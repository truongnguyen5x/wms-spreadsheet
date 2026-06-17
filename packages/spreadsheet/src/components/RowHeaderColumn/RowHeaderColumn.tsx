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
  visibleRowIndices?: readonly number[];
  getDisplayRowTop?: (displayRow: number) => number;
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

function getSelectionRowOverlap(
  range: INormalizedRange | null,
  rowStart: number,
  rowEnd: number,
): { startRow: number; endRow: number } | null {
  if (range === null) return null;
  const startRow = Math.max(range.startRow, rowStart);
  const endRow = Math.min(range.endRow, rowEnd);
  if (endRow < startRow) return null;
  return { startRow, endRow };
}

function isSelectionMaskEqualInViewport(
  previousRange: INormalizedRange | null,
  nextRange: INormalizedRange | null,
  rowStart: number,
  rowEnd: number,
): boolean {
  const previousOverlap = getSelectionRowOverlap(previousRange, rowStart, rowEnd);
  const nextOverlap = getSelectionRowOverlap(nextRange, rowStart, rowEnd);
  if (previousOverlap === null || nextOverlap === null) {
    return previousOverlap === nextOverlap;
  }
  return (
    previousOverlap.startRow === nextOverlap.startRow &&
    previousOverlap.endRow === nextOverlap.endRow
  );
}

function areRowHeaderColumnPropsEqual(
  previousProps: IRowHeaderColumnProps,
  nextProps: IRowHeaderColumnProps,
): boolean {
  if (previousProps.visibleRange.startRow !== nextProps.visibleRange.startRow) {
    return false;
  }
  if (previousProps.visibleRange.endRow !== nextProps.visibleRange.endRow) {
    return false;
  }
  if (previousProps.dimensions !== nextProps.dimensions) return false;
  if (previousProps.visibleRowIndices !== nextProps.visibleRowIndices) return false;
  if (previousProps.getDisplayRowTop !== nextProps.getDisplayRowTop) return false;
  if (previousProps.scrollTop !== nextProps.scrollTop) return false;
  if (previousProps.totalHeight !== nextProps.totalHeight) return false;
  if (previousProps.headerPaneRef !== nextProps.headerPaneRef) return false;
  if (previousProps.hoveredHandle !== nextProps.hoveredHandle) return false;
  if (previousProps.onRowMouseDown !== nextProps.onRowMouseDown) return false;
  if (previousProps.onRowMouseEnter !== nextProps.onRowMouseEnter) return false;
  if (
    previousProps.onResizeHandleMouseEnter !== nextProps.onResizeHandleMouseEnter
  ) {
    return false;
  }
  if (
    previousProps.onResizeHandleMouseLeave !== nextProps.onResizeHandleMouseLeave
  ) {
    return false;
  }
  if (previousProps.onResizeStart !== nextProps.onResizeStart) return false;

  return isSelectionMaskEqualInViewport(
    previousProps.selectionRange,
    nextProps.selectionRange,
    nextProps.visibleRange.startRow,
    nextProps.visibleRange.endRow,
  );
}

export const RowHeaderColumn = memo(function RowHeaderColumn({
  visibleRange,
  dimensions,
  visibleRowIndices,
  getDisplayRowTop,
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
  for (
    let displayRow = visibleRange.startRow;
    displayRow <= visibleRange.endRow;
    displayRow++
  ) {
    const row =
      visibleRowIndices?.[displayRow] !== undefined
        ? visibleRowIndices[displayRow]
        : displayRow;
    const rowTop = getDisplayRowTop
      ? getDisplayRowTop(displayRow)
      : dimensions.getRowTop(row);
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
}, areRowHeaderColumnPropsEqual);

