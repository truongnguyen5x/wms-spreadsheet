import { useSyncExternalStore } from "react";
import type { CellStore } from "../store/CellStore";

export function useCellValue(
  store: CellStore,
  row: number,
  col: number,
): string {
  return useSyncExternalStore(
    (cb) => store.subscribe(row, col, cb),
    () => store.getValue(row, col),
    () => store.getValue(row, col),
  );
}

