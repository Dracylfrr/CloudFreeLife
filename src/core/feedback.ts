import { writable } from 'svelte/store';

/* ----------------------------- toasts ----------------------------- */
/** A button inside a toast, such as "Show in folder". */
export interface ToastAction {
  label: string;
  run: () => void;
}
export interface ToastMsg {
  id: number;
  text: string;
  kind: 'info' | 'success' | 'error';
  action?: ToastAction;
}
let toastId = 1;
export const toasts = writable<ToastMsg[]>([]);

export function toast(text: string, kind: ToastMsg['kind'] = 'info', ms = 3200, action?: ToastAction) {
  const id = toastId++;
  toasts.update((t) => [...t.slice(-3), { id, text, kind, action }]);
  setTimeout(() => toasts.update((t) => t.filter((x) => x.id !== id)), ms);
}

/** How long the "saved" notice stays: long enough to notice and click, short enough to stay out of the way. */
export const SAVED_TOAST_MS = 8000;

/* ------------------------- confirm dialog ------------------------- */
export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  /** Optional text input (used for Rename). */
  input?: { value: string; placeholder?: string; maxLength?: number };
  resolve: (result: { ok: boolean; value?: string }) => void;
}

export const confirmRequest = writable<ConfirmRequest | null>(null);

export function confirmDialog(opts: Omit<ConfirmRequest, 'resolve'>): Promise<boolean> {
  return new Promise((resolve) => {
    confirmRequest.set({ ...opts, resolve: (r) => resolve(r.ok) });
  });
}

export function promptDialog(opts: Omit<ConfirmRequest, 'resolve'> & { input: NonNullable<ConfirmRequest['input']> }): Promise<string | null> {
  return new Promise((resolve) => {
    confirmRequest.set({ ...opts, resolve: (r) => resolve(r.ok ? (r.value ?? '') : null) });
  });
}

/* --------------------------- save status -------------------------- */
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
export const saveStatus = writable<SaveStatus>('idle');
