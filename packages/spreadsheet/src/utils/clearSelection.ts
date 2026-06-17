import type { CellStore } from "../store/CellStore";
import type { MergeStore } from "../store/MergeStore";
import type { ICellInput, ICellStoreInput, INormalizedRange } from "../types";
import { iterRangeCells } from "./normalizeRange";

export function clearSelectionValues(
  store: CellStore,
  range: INormalizedRange,
  onChange?: (changes: ICellInput[]) => void,
  isWritable?: (row: number, col: number) => boolean,
  visibleRowIndices?: readonly number[],
  mergeStore?: MergeStore,
): void {
  const visibleRowSet =
    visibleRowIndices !== undefined
      ? new Set(visibleRowIndices)
      : null;
  const toClear: ICellStoreInput[] = [];
  for (const { row, col } of iterRangeCells(range)) {
    if (visibleRowSet && !visibleRowSet.has(row)) continue;
    if (mergeStore?.getRole(row, col) === "covered") continue;
    if (isWritable && !isWritable(row, col)) continue;
    if (store.getValue(row, col) !== "") {
      toClear.push({ row, col, value: "" });
    }
  }

  if (toClear.length === 0) return;
  store.setValues(toClear);
  onChange?.(toClear);
}
