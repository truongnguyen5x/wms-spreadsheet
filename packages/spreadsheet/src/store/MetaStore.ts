import { cellKey } from "../utils/cellKey";
import type { ICellMeta } from "../types";

export interface IMetaStoreInput {
  row: number;
  col: number;
  meta: Partial<ICellMeta>;
}

const EMPTY_META: ICellMeta = { type: "text" };
function isDefaultMeta(meta: ICellMeta): boolean {
  return (
    (meta.type === undefined || meta.type === "text") &&
    meta.options === undefined &&
    meta.dateFormat === undefined &&
    meta.minDate === undefined &&
    meta.maxDate === undefined &&
    meta.maxValue === undefined &&
    meta.decimalPlaces === undefined &&
    meta.customKey === undefined &&
    meta.customProps === undefined &&
    meta.invalid !== true &&
    meta.disabled !== true
  );
}

export class MetaStore {
  private data = new Map<string, ICellMeta>();
  private listeners = new Map<string, Set<() => void>>();
  getMeta(row: number, col: number): ICellMeta {
    return this.data.get(cellKey(row, col)) ?? EMPTY_META;
  }
  getStoredMeta(row: number, col: number): Partial<ICellMeta> {
    return this.data.get(cellKey(row, col)) ?? {};
  }
  setMeta(row: number, col: number, meta: Partial<ICellMeta>): void {
    const key = cellKey(row, col);
    const prev = this.data.get(key) ?? {};
    const next: ICellMeta = { ...prev, ...meta };

    if (isDefaultMeta(next)) {
      if (!this.data.has(key)) return;
      this.data.delete(key);
    } else {
      this.data.set(key, next);
    }
    this.listeners.get(key)?.forEach((fn) => fn());
  }
  setMetas(cells: IMetaStoreInput[]): void {
    const changedKeys = new Set<string>();
    for (const { row, col, meta } of cells) {
      const key = cellKey(row, col);
      const prev = this.data.get(key) ?? {};
      const next: ICellMeta = { ...prev, ...meta };

      if (isDefaultMeta(next)) {
        if (this.data.delete(key)) {
          changedKeys.add(key);
        }
      } else {
        this.data.set(key, next);
        changedKeys.add(key);
      }
    }
    changedKeys.forEach((key) => {
      this.listeners.get(key)?.forEach((fn) => fn());
    });
  }
  subscribe(row: number, col: number, listener: () => void): () => void {
    const key = cellKey(row, col);
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(listener);
    return () => {
      this.listeners.get(key)?.delete(listener);
    };
  }
}

