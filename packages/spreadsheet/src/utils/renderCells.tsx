import type { CellStore } from "../store/CellStore";
import type { MergeStore } from "../store/MergeStore";
import type { MetaStore } from "../store/MetaStore";
import type {
  ICellAddress,
  ICustomCellDefinition,
  ISelection,
  ISpreadsheetColumn,
} from "../types";
import type { IGridDimensions } from "../hooks/useGridDimensions";
import { sumSizes } from "./gridDimensions";
import { SpreadsheetCell } from "../components/SpreadsheetCell";

export interface IRenderCellsOptions {
  store: CellStore;
  metaStore: MetaStore;
  mergeStore: MergeStore;
  dimensions: IGridDimensions;
  rowStart: number;
  rowEnd: number;
  colStart: number;
  colEnd: number;
  columns?: ISpreadsheetColumn[];
  customCellRegistry?: Record<string, ICustomCellDefinition>;
  selection?: ISelection | null;
  activeCell?: ICellAddress | null;
  getColumnLeft: (col: number) => number;
  resolvePhysicalRow?: (displayRow: number) => number;
  getRowTop?: (displayRow: number) => number;
  onCellMouseDown: (row: number, col: number) => void;
  onCellMouseEnter: (row: number, col: number) => void;
  onCellDoubleClick: (row: number, col: number) => void;
  onBooleanToggle: (row: number, col: number, nextValue: string) => void;
}

export function renderCells({
  store,
  metaStore,
  mergeStore,
  dimensions,
  rowStart,
  rowEnd,
  colStart,
  colEnd,
  columns,
  customCellRegistry,
  selection,
  activeCell,
  getColumnLeft,
  resolvePhysicalRow,
  getRowTop,
  onCellMouseDown,
  onCellMouseEnter,
  onCellDoubleClick,
  onBooleanToggle,
}: IRenderCellsOptions): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  if (colEnd < colStart) return result;
  const resolvedFocus =
    activeCell !== undefined
      ? activeCell
      : selection?.focus
        ? mergeStore.resolveAnchor(selection.focus.row, selection.focus.col)
        : null;

  for (let displayRow = rowStart; displayRow <= rowEnd; displayRow++) {
    const row = resolvePhysicalRow ? resolvePhysicalRow(displayRow) : displayRow;
    if (row < 0) continue;
    for (let col = colStart; col <= colEnd; col++) {
      if (mergeStore.getRole(row, col) === "covered") continue;

      const { rowSpan, colSpan } = mergeStore.getSpan(row, col);
      const isMerged = rowSpan > 1 || colSpan > 1;
      const width = sumSizes(
        dimensions.columnWidths,
        col,
        col + colSpan - 1,
      );
      const height = sumSizes(
        dimensions.rowHeights,
        row,
        row + rowSpan - 1,
      );
      const isActive =
        resolvedFocus !== null &&
        resolvedFocus.row === row &&
        resolvedFocus.col === col;

      result.push(
        <SpreadsheetCell
          key={`${row}:${col}`}
          store={store}
          metaStore={metaStore}
          row={row}
          col={col}
          columns={columns}
          customCellRegistry={customCellRegistry}
          isActive={isActive}
          isMerged={isMerged}
          top={getRowTop ? getRowTop(displayRow) : dimensions.getRowTop(row)}
          left={getColumnLeft(col)}
          width={width}
          height={height}
          onMouseDown={onCellMouseDown}
          onMouseEnter={onCellMouseEnter}
          onDoubleClick={onCellDoubleClick}
          onBooleanToggle={onBooleanToggle}
        />,
      );
    }
  }

  return result;
}
