import { writable } from 'svelte/store';

/* ----------------------------- toasts ----------------------------- */
export interface ToastMsg {
  id: number;
  text: string;
  kind: 'info' | 'success' | 'error';
}
let toastId = 1;
export const toasts = writable<ToastMsg[]>([]);

export function toast(text: string, kind: ToastMsg['kind'] = 'info', ms = 3200) {
  const id = toastId++;
  toasts.update((t) => [...t.slice(-3), { id, text, kind }]);
  setTimeout(() => toasts.update((t) => t.filter((x) => x.id !== id)), ms);
}

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
