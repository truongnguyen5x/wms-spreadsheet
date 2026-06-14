import { memo } from "react";
import { ROW_HEADER_WIDTH, type INormalizedRange } from "../../types";
import type { IVisibleRange } from "../../utils/computeVisibleRange";
import styles from "../../styles/spreadsheet.module.scss";

export interface IRowHeaderColumnProps {
  visibleRange: IVisibleRange;
  rowHeight: number;
  scrollTop: number;
  totalHeight: number;
  selectionRange: INormalizedRange | null;
}

export const RowHeaderColumn = memo(function RowHeaderColumn({
  visibleRange,
  rowHeight,
  scrollTop,
  totalHeight,
  selectionRange,
}: IRowHeaderColumnProps) {
  const headers: React.ReactNode[] = [];

  for (let row = visibleRange.startRow; row <= visibleRange.endRow; row++) {
    const isActive =
      selectionRange !== null &&
      row >= selectionRange.startRow &&
      row <= selectionRange.endRow;
    headers.push(
      <div
        key={row}
        className={`${styles.rowHeaderCell}${isActive ? ` ${styles.active}` : ""}`}
        style={{
          top: row * rowHeight,
          width: ROW_HEADER_WIDTH,
          height: rowHeight,
        }}
      >
        {row + 1}
      </div>,
    );
  }

  return (
    <div className={styles.rowHeaderPane}>
      <div
        className={styles.headerCanvas}
        style={{
          width: ROW_HEADER_WIDTH,
          height: totalHeight,
          transform: `translateY(${-scrollTop}px)`,
        }}
      >
        {headers}
      </div>
    </div>
  );
});
