/**
 * Central, non-secret configuration.
 *
 * GITHUB_REPO is the ONLY place the official release repository is named.
 * Change it here (and nowhere else) when you publish under a different account.
 * No access tokens are ever embedded: release data is read from public endpoints.
 */
export const GITHUB_OWNER = 'Dracylfrr';
export const GITHUB_REPO_NAME = 'CloudFreeLife';
export const GITHUB_REPO = `${GITHUB_OWNER}/${GITHUB_REPO_NAME}`;

export const GITHUB_API_LATEST = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
export const GITHUB_API_RELEASES = `https://api.github.com/repos/${GITHUB_REPO}/releases?per_page=20`;

/** Hosts a release asset may be downloaded from. Everything else is refused. */
export const ALLOWED_DOWNLOAD_HOSTS = [
  'github.com',
  'objects.githubusercontent.com',
  'release-assets.githubusercontent.com',
  'github-releases.githubusercontent.com'
];

/** Name of the manifest asset attached to every release. */
export const RELEASE_MANIFEST_ASSET = 'cloud-freelife-release.json';

export const DATA_DIR_NAME = 'Cloud-Freelife';

/** Canvas working resolution (4:3). Keeps memory use predictable. */
export const CANVAS_W = 1280;
export const CANVAS_H = 960;
/** Content art is authored in a 1000x750 viewBox. */
export const ART_VIEWBOX_W = 1000;
export const ART_VIEWBOX_H = 750;
