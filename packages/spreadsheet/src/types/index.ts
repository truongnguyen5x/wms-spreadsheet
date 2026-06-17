import type { ReactNode } from "react";

export type TCellType =
  | "text"
  | "select"
  | "multiSelect"
  | "boolean"
  | "switch"
  | "date"
  | "custom";
export type TCellValue = string | string[];
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

export interface IMergedRange {
  anchorRow: number;
  anchorCol: number;
  rowSpan: number;
  colSpan: number;
}

export type TSpreadsheetErrorCode =
  | "MERGE_COPY_NOT_ALLOWED"
  | "MERGE_PASTE_NOT_ALLOWED"
  | "MERGE_INVALID_RANGE"
  | "MERGE_OVERLAP"
  | "MERGE_SORT_FILTER_ACTIVE";

export interface ISpreadsheetError {
  code: TSpreadsheetErrorCode;
  message: string;
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
  /** Hiển thị icon/filter popup ở header cột. */
  showFilter?: boolean;
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

export type TSheetRowRecord = Record<string, TCellValue>;
export type TSheetDataInput =
  | ISheetData
  | string[][]
  | TSheetRowRecord[];
export type TSheetDataOutput = ISheetData | TSheetRowRecord[];
export type TSheetRowDataOutput = ISheetData | TSheetRowRecord;
export interface ICellInput {
  row: number;
  col?: number | null;
  colName?: string;
  value: TCellValue;
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
    value: TCellValue,
    colName?: string,
  ): void;
  getCellValue(
    row: number,
    col: number | null,
    colName?: string,
  ): TCellValue;
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
  mergeCells(range?: INormalizedRange): boolean;
  unmergeCells(row?: number, col?: number): boolean;
  getMergedRanges(): IMergedRange[];
  hasMergedCells(): boolean;
}

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export type TFilterCondition =
  | "none"
  | "isEmpty"
  | "isNotEmpty"
  | "isEqualTo"
  | "isNotEqualTo"
  | "beginsWith"
  | "endsWith"
  | "contains"
  | "doesNotContain";

export interface ISpreadsheetLocale {
  errors: {
    mergeInvalidRange: string;
    mergeOverlap: string;
    mergeWhileSortFilterActive: string;
    filterWhileMerged: string;
    sortWhileMerged: string;
    copyMergedNotAllowed: string;
    pasteMergedNotAllowed: string;
  };
  filter: {
    columnAriaLabel: string;
    dialogAriaLabel: string;
    sortAsc: string;
    sortDesc: string;
    filterByCondition: string;
    filterByValue: string;
    valuePlaceholder: string;
    searchPlaceholder: string;
    selectAll: string;
    clear: string;
    reset: string;
    ok: string;
    cancel: string;
    blankCells: string;
    conditions: Record<TFilterCondition, string>;
  };
  datepicker: {
    dialogAriaLabel: string;
    prevMonthAriaLabel: string;
    nextMonthAriaLabel: string;
    today: string;
    clear: string;
    monthNames: readonly string[];
    weekdayLabels: readonly string[];
  };
}

export interface ISpreadsheetProps {
  rowCount: number;
  columnCount: number;
  columns?: ISpreadsheetColumn[];
  rowHeight?: number;
  /** Chiều cao hàng header cột (px). Mặc định COLUMN_HEADER_HEIGHT. */
  colHeaderHeight?: number;
  columnWidth?: number;
  overscan?: number;
  className?: string;
  onChange?: (changes: ICellInput[]) => void;
  onError?: (error: ISpreadsheetError) => void;
  onColumnResize?: (col: number, width: number) => void;
  onRowResize?: (row: number, height: number) => void;
  initialData?: TSheetDataInput;
  /** Số cột cố định từ trái (0 = không cố định). Ví dụ 2 → cột A, B. */
  frozenColumnCount?: number;
  /** Registry custom cell render/editor theo customKey. */
  customCellRegistry?: Record<string, ICustomCellDefinition>;
  /** UI strings; mặc định tiếng Anh. Truyền partial để override đa ngôn ngữ. */
  locale?: DeepPartial<ISpreadsheetLocale>;
}

export type TSortDirection = "asc" | "desc";
export interface IColumnSortState {
  col: number;
  direction: TSortDirection;
}
export interface IColumnFilterState {
  condition: TFilterCondition;
  conditionValue?: string;
  /** null = không giới hạn checkbox value. */
  selectedValues: string[] | null;
}
export const FILTER_BLANK_VALUE = "__BLANK__";

export const DEFAULT_ROW_HEIGHT = 28;
export const DEFAULT_COLUMN_WIDTH = 100;
export const CELL_LINE_HEIGHT = 20;
export const CELL_VERTICAL_PADDING = 8;
export const CELL_EDITOR_VERTICAL_CHROME = CELL_VERTICAL_PADDING;
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

