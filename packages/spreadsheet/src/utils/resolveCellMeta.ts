import type { MetaStore } from "../store/MetaStore";
import type { ICellMeta, ISpreadsheetColumn, TCellType } from "../types";

const DEFAULT_META: ICellMeta = { type: "text" };

function columnToMeta(column?: ISpreadsheetColumn): Partial<ICellMeta> {
  if (!column) return {};

  return {
    type: column.cellType,
    options: column.options,
    customKey: column.customKey,
  };
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
  const cellMeta = metaStore.getMeta(row, col);
  const columnMeta = columnToMeta(columns?.[col]);
  const merged: ICellMeta = {
    ...DEFAULT_META,
    ...columnMeta,
    ...cellMeta,
  };

  merged.type = inferCellType(merged);

  return merged;
}

export function isCellEditable(meta: ICellMeta): boolean {
  return meta.type !== "boolean";
}

