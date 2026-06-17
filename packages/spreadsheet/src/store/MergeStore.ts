import type { CellStore } from "./CellStore";
import type { MetaStore } from "./MetaStore";
import type { ICellAddress, IMergedRange, INormalizedRange } from "../types";
import { cellKey } from "../utils/cellKey";
import {
  expandRangeWithMerges,
  getRoleInMerge,
  isValidMergeRange,
  mergedRangeToBounds,
  rangeIntersectsAnyMerge,
  rangePartiallyOverlapsMerge,
  rangeToMergedRange,
  rangesOverlap,
  type TMergeCellRole,
} from "../utils/mergeCell";

export class MergeStore {
  private anchors = new Map<string, IMergedRange>();
  private coveredToAnchor = new Map<string, string>();
  private listeners = new Set<() => void>();
  private revision = 0;

  getRevision(): number {
    return this.revision;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.revision += 1;
    this.listeners.forEach((fn) => fn());
  }

  getAll(): IMergedRange[] {
    return Array.from(this.anchors.values());
  }

  hasAny(): boolean {
    return this.anchors.size > 0;
  }

  getRole(row: number, col: number): TMergeCellRole {
    const anchorKey = this.coveredToAnchor.get(cellKey(row, col));
    if (!anchorKey) return "none";
    const merge = this.anchors.get(anchorKey);
    if (!merge) return "none";
    return getRoleInMerge(row, col, merge);
  }

  resolveAnchor(row: number, col: number): ICellAddress {
    const anchorKey = this.coveredToAnchor.get(cellKey(row, col));
    if (!anchorKey) return { row, col };
    const merge = this.anchors.get(anchorKey);
    if (!merge) return { row, col };
    return { row: merge.anchorRow, col: merge.anchorCol };
  }

  getSpan(row: number, col: number): { rowSpan: number; colSpan: number } {
    const merge = this.anchors.get(cellKey(row, col));
    if (!merge) return { rowSpan: 1, colSpan: 1 };
    return { rowSpan: merge.rowSpan, colSpan: merge.colSpan };
  }

  getMergeAt(row: number, col: number): IMergedRange | null {
    const anchor = this.resolveAnchor(row, col);
    return this.anchors.get(cellKey(anchor.row, anchor.col)) ?? null;
  }

  rangeIntersectsMerge(range: INormalizedRange): boolean {
    return rangeIntersectsAnyMerge(range, this.getAll());
  }

  expandRange(range: INormalizedRange): INormalizedRange {
    return expandRangeWithMerges(range, this.getAll());
  }

  canMerge(range: INormalizedRange): boolean {
    if (!isValidMergeRange(range)) return false;
    const merges = this.getAll();
    if (rangePartiallyOverlapsMerge(range, merges)) return false;
    for (const merge of merges) {
      const bounds = mergedRangeToBounds(merge);
      if (rangesOverlap(range, bounds)) return false;
    }
    return true;
  }

  merge(
    range: INormalizedRange,
    store: CellStore,
    metaStore: MetaStore,
  ): boolean {
    if (!this.canMerge(range)) return false;

    const merged = rangeToMergedRange(range);
    const anchorKey = cellKey(merged.anchorRow, merged.anchorCol);

    for (let row = range.startRow; row <= range.endRow; row++) {
      for (let col = range.startCol; col <= range.endCol; col++) {
        if (row === merged.anchorRow && col === merged.anchorCol) continue;
        store.setValue(row, col, "");
        metaStore.setMeta(row, col, {
          type: "text",
          disabled: false,
          invalid: false,
        });
        this.coveredToAnchor.set(cellKey(row, col), anchorKey);
      }
    }

    this.anchors.set(anchorKey, merged);
    this.coveredToAnchor.set(anchorKey, anchorKey);
    this.notify();
    return true;
  }

  unmerge(row: number, col: number): boolean {
    const anchor = this.resolveAnchor(row, col);
    const anchorKey = cellKey(anchor.row, anchor.col);
    const merge = this.anchors.get(anchorKey);
    if (!merge) return false;

    const bounds = mergedRangeToBounds(merge);
    for (let r = bounds.startRow; r <= bounds.endRow; r++) {
      for (let c = bounds.startCol; c <= bounds.endCol; c++) {
        this.coveredToAnchor.delete(cellKey(r, c));
      }
    }

    this.anchors.delete(anchorKey);
    this.notify();
    return true;
  }

  clear(): void {
    if (this.anchors.size === 0 && this.coveredToAnchor.size === 0) return;
    this.anchors.clear();
    this.coveredToAnchor.clear();
    this.notify();
  }
}
