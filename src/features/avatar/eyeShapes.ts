/** The outline of the eye opening and the upper lash line for each eye shape (outer corner toward +x). */
import type { EyeShape } from './avatar';

export const EYE_SCLERA: Record<EyeShape, string> = {
  round: 'M-6.9 0A6.9 8.3 0 1 0 6.9 0A6.9 8.3 0 1 0 -6.9 0Z',
  sparkle: 'M-6.9 0A6.9 8.3 0 1 0 6.9 0A6.9 8.3 0 1 0 -6.9 0Z',
  sleepy: 'M-6.9 0A6.9 8.3 0 1 0 6.9 0A6.9 8.3 0 1 0 -6.9 0Z',
  almond: 'M-8.4 1.2C-6 -6.4 5 -8.2 8.8 -1.8C5.4 5.8 -5 7.4 -8.4 1.2Z',
  cat: 'M-8 2.4C-5 -5.6 3.8 -8.4 10 -4.2C6.4 4.6 -3.8 7 -8 2.4Z',
  // the inner corner (near the nose) sits lower than the outer one: a sharp, determined look
  fierce: 'M-8.4 3.4C-5.6 -1.8 3.4 -8.6 10 -6.6C7.4 3.6 -3.4 7 -8.4 3.4Z'
};

export const EYE_LASH: Record<EyeShape, string> = {
  round: 'M-7.6 -3.6Q0 -11.6 7.6 -3.6',
  sparkle: 'M-7.6 -3.6Q0 -11.6 7.6 -3.6',
  sleepy: 'M-7.8 -1.4Q0 -5.4 7.8 -1.4',
  almond: 'M-8.9 1C-6.4 -7.2 5.2 -9 9.8 -2.2',
  cat: 'M-8.4 2.2C-5.2 -6.4 4 -9.4 10.4 -4.6L11.9 -7.4',
  fierce: 'M-9 2.6C-5.6 -3.2 4 -10.4 11 -8.2L12.6 -10.6'
};
