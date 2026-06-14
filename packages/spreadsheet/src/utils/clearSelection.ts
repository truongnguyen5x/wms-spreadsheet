import type { CellStore } from "../store/CellStore";
import type { ICellInput, INormalizedRange } from "../types";
import { iterRangeCells } from "./normalizeRange";

export function clearSelectionValues(
  store: CellStore,
  range: INormalizedRange,
  onChange?: (changes: ICellInput[]) => void,
): void {
  const toClear: ICellInput[] = [];

  for (const { row, col } of iterRangeCells(range)) {
    if (store.getValue(row, col) !== "") {
      toClear.push({ row, col, value: "" });
    }
  }

  if (toClear.length === 0) return;

  store.setValues(toClear);
  onChange?.(toClear);
}
