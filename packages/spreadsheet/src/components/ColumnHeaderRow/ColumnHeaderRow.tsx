import { memo, type Ref } from "react";
import { columnLabel } from "../../utils/columnLabel";
import { COLUMN_HEADER_HEIGHT, type INormalizedRange } from "../../types";
import type { IVisibleRange } from "../../utils/computeVisibleRange";
import styles from "../../styles/spreadsheet.module.scss";

export interface IColumnHeaderRowProps {
  visibleRange: IVisibleRange;
  columnWidth: number;
  scrollLeft: number;
  totalWidth: number;
  selectionRange: INormalizedRange | null;
  headerPaneRef?: Ref<HTMLDivElement>;
  onColumnMouseDown: (col: number) => void;
  onColumnMouseEnter: (col: number) => void;
}

export const ColumnHeaderRow = memo(function ColumnHeaderRow({
  visibleRange,
  columnWidth,
  scrollLeft,
  totalWidth,
  selectionRange,
  headerPaneRef,
  onColumnMouseDown,
  onColumnMouseEnter,
}: IColumnHeaderRowProps) {
  const headers: React.ReactNode[] = [];

  for (let col = visibleRange.startCol; col <= visibleRange.endCol; col++) {
    const isActive =
      selectionRange !== null &&
      col >= selectionRange.startCol &&
      col <= selectionRange.endCol;
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
        onMouseDown={(e) => {
          e.preventDefault();
          onColumnMouseDown(col);
        }}
        onMouseEnter={() => onColumnMouseEnter(col)}
      >
        {columnLabel(col)}
      </div>,
    );
  }

  return (
    <div ref={headerPaneRef} className={styles.columnHeaderPane}>
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
