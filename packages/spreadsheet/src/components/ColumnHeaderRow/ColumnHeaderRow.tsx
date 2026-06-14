import { memo } from "react";
import { columnLabel } from "../../utils/columnLabel";
import {
  COLUMN_HEADER_HEIGHT,
} from "../../types";
import type { IVisibleRange } from "../../utils/computeVisibleRange";
import styles from "../../styles/spreadsheet.module.scss";

export interface IColumnHeaderRowProps {
  visibleRange: IVisibleRange;
  columnWidth: number;
  scrollLeft: number;
  totalWidth: number;
  activeCol: number | null;
}

export const ColumnHeaderRow = memo(function ColumnHeaderRow({
  visibleRange,
  columnWidth,
  scrollLeft,
  totalWidth,
  activeCol,
}: IColumnHeaderRowProps) {
  const headers: React.ReactNode[] = [];

  for (let col = visibleRange.startCol; col <= visibleRange.endCol; col++) {
    const isActive = activeCol === col;
    headers.push(
      <div
        key={col}
        className={`${styles.headerCell}${isActive ? ` ${styles.active}` : ""}`}
        style={{
          top: 0,
          left: col * columnWidth,
          width: columnWidth,
          height: COLUMN_HEADER_HEIGHT,
        }}
      >
        {columnLabel(col)}
      </div>,
    );
  }

  return (
    <div className={styles.columnHeaderPane}>
      <div
        className={styles.headerCanvas}
        style={{
          width: totalWidth,
          height: COLUMN_HEADER_HEIGHT,
          transform: `translateX(${-scrollLeft}px)`,
        }}
      >
        {headers}
      </div>
    </div>
  );
});
