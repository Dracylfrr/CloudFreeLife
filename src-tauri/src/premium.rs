//! Premium content: checks a signed license and opens encrypted packs.
//!
//! The app holds only the PUBLIC half of the license key, so it can check a license but never make one,
//! and there is no secret anywhere in the app to find. A license lists the packs its owner may open, with
//! one key per pack; the packs themselves are ordinary downloads that are useless without that key.
//! The formats are described in scripts/dlc/lib.mjs, and the tests below read files made by that script,
//! so this file and the author's tool are proven to agree.

use aes_gcm::aead::{Aead, KeyInit, Payload};
use aes_gcm::{Aes256Gcm, Nonce};
use base64::engine::general_purpose::STANDARD as B64;
use base64::Engine;
use ed25519_dalek::{Signature, VerifyingKey};
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};

/// The public half of the author's license-signing key (made by `node scripts/dlc.mjs keygen`).
const LICENSE_PUBLIC_KEY: [u8; 32] = [
    0x9b, 0xd8, 0x48, 0x52, 0xb6, 0x88, 0xcc, 0xe7, 0xc5, 0xc0, 0xb7, 0x2e, 0x79, 0x93, 0x38, 0xca, 0x06, 0x9a, 0x9b, 0x22, 0xf4, 0x52, 0xd3, 0x11, 0x17, 0x2b, 0x94, 0x8b, 0xfd, 0x3b,
    0x81, 0x51,
];

const MAGIC: &str = "DREAMLIC1";
const MAX_LICENSE_BYTES: usize = 64 * 1024;
const MAX_PACK_BYTES: usize = 80 * 1024 * 1024;
const MAX_PACKS_IN_LICENSE: usize = 200;

#[derive(Deserialize)]
#[cfg_attr(test, derive(Debug))]
struct PackKey {
    id: String,
    key: String,
}

#[derive(Deserialize)]
#[cfg_attr(test, derive(Debug))]
struct License {
    format: u32,
    id: String,
    issued: String,
    expires: Option<String>,
    packs: Vec<PackKey>,
    sig: String,
}

#[derive(Deserialize)]
struct Container {
    format: u32,
    id: String,
    version: String,
    nonce: String,
    data: String,
}

/// What the screen is told about a license. The keys never leave this file.
#[derive(Serialize, Debug, PartialEq)]
pub struct LicenseInfo {
    pub id: String,
    pub issued: String,
    pub expires: Option<String>,
    pub packs: Vec<String>,
}

fn pack_id_ok(s: &str) -> bool {
    !s.is_empty() && s.len() <= 64 && s.bytes().all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'_') && !s.starts_with('_')
}

fn version_ok(s: &str) -> bool {
    let parts: Vec<&str> = s.split('.').collect();
    parts.len() == 3 && parts.iter().all(|p| !p.is_empty() && p.len() <= 5 && p.bytes().all(|b| b.is_ascii_digit()))
}

fn date_ok(s: &str) -> bool {
    let b = s.as_bytes();
    b.len() == 10 && b[4] == b'-' && b[7] == b'-' && b.iter().enumerate().all(|(i, c)| i == 4 || i == 7 || c.is_ascii_digit())
}

/// Today as "YYYY-MM-DD" (UTC), without any date library.
fn today_iso() -> String {
    let secs = SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_secs()).unwrap_or(0);
    let z = (secs / 86_400) as i64 + 719_468;
    let era = z.div_euclid(146_097);
    let doe = z.rem_euclid(146_097);
    let yoe = (doe - doe / 1_460 + doe / 36_524 - doe / 146_096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let y = if m <= 2 { y + 1 } else { y };
    format!("{y:04}-{m:02}-{d:02}")
}

fn message(l: &License) -> Vec<u8> {
    let packs = l.packs.iter().map(|p| format!("{}:{}", p.id, p.key)).collect::<Vec<_>>().join(",");
    format!("{MAGIC}\n{}\n{}\n{}\n{}", l.id, l.issued, l.expires.clone().unwrap_or_default(), packs).into_bytes()
}

const BAD_LICENSE: &str = "That file is not a valid license.";

/// Reads a license and checks its signature and dates. Everything else in this file builds on it.
fn read_license(text: &str, public: &[u8; 32], today: &str) -> Result<License, String> {
    if text.len() > MAX_LICENSE_BYTES {
        return Err(BAD_LICENSE.into());
    }
    let l: License = serde_json::from_str(text).map_err(|_| BAD_LICENSE.to_string())?;
    let shape_ok = l.format == 1
        && l.id.len() >= 4
        && l.id.len() <= 64
        && l.id.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'_' || b == b'-')
        && date_ok(&l.issued)
        && l.expires.as_deref().map_or(true, date_ok)
        && !l.packs.is_empty()
        && l.packs.len() <= MAX_PACKS_IN_LICENSE
        && l.packs.iter().all(|p| pack_id_ok(&p.id) && p.key.len() == 44 && B64.decode(&p.key).map(|k| k.len() == 32).unwrap_or(false));
    if !shape_ok {
        return Err(BAD_LICENSE.into());
    }
    let sig_bytes = B64.decode(&l.sig).map_err(|_| BAD_LICENSE.to_string())?;
    let sig = Signature::from_slice(&sig_bytes).map_err(|_| BAD_LICENSE.to_string())?;
    let key = VerifyingKey::from_bytes(public).map_err(|_| BAD_LICENSE.to_string())?;
    key.verify_strict(&message(&l), &sig).map_err(|_| BAD_LICENSE.to_string())?;
    if let Some(e) = &l.expires {
        if today > e.as_str() {
            return Err("This license has expired.".into());
        }
    }
    Ok(l)
}

fn info_of(l: &License) -> LicenseInfo {
    LicenseInfo { id: l.id.clone(), issued: l.issued.clone(), expires: l.expires.clone(), packs: l.packs.iter().map(|p| p.id.clone()).collect() }
}

/// Opens one encrypted pack with the key the license holds for it. Returns the pack's plain bytes.
fn open_pack(license: &str, pack_id: &str, pack_text: &str, public: &[u8; 32], today: &str) -> Result<Vec<u8>, String> {
    let l = read_license(license, public, today)?;
    if !pack_id_ok(pack_id) || pack_text.len() > MAX_PACK_BYTES {
        return Err("That content could not be opened.".into());
    }
    let entry = l.packs.iter().find(|p| p.id == pack_id).ok_or_else(|| "Your license does not include this content.".to_string())?;
    let c: Container = serde_json::from_str(pack_text).map_err(|_| "That content could not be opened.".to_string())?;
    let cannot = || "That content could not be opened.".to_string();
    if c.format != 2 || c.id != pack_id || !version_ok(&c.version) {
        return Err(cannot());
    }
    let key = B64.decode(&entry.key).map_err(|_| cannot())?;
    let nonce = B64.decode(&c.nonce).map_err(|_| cannot())?;
    let data = B64.decode(&c.data).map_err(|_| cannot())?;
    if nonce.len() != 12 || data.len() < 16 {
        return Err(cannot());
    }
    let aad = format!("{}:{}", c.id, c.version);
    Aes256Gcm::new_from_slice(&key)
        .map_err(|_| cannot())?
        .decrypt(Nonce::from_slice(&nonce), Payload { msg: &data, aad: aad.as_bytes() })
        .map_err(|_| cannot())
}

/// Checks a license the person has added and says what it covers.
#[tauri::command]
pub fn premium_check_license(license: String) -> Result<LicenseInfo, String> {
    read_license(&license, &LICENSE_PUBLIC_KEY, &today_iso()).map(|l| info_of(&l))
}

/// Decrypts a downloaded pack with the license's key for it. The result is the plain pack, as base64.
#[tauri::command]
pub fn premium_open_pack(license: String, pack_id: String, pack: String) -> Result<String, String> {
    open_pack(&license, &pack_id, &pack, &LICENSE_PUBLIC_KEY, &today_iso()).map(|b| B64.encode(b))
}

#[cfg(test)]
mod tests {
    use super::*;

    const PUBLIC_HEX: &str = include_str!("../fixtures/public-key.hex");
    const GOOD: &str = include_str!("../fixtures/good.dreamlicense");
    const EXPIRED: &str = include_str!("../fixtures/expired.dreamlicense");
    const FUTURE: &str = include_str!("../fixtures/future.dreamlicense");
    const WRONG_KEY: &str = include_str!("../fixtures/wrongkey.dreamlicense");
    const OTHER_PACK: &str = include_str!("../fixtures/otherpack.dreamlicense");
    const TAMPERED: &str = include_str!("../fixtures/tampered.dreamlicense");
    const PACK: &str = include_str!("../fixtures/fixture_pack_v1.0.0.dreampack");
    const RELABELLED: &str = include_str!("../fixtures/relabelled.dreampack");
    const PLAIN: &[u8] = include_bytes!("../fixtures/plain.cfpack");
    const TODAY: &str = "2026-06-01";

    fn public() -> [u8; 32] {
        let h = PUBLIC_HEX.trim();
        let mut out = [0u8; 32];
        for i in 0..32 {
            out[i] = u8::from_str_radix(&h[i * 2..i * 2 + 2], 16).unwrap();
        }
        out
    }

    #[test]
    fn a_license_made_by_the_author_tool_checks_out() {
        let l = read_license(GOOD, &public(), TODAY).unwrap();
        assert_eq!(info_of(&l), LicenseInfo { id: "fixture-license".into(), issued: "2026-01-01".into(), expires: None, packs: vec!["fixture_pack".into()] });
    }

    #[test]
    fn the_real_app_key_refuses_a_license_signed_with_another_key() {
        assert_eq!(read_license(GOOD, &LICENSE_PUBLIC_KEY, TODAY).unwrap_err(), BAD_LICENSE);
    }

    #[test]
    fn a_license_cannot_be_edited_to_add_packs() {
        assert_eq!(read_license(TAMPERED, &public(), TODAY).unwrap_err(), BAD_LICENSE);
        let edited = GOOD.replace("fixture-license", "another-license");
        assert_eq!(read_license(&edited, &public(), TODAY).unwrap_err(), BAD_LICENSE);
    }

    #[test]
    fn expiry_is_honoured() {
        assert_eq!(read_license(EXPIRED, &public(), TODAY).unwrap_err(), "This license has expired.");
        assert!(read_license(EXPIRED, &public(), "2026-01-15").is_ok());
        assert!(read_license(FUTURE, &public(), TODAY).is_ok());
    }

    #[test]
    fn junk_is_refused_politely() {
        for bad in ["", "{}", "[]", "not json", "{\"format\":1}", &"x".repeat(MAX_LICENSE_BYTES + 1)] {
            assert_eq!(read_license(bad, &public(), TODAY).unwrap_err(), BAD_LICENSE);
        }
    }

    #[test]
    fn a_pack_made_by_the_author_tool_opens_with_its_license() {
        assert_eq!(open_pack(GOOD, "fixture_pack", PACK, &public(), TODAY).unwrap(), PLAIN);
    }

    #[test]
    fn a_license_for_other_packs_does_not_open_this_one() {
        assert_eq!(open_pack(OTHER_PACK, "fixture_pack", PACK, &public(), TODAY).unwrap_err(), "Your license does not include this content.");
    }

    #[test]
    fn a_wrong_key_opens_nothing() {
        assert_eq!(open_pack(WRONG_KEY, "fixture_pack", PACK, &public(), TODAY).unwrap_err(), "That content could not be opened.");
    }

    #[test]
    fn an_expired_license_opens_nothing() {
        assert!(open_pack(EXPIRED, "fixture_pack", PACK, &public(), TODAY).is_err());
    }

    #[test]
    fn a_pack_cannot_be_relabelled_or_tampered_with() {
        assert!(open_pack(GOOD, "fixture_pack", RELABELLED, &public(), TODAY).is_err());
        let flipped = PACK.replace("\"data\":\"", "\"data\":\"AAAA");
        assert!(open_pack(GOOD, "fixture_pack", &flipped, &public(), TODAY).is_err());
        assert!(open_pack(GOOD, "fixture_pack", "{}", &public(), TODAY).is_err());
        assert!(open_pack(GOOD, "../etc", PACK, &public(), TODAY).is_err());
    }

    #[test]
    fn todays_date_looks_right() {
        let t = today_iso();
        assert!(date_ok(&t), "{t}");
        assert!(t.as_str() >= "2026-01-01");
    }

    #[test]
    fn dates_are_counted_correctly() {
        // 2000-03-01 is day 11017 since 1970; 1970-01-01 is day 0; 2024-02-29 is day 19782
        let civil = |days: i64| {
            let z = days + 719_468;
            let era = z.div_euclid(146_097);
            let doe = z.rem_euclid(146_097);
            let yoe = (doe - doe / 1_460 + doe / 36_524 - doe / 146_096) / 365;
            let y = yoe + era * 400;
            let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
            let mp = (5 * doy + 2) / 153;
            let d = doy - (153 * mp + 2) / 5 + 1;
            let m = if mp < 10 { mp + 3 } else { mp - 9 };
            (if m <= 2 { y + 1 } else { y }, m, d)
        };
        assert_eq!(civil(0), (1970, 1, 1));
        assert_eq!(civil(11_017), (2000, 3, 1));
        assert_eq!(civil(19_782), (2024, 2, 29));
    }
}
