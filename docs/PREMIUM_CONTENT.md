# Premium content

Premium series, adventures and levels are sold as **encrypted packs**. The app ships with no premium content and no secrets. Someone who buys gets a small **license file**, and the license opens the packs it names.

```
 your private repo ──build──▶ encrypted pack (.dreampack) ──publish──▶ public releases (useless without the key)
        │                                                                          │
        └── your keys (home folder) ──sign──▶ license (.dreamlicense) ──to buyer──▶ app downloads, opens, installs
```

## What lives where

| Thing | Where | Secret? |
| --- | --- | --- |
| The premium stories, art and source | your **private** repo (`projectDreamResources`) | yes |
| One key per pack, and the license signing key | `~/.dream-dlc/` on your computer (`C:\Users\<you>\.dream-dlc`) | **yes. Back it up. Never commit it.** |
| The public half of the signing key | inside the app (`src-tauri/src/premium.rs`) | no, it can only check licenses, never make one |
| Encrypted packs | public GitHub releases | no, they are unreadable without a key |
| A license file | the buyer's computer | belongs to the buyer |

The app never reads your private repo and never holds a token. That is deliberate: anything inside an app can be pulled out of it.

## One-time setup

1. `node scripts/dlc.mjs keygen` makes the signing key in `~/.dream-dlc`. **Back that folder up.** If the signing key is lost, no new license can be made for apps that are already out. (This was done once; the public half is already in `premium.rs`.)
2. In your private repo, keep each pack as `packs/<pack_id>/pack.json` (name, description, kind, minAppVersion) and `packs/<pack_id>/content/...` in the same layout as the app's `content/` folder.

## Publish a pack

```powershell
node scripts/dlc.mjs pack ..\projectDreamResources\packs\lantern_lane\content --id lantern_lane --version 1.0.0 --name "Lantern Lane" --kind stories --description "..." --min-app 1.8.0
```

This writes `release/lantern_lane_v1.0.0.dreampack` and `release/cloud-freelife-release.json`. Create a GitHub release tagged `lantern_lane_v1.0.0` on the **public** repo and attach both files. The pack's key is made the first time and reused for later versions, so existing licenses keep opening new versions.

`docs/premium/build-premium-pack.yml` is a workflow for the private repo that does the same on a tag push. It needs two secrets there: `PACK_KEYS_JSON` (the contents of `~/.dream-dlc/pack-keys.json`) and `PUBLIC_RELEASES_TOKEN` (a fine-grained token with write access to the public repo's releases only).

## Make a license

```powershell
node scripts/dlc.mjs license --id friend-01 --packs lantern_lane,skyfarers
node scripts/dlc.mjs license --id all-2026 --all --expires 2027-12-31
node scripts/dlc.mjs verify friend-01.dreamlicense
```

Send the `.dreamlicense` file to the buyer. In the app: **Updates > Premium content > Choose license file**. The app checks the signature, keeps the file in its data folder and then offers the packs the license opens as normal "New content".

## What this protects, honestly

- **Protects:** reading or using premium content from the public downloads; making your own license (no private key in the app); editing a license to add packs (the signature breaks); swapping or relabelling packs (each is bound to its id and version).
- **Does not protect against:** a buyer sharing their license file; a buyer copying the installed (unencrypted) content from their app folder; someone modifying their own copy of the app to skip the check. No offline app can prevent these. The aim is to stop casual sharing and make the paid content impossible to get without paying.
- **Taking a license back:** make a new key by deleting that pack's entry in `pack-keys.json`, re-pack, and issue new licenses. Old licenses still open files already downloaded, but not the new version.
- **Free content** (such as the Night Train series) is bundled in the app and needs no license.

## Moving the releases to their own repo

Premium packs are published to the repo named in `src/core/config.ts`. To use a separate releases-only repo, change `GITHUB_OWNER` and `GITHUB_REPO_NAME` there (and the matching workflow). The app only ever asks that repo for public release files.
