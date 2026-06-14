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

import { renderCells } from "../../utils/renderCells";

import { CornerCell } from "../CornerCell";

import { ColumnHeaderRow } from "../ColumnHeaderRow";

import { RowHeaderColumn } from "../RowHeaderColumn";

import { FrozenColumnPane } from "../FrozenColumnPane";

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

  const { startRow, endRow, startCol, endCol } = visibleRange;

  const isDraggingRef = useRef(isDragging);

  isDraggingRef.current = isDragging;

  const scrollLeftRef = useRef(scrollLeft);

  scrollLeftRef.current = scrollLeft;

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
        isDraggingRef.current &&
        isFrozenColumn(col, frozenColumnCount) &&
        scrollLeftRef.current > 0
      ) {
        return;
      }

      onCellMouseEnter(row, col);
    },

    [frozenColumnCount, onCellMouseEnter],
  );

  const guardedFrozenColumnHeaderMouseEnter = useCallback(
    (col: number) => {
      if (
        isDraggingRef.current &&
        isFrozenColumn(col, frozenColumnCount) &&
        scrollLeftRef.current > 0
      ) {
        return;
      }

      onColumnHeaderMouseEnter(col);
    },

    [frozenColumnCount, onColumnHeaderMouseEnter],
  );

  const scrollableColStart = hasFrozenColumns
    ? Math.max(frozenColumnCount, startCol)
    : startCol;

  const scrollableCells = useMemo(() => {
    const colStart = hasFrozenColumns ? frozenColumnCount : startCol;

    return renderCells(
      store,

      dimensions,

      startRow,

      endRow,

      colStart,

      endCol,

      hasFrozenColumns ? getScrollableLeft : getFrozenColumnLeft,

      onCellMouseDown,

      onCellMouseEnter,

      onCellDoubleClick,
    );
  }, [
    hasFrozenColumns,

    startRow,

    endRow,

    startCol,

    endCol,

    store,

    dimensions,

    frozenColumnCount,

    getScrollableLeft,

    getFrozenColumnLeft,

    onCellMouseDown,

    onCellMouseEnter,

    onCellDoubleClick,
  ]);

  const clipboardCoversSelection =
    clipboardRange !== null &&
    selection !== null &&
    areRangesEqual(clipboardRange, normalizeSelection(selection));

  const isSingleSelection =
    selection !== null && isSingleCellSelection(selection);

  const splitSelection = useMemo(
    () =>
      selectionRange
        ? splitRangeByFrozenColumns(selectionRange, frozenColumnCount)
        : { frozen: null, scrollable: null },
    [selectionRange, frozenColumnCount],
  );

  const splitClipboard = useMemo(
    () =>
      clipboardRange
        ? splitRangeByFrozenColumns(clipboardRange, frozenColumnCount)
        : { frozen: null, scrollable: null },
    [clipboardRange, frozenColumnCount],
  );

  const frozenSelectionOverlay = useMemo(() => {
    if (selection === null || clipboardCoversSelection) return null;

    const range = splitSelection.frozen;

    if (range === null) return null;

    const { hideLeftBorder, hideRightBorder } = getSplitRangePaneBorderFlags(
      splitSelection,

      "frozen",
    );

    const showFillHandle =
      isSingleSelection &&
      isFrozenColumn(selection.focus.col, frozenColumnCount);

    const showHandle = isSingleSelection
      ? showFillHandle
      : selectionRange !== null &&
        isRangeEndInPane(selectionRange.endCol, "frozen", frozenColumnCount);

    return (
      <SelectionOverlay
        range={range}
        dimensions={dimensions}
        columnLeftOffset={0}
        showFillHandle={showFillHandle}
        hideLeftBorder={hideLeftBorder}
        hideRightBorder={hideRightBorder}
        showHandle={showHandle}
      />
    );
  }, [
    selection,

    clipboardCoversSelection,

    splitSelection,

    isSingleSelection,

    selectionRange,

    frozenColumnCount,

    dimensions,
  ]);

  const frozenClipboardOverlay = useMemo(() => {
    if (clipboardRange === null) return null;

    const range = splitClipboard.frozen;

    if (range === null) return null;

    const { hideLeftBorder, hideRightBorder } = getSplitRangePaneBorderFlags(
      splitClipboard,

      "frozen",
    );

    return (
      <ClipboardOverlay
        range={range}
        dimensions={dimensions}
        columnLeftOffset={0}
        hideLeftBorder={hideLeftBorder}
        hideRightBorder={hideRightBorder}
      />
    );
  }, [clipboardRange, splitClipboard, dimensions]);

  const frozenEditor = useMemo(() => {
    if (editingCell === null) return null;

    const { row, col } = editingCell;

    if (!isFrozenColumn(col, frozenColumnCount)) return null;

    return (
      <CellEditor
        row={row}
        col={col}
        value={store.getValue(row, col)}
        top={dimensions.getRowTop(row)}
        left={dimensions.getColumnLeft(col)}
        width={dimensions.getColumnWidth(col)}
        height={dimensions.getRowHeight(row)}
        onCommit={(commitValue, direction) =>
          onCommitEdit(row, col, commitValue, direction)
        }
        onCancel={onCancelEdit}
      />
    );
  }, [
    editingCell,

    frozenColumnCount,

    store,

    dimensions,

    onCommitEdit,

    onCancelEdit,
  ]);

  const renderScrollableSelectionOverlay = () => {
    if (selection === null || clipboardCoversSelection) return null;

    const range = splitSelection.scrollable;

    if (range === null) return null;

    const { hideLeftBorder, hideRightBorder } = getSplitRangePaneBorderFlags(
      splitSelection,

      "scrollable",
    );

    const showFillHandle =
      isSingleSelection &&
      !isFrozenColumn(selection.focus.col, frozenColumnCount);

    const showHandle = isSingleSelection
      ? showFillHandle
      : selectionRange !== null &&
        isRangeEndInPane(
          selectionRange.endCol,

          "scrollable",

          frozenColumnCount,
        );

    return (
      <SelectionOverlay
        range={range}
        dimensions={dimensions}
        columnLeftOffset={hasFrozenColumns ? frozenWidth : 0}
        showFillHandle={showFillHandle}
        hideLeftBorder={hideLeftBorder}
        hideRightBorder={hideRightBorder}
        showHandle={showHandle}
      />
    );
  };

  const renderScrollableClipboardOverlay = () => {
    if (clipboardRange === null) return null;

    const range = splitClipboard.scrollable;

    if (range === null) return null;

    const { hideLeftBorder, hideRightBorder } = getSplitRangePaneBorderFlags(
      splitClipboard,

      "scrollable",
    );

    return (
      <ClipboardOverlay
        range={range}
        dimensions={dimensions}
        columnLeftOffset={hasFrozenColumns ? frozenWidth : 0}
        hideLeftBorder={hideLeftBorder}
        hideRightBorder={hideRightBorder}
      />
    );
  };

  const scrollableEditor = useMemo(() => {
    if (editingCell === null) return null;

    const { row, col } = editingCell;

    if (hasFrozenColumns && isFrozenColumn(col, frozenColumnCount)) return null;

    const left = hasFrozenColumns
      ? getScrollableColumnLeft(col, dimensions, frozenWidth)
      : dimensions.getColumnLeft(col);

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
  }, [
    editingCell,

    hasFrozenColumns,

    frozenColumnCount,

    store,

    dimensions,

    frozenWidth,

    onCommitEdit,

    onCancelEdit,
  ]);

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
          colEnd={endCol}
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
          <FrozenColumnPane
            bodyRef={frozenBodyRef}
            store={store}
            startRow={startRow}
            endRow={endRow}
            frozenColumnCount={frozenColumnCount}
            dimensions={dimensions}
            frozenWidth={frozenWidth}
            scrollTop={scrollTop}
            totalHeight={totalHeight}
            isEditing={editingCell !== null}
            onCellMouseDown={onCellMouseDown}
            onCellMouseEnter={guardedFrozenCellMouseEnter}
            onCellDoubleClick={onCellDoubleClick}
            selectionOverlay={frozenSelectionOverlay}
            clipboardOverlay={frozenClipboardOverlay}
            editor={frozenEditor}
          />
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

            {renderScrollableSelectionOverlay()}

            {renderScrollableClipboardOverlay()}

            {scrollableEditor}
          </div>
        </div>
      </div>
    </div>
  );
});
