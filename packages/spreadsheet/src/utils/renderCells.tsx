import type { CellStore } from "../store/CellStore";
import type { MetaStore } from "../store/MetaStore";
import type {
  ICustomCellDefinition,
  ISelection,
  ISpreadsheetColumn,
} from "../types";
import type { IGridDimensions } from "../hooks/useGridDimensions";
import { SpreadsheetCell } from "../components/SpreadsheetCell";

export interface IRenderCellsOptions {
  store: CellStore;
  metaStore: MetaStore;
  dimensions: IGridDimensions;
  rowStart: number;
  rowEnd: number;
  colStart: number;
  colEnd: number;
  columns?: ISpreadsheetColumn[];
  customCellRegistry?: Record<string, ICustomCellDefinition>;
  selection?: ISelection | null;
  getColumnLeft: (col: number) => number;
  onCellMouseDown: (row: number, col: number) => void;
  onCellMouseEnter: (row: number, col: number) => void;
  onCellDoubleClick: (row: number, col: number) => void;
  onBooleanToggle: (row: number, col: number, nextValue: string) => void;
}

export function renderCells({
  store,
  metaStore,
  dimensions,
  rowStart,
  rowEnd,
  colStart,
  colEnd,
  columns,
  customCellRegistry,
  selection,
  getColumnLeft,
  onCellMouseDown,
  onCellMouseEnter,
  onCellDoubleClick,
  onBooleanToggle,
}: IRenderCellsOptions): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  if (colEnd < colStart) return result;
  const focus = selection?.focus;
  for (let row = rowStart; row <= rowEnd; row++) {
    for (let col = colStart; col <= colEnd; col++) {
      const isActive =
        focus !== undefined &&
        focus?.row === row &&
        focus?.col === col;
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
          top={dimensions.getRowTop(row)}
          left={getColumnLeft(col)}
          width={dimensions.getColumnWidth(col)}
          height={dimensions.getRowHeight(row)}
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
