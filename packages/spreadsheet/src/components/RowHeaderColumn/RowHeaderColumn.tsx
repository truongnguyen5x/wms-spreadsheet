import { memo, type Ref } from "react";
import { ROW_HEADER_WIDTH, type INormalizedRange } from "../../types";
import type { IVisibleRange } from "../../utils/computeVisibleRange";
import styles from "../../styles/spreadsheet.module.scss";

export interface IRowHeaderColumnProps {
  visibleRange: IVisibleRange;
  rowHeight: number;
  scrollTop: number;
  totalHeight: number;
  selectionRange: INormalizedRange | null;
  headerPaneRef?: Ref<HTMLDivElement>;
  onRowMouseDown: (row: number) => void;
  onRowMouseEnter: (row: number) => void;
}

export const RowHeaderColumn = memo(function RowHeaderColumn({
  visibleRange,
  rowHeight,
  scrollTop,
  totalHeight,
  selectionRange,
  headerPaneRef,
  onRowMouseDown,
  onRowMouseEnter,
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
        onMouseDown={(e) => {
          e.preventDefault();
          onRowMouseDown(row);
        }}
        onMouseEnter={() => onRowMouseEnter(row)}
      >
        {row + 1}
      </div>,
    );
  }

  return (
    <div ref={headerPaneRef} className={styles.rowHeaderPane}>
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
