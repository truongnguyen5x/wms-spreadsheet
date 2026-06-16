import { memo, type Ref } from "react";
import {
  COLUMN_HEADER_HEIGHT,
  type IColumnFilterState,
  RESIZE_HIT_ZONE,
  type INormalizedRange,
  type IResizeHandle,
  type ISpreadsheetColumn,
} from "../../types";
import type { IGridDimensions } from "../../hooks/useGridDimensions";
import { getColumnHeaderContent } from "../../utils/columnHeaderContent";
import { getScrollableColumnLeft } from "../../utils/frozenColumns";
import { isColumnFilterActive } from "../../utils/columnFilter";
import styles from "../../styles/spreadsheet.module.scss";

export type TColumnHeaderMode = "frozen" | "scrollable";

interface IColumnHeaderCellProps {
  col: number;
  columnLeft: number;
  columnWidth: number;
  isActive: boolean;
  columns?: ISpreadsheetColumn[];
  activeFilterColumns: ReadonlyMap<number, IColumnFilterState>;
  onColumnMouseDown: (col: number) => void;
  onColumnMouseEnter: (col: number) => void;
  onFilterIconClick: (col: number, anchorRect: DOMRect) => void;
}

const ColumnHeaderCell = memo(function ColumnHeaderCell({
  col,
  columnLeft,
  columnWidth,
  isActive,
  columns,
  activeFilterColumns,
  onColumnMouseDown,
  onColumnMouseEnter,
  onFilterIconClick,
}: IColumnHeaderCellProps) {
  const column = columns?.[col];
  const showFilter = column?.showFilter === true;
  const isFilterActive = showFilter
    ? isColumnFilterActive(
        activeFilterColumns.get(col) ?? {
          condition: "none",
          selectedValues: null,
        },
      )
    : false;
  return (
    <div
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
      <div className={styles.headerCellInner}>
        <div className={styles.headerCellText}>
          {getColumnHeaderContent(col, columns)}
        </div>
        {showFilter && (
          <button
            type="button"
            className={`${styles.filterIconBtn}${isFilterActive ? ` ${styles.filterIconBtnActive}` : ""}`}
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onFilterIconClick(col, event.currentTarget.getBoundingClientRect());
            }}
            aria-label="Filter column"
          >
            <svg viewBox="0 0 24 24" aria-hidden focusable="false">
              <path
                d="M4 6h16l-6.5 7.2V18l-3 1.8v-6.6L4 6z"
                fill="currentColor"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
});

interface IColumnResizeHandleProps {
  col: number;
  columnLeft: number;
  columnWidth: number;
  isHandleHovered: boolean;
  onResizeHandleMouseEnter: (handle: IResizeHandle) => void;
  onResizeHandleMouseLeave: () => void;
  onResizeStart: (col: number, clientX: number) => void;
}

const ColumnResizeHandle = memo(function ColumnResizeHandle({
  col,
  columnLeft,
  columnWidth,
  isHandleHovered,
  onResizeHandleMouseEnter,
  onResizeHandleMouseLeave,
  onResizeStart,
}: IColumnResizeHandleProps) {
  return (
    <div
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
    </div>
  );
});

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
  columns?: ISpreadsheetColumn[];
  activeFilterColumns: ReadonlyMap<number, IColumnFilterState>;
  onColumnMouseDown: (col: number) => void;
  onColumnMouseEnter: (col: number) => void;
  onFilterIconClick: (col: number, anchorRect: DOMRect) => void;
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
  columns,
  activeFilterColumns,
  onColumnMouseDown,
  onColumnMouseEnter,
  onFilterIconClick,
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
        <ColumnHeaderCell
          key={col}
          col={col}
          columnLeft={columnLeft}
          columnWidth={columnWidth}
          isActive={isActive}
          columns={columns}
          activeFilterColumns={activeFilterColumns}
          onColumnMouseDown={onColumnMouseDown}
          onColumnMouseEnter={onColumnMouseEnter}
          onFilterIconClick={onFilterIconClick}
        />,
      );
      const isHandleHovered =
        hoveredHandle?.axis === "column" && hoveredHandle.index === col;
      handles.push(
        <ColumnResizeHandle
          key={`resize-${col}`}
          col={col}
          columnLeft={columnLeft}
          columnWidth={columnWidth}
          isHandleHovered={isHandleHovered}
          onResizeHandleMouseEnter={onResizeHandleMouseEnter}
          onResizeHandleMouseLeave={onResizeHandleMouseLeave}
          onResizeStart={onResizeStart}
        />,
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
