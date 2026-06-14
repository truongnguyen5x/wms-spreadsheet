import { cellKey, parseCellKey } from "../utils/cellKey";
import type { ISheetData, ICellStoreInput } from "../types";

export class CellStore {
  private data = new Map<string, string>();
  private listeners = new Map<string, Set<() => void>>();

  getValue(row: number, col: number): string {
    return this.data.get(cellKey(row, col)) ?? "";
  }

  setValue(row: number, col: number, value: string): void {
    const key = cellKey(row, col);
    const prev = this.data.get(key) ?? "";
    if (prev === value) return;

    if (value === "") {
      this.data.delete(key);
    } else {
      this.data.set(key, value);
    }

    this.listeners.get(key)?.forEach((fn) => fn());
  }

  setValues(cells: ICellStoreInput[]): void {
    const changedKeys = new Set<string>();

    for (const { row, col, value } of cells) {
      const key = cellKey(row, col);
      const prev = this.data.get(key) ?? "";
      if (prev === value) continue;

      if (value === "") {
        this.data.delete(key);
      } else {
        this.data.set(key, value);
      }
      changedKeys.add(key);
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

  getAllData(): ISheetData {
    const result: ISheetData = {};
    this.data.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  loadData(data: ISheetData): void {
    const changedKeys = new Set<string>();

    for (const [key, value] of Object.entries(data)) {
      const prev = this.data.get(key) ?? "";
      if (prev === value) continue;

      if (value === "") {
        this.data.delete(key);
      } else {
        this.data.set(key, value);
      }
      changedKeys.add(key);
    }

    changedKeys.forEach((key) => {
      this.listeners.get(key)?.forEach((fn) => fn());
    });
  }

  clearAndLoad(data: ISheetData): void {
    const oldKeys = new Set(this.data.keys());
    this.data.clear();

    const allKeys = new Set<string>(oldKeys);
    for (const [key, value] of Object.entries(data)) {
      if (value !== "") {
        this.data.set(key, value);
        allKeys.add(key);
      }
    }

    allKeys.forEach((key) => {
      this.listeners.get(key)?.forEach((fn) => fn());
    });
  }

  getKeys(): string[] {
    return Array.from(this.data.keys());
  }

  parseKey(key: string): { row: number; col: number } {
    return parseCellKey(key);
  }
}
