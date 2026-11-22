/**
 * Undo/redo history with a memory budget.
 *
 * Entries are "swap" patches: applying one to the current state returns the
 * inverse patch, which is pushed onto the opposite stack. The history never
 * knows what a patch contains, only how many bytes it holds.
 */
export interface Sized {
  bytes: number;
}

export class History<T extends Sized> {
  private undoStack: T[] = [];
  private redoStack: T[] = [];
  private bytes = 0;

  constructor(
    private maxEntries = 60,
    private maxBytes = 96 * 1024 * 1024
  ) {}

  get canUndo() {
    return this.undoStack.length > 0;
  }
  get canRedo() {
    return this.redoStack.length > 0;
  }
  get undoCount() {
    return this.undoStack.length;
  }
  get redoCount() {
    return this.redoStack.length;
  }
  get memoryBytes() {
    return this.bytes;
  }

  /** Records a new action. Any redo history is discarded. */
  push(entry: T) {
    for (const r of this.redoStack) this.bytes -= r.bytes;
    this.redoStack = [];
    this.undoStack.push(entry);
    this.bytes += entry.bytes;
    this.trim();
  }

  private trim() {
    while (this.undoStack.length > 1 && (this.undoStack.length > this.maxEntries || this.bytes > this.maxBytes)) {
      const old = this.undoStack.shift()!;
      this.bytes -= old.bytes;
    }
  }

  /** `swap` applies the entry to the canvas/state and returns the inverse entry. */
  undo(swap: (e: T) => T): boolean {
    const e = this.undoStack.pop();
    if (!e) return false;
    this.bytes -= e.bytes;
    const inverse = swap(e);
    this.redoStack.push(inverse);
    this.bytes += inverse.bytes;
    return true;
  }

  redo(swap: (e: T) => T): boolean {
    const e = this.redoStack.pop();
    if (!e) return false;
    this.bytes -= e.bytes;
    const inverse = swap(e);
    this.undoStack.push(inverse);
    this.bytes += inverse.bytes;
    this.trim();
    return true;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.bytes = 0;
  }
}
