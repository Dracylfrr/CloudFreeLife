/**
 * The name people see. The program, its install folder, its shortcuts, the entry in Settings > Apps,
 * the saved-data folder, the downloads folder and every message use it. Only the names of the files
 * attached to a GitHub release (the installer asset and the release manifest) keep the original
 * "Cloud-Freelife" name, because every older version looks for exactly those names when it updates.
 */
export const BRAND_NAME = 'Project D.R.E.A.M';
export const BRAND_SUBTITLE = 'Cloud Sonata';
export const BRAND_FULL = `${BRAND_NAME}: ${BRAND_SUBTITLE}`;
/** What D.R.E.A.M stands for, in order. */
export const DREAM_WORDS = ['Draw', 'Relax', 'Explore', 'Adventure', 'Meditate'] as const;
