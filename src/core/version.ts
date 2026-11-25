/** Semantic version helpers. Only plain MAJOR.MINOR.PATCH[-pre] is supported. */
import pkg from '../../package.json';

export const APP_VERSION: string = pkg.version;
export const APP_NAME = 'Project D.R.E.A.M';

export interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
  pre: string[];
}

const SEMVER = /^v?(\d{1,6})\.(\d{1,6})\.(\d{1,6})(?:-([0-9A-Za-z.-]{1,32}))?(?:\+[0-9A-Za-z.-]+)?$/;

export function parseVersion(input: string): ParsedVersion | null {
  if (typeof input !== 'string') return null;
  const m = SEMVER.exec(input.trim());
  if (!m) return null;
  return {
    major: Number(m[1]),
    minor: Number(m[2]),
    patch: Number(m[3]),
    pre: m[4] ? m[4].split('.') : []
  };
}

export function isValidVersion(input: string): boolean {
  return parseVersion(input) !== null;
}

function comparePre(a: string[], b: string[]): number {
  // A version without a pre-release tag is greater than one with.
  if (a.length === 0 && b.length === 0) return 0;
  if (a.length === 0) return 1;
  if (b.length === 0) return -1;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const x = a[i];
    const y = b[i];
    if (x === undefined) return -1;
    if (y === undefined) return 1;
    const nx = /^\d+$/.test(x);
    const ny = /^\d+$/.test(y);
    if (nx && ny) {
      const d = Number(x) - Number(y);
      if (d !== 0) return d < 0 ? -1 : 1;
    } else if (nx !== ny) {
      return nx ? -1 : 1;
    } else if (x !== y) {
      return x < y ? -1 : 1;
    }
  }
  return 0;
}

/** Returns -1, 0 or 1. Throws on invalid input so bad data never silently compares. */
export function compareVersions(a: string, b: string): -1 | 0 | 1 {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  if (!pa || !pb) throw new Error(`Invalid version comparison: "${a}" vs "${b}"`);
  for (const key of ['major', 'minor', 'patch'] as const) {
    if (pa[key] !== pb[key]) return pa[key] < pb[key] ? -1 : 1;
  }
  return comparePre(pa.pre, pb.pre) as -1 | 0 | 1;
}

export function isNewer(candidate: string, current: string): boolean {
  return compareVersions(candidate, current) === 1;
}

/** True when `appVersion` satisfies a content item's minimum app version. */
export function meetsMinVersion(minAppVersion: string, appVersion: string = APP_VERSION): boolean {
  if (!isValidVersion(minAppVersion)) return false;
  return compareVersions(appVersion, minAppVersion) >= 0;
}
