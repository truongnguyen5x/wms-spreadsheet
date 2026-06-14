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

export interface ICellInput {
  row: number;
  col: number;
  value: string;
}

export interface IClipboardData {
  range: INormalizedRange;
  values: string[][];
}

export interface ISpreadsheetRef {
  setCellValue(row: number, col: number, value: string): void;
  getCellValue(row: number, col: number): string;
  setCellValues(cells: ICellInput[]): void;
  loadData(data: ISheetData): void;
  getData(): ISheetData;
  getActiveCell(): ICellAddress | null;
  setActiveCell(cell: ICellAddress): void;
  getSelection(): ISelection | null;
  setSelection(selection: ISelection): void;
}

export interface ISpreadsheetProps {
  rowCount: number;
  columnCount: number;
  rowHeight?: number;
  columnWidth?: number;
  overscan?: number;
  className?: string;
  onChange?: (changes: ICellInput[]) => void;
  initialData?: ISheetData;
}

export const DEFAULT_ROW_HEIGHT = 28;
export const DEFAULT_COLUMN_WIDTH = 100;
export const ROW_HEADER_WIDTH = 46;
export const COLUMN_HEADER_HEIGHT = 28;
export const DEFAULT_OVERSCAN = 3;
