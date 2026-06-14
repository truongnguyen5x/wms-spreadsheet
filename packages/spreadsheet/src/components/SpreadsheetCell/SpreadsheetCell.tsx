import { memo } from "react";
import type { CellStore } from "../../store/CellStore";
import { useCellValue } from "../../hooks/useCellValue";
import styles from "../../styles/spreadsheet.module.scss";

export interface ISpreadsheetCellProps {
  store: CellStore;
  row: number;
  col: number;
  isActive: boolean;
  top: number;
  left: number;
  width: number;
  height: number;
  onClick: (row: number, col: number) => void;
  onDoubleClick: (row: number, col: number) => void;
}

export const SpreadsheetCell = memo(function SpreadsheetCell({
  store,
  row,
  col,
  isActive,
  top,
  left,
  width,
  height,
  onClick,
  onDoubleClick,
}: ISpreadsheetCellProps) {
  const value = useCellValue(store, row, col);

  return (
    <div
      className={`${styles.cell}${isActive ? ` ${styles.active}` : ""}`}
      style={{ top, left, width, height }}
      onClick={() => onClick(row, col)}
      onDoubleClick={() => onDoubleClick(row, col)}
      role="gridcell"
      aria-selected={isActive}
    >
      {value}
      {isActive && <span className={styles.fillHandle} />}
    </div>
  );
});
