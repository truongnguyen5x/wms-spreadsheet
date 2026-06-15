import type { MetaStore } from "../store/MetaStore";
import type { ICellMeta, ISpreadsheetColumn, TCellType } from "../types";

const DEFAULT_META: ICellMeta = { type: "text" };

function columnToMeta(column?: ISpreadsheetColumn): Partial<ICellMeta> {
  return column?.meta ?? {};
}

function inferCellType(meta: ICellMeta): TCellType {
  if (meta.customKey) return "custom";
  if (meta.options?.length) return "select";
  return meta.type ?? "text";
}

export function resolveCellMeta(
  metaStore: MetaStore,
  row: number,
  col: number,
  columns?: ISpreadsheetColumn[],
): ICellMeta {
  const cellMeta = metaStore.getStoredMeta(row, col);
  const columnMeta = columnToMeta(columns?.[col]);
  const merged: ICellMeta = {
    ...DEFAULT_META,
    ...columnMeta,
    ...cellMeta,
  };

  merged.type = inferCellType(merged);

  return merged;
}

export function isCellDisabled(meta: ICellMeta): boolean {
  return meta.disabled === true;
}

export function isCellEditable(meta: ICellMeta): boolean {
  if (isCellDisabled(meta)) return false;
  return meta.type !== "boolean" && meta.type !== "switch";
}

