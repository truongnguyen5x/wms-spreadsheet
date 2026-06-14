import { memo, type Ref } from "react";
import { columnLabel } from "../../utils/columnLabel";
import {
  COLUMN_HEADER_HEIGHT,
  RESIZE_HIT_ZONE,
  type INormalizedRange,
  type IResizeHandle,
} from "../../types";
import type { IGridDimensions } from "../../hooks/useGridDimensions";
import { getScrollableColumnLeft } from "../../utils/frozenColumns";
import styles from "../../styles/spreadsheet.module.scss";

export type TColumnHeaderMode = "frozen" | "scrollable";

export interface IColumnHeaderRowProps {
  colStart: number;
  colEnd: number;
  dimensions: IGridDimensions;
  scrollLeft: number;
  canvasWidth: number;
  frozenWidth: number;
  mode: TColumnHeaderMode;
  selectionRange: INormalizedRange | null;
  headerPaneRef?: Ref<HTMLDivElement>;
  paneClassName?: string;
  withFrozenDivider?: boolean;
  hoveredHandle: IResizeHandle | null;
  onColumnMouseDown: (col: number) => void;
  onColumnMouseEnter: (col: number) => void;
  onResizeHandleMouseEnter: (handle: IResizeHandle) => void;
  onResizeHandleMouseLeave: () => void;
  onResizeStart: (col: number, clientX: number) => void;
}

export const ColumnHeaderRow = memo(function ColumnHeaderRow({
  colStart,
  colEnd,
  dimensions,
  scrollLeft,
  canvasWidth,
  frozenWidth,
  mode,
  selectionRange,
  headerPaneRef,
  paneClassName,
  withFrozenDivider = false,
  hoveredHandle,
  onColumnMouseDown,
  onColumnMouseEnter,
  onResizeHandleMouseEnter,
  onResizeHandleMouseLeave,
  onResizeStart,
}: IColumnHeaderRowProps) {
  const headers: React.ReactNode[] = [];
  const handles: React.ReactNode[] = [];

  if (colEnd >= colStart) {
    for (let col = colStart; col <= colEnd; col++) {
      const columnLeft =
        mode === "frozen"
          ? dimensions.getColumnLeft(col)
          : getScrollableColumnLeft(col, dimensions, frozenWidth);
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
  }

  const paneClass =
    paneClassName ??
    (mode === "frozen"
      ? styles.frozenColumnHeaderPane
      : `${styles.columnHeaderPane}${withFrozenDivider ? ` ${styles.scrollableWithFrozenDivider}` : ""}`);

  return (
    <div ref={headerPaneRef} className={paneClass}>
      <div
        className={styles.headerCanvas}
        style={{
          width: canvasWidth,
          height: COLUMN_HEADER_HEIGHT,
          transform:
            mode === "scrollable" ? `translateX(${-scrollLeft}px)` : undefined,
        }}
      >
        {headers}
        {handles}
      </div>
    </div>
  );
});
