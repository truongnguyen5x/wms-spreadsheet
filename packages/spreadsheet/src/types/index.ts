import type { ReactNode } from "react";

export interface ICellAddress {
  row: number;
  col: number;
}

export interface ISelection {
  anchor: ICellAddress;
  focus: ICellAddress;
}

export interface INormalizedRange {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
}

export type ISheetData = Record<string, string>;

export interface IColumnHeaderRenderParams {
  col: number;
  column: ISpreadsheetColumn;
}

export interface ISpreadsheetColumn {
  /** Key trong object data và API colName. */
  colName: string;
  width: number;
  /** Text hiển thị header; mặc định colName. */
  colText?: string;
  /** Custom render header cell; ưu tiên hơn colText. */
  colRender?: (params: IColumnHeaderRenderParams) => ReactNode;
}

export type TSheetDataInput =
  | ISheetData
  | string[][]
  | Record<string, string>[];

export type TSheetDataOutput = ISheetData | Record<string, string>[];

export interface ICellInput {
  row: number;
  col?: number | null;
  colName?: string;
  value: string;
}

/** Input nội bộ cho CellStore — luôn dùng index cột. */
export interface ICellStoreInput {
  row: number;
  col: number;
  value: string;
}

export interface IClipboardData {
  range: INormalizedRange;
  values: string[][];
}

export interface ISpreadsheetRef {
  setCellValue(
    row: number,
    col: number | null,
    value: string,
    colName?: string,
  ): void;
  getCellValue(
    row: number,
    col: number | null,
    colName?: string,
  ): string;
  setCellValues(cells: ICellInput[]): void;
  loadData(data: TSheetDataInput): void;
  getData(): TSheetDataOutput;
  getActiveCell(): ICellAddress | null;
  setActiveCell(cell: ICellAddress): void;
  getSelection(): ISelection | null;
  setSelection(selection: ISelection): void;
}

export interface ISpreadsheetProps {
  rowCount: number;
  columnCount: number;
  columns?: ISpreadsheetColumn[];
  rowHeight?: number;
  columnWidth?: number;
  overscan?: number;
  className?: string;
  onChange?: (changes: ICellInput[]) => void;
  onColumnResize?: (col: number, width: number) => void;
  onRowResize?: (row: number, height: number) => void;
  initialData?: TSheetDataInput;
  /** Số cột cố định từ trái (0 = không cố định). Ví dụ 2 → cột A, B. */
  frozenColumnCount?: number;
}

export const DEFAULT_ROW_HEIGHT = 28;
export const DEFAULT_COLUMN_WIDTH = 100;
export const CELL_LINE_HEIGHT = 20;
export const CELL_EDITOR_VERTICAL_CHROME = 10;
export const ROW_HEADER_WIDTH = 46;
export const COLUMN_HEADER_HEIGHT = 28;
export const DEFAULT_OVERSCAN = 3;
export const MIN_COLUMN_WIDTH = 20;
export const MIN_ROW_HEIGHT = 20;
export const RESIZE_HIT_ZONE = 5;

export type TResizeAxis = "column" | "row";

export interface IResizeHandle {
  axis: TResizeAxis;
  index: number;
}
