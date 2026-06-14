import { useSyncExternalStore } from "react";
import type { MetaStore } from "../store/MetaStore";
import type { ICellMeta } from "../types";

export function useCellMeta(
  store: MetaStore,
  row: number,
  col: number,
): ICellMeta {
  return useSyncExternalStore(
    (cb) => store.subscribe(row, col, cb),
    () => store.getMeta(row, col),
    () => store.getMeta(row, col),
  );
}

