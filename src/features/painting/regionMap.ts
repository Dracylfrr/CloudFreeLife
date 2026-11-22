/**
 * Region maps: a per-pixel lookup of "which colorable region is here?".
 *
 * Every coloring page is an SVG whose colorable shapes carry data-region="id".
 * We re-render those shapes (and only those) with a unique flat color per
 * region and anti-aliasing off, then read the pixels back. That gives exact,
 * fast region fill, "stay inside lines" painting and region clearing, with
 * no flood-fill leaks and no region ever "locked".
 */

export interface Bbox {
  x0: number;
  y0: number;
  x1: number; // inclusive
  y1: number;
}

const LEAF = new Set(['path', 'circle', 'ellipse', 'rect', 'polygon', 'polyline', 'line', 'text', 'image', 'use']);

/** Encodes a 1-based region index as an opaque color. */
export const encodeRegionColor = (index: number) => `rgb(${(index >> 8) & 255},${index & 255},0)`;

/** Builds the flat-colored SVG used to render the region map. */
export function buildRegionSvg(svgText: string, regionIds: string[], width: number, height: number): string {
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  const root = doc.documentElement;
  if (root.nodeName === 'parsererror' || doc.getElementsByTagName('parsererror').length) throw new Error('Line art SVG could not be parsed');
  const index = new Map(regionIds.map((id, i) => [id, i + 1]));
  const doomed: Element[] = [];
  const walk = (el: Element) => {
    for (const child of Array.from(el.children)) {
      const rid = child.getAttribute('data-region');
      if (rid && index.has(rid)) {
        for (const a of ['stroke', 'stroke-width', 'opacity', 'fill-opacity', 'stroke-opacity', 'filter', 'style', 'class']) child.removeAttribute(a);
        child.setAttribute('fill', encodeRegionColor(index.get(rid)!));
        child.setAttribute('stroke', 'none');
        child.setAttribute('shape-rendering', 'crispEdges');
      } else if (LEAF.has(child.localName)) {
        doomed.push(child);
      } else {
        walk(child);
      }
    }
  };
  walk(root);
  doomed.forEach((d) => d.remove());
  root.setAttribute('width', String(width));
  root.setAttribute('height', String(height));
  root.setAttribute('shape-rendering', 'crispEdges');
  return new XMLSerializer().serializeToString(doc);
}

export class RegionMap {
  readonly bboxes: (Bbox | null)[];
  readonly areas: Uint32Array;

  constructor(
    readonly ids: Uint16Array,
    readonly width: number,
    readonly height: number,
    readonly regionIds: string[]
  ) {
    const n = regionIds.length + 1;
    this.bboxes = new Array(n).fill(null);
    this.areas = new Uint32Array(n);
    for (let y = 0; y < height; y++) {
      const row = y * width;
      for (let x = 0; x < width; x++) {
        const id = ids[row + x];
        if (id === 0 || id >= n) continue;
        this.areas[id]++;
        const b = this.bboxes[id];
        if (!b) this.bboxes[id] = { x0: x, y0: y, x1: x, y1: y };
        else {
          if (x < b.x0) b.x0 = x;
          if (x > b.x1) b.x1 = x;
          if (y > b.y1) b.y1 = y;
        }
      }
    }
  }

  /** Decodes RGBA pixels produced by rendering buildRegionSvg(). */
  static fromRgba(rgba: Uint8ClampedArray | Uint8Array, width: number, height: number, regionIds: string[]): RegionMap {
    const ids = new Uint16Array(width * height);
    const max = regionIds.length;
    for (let i = 0, p = 0; i < ids.length; i++, p += 4) {
      if (rgba[p + 3] < 255 || rgba[p + 2] !== 0) continue; // blended / empty pixel
      const id = (rgba[p] << 8) | rgba[p + 1];
      ids[i] = id >= 1 && id <= max ? id : 0;
    }
    return new RegionMap(ids, width, height, regionIds);
  }

  idAt(x: number, y: number): number {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    if (xi < 0 || yi < 0 || xi >= this.width || yi >= this.height) return 0;
    return this.ids[yi * this.width + xi];
  }

  /** Region at the point, or the closest one within `radius` px (so clicking on a line still works). */
  idNearest(x: number, y: number, radius = 7): number {
    const id = this.idAt(x, y);
    if (id) return id;
    for (let r = 1; r <= radius; r++) {
      for (let a = 0; a < 16; a++) {
        const t = (a / 16) * Math.PI * 2;
        const v = this.idAt(x + Math.cos(t) * r, y + Math.sin(t) * r);
        if (v) return v;
      }
    }
    return 0;
  }

  regionKey(id: number): string | null {
    return id > 0 && id <= this.regionIds.length ? this.regionIds[id - 1] : null;
  }
}

/** Lists the colorable regions of an SVG (in paint order) from their data-region / data-name attributes. */
export function extractRegions(svgText: string): { id: string; name: string }[] {
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  const out: { id: string; name: string }[] = [];
  const seen = new Set<string>();
  doc.querySelectorAll('[data-region]').forEach((el) => {
    const id = el.getAttribute('data-region')!;
    if (seen.has(id)) return;
    seen.add(id);
    out.push({ id, name: el.getAttribute('data-name') || id.replace(/_/g, ' ') });
  });
  return out;
}
