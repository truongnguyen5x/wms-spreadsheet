import type { CellStore } from "../store/CellStore";
import type {
  ICellStoreInput,
  IClipboardData,
  INormalizedRange,
} from "../types";
import { getVisiblePhysicalRowsInRange } from "./visibleRowLayout";

export function copyRange(
  store: CellStore,
  range: INormalizedRange,
  visibleRowIndices?: readonly number[],
): IClipboardData {
  const rows =
    visibleRowIndices !== undefined
      ? getVisiblePhysicalRowsInRange(range, visibleRowIndices)
      : Array.from(
          { length: range.endRow - range.startRow + 1 },
          (_, index) => range.startRow + index,
        );
  const colCount = range.endCol - range.startCol + 1;
  const values: string[][] = [];
  for (const physicalRow of rows) {
    const row: string[] = [];
    for (let c = 0; c < colCount; c++) {
      row.push(store.getValue(physicalRow, range.startCol + c));
    }
    values.push(row);
  }

  const copiedRange: INormalizedRange =
    rows.length > 0
      ? {
          startRow: rows[0],
          endRow: rows[rows.length - 1],
          startCol: range.startCol,
          endCol: range.endCol,
        }
      : range;

  return { range: copiedRange, values };
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
  canWrite?: (row: number, col: number) => boolean,
  visibleRowIndices?: readonly number[],
): ICellStoreInput[] {
  const changes: ICellStoreInput[] = [];
  const useVisibleRows =
    visibleRowIndices !== undefined &&
    visibleRowIndices.length < rowCount;
  const startVisibleIndex = useVisibleRows
    ? visibleRowIndices.indexOf(targetRow)
    : -1;

  if (useVisibleRows && startVisibleIndex < 0) {
    return changes;
  }

  for (let r = 0; r < values.length; r++) {
    const destRow = useVisibleRows
      ? visibleRowIndices[startVisibleIndex + r]
      : targetRow + r;
    if (destRow === undefined || destRow >= rowCount) break;
    const rowValues = values[r] ?? [];
    for (let c = 0; c < rowValues.length; c++) {
      const destCol = targetCol + c;
      if (destCol >= columnCount) break;
      if (canWrite && !canWrite(destRow, destCol)) continue;
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

export function applyChanges(
  store: CellStore,
  changes: ICellStoreInput[],
): void {
  if (changes.length === 0) return;
  if (changes.length === 1) {
    const { row, col, value } = changes[0];
    store.setValue(row, col, value);
    return;
  }
  store.setValues(changes);
}
