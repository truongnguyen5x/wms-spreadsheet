import type { ReactNode } from "react";
import type { ISpreadsheetColumn } from "../types";
import { columnLabel } from "./columnLabel";

export function getColumnHeaderContent(
  col: number,
  columns?: ISpreadsheetColumn[],
): ReactNode {
  const column = columns?.[col];
  if (!column) return columnLabel(col);
  if (column.colRender) return column.colRender({ col, column });
  return column.colText ?? column.colName;
}

