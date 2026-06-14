import { memo, type Ref } from "react";
import {
  ROW_HEADER_WIDTH,
  RESIZE_HIT_ZONE,
  type INormalizedRange,
  type IResizeHandle,
} from "../../types";
import type { IVisibleRange } from "../../utils/computeVisibleRange";
import type { IGridDimensions } from "../../hooks/useGridDimensions";
import styles from "../../styles/spreadsheet.module.scss";

export interface IRowHeaderColumnProps {
  visibleRange: IVisibleRange;
  dimensions: IGridDimensions;
  scrollTop: number;
  totalHeight: number;
  selectionRange: INormalizedRange | null;
  headerPaneRef?: Ref<HTMLDivElement>;
  hoveredHandle: IResizeHandle | null;
  onRowMouseDown: (row: number) => void;
  onRowMouseEnter: (row: number) => void;
  onResizeHandleMouseEnter: (handle: IResizeHandle) => void;
  onResizeHandleMouseLeave: () => void;
  onResizeStart: (row: number, clientY: number) => void;
}

export const RowHeaderColumn = memo(function RowHeaderColumn({
  visibleRange,
  dimensions,
  scrollTop,
  totalHeight,
  selectionRange,
  headerPaneRef,
  hoveredHandle,
  onRowMouseDown,
  onRowMouseEnter,
  onResizeHandleMouseEnter,
  onResizeHandleMouseLeave,
  onResizeStart,
}: IRowHeaderColumnProps) {
  const headers: React.ReactNode[] = [];
  const handles: React.ReactNode[] = [];

  for (let row = visibleRange.startRow; row <= visibleRange.endRow; row++) {
    const rowTop = dimensions.getRowTop(row);
    const rowHeight = dimensions.getRowHeight(row);
    const isActive =
      selectionRange !== null &&
      row >= selectionRange.startRow &&
      row <= selectionRange.endRow;

    headers.push(
      <div
        key={row}
        className={`${styles.rowHeaderCell}${isActive ? ` ${styles.active}` : ""}`}
        style={{
          top: rowTop,
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

    const isHandleHovered =
      hoveredHandle?.axis === "row" && hoveredHandle.index === row;

    handles.push(
      <div
        key={`resize-${row}`}
        className={`${styles.rowResizeHandle}${isHandleHovered ? ` ${styles.resizeHandleHovered}` : ""}`}
        style={{
          top: rowTop + rowHeight - RESIZE_HIT_ZONE / 2,
          height: RESIZE_HIT_ZONE,
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onResizeStart(row, e.clientY);
        }}
        onMouseEnter={() =>
          onResizeHandleMouseEnter({ axis: "row", index: row })
        }
        onMouseLeave={onResizeHandleMouseLeave}
      >
        <span className={styles.resizeHandleIcon} aria-hidden />
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
        {handles}
      </div>
    </div>
  );
});
