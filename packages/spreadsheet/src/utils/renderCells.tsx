import type { CellStore } from "../store/CellStore";
import type { IGridDimensions } from "../hooks/useGridDimensions";
import { SpreadsheetCell } from "../components/SpreadsheetCell";

export function renderCells(
  store: CellStore,
  dimensions: IGridDimensions,
  rowStart: number,
  rowEnd: number,
  colStart: number,
  colEnd: number,
  getColumnLeft: (col: number) => number,
  onCellMouseDown: (row: number, col: number) => void,
  onCellMouseEnter: (row: number, col: number) => void,
  onCellDoubleClick: (row: number, col: number) => void,
): React.ReactNode[] {
  const result: React.ReactNode[] = [];

  if (colEnd < colStart) return result;

  for (let row = rowStart; row <= rowEnd; row++) {
    for (let col = colStart; col <= colEnd; col++) {
      result.push(
        <SpreadsheetCell
          key={`${row}:${col}`}
          store={store}
          row={row}
          col={col}
          top={dimensions.getRowTop(row)}
          left={getColumnLeft(col)}
          width={dimensions.getColumnWidth(col)}
          height={dimensions.getRowHeight(row)}
          onMouseDown={onCellMouseDown}
          onMouseEnter={onCellMouseEnter}
          onDoubleClick={onCellDoubleClick}
        />,
      );
    }
  }

  return result;
}
