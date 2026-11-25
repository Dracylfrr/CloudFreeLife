/**
 * The name people see. The saved-data folder, the downloads folder and every message use it. Only the
 * installer's file name, the install folder and the program file inside it keep the original
 * "Cloud-Freelife" name, because updating from older versions looks for exactly that name.
 */
export const BRAND_NAME = 'Project D.R.E.A.M';
export const BRAND_SUBTITLE = 'Cloud Sonata';
export const BRAND_FULL = `${BRAND_NAME}: ${BRAND_SUBTITLE}`;
/** What D.R.E.A.M stands for, in order. */
export const DREAM_WORDS = ['Draw', 'Relax', 'Explore', 'Adventure', 'Meditate'] as const;
