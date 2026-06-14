import { memo, type Ref } from "react";
import { columnLabel } from "../../utils/columnLabel";
import {
  COLUMN_HEADER_HEIGHT,
  RESIZE_HIT_ZONE,
  type INormalizedRange,
  type IResizeHandle,
} from "../../types";
import type { IVisibleRange } from "../../utils/computeVisibleRange";
import type { IGridDimensions } from "../../hooks/useGridDimensions";
import styles from "../../styles/spreadsheet.module.scss";

export interface IColumnHeaderRowProps {
  visibleRange: IVisibleRange;
  dimensions: IGridDimensions;
  scrollLeft: number;
  totalWidth: number;
  selectionRange: INormalizedRange | null;
  headerPaneRef?: Ref<HTMLDivElement>;
  hoveredHandle: IResizeHandle | null;
  onColumnMouseDown: (col: number) => void;
  onColumnMouseEnter: (col: number) => void;
  onResizeHandleMouseEnter: (handle: IResizeHandle) => void;
  onResizeHandleMouseLeave: () => void;
  onResizeStart: (col: number, clientX: number) => void;
}

export const ColumnHeaderRow = memo(function ColumnHeaderRow({
  visibleRange,
  dimensions,
  scrollLeft,
  totalWidth,
  selectionRange,
  headerPaneRef,
  hoveredHandle,
  onColumnMouseDown,
  onColumnMouseEnter,
  onResizeHandleMouseEnter,
  onResizeHandleMouseLeave,
  onResizeStart,
}: IColumnHeaderRowProps) {
  const headers: React.ReactNode[] = [];
  const handles: React.ReactNode[] = [];

  for (let col = visibleRange.startCol; col <= visibleRange.endCol; col++) {
    const columnLeft = dimensions.getColumnLeft(col);
    const columnWidth = dimensions.getColumnWidth(col);
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
          left: columnLeft,
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

    const isHandleHovered =
      hoveredHandle?.axis === "column" && hoveredHandle.index === col;

    handles.push(
      <div
        key={`resize-${col}`}
        className={`${styles.columnResizeHandle}${isHandleHovered ? ` ${styles.resizeHandleHovered}` : ""}`}
        style={{
          left: columnLeft + columnWidth - RESIZE_HIT_ZONE / 2,
          width: RESIZE_HIT_ZONE,
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onResizeStart(col, e.clientX);
        }}
        onMouseEnter={() =>
          onResizeHandleMouseEnter({ axis: "column", index: col })
        }
        onMouseLeave={onResizeHandleMouseLeave}
      >
        <span className={styles.resizeHandleIcon} aria-hidden />
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
        {handles}
      </div>
    </div>
  );
});
