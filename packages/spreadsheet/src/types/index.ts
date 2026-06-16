import type { ReactNode } from "react";

export type TCellType =
  | "text"
  | "select"
  | "boolean"
  | "switch"
  | "date"
  | "custom";
export type THorizontalAlign = "left" | "center" | "right";
export type TVerticalAlign = "top" | "middle" | "bottom";
export type ICommitDirection = "stay" | "down" | "right";
export interface ISelectOption {
  id: string;
  label: string;
  color?: string;
}

export interface ICellMeta {
  type?: TCellType;
  options?: ISelectOption[];
  /** Định dạng ngày lưu và hiển thị. Mặc định DD/MM/YYYY */
  dateFormat?: string;
  /** Ngày sớm nhất được chọn (chuỗi theo dateFormat của cell/cột) */
  minDate?: string;
  /** Ngày muộn nhất được chọn (chuỗi theo dateFormat của cell/cột) */
  maxDate?: string;
  customKey?: string;
  customProps?: Record<string, unknown>;
  invalid?: boolean;
  disabled?: boolean;
}

export interface ICellRenderParams {
  row: number;
  col: number;
  value: string;
  meta: ICellMeta;
  isActive: boolean;
}

export interface ICellEditorParams extends ICellRenderParams {
  top: number;
  left: number;
  width: number;
  height: number;
  onCommit: (value: string, direction?: ICommitDirection) => void;
  onCancel: () => void;
}

export interface ICustomCellDefinition {
  render: (params: ICellRenderParams) => ReactNode;
  editor?: (params: ICellEditorParams) => ReactNode;
}

export interface ICellMetaInput {
  row: number;
  col?: number | null;
  colName?: string;
  meta: Partial<ICellMeta>;
}

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
  /** Meta mặc định cho toàn cột; cell meta override từng field. */
  meta?: Partial<ICellMeta>;
  /** Căn ngang nội dung body cell. Mặc định "left". Không áp header. */
  horizontalAlign?: THorizontalAlign;
  /** Căn dọc nội dung body cell. Mặc định "top". Không áp header. */
  verticalAlign?: TVerticalAlign;
  /** Override render cell body; ưu tiên hơn registry. */
  cellRender?: (params: ICellRenderParams) => ReactNode;
  /** Override editor cell; ưu tiên hơn registry. */
  cellEditor?: (params: ICellEditorParams) => ReactNode;
}

export type TSheetDataInput =
  | ISheetData
  | string[][]
  | Record<string, string>[];
export type TSheetDataOutput = ISheetData | Record<string, string>[];
export type TSheetRowDataOutput = ISheetData | Record<string, string>;
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
  getCellValue(row: number, col: number | null, colName?: string): string;
  setCellValues(cells: ICellInput[]): void;
  loadData(data: TSheetDataInput): void;
  getData(): TSheetDataOutput;
  getRowData(row: number): TSheetRowDataOutput;
  getActiveCell(): ICellAddress | null;
  setActiveCell(cell: ICellAddress): void;
  getSelection(): ISelection | null;
  setSelection(selection: ISelection): void;
  setCellMeta(
    row: number,
    col: number | null,
    meta: Partial<ICellMeta>,
    colName?: string,
  ): void;
  getCellMeta(row: number, col: number | null, colName?: string): ICellMeta;
  setCellsMeta(cells: ICellMetaInput[]): void;
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
  /** Registry custom cell render/editor theo customKey. */
  customCellRegistry?: Record<string, ICustomCellDefinition>;
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

