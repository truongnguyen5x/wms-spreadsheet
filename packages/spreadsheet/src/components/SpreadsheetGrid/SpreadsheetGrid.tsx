import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import type { CellStore } from "../../store/CellStore";
import type { ISelection, INormalizedRange } from "../../types";
import { useVirtualWindow } from "../../hooks/useVirtualWindow";
import { useDragAutoScroll } from "../../hooks/useDragAutoScroll";
import type { TSelectionDragMode } from "../../hooks/useRangeSelection";
import type { IGridDimensions } from "../../hooks/useGridDimensions";
import type { IUseHeaderResizeResult } from "../../hooks/useHeaderResize";
import {
  areRangesEqual,
  isHeaderStyleSelection,
  isSingleCellSelection,
  normalizeSelection,
} from "../../utils/normalizeRange";
import {
  getScrollableColumnLeft,
  getSplitRangePaneBorderFlags,
  isFrozenColumn,
  isRangeEndInPane,
  normalizeFrozenColumnCount,
  splitRangeByFrozenColumns,
} from "../../utils/frozenColumns";
import { CornerCell } from "../CornerCell";
import { ColumnHeaderRow } from "../ColumnHeaderRow";
import { RowHeaderColumn } from "../RowHeaderColumn";
import { SpreadsheetCell } from "../SpreadsheetCell";
import { CellEditor } from "../CellEditor";
import { SelectionOverlay } from "../SelectionOverlay";
import { ClipboardOverlay } from "../ClipboardOverlay";
import styles from "../../styles/spreadsheet.module.scss";

export interface ISpreadsheetGridProps {
  store: CellStore;
  rowCount: number;
  columnCount: number;
  frozenColumnCount?: number;
  dimensions: IGridDimensions;
  overscan: number;
  selection: ISelection | null;
  clipboardRange: INormalizedRange | null;
  editingCell: { row: number; col: number } | null;
  isDragging: boolean;
  dragMode: TSelectionDragMode;
  headerResize: IUseHeaderResizeResult;
  onCellMouseDown: (row: number, col: number) => void;
  onCellMouseEnter: (row: number, col: number) => void;
  onColumnHeaderMouseDown: (col: number) => void;
  onColumnHeaderMouseEnter: (col: number) => void;
  onRowHeaderMouseDown: (row: number) => void;
  onRowHeaderMouseEnter: (row: number) => void;
  onCellDoubleClick: (row: number, col: number) => void;
  onCommitEdit: (
    row: number,
    col: number,
    value: string,
    direction: "stay" | "down" | "right",
  ) => void;
  onCancelEdit: () => void;
}

function renderCells(
  store: CellStore,
  dimensions: IGridDimensions,
  rowStart: number,
  rowEnd: number,
  colStart: number,
  colEnd: number,
  getColumnLeft: (col: number) => number,
  onCellMouseDown: (row: number, col: number) => void,
  onCellMouseEnter: (row: number, col: number) => void,
  onCellDoubleClick: (row: number, col: number) => void,
): React.ReactNode[] {
  const result: React.ReactNode[] = [];

  if (colEnd < colStart) return result;

  for (let row = rowStart; row <= rowEnd; row++) {
    for (let col = colStart; col <= colEnd; col++) {
      result.push(
        <SpreadsheetCell
          key={`${row}:${col}`}
          store={store}
          row={row}
          col={col}
          top={dimensions.getRowTop(row)}
          left={getColumnLeft(col)}
          width={dimensions.getColumnWidth(col)}
          height={dimensions.getRowHeight(row)}
          onMouseDown={onCellMouseDown}
          onMouseEnter={onCellMouseEnter}
          onDoubleClick={onCellDoubleClick}
        />,
      );
    }
  }

  return result;
}

export const SpreadsheetGrid = memo(function SpreadsheetGrid({
  store,
  rowCount,
  columnCount,
  frozenColumnCount: frozenColumnCountProp,
  dimensions,
  overscan,
  selection,
  clipboardRange,
  editingCell,
  isDragging,
  dragMode,
  headerResize,
  onCellMouseDown,
  onCellMouseEnter,
  onColumnHeaderMouseDown,
  onColumnHeaderMouseEnter,
  onRowHeaderMouseDown,
  onRowHeaderMouseEnter,
  onCellDoubleClick,
  onCommitEdit,
  onCancelEdit,
}: ISpreadsheetGridProps) {
  const columnHeaderRef = useRef<HTMLDivElement>(null);
  const frozenColumnHeaderRef = useRef<HTMLDivElement>(null);
  const frozenBodyRef = useRef<HTMLDivElement>(null);
  const rowHeaderRef = useRef<HTMLDivElement>(null);

  const frozenColumnCount = normalizeFrozenColumnCount(
    frozenColumnCountProp,
    columnCount,
  );
  const hasFrozenColumns = frozenColumnCount > 0;

  const virtual = useVirtualWindow({
    rowCount,
    columnCount,
    rowHeights: dimensions.rowHeights,
    columnWidths: dimensions.columnWidths,
    overscan,
    frozenColumnCount,
  });

  const {
    visibleRange,
    scrollTop,
    scrollLeft,
    scrollableTotalWidth,
    totalHeight,
    frozenWidth,
  } = virtual;

  useDragAutoScroll({
    isDragging,
    dragMode,
    scrollRef: virtual.scrollRef,
    columnHeaderRef,
    rowHeaderRef,
    rowHeights: dimensions.rowHeights,
    columnWidths: dimensions.columnWidths,
    rowCount,
    columnCount,
    frozenWidth: hasFrozenColumns ? frozenWidth : 0,
    frozenColumnHeaderRef: hasFrozenColumns ? frozenColumnHeaderRef : undefined,
    frozenBodyRef: hasFrozenColumns ? frozenBodyRef : undefined,
    onCellFocus: onCellMouseEnter,
    onColumnFocus: onColumnHeaderMouseEnter,
    onRowFocus: onRowHeaderMouseEnter,
  });

  const focusCell = selection?.focus ?? null;
  const selectionRange = selection ? normalizeSelection(selection) : null;

  useEffect(() => {
    if (!focusCell || isDragging) return;
    if (selection && isHeaderStyleSelection(selection, rowCount, columnCount)) {
      return;
    }

    const el = virtual.scrollRef.current;
    if (!el) return;

    const cellTop = dimensions.getRowTop(focusCell.row);
    const cellBottom = cellTop + dimensions.getRowHeight(focusCell.row);

    const viewTop = el.scrollTop;
    const viewBottom = viewTop + el.clientHeight;

    if (cellTop < viewTop) {
      el.scrollTop = cellTop;
    } else if (cellBottom > viewBottom) {
      el.scrollTop = cellBottom - el.clientHeight;
    }

    if (!isFrozenColumn(focusCell.col, frozenColumnCount)) {
      const cellLeft = getScrollableColumnLeft(
        focusCell.col,
        dimensions,
        frozenWidth,
      );
      const cellRight = cellLeft + dimensions.getColumnWidth(focusCell.col);
      const viewLeft = el.scrollLeft;
      const viewRight = viewLeft + el.clientWidth;

      if (cellLeft < viewLeft) {
        el.scrollLeft = cellLeft;
      } else if (cellRight > viewRight) {
        el.scrollLeft = cellRight - el.clientWidth;
      }
    }
  }, [
    focusCell,
    isDragging,
    selection,
    rowCount,
    columnCount,
    dimensions,
    virtual.scrollRef,
    frozenColumnCount,
    frozenWidth,
  ]);

  const getFrozenColumnLeft = useCallback(
    (col: number) => dimensions.getColumnLeft(col),
    [dimensions],
  );

  const getScrollableLeft = useCallback(
    (col: number) => getScrollableColumnLeft(col, dimensions, frozenWidth),
    [dimensions, frozenWidth],
  );

  const guardedFrozenCellMouseEnter = useCallback(
    (row: number, col: number) => {
      if (
        isDragging &&
        isFrozenColumn(col, frozenColumnCount) &&
        (virtual.scrollRef.current?.scrollLeft ?? 0) > 0
      ) {
        return;
      }
      onCellMouseEnter(row, col);
    },
    [isDragging, frozenColumnCount, virtual.scrollRef, onCellMouseEnter],
  );

  const guardedFrozenColumnHeaderMouseEnter = useCallback(
    (col: number) => {
      if (
        isDragging &&
        isFrozenColumn(col, frozenColumnCount) &&
        (virtual.scrollRef.current?.scrollLeft ?? 0) > 0
      ) {
        return;
      }
      onColumnHeaderMouseEnter(col);
    },
    [
      isDragging,
      frozenColumnCount,
      virtual.scrollRef,
      onColumnHeaderMouseEnter,
    ],
  );

  const frozenCells = useMemo(() => {
    if (!hasFrozenColumns) return [];
    return renderCells(
      store,
      dimensions,
      visibleRange.startRow,
      visibleRange.endRow,
      0,
      frozenColumnCount - 1,
      getFrozenColumnLeft,
      onCellMouseDown,
      guardedFrozenCellMouseEnter,
      onCellDoubleClick,
    );
  }, [
    hasFrozenColumns,
    visibleRange,
    store,
    dimensions,
    frozenColumnCount,
    getFrozenColumnLeft,
    onCellMouseDown,
    guardedFrozenCellMouseEnter,
    onCellDoubleClick,
  ]);

  const scrollableCells = useMemo(() => {
    const colStart = hasFrozenColumns
      ? frozenColumnCount
      : visibleRange.startCol;
    const colEnd = visibleRange.endCol;
    return renderCells(
      store,
      dimensions,
      visibleRange.startRow,
      visibleRange.endRow,
      colStart,
      colEnd,
      hasFrozenColumns ? getScrollableLeft : getFrozenColumnLeft,
      onCellMouseDown,
      onCellMouseEnter,
      onCellDoubleClick,
    );
  }, [
    hasFrozenColumns,
    visibleRange,
    store,
    dimensions,
    frozenColumnCount,
    getScrollableLeft,
    getFrozenColumnLeft,
    onCellMouseDown,
    onCellMouseEnter,
    onCellDoubleClick,
  ]);

  const renderEditor = (pane: "frozen" | "scrollable") => {
    if (editingCell === null) return null;

    const { row, col } = editingCell;
    const inFrozen = isFrozenColumn(col, frozenColumnCount);
    if (pane === "frozen" && !inFrozen) return null;
    if (pane === "scrollable" && hasFrozenColumns && inFrozen) return null;

    const left =
      inFrozen || !hasFrozenColumns
        ? dimensions.getColumnLeft(col)
        : getScrollableColumnLeft(col, dimensions, frozenWidth);

    return (
      <CellEditor
        row={row}
        col={col}
        value={store.getValue(row, col)}
        top={dimensions.getRowTop(row)}
        left={left}
        width={dimensions.getColumnWidth(col)}
        height={dimensions.getRowHeight(row)}
        onCommit={(commitValue, direction) =>
          onCommitEdit(row, col, commitValue, direction)
        }
        onCancel={onCancelEdit}
      />
    );
  };

  const clipboardCoversSelection =
    clipboardRange !== null &&
    selection !== null &&
    areRangesEqual(clipboardRange, normalizeSelection(selection));

  const isSingleSelection =
    selection !== null && isSingleCellSelection(selection);

  const splitSelection = selectionRange
    ? splitRangeByFrozenColumns(selectionRange, frozenColumnCount)
    : { frozen: null, scrollable: null };

  const splitClipboard = clipboardRange
    ? splitRangeByFrozenColumns(clipboardRange, frozenColumnCount)
    : { frozen: null, scrollable: null };

  const renderSelectionOverlays = (
    columnLeftOffset: number,
    pane: "frozen" | "scrollable",
  ) => {
    if (selection === null || clipboardCoversSelection) return null;

    const range =
      pane === "frozen" ? splitSelection.frozen : splitSelection.scrollable;
    if (range === null) return null;

    const { hideLeftBorder, hideRightBorder } = getSplitRangePaneBorderFlags(
      splitSelection,
      pane,
    );

    const showFillHandle =
      isSingleSelection &&
      (pane === "frozen"
        ? isFrozenColumn(selection.focus.col, frozenColumnCount)
        : !isFrozenColumn(selection.focus.col, frozenColumnCount));

    const showHandle = isSingleSelection
      ? showFillHandle
      : selectionRange !== null &&
        isRangeEndInPane(selectionRange.endCol, pane, frozenColumnCount);

    return (
      <SelectionOverlay
        range={range}
        dimensions={dimensions}
        columnLeftOffset={columnLeftOffset}
        showFillHandle={showFillHandle}
        hideLeftBorder={hideLeftBorder}
        hideRightBorder={hideRightBorder}
        showHandle={showHandle}
      />
    );
  };

  const renderClipboardOverlays = (
    columnLeftOffset: number,
    pane: "frozen" | "scrollable",
  ) => {
    if (clipboardRange === null) return null;

    const range =
      pane === "frozen" ? splitClipboard.frozen : splitClipboard.scrollable;
    if (range === null) return null;

    const { hideLeftBorder, hideRightBorder } = getSplitRangePaneBorderFlags(
      splitClipboard,
      pane,
    );

    return (
      <ClipboardOverlay
        range={range}
        dimensions={dimensions}
        columnLeftOffset={columnLeftOffset}
        hideLeftBorder={hideLeftBorder}
        hideRightBorder={hideRightBorder}
      />
    );
  };

  const handleColumnResizeStart = useCallback(
    (col: number, clientX: number) => {
      headerResize.onResizeStart("column", col, clientX);
    },
    [headerResize],
  );

  const handleRowResizeStart = useCallback(
    (row: number, clientY: number) => {
      headerResize.onResizeStart("row", row, clientY);
    },
    [headerResize],
  );

  const frozenEditor = hasFrozenColumns ? renderEditor("frozen") : null;

  const scrollableEditor = renderEditor("scrollable");

  const scrollableColStart = hasFrozenColumns
    ? Math.max(frozenColumnCount, visibleRange.startCol)
    : visibleRange.startCol;

  // #region agent log
  useEffect(() => {
    const bodyEl = virtual.scrollRef.current;
    const headerEl = columnHeaderRef.current;
    const rowHeaderEl = rowHeaderRef.current;
    const spreadsheetEl = bodyEl?.closest(
      "[class*='spreadsheet']",
    ) as HTMLElement | null;
    const cornerEl = spreadsheetEl?.querySelector(
      "[class*='corner']",
    ) as HTMLElement | null;
    if (!bodyEl || !headerEl) return;

    const headerCells = headerEl.querySelectorAll("[class*='headerCell']");
    const bodyCells = bodyEl.querySelectorAll("[role='gridcell']");
    if (headerCells.length === 0 || bodyCells.length === 0) return;

    const colsToCheck = Math.min(5, headerCells.length, bodyCells.length);
    const borderComparisons: Array<{
      col: number;
      headerRight: number;
      bodyRight: number;
      delta: number;
      headerLeft: number;
      bodyLeft: number;
      headerWidth: number;
      bodyWidth: number;
    }> = [];

    for (let i = 0; i < colsToCheck; i++) {
      const hRect = headerCells[i].getBoundingClientRect();
      const bRect = bodyCells[i].getBoundingClientRect();
      borderComparisons.push({
        col: scrollableColStart + i,
        headerRight: hRect.right,
        bodyRight: bRect.right,
        delta: hRect.right - bRect.right,
        headerLeft: hRect.left,
        bodyLeft: bRect.left,
        headerWidth: hRect.width,
        bodyWidth: bRect.width,
      });
    }

    const headerCanvas = headerEl.querySelector(
      "[class*='headerCanvas']",
    ) as HTMLElement | null;
    const bodyCanvas = bodyEl.querySelector(
      "[class*='canvas']",
    ) as HTMLElement | null;
    const scrollbarWidth = bodyEl.offsetWidth - bodyEl.clientWidth;

    const cornerRect = cornerEl?.getBoundingClientRect();
    const rowHeaderRect = rowHeaderEl?.getBoundingClientRect();
    const columnHeaderPaneRect = headerEl.getBoundingClientRect();
    const firstHeaderCellRect = headerCells[0]?.getBoundingClientRect();
    const firstBodyCellRect = bodyCells[0]?.getBoundingClientRect();

    fetch("http://127.0.0.1:7430/ingest/54b7af5a-ad15-4f99-96a3-3eb318775f92", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "5d9b67",
      },
      body: JSON.stringify({
        sessionId: "5d9b67",
        location: "SpreadsheetGrid.tsx:alignment-check",
        message: "header vs body border alignment",
        data: {
          hasFrozenColumns,
          scrollLeft,
          scrollTop,
          scrollbarWidth,
          headerPaneWidth: headerEl.clientWidth,
          bodyScrollClientWidth: bodyEl.clientWidth,
          bodyScrollOffsetWidth: bodyEl.offsetWidth,
          headerCanvasTransform: headerCanvas?.style.transform ?? null,
          headerCanvasWidth: headerCanvas?.offsetWidth ?? null,
          bodyCanvasWidth: bodyCanvas?.offsetWidth ?? null,
          cornerSize: cornerRect
            ? {
                width: cornerRect.width,
                height: cornerRect.height,
                right: cornerRect.right,
              }
            : null,
          rowHeaderSize: rowHeaderRect
            ? {
                width: rowHeaderRect.width,
                height: rowHeaderRect.height,
                right: rowHeaderRect.right,
              }
            : null,
          columnHeaderPaneSize: columnHeaderPaneRect
            ? {
                width: columnHeaderPaneRect.width,
                height: columnHeaderPaneRect.height,
                left: columnHeaderPaneRect.left,
              }
            : null,
          cornerVsRowHeaderWidthDelta:
            cornerRect && rowHeaderRect
              ? cornerRect.width - rowHeaderRect.width
              : null,
          columnHeaderVsBodyLeftDelta:
            firstHeaderCellRect && firstBodyCellRect
              ? firstHeaderCellRect.left - firstBodyCellRect.left
              : null,
          borderComparisons,
          computedCol0: {
            headerLeft: dimensions.getColumnLeft(scrollableColStart),
            bodyLeft: hasFrozenColumns
              ? getScrollableColumnLeft(
                  scrollableColStart,
                  dimensions,
                  frozenWidth,
                )
              : dimensions.getColumnLeft(scrollableColStart),
            width: dimensions.getColumnWidth(scrollableColStart),
          },
        },
        timestamp: Date.now(),
        hypothesisId: "A,B,C,D,F",
      }),
    }).catch(() => {});
  }, [
    visibleRange,
    scrollLeft,
    scrollTop,
    hasFrozenColumns,
    frozenWidth,
    dimensions,
    scrollableColStart,
    virtual.scrollRef,
  ]);
  // #endregion

  return (
    <div className={styles.spreadsheet} role="grid">
      <div className={styles.topRow}>
        <CornerCell />
        {hasFrozenColumns && (
          <ColumnHeaderRow
            colStart={0}
            colEnd={frozenColumnCount - 1}
            dimensions={dimensions}
            scrollLeft={0}
            canvasWidth={frozenWidth}
            frozenWidth={frozenWidth}
            mode="frozen"
            selectionRange={selectionRange}
            headerPaneRef={frozenColumnHeaderRef}
            hoveredHandle={headerResize.hoveredHandle}
            onColumnMouseDown={onColumnHeaderMouseDown}
            onColumnMouseEnter={guardedFrozenColumnHeaderMouseEnter}
            onResizeHandleMouseEnter={headerResize.onResizeHandleMouseEnter}
            onResizeHandleMouseLeave={headerResize.onResizeHandleMouseLeave}
            onResizeStart={handleColumnResizeStart}
          />
        )}
        <ColumnHeaderRow
          colStart={scrollableColStart}
          colEnd={visibleRange.endCol}
          dimensions={dimensions}
          scrollLeft={scrollLeft}
          canvasWidth={
            hasFrozenColumns ? scrollableTotalWidth : virtual.totalWidth
          }
          frozenWidth={frozenWidth}
          mode="scrollable"
          withFrozenDivider={hasFrozenColumns}
          selectionRange={selectionRange}
          headerPaneRef={columnHeaderRef}
          hoveredHandle={headerResize.hoveredHandle}
          onColumnMouseDown={onColumnHeaderMouseDown}
          onColumnMouseEnter={onColumnHeaderMouseEnter}
          onResizeHandleMouseEnter={headerResize.onResizeHandleMouseEnter}
          onResizeHandleMouseLeave={headerResize.onResizeHandleMouseLeave}
          onResizeStart={handleColumnResizeStart}
        />
      </div>

      <div className={styles.bottomRow}>
        <RowHeaderColumn
          visibleRange={visibleRange}
          dimensions={dimensions}
          scrollTop={scrollTop}
          totalHeight={totalHeight}
          selectionRange={selectionRange}
          headerPaneRef={rowHeaderRef}
          hoveredHandle={headerResize.hoveredHandle}
          onRowMouseDown={onRowHeaderMouseDown}
          onRowMouseEnter={onRowHeaderMouseEnter}
          onResizeHandleMouseEnter={headerResize.onResizeHandleMouseEnter}
          onResizeHandleMouseLeave={headerResize.onResizeHandleMouseLeave}
          onResizeStart={handleRowResizeStart}
        />

        {hasFrozenColumns && (
          <div
            ref={frozenBodyRef}
            className={`${styles.frozenBodyPane}${editingCell !== null ? ` ${styles.frozenBodyPaneEditing}` : ""}`}
            style={{ width: frozenWidth }}
          >
            <div
              className={styles.canvas}
              style={{
                width: frozenWidth,
                height: totalHeight,
                transform: `translateY(${-scrollTop}px)`,
              }}
            >
              {frozenCells}
              {renderSelectionOverlays(0, "frozen")}
              {renderClipboardOverlays(0, "frozen")}
              {frozenEditor}
            </div>
          </div>
        )}

        <div
          ref={virtual.scrollRef}
          className={`${styles.bodyScroll}${hasFrozenColumns ? ` ${styles.scrollableWithFrozenDivider}` : ""}`}
        >
          <div
            className={styles.canvas}
            style={{
              width: hasFrozenColumns
                ? scrollableTotalWidth
                : virtual.totalWidth,
              height: totalHeight,
            }}
          >
            {scrollableCells}
            {renderSelectionOverlays(
              hasFrozenColumns ? frozenWidth : 0,
              "scrollable",
            )}
            {renderClipboardOverlays(
              hasFrozenColumns ? frozenWidth : 0,
              "scrollable",
            )}
            {scrollableEditor}
          </div>
        </div>
      </div>
    </div>
  );
});
