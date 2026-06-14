import { memo } from "react";
import type { CellStore } from "../../store/CellStore";
import { useCellValue } from "../../hooks/useCellValue";
import styles from "../../styles/spreadsheet.module.scss";

export interface ISpreadsheetCellProps {
  store: CellStore;
  row: number;
  col: number;
  top: number;
  left: number;
  width: number;
  height: number;
  onMouseDown: (row: number, col: number) => void;
  onMouseEnter: (row: number, col: number) => void;
  onDoubleClick: (row: number, col: number) => void;
}

export const SpreadsheetCell = memo(function SpreadsheetCell({
  store,
  row,
  col,
  top,
  left,
  width,
  height,
  onMouseDown,
  onMouseEnter,
  onDoubleClick,
}: ISpreadsheetCellProps) {
  const value = useCellValue(store, row, col);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    onMouseDown(row, col);
  };

  return (
    <div
      className={styles.cell}
      style={{ top, left, width, height }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => onMouseEnter(row, col)}
      onDoubleClick={() => onDoubleClick(row, col)}
      role="gridcell"
    >
      {value}
    </div>
  );
});
