import type { CellStore } from "../store/CellStore";
import type { ICellStoreInput, IClipboardData, INormalizedRange } from "../types";

export function copyRange(
  store: CellStore,
  range: INormalizedRange,
): IClipboardData {
  const rowCount = range.endRow - range.startRow + 1;
  const colCount = range.endCol - range.startCol + 1;
  const values: string[][] = [];

  for (let r = 0; r < rowCount; r++) {
    const row: string[] = [];
    for (let c = 0; c < colCount; c++) {
      row.push(store.getValue(range.startRow + r, range.startCol + c));
    }
    values.push(row);
  }

  return { range, values };
}

export function clipboardToTsv(data: IClipboardData): string {
  return data.values.map((row) => row.join("\t")).join("\n");
}

export function tsvToMatrix(text: string): string[][] {
  if (!text) return [[""]];
  return text.split(/\r?\n/).map((line) => line.split("\t"));
}

export function pasteAt(
  store: CellStore,
  values: string[][],
  targetRow: number,
  targetCol: number,
  rowCount: number,
  columnCount: number,
): ICellStoreInput[] {
  const changes: ICellStoreInput[] = [];

  for (let r = 0; r < values.length; r++) {
    const destRow = targetRow + r;
    if (destRow >= rowCount) break;

    const rowValues = values[r] ?? [];
    for (let c = 0; c < rowValues.length; c++) {
      const destCol = targetCol + c;
      if (destCol >= columnCount) break;

      const value = rowValues[c] ?? "";
      if (store.getValue(destRow, destCol) !== value) {
        changes.push({ row: destRow, col: destCol, value });
      }
    }
  }

  if (changes.length > 0) {
    store.setValues(changes);
  }

  return changes;
}

export function applyChanges(store: CellStore, changes: ICellStoreInput[]): void {
  if (changes.length === 0) return;
  if (changes.length === 1) {
    const { row, col, value } = changes[0];
    store.setValue(row, col, value);
    return;
  }
  store.setValues(changes);
}
