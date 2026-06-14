import type { CellStore } from "../store/CellStore";
import type { ISheetData, ISpreadsheetColumn } from "../types";
import { cellKey } from "./cellKey";

const CELL_KEY_PATTERN = /^\d+:\d+$/;

export function is2DArray(data: unknown): data is string[][] {
  return (
    Array.isArray(data) &&
    (data.length === 0 || Array.isArray(data[0]))
  );
}

export function isObjectArray(
  data: unknown,
): data is Record<string, string>[] {
  return (
    Array.isArray(data) &&
    data.length > 0 &&
    typeof data[0] === "object" &&
    data[0] !== null &&
    !Array.isArray(data[0])
  );
}

export function isSheetData(data: unknown): data is ISheetData {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return false;
  }
  const keys = Object.keys(data);
  return keys.length === 0 || keys.every((key) => CELL_KEY_PATTERN.test(key));
}

export function resolveColIndex(
  col: number | null | undefined,
  colName: string | undefined,
  columns: ISpreadsheetColumn[] | undefined,
): number {
  if (col !== null && col !== undefined) {
    return col;
  }

  if (!colName) {
    throw new Error("colName is required when col is null");
  }

  if (!columns?.length) {
    throw new Error("columns prop is required when using colName");
  }

  const index = columns.findIndex((column) => column.colName === colName);
  if (index === -1) {
    throw new Error(`Unknown colName: ${colName}`);
  }

  return index;
}

function matrixToSheetData(data: string[][]): ISheetData {
  const result: ISheetData = {};

  for (let row = 0; row < data.length; row++) {
    for (let col = 0; col < data[row].length; col++) {
      const value = data[row][col];
      if (value !== "") {
        result[cellKey(row, col)] = value;
      }
    }
  }

  return result;
}

function objectArrayToSheetData(
  data: Record<string, string>[],
  columns: ISpreadsheetColumn[],
): ISheetData {
  const result: ISheetData = {};

  for (let row = 0; row < data.length; row++) {
    const rowData = data[row];
    for (let col = 0; col < columns.length; col++) {
      const value = String(rowData[columns[col].colName] ?? "");
      if (value !== "") {
        result[cellKey(row, col)] = value;
      }
    }
  }

  return result;
}

export function normalizeToSheetData(
  data: unknown,
  columns?: ISpreadsheetColumn[],
): ISheetData {
  if (isSheetData(data)) {
    return data;
  }

  if (is2DArray(data)) {
    return matrixToSheetData(data);
  }

  if (isObjectArray(data)) {
    if (!columns?.length) {
      throw new Error("columns prop is required when initialData is an object array");
    }
    return objectArrayToSheetData(data, columns);
  }

  throw new Error("Unsupported data format");
}

export function exportSheetData(
  store: CellStore,
  columns: ISpreadsheetColumn[] | undefined,
  rowCount: number,
): ISheetData | Record<string, string>[] {
  if (!columns?.length) {
    return store.getAllData();
  }

  const result: Record<string, string>[] = [];

  for (let row = 0; row < rowCount; row++) {
    const rowObject: Record<string, string> = {};
    let hasData = false;

    for (let col = 0; col < columns.length; col++) {
      const value = store.getValue(row, col);
      if (value !== "") {
        rowObject[columns[col].colName] = value;
        hasData = true;
      }
    }

    if (hasData) {
      result.push(rowObject);
    }
  }

  return result;
}

export function getEffectiveColumnCount(
  columnCount: number,
  columns?: ISpreadsheetColumn[],
): number {
  return Math.max(columnCount, columns?.length ?? 0);
}

export function buildInitialColumnWidths(
  columnCount: number,
  defaultColumnWidth: number,
  columns?: ISpreadsheetColumn[],
): number[] | undefined {
  if (!columns?.length) return undefined;
  const total = getEffectiveColumnCount(columnCount, columns);
  return Array.from(
    { length: total },
    (_, col) => columns[col]?.width ?? defaultColumnWidth,
  );
}
