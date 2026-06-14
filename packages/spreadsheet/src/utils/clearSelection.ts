import type { CellStore } from "../store/CellStore";
import type { INormalizedRange } from "../types";
import { iterRangeCells } from "./normalizeRange";

export function clearSelectionValues(
  store: CellStore,
  range: INormalizedRange,
  onCellChange?: (row: number, col: number, value: string) => void,
): void {
  const toClear: Array<{ row: number; col: number; value: string }> = [];

  for (const { row, col } of iterRangeCells(range)) {
    if (store.getValue(row, col) !== "") {
      toClear.push({ row, col, value: "" });
    }
  }

  if (toClear.length === 0) return;

  store.setValues(toClear);

  if (onCellChange) {
    for (const { row, col } of toClear) {
      onCellChange(row, col, "");
    }
  }
}
