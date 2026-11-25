/**
 * Can this computer run the speech model on its graphics chip? That needs WebGPU (a recent Windows with a
 * graphics chip and driver that support Direct3D 12). Many older computers cannot, and then the standard
 * voices, which run on the processor, are used instead. Asking is quick and changes nothing.
 */
let cached: Promise<boolean> | null = null;

export function graphicsChipUsable(): Promise<boolean> {
  return (cached ??= (async () => {
    try {
      const gpu = (navigator as unknown as { gpu?: { requestAdapter(): Promise<{ requestDevice(): Promise<{ destroy(): void }> } | null> } }).gpu;
      if (!gpu) return false;
      const adapter = await gpu.requestAdapter();
      if (!adapter) return false;
      const device = await adapter.requestDevice();
      device.destroy();
      return true;
    } catch {
      return false;
    }
  })());
}

/** For tests: forget what was found. */
export function forgetGraphicsChip() {
  cached = null;
}
