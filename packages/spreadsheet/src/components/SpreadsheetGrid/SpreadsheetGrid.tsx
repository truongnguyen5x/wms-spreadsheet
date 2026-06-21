import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import type { CellStore } from "../../store/CellStore";
import type { MetaStore } from "../../store/MetaStore";
import type { MergeStore } from "../../store/MergeStore";
import {
  FILTER_BLANK_VALUE,
  type ICellAddress,
  type IColumnFilterState,
  type IColumnSortState,
  type ICustomCellDefinition,
  type ISelection,
  type INormalizedRange,
  type ISpreadsheetColumn,
  type ISpreadsheetRef,
  type TSortDirection,
} from "../../types";
import { useVirtualWindow } from "../../hooks/useVirtualWindow";
import { useDragAutoScroll } from "../../hooks/useDragAutoScroll";
import type { TSelectionDragMode } from "../../hooks/useRangeSelection";
import type { IGridDimensions } from "../../hooks/useGridDimensions";
import type { IUseHeaderResizeResult } from "../../hooks/useHeaderResize";
import {
  areRangesEqual,
  isHeaderStyleSelection,
  isSingleCellSelection,
} from "../../utils/normalizeRange";
import { resolveSelectionRange } from "../../utils/mergeCell";
import {
  getScrollableColumnLeft,
  getSplitRangePaneBorderFlags,
  isFrozenColumn,
  isRangeEndInPane,
  normalizeFrozenColumnCount,
  splitRangeByFrozenColumns,
} from "../../utils/frozenColumns";
import { useMergeRevision } from "../../hooks/useMergeRevision";
import { sumSizes } from "../../utils/gridDimensions";
import { renderCells } from "../../utils/renderCells";
import { resolveCellMeta } from "../../utils/resolveCellMeta";
import {
  getDisplayRowTop,
  getTotalVisibleHeight,
  type IVisibleRowLayout,
} from "../../utils/visibleRowLayout";
import {
  ColumnFilterPopup,
  createFilterValueOptions,
} from "../ColumnFilter";
import { CornerCell } from "../CornerCell";
import { ColumnHeaderRow } from "../ColumnHeaderRow";
import { RowHeaderColumn } from "../RowHeaderColumn";
import { FrozenColumnPane } from "../FrozenColumnPane";
import { CellEditorRouter } from "../CellEditor";
import { SelectionOverlay } from "../SelectionOverlay";
import { ClipboardOverlay } from "../ClipboardOverlay";
import { useSpreadsheetLocale } from "../../context/SpreadsheetLocaleContext";
import styles from "../../styles/spreadsheet.module.scss";

function getMergedCellSize(
  mergeStore: MergeStore,
  dimensions: IGridDimensions,
  row: number,
  col: number,
): { width: number; height: number } {
  const { rowSpan, colSpan } = mergeStore.getSpan(row, col);
  return {
    width: sumSizes(dimensions.columnWidths, col, col + colSpan - 1),
    height: sumSizes(dimensions.rowHeights, row, row + rowSpan - 1),
  };
}

export interface ISpreadsheetGridProps {
  store: CellStore;
  metaStore: MetaStore;
  mergeStore: MergeStore;
  rowCount: number;
  columnCount: number;
  frozenColumnCount?: number;
  columns?: ISpreadsheetColumn[];
  customCellRegistry?: Record<string, ICustomCellDefinition>;
  api: ISpreadsheetRef;
  dimensions: IGridDimensions;
  visibleRowLayout: IVisibleRowLayout;
  overscan: number;
  colHeaderHeight: number;
  selection: ISelection | null;
  clipboardRange: INormalizedRange | null;
  editingCell: { row: number; col: number } | null;
  editingInitialInput?: string;
  isDragging: boolean;
  dragMode: TSelectionDragMode;
  headerResize: IUseHeaderResizeResult;
  sortFilterDisabled?: boolean;
  onCellMouseDown: (row: number, col: number) => void;
  onCellMouseEnter: (row: number, col: number) => void;
  onColumnHeaderMouseDown: (col: number) => void;
  onColumnHeaderMouseEnter: (col: number) => void;
  onOpenColumnFilter: (col: number, anchorRect: DOMRect) => void;
  openFilterCol: number | null;
  filterAnchorRect: DOMRect | null;
  columnFilters: ReadonlyMap<number, IColumnFilterState>;
  columnSort: IColumnSortState | null;
  onApplyColumnFilter: (col: number, nextState: IColumnFilterState) => void;
  onSortColumn: (col: number, direction: TSortDirection) => void;
  onResetColumnFilter: (col: number) => void;
  onCloseColumnFilter: () => void;
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
  onBooleanToggle: (row: number, col: number, nextValue: string) => void;
}

export const SpreadsheetGrid = memo(function SpreadsheetGrid({
  store,
  metaStore,
  mergeStore,
  rowCount,
  columnCount,
  frozenColumnCount: frozenColumnCountProp,
  columns,
  customCellRegistry,
  api,
  dimensions,
  visibleRowLayout,
  overscan,
  colHeaderHeight,
  selection,
  clipboardRange,
  editingCell,
  editingInitialInput,
  isDragging,
  dragMode,
  headerResize,
  sortFilterDisabled = false,
  onCellMouseDown,
  onCellMouseEnter,
  onColumnHeaderMouseDown,
  onColumnHeaderMouseEnter,
  onOpenColumnFilter,
  openFilterCol,
  filterAnchorRect,
  columnFilters,
  columnSort,
  onApplyColumnFilter,
  onSortColumn,
  onResetColumnFilter,
  onCloseColumnFilter,
  onRowHeaderMouseDown,
  onRowHeaderMouseEnter,
  onCellDoubleClick,
  onCommitEdit,
  onCancelEdit,
  onBooleanToggle,
}: ISpreadsheetGridProps) {
  const { filter: filterLocale } = useSpreadsheetLocale();
  const mergeRevision = useMergeRevision(mergeStore);
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
    rowCount: visibleRowLayout.visibleCount,
    columnCount,
    rowHeights: visibleRowLayout.displayRowHeights,
    columnWidths: dimensions.columnWidths,
    overscan,
    frozenColumnCount,
  });
  const {
    visibleRange,
    scrollTop,
    scrollLeft,
    scrollableTotalWidth,
    frozenWidth,
  } = virtual;
  const { startRow, endRow, startCol, endCol } = visibleRange;
  const totalHeight = useMemo(
    () => getTotalVisibleHeight(visibleRowLayout),
    [visibleRowLayout],
  );
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
    rowHeights: visibleRowLayout.displayRowHeights,
    columnWidths: dimensions.columnWidths,
    rowCount: visibleRowLayout.visibleCount,
    columnCount,
    frozenWidth: hasFrozenColumns ? frozenWidth : 0,
    frozenColumnHeaderRef: hasFrozenColumns ? frozenColumnHeaderRef : undefined,
    frozenBodyRef: hasFrozenColumns ? frozenBodyRef : undefined,
    onCellFocus: (displayRow, col) => {
      const physicalRow = visibleRowLayout.visibleRowIndices[displayRow];
      if (physicalRow === undefined) return;
      const anchor = mergeStore.resolveAnchor(physicalRow, col);
      onCellMouseEnter(anchor.row, anchor.col);
    },
    onColumnFocus: onColumnHeaderMouseEnter,
    onRowFocus: (displayRow) => {
      const physicalRow = visibleRowLayout.visibleRowIndices[displayRow];
      if (physicalRow === undefined) return;
      onRowHeaderMouseEnter(physicalRow);
    },
  });
  const focusCell = selection?.focus ?? null;
  const selectionAnchorRow = selection?.anchor.row ?? null;
  const selectionAnchorCol = selection?.anchor.col ?? null;
  const selectionFocusRow = selection?.focus.row ?? null;
  const selectionFocusCol = selection?.focus.col ?? null;
  const selectionRange = useMemo(
    () =>
      selection
        ? resolveSelectionRange(selection, mergeStore, rowCount, columnCount)
        : null,
    [selection, selectionAnchorRow, selectionAnchorCol, selectionFocusRow, selectionFocusCol, mergeStore, mergeRevision, rowCount, columnCount],
  );
  const frozenActiveCell = useMemo<ICellAddress | null>(() => {
    if (selectionFocusRow === null || selectionFocusCol === null) return null;
    const anchor = mergeStore.resolveAnchor(selectionFocusRow, selectionFocusCol);
    if (!isFrozenColumn(anchor.col, frozenColumnCount)) return null;
    return anchor;
  }, [selectionFocusRow, selectionFocusCol, mergeStore, frozenColumnCount]);
  useEffect(() => {
    if (!focusCell || isDragging) return;
    if (selection && isHeaderStyleSelection(selection, rowCount, columnCount)) {
      return;
    }

    const el = virtual.scrollRef.current;
    if (!el) return;
    const displayFocusRow =
      visibleRowLayout.physicalToDisplay.get(focusCell.row) ?? -1;
    if (displayFocusRow < 0) return;
    const cellTop = getDisplayRowTop(visibleRowLayout, displayFocusRow);
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
    visibleRowLayout,
  ]);
  const getRowTopByDisplayIndex = useCallback(
    (displayRow: number) => getDisplayRowTop(visibleRowLayout, displayRow),
    [visibleRowLayout],
  );
  const resolvePhysicalRow = useCallback(
    (displayRow: number) => visibleRowLayout.visibleRowIndices[displayRow] ?? -1,
    [visibleRowLayout],
  );
  const toDisplayRow = useCallback(
    (physicalRow: number) => visibleRowLayout.physicalToDisplay.get(physicalRow) ?? -1,
    [visibleRowLayout],
  );
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
    return renderCells({
      store,
      metaStore,
      mergeStore,
      dimensions,
      rowStart: startRow,
      rowEnd: endRow,
      colStart,
      colEnd: endCol,
      columns,
      customCellRegistry,
      selection,
      getColumnLeft: hasFrozenColumns ? getScrollableLeft : getFrozenColumnLeft,
      resolvePhysicalRow,
      getRowTop: getRowTopByDisplayIndex,
      onCellMouseDown,
      onCellMouseEnter,
      onCellDoubleClick,
      onBooleanToggle,
    });
  }, [
    hasFrozenColumns,
    startRow,
    endRow,
    startCol,
    endCol,
    store,
    metaStore,
    mergeStore,
    mergeRevision,
    dimensions,
    frozenColumnCount,
    columns,
    customCellRegistry,
    selection,
    getScrollableLeft,
    getFrozenColumnLeft,
    onCellMouseDown,
    onCellMouseEnter,
    onCellDoubleClick,
    onBooleanToggle,
    resolvePhysicalRow,
    getRowTopByDisplayIndex,
  ]);
  const clipboardCoversSelection =
    clipboardRange !== null &&
    selectionRange !== null &&
    areRangesEqual(clipboardRange, selectionRange);
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
        visibleRowLayout={visibleRowLayout}
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
    visibleRowLayout,
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
        visibleRowLayout={visibleRowLayout}
        columnLeftOffset={0}
        hideLeftBorder={hideLeftBorder}
        hideRightBorder={hideRightBorder}
      />
    );
  }, [clipboardRange, splitClipboard, dimensions, visibleRowLayout]);
  const frozenEditor = useMemo(() => {
    if (editingCell === null) return null;
    const { row, col } = editingCell;
    if (!isFrozenColumn(col, frozenColumnCount)) return null;
    const displayRow = toDisplayRow(row);
    if (displayRow < 0) return null;
    const meta = resolveCellMeta(metaStore, row, col, columns);
    const { width, height } = getMergedCellSize(mergeStore, dimensions, row, col);
    return (
      <CellEditorRouter
        row={row}
        col={col}
        value={store.getValue(row, col)}
        meta={meta}
        column={columns?.[col]}
        customCellRegistry={customCellRegistry}
        api={api}
        top={getRowTopByDisplayIndex(displayRow)}
        left={dimensions.getColumnLeft(col)}
        width={width}
        height={height}
        initialInput={editingInitialInput}
        onCommit={(commitValue, direction) =>
          onCommitEdit(row, col, commitValue, direction)
        }
        onCancel={onCancelEdit}
      />
    );
  }, [
    editingCell,
    editingInitialInput,
    frozenColumnCount,
    store,
    metaStore,
    mergeStore,
    columns,
    customCellRegistry,
    api,
    dimensions,
    onCommitEdit,
    onCancelEdit,
    toDisplayRow,
    getRowTopByDisplayIndex,
  ]);
  const frozenActiveOverlay = useMemo(() => {
    if (frozenActiveCell === null) return null;
    const displayRow = toDisplayRow(frozenActiveCell.row);
    if (displayRow < 0) return null;
    const { width, height } = getMergedCellSize(
      mergeStore,
      dimensions,
      frozenActiveCell.row,
      frozenActiveCell.col,
    );
    return (
      <div
        className={styles.frozenActiveOverlay}
        style={{
          top: getRowTopByDisplayIndex(displayRow),
          left: dimensions.getColumnLeft(frozenActiveCell.col),
          width,
          height,
        }}
      />
    );
  }, [
    frozenActiveCell,
    toDisplayRow,
    mergeStore,
    dimensions,
    getRowTopByDisplayIndex,
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
        visibleRowLayout={visibleRowLayout}
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
        visibleRowLayout={visibleRowLayout}
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
    const displayRow = toDisplayRow(row);
    if (displayRow < 0) return null;
    const left = hasFrozenColumns
      ? getScrollableColumnLeft(col, dimensions, frozenWidth)
      : dimensions.getColumnLeft(col);
    const meta = resolveCellMeta(metaStore, row, col, columns);
    const { width, height } = getMergedCellSize(mergeStore, dimensions, row, col);
    return (
      <CellEditorRouter
        row={row}
        col={col}
        value={store.getValue(row, col)}
        meta={meta}
        column={columns?.[col]}
        customCellRegistry={customCellRegistry}
        api={api}
        top={getRowTopByDisplayIndex(displayRow)}
        left={left}
        width={width}
        height={height}
        initialInput={editingInitialInput}
        onCommit={(commitValue, direction) =>
          onCommitEdit(row, col, commitValue, direction)
        }
        onCancel={onCancelEdit}
      />
    );
  }, [
    editingCell,
    editingInitialInput,
    hasFrozenColumns,
    frozenColumnCount,
    store,
    metaStore,
    mergeStore,
    columns,
    customCellRegistry,
    api,
    dimensions,
    frozenWidth,
    onCommitEdit,
    onCancelEdit,
    toDisplayRow,
    getRowTopByDisplayIndex,
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
  const handleSortColumn = useCallback(
    (direction: TSortDirection) => {
      if (openFilterCol === null) return;
      onSortColumn(openFilterCol, direction);
      onCloseColumnFilter();
    },
    [openFilterCol, onSortColumn, onCloseColumnFilter],
  );
  const handleApplyColumnFilter = useCallback(
    (nextState: IColumnFilterState) => {
      if (openFilterCol === null) return;
      onApplyColumnFilter(openFilterCol, nextState);
      onCloseColumnFilter();
    },
    [openFilterCol, onApplyColumnFilter, onCloseColumnFilter],
  );
  const handleResetColumnFilter = useCallback(() => {
    if (openFilterCol === null) return;
    onResetColumnFilter(openFilterCol);
    onCloseColumnFilter();
  }, [openFilterCol, onResetColumnFilter, onCloseColumnFilter]);
  return (
    <div className={styles.spreadsheet} role="grid">
      <div className={styles.topRow}>
        <CornerCell colHeaderHeight={colHeaderHeight} />
        {hasFrozenColumns && (
          <ColumnHeaderRow
            colStart={0}
            colEnd={frozenColumnCount - 1}
            colHeaderHeight={colHeaderHeight}
            dimensions={dimensions}
            scrollLeft={0}
            canvasWidth={frozenWidth}
            frozenWidth={frozenWidth}
            mode="frozen"
            selectionRange={selectionRange}
            headerPaneRef={frozenColumnHeaderRef}
            hoveredHandle={headerResize.hoveredHandle}
            columns={columns}
            onColumnMouseDown={onColumnHeaderMouseDown}
            onColumnMouseEnter={guardedFrozenColumnHeaderMouseEnter}
            onFilterIconClick={onOpenColumnFilter}
            activeFilterColumns={columnFilters}
            onResizeHandleMouseEnter={headerResize.onResizeHandleMouseEnter}
            onResizeHandleMouseLeave={headerResize.onResizeHandleMouseLeave}
            onResizeStart={handleColumnResizeStart}
          />
        )}
        <ColumnHeaderRow
          colStart={scrollableColStart}
          colEnd={endCol}
          colHeaderHeight={colHeaderHeight}
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
          columns={columns}
          onColumnMouseDown={onColumnHeaderMouseDown}
          onColumnMouseEnter={onColumnHeaderMouseEnter}
          onFilterIconClick={onOpenColumnFilter}
          activeFilterColumns={columnFilters}
          onResizeHandleMouseEnter={headerResize.onResizeHandleMouseEnter}
          onResizeHandleMouseLeave={headerResize.onResizeHandleMouseLeave}
          onResizeStart={handleColumnResizeStart}
        />
      </div>
      <div className={styles.bottomRow}>
        <RowHeaderColumn
          visibleRange={visibleRange}
          dimensions={dimensions}
          visibleRowIndices={visibleRowLayout.visibleRowIndices}
          getDisplayRowTop={getRowTopByDisplayIndex}
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
            metaStore={metaStore}
            mergeStore={mergeStore}
            startRow={startRow}
            endRow={endRow}
            frozenColumnCount={frozenColumnCount}
            dimensions={dimensions}
            frozenWidth={frozenWidth}
            scrollTop={scrollTop}
            totalHeight={totalHeight}
            isEditing={editingCell !== null}
            columns={columns}
            customCellRegistry={customCellRegistry}
            resolvePhysicalRow={resolvePhysicalRow}
            getRowTop={getRowTopByDisplayIndex}
            onCellMouseDown={onCellMouseDown}
            onCellMouseEnter={guardedFrozenCellMouseEnter}
            onCellDoubleClick={onCellDoubleClick}
            onBooleanToggle={onBooleanToggle}
            activeOverlay={frozenActiveOverlay}
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
      {openFilterCol !== null &&
        filterAnchorRect !== null &&
        columns?.[openFilterCol]?.showFilter && (
          <ColumnFilterPopup
            anchorRect={filterAnchorRect}
            filterState={columnFilters.get(openFilterCol) ?? {
              condition: "none",
              selectedValues: null,
            }}
            activeSortDirection={
              columnSort?.col === openFilterCol ? columnSort.direction : undefined
            }
            sortFilterDisabled={sortFilterDisabled}
            valueOptions={createFilterValueOptions(
              [
                ...new Set(
                  Array.from({ length: rowCount }, (_, row) => {
                    const value = store.getValue(row, openFilterCol);
                    return value.trim() === "" ? FILTER_BLANK_VALUE : value;
                  }),
                ),
              ].sort((left, right) => left.localeCompare(right)),
              filterLocale.blankCells,
            )}
            onSort={handleSortColumn}
            onApply={handleApplyColumnFilter}
            onReset={handleResetColumnFilter}
            onCancel={onCloseColumnFilter}
          />
        )}
    </div>
  );
});
