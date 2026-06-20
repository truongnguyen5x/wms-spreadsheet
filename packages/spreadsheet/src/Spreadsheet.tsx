import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { CellStore } from "./store/CellStore";
import { MetaStore } from "./store/MetaStore";
import { MergeStore } from "./store/MergeStore";
import { SpreadsheetGrid } from "./components/SpreadsheetGrid";
import { useKeyboardNavigation } from "./hooks/useKeyboardNavigation";
import { useClipboard } from "./hooks/useClipboard";
import { useRangeSelection } from "./hooks/useRangeSelection";
import { useGridDimensions } from "./hooks/useGridDimensions";
import { useHeaderResize } from "./hooks/useHeaderResize";
import { useMergeRevision } from "./hooks/useMergeRevision";
import { useSpreadsheetHostHeight } from "./hooks/useSpreadsheetHostHeight";
import {
  CELL_LINE_HEIGHT,
  CELL_VERTICAL_PADDING,
  DEFAULT_COLUMN_WIDTH,
  DEFAULT_OVERSCAN,
  DEFAULT_ROW_HEIGHT,
  COLUMN_HEADER_HEIGHT,
  type ICellAddress,
  type IColumnFilterState,
  type IColumnSortState,
  type ICellMetaInput,
  type INormalizedRange,
  type ISpreadsheetColumn,
  type ISpreadsheetProps,
  type ISpreadsheetRef,
  type ISelection,
  type TSortDirection,
  type TSheetDataInput,
  type TCellValue,
} from "./types";
import {
  exportRowData,
  exportSheetData,
  buildInitialColumnWidths,
  fromStoreValue,
  getEffectiveColumnCount,
  normalizeToSheetData,
  resolveColIndex,
  toStoreValue,
} from "./utils/dataAdapter";
import { resolveCellMeta, isCellEditable, isCellDisabled } from "./utils/resolveCellMeta";
import {
  createSelection,
  isHeaderStyleSelection,
  normalizeSelection,
} from "./utils/normalizeRange";
import { selectionFromExpandedRange } from "./utils/mergeCell";
import {
  computeVisibleRowIndices,
  createDefaultColumnFilterState,
  hasActiveSortOrFilter,
} from "./utils/columnFilter";
import { sortDisplayRowOrder } from "./utils/rowSort";
import { buildVisibleRowLayout } from "./utils/visibleRowLayout";
import { resolveSpreadsheetLocale } from "./locale/resolveSpreadsheetLocale";
import { SpreadsheetLocaleProvider } from "./context/SpreadsheetLocaleContext";
import styles from "./styles/spreadsheet.module.scss";

function buildIdentityRowOrder(rowCount: number): number[] {
  return Array.from({ length: rowCount }, (_, index) => index);
}

export const Spreadsheet = forwardRef<ISpreadsheetRef, ISpreadsheetProps>(
  function Spreadsheet(props, ref) {
    const {
      rowCount,
      columnCount,
      columns,
      rowHeight = DEFAULT_ROW_HEIGHT,
      colHeaderHeight = COLUMN_HEADER_HEIGHT,
      columnWidth = DEFAULT_COLUMN_WIDTH,
      overscan = DEFAULT_OVERSCAN,
      className,
      onChange,
      onError,
      onColumnResize,
      onRowResize,
      initialData,
      frozenColumnCount,
      customCellRegistry,
      locale: localePartial,
    } = props;
    const locale = useMemo(
      () => resolveSpreadsheetLocale(localePartial),
      [localePartial],
    );
    const effectiveColumnCount = getEffectiveColumnCount(columnCount, columns);
    const initialColumnWidths = useMemo(
      () => buildInitialColumnWidths(columnCount, columnWidth, columns),
      [columnCount, columnWidth, columns],
    );
    const columnsRef = useRef<ISpreadsheetColumn[] | undefined>(columns);
    columnsRef.current = columns;
    const storeRef = useRef<CellStore | null>(null);
    if (storeRef.current === null) {
      storeRef.current = new CellStore();
    }

    const store = storeRef.current;
    const metaStoreRef = useRef<MetaStore | null>(null);
    if (metaStoreRef.current === null) {
      metaStoreRef.current = new MetaStore();
    }

    const metaStore = metaStoreRef.current;
    const mergeStoreRef = useRef<MergeStore | null>(null);
    if (mergeStoreRef.current === null) {
      mergeStoreRef.current = new MergeStore();
    }

    const mergeStore = mergeStoreRef.current;
    const mergeRevision = useMergeRevision(mergeStore);
    void mergeRevision;
    const resolveCell = useCallback(
      (row: number, col: number) => mergeStore.resolveAnchor(row, col),
      [mergeStore],
    );
    const expandSelection = useCallback(
      (next: ISelection) => {
        if (isHeaderStyleSelection(next, rowCount, effectiveColumnCount)) {
          return next;
        }
        const expanded = mergeStore.expandRange(normalizeSelection(next));
        return selectionFromExpandedRange(expanded, next);
      },
      [mergeStore, rowCount, effectiveColumnCount],
    );
    const initialLoadedRef = useRef(false);
    useEffect(() => {
      if (initialData && !initialLoadedRef.current) {
        store.clearAndLoad(normalizeToSheetData(initialData, columns));
        initialLoadedRef.current = true;
      }
    }, [initialData, columns, store]);
    const {
      selection,
      setSelection,
      handleCellMouseDown: onRangeMouseDown,
      handleCellMouseEnter,
      handleColumnHeaderMouseDown: onColumnHeaderMouseDown,
      handleColumnHeaderMouseEnter,
      handleRowHeaderMouseDown: onRowHeaderMouseDown,
      handleRowHeaderMouseEnter,
      isDragging,
      dragMode,
    } = useRangeSelection({
      rowCount,
      columnCount: effectiveColumnCount,
      resolveCell,
      expandSelection,
    });
    const dimensions = useGridDimensions({
      rowCount,
      columnCount: effectiveColumnCount,
      defaultRowHeight: rowHeight,
      defaultColumnWidth: columnWidth,
      initialColumnWidths,
    });
    const headerResize = useHeaderResize({
      dimensions,
      onColumnResize,
      onRowResize,
    });
    const [editingCell, setEditingCell] = useState<ICellAddress | null>(null);
    const [editingInitialInput, setEditingInitialInput] = useState<
      string | undefined
    >();
    const gridContainerRef = useRef<HTMLDivElement>(null);
    const visibleRowIndicesRef = useRef<readonly number[]>([]);
    const [columnFilters, setColumnFilters] = useState<Map<number, IColumnFilterState>>(
      () => new Map(),
    );
    const [displayRowOrder, setDisplayRowOrder] = useState<number[]>(
      () => buildIdentityRowOrder(rowCount),
    );
    const [columnSort, setColumnSort] = useState<IColumnSortState | null>(null);
    const baselineRowOrderRef = useRef<number[]>(buildIdentityRowOrder(rowCount));
    const [openFilterCol, setOpenFilterCol] = useState<number | null>(null);
    const [filterAnchorRect, setFilterAnchorRect] = useState<DOMRect | null>(null);
    const { clipboard, handleCopy, handlePaste, clearClipboard } = useClipboard(
      {
        store,
        metaStore,
        mergeStore,
        columnsRef,
        rowCount,
        columnCount: effectiveColumnCount,
        visibleRowIndicesRef,
        onChange,
        onError,
        locale,
      },
    );
    const setActiveCell = useCallback(
      (cell: ICellAddress) => {
        setSelection(createSelection(cell));
        setEditingCell(null);
        setEditingInitialInput(undefined);
      },
      [setSelection],
    );
    useImperativeHandle(
      ref,
      () => ({
        setCellValue(
          row: number,
          col: number | null,
          value: TCellValue,
          colName?: string,
        ) {
          const resolvedCol = resolveColIndex(
            col,
            colName,
            columnsRef.current,
          );
          const anchor = mergeStore.resolveAnchor(row, resolvedCol);
          const column = columnsRef.current?.[resolvedCol];
          store.setValue(anchor.row, anchor.col, toStoreValue(value, column));
        },
        getCellValue(row: number, col: number | null, colName?: string) {
          const resolvedCol = resolveColIndex(
            col,
            colName,
            columnsRef.current,
          );
          const anchor = mergeStore.resolveAnchor(row, resolvedCol);
          const column = columnsRef.current?.[resolvedCol];
          return fromStoreValue(
            store.getValue(anchor.row, anchor.col),
            column,
          );
        },
        setCellValues(cells) {
          store.setValues(
            cells.map(({ row, col, colName, value }) => {
              const resolvedCol = resolveColIndex(
                col ?? null,
                colName,
                columnsRef.current,
              );
              const column = columnsRef.current?.[resolvedCol];
              return {
                row,
                col: resolvedCol,
                value: toStoreValue(value, column),
              };
            }),
          );
        },
        loadData(data: TSheetDataInput) {
          store.clearAndLoad(normalizeToSheetData(data, columnsRef.current));
          mergeStore.clear();
          const identity = buildIdentityRowOrder(rowCount);
          baselineRowOrderRef.current = identity;
          setDisplayRowOrder(identity);
          setColumnFilters(new Map());
          setColumnSort(null);
        },
        getData() {
          return exportSheetData(store, columnsRef.current, rowCount);
        },
        getRowData(row: number) {
          return exportRowData(store, columnsRef.current, row);
        },
        getActiveCell() {
          return selection?.anchor ?? null;
        },
        setActiveCell(cell: ICellAddress) {
          setActiveCell(cell);
        },
        getSelection() {
          return selection;
        },
        setSelection(next: ISelection) {
          setSelection(next);
        },
        setCellMeta(
          row: number,
          col: number | null,
          meta,
          colName?: string,
        ) {
          const resolvedCol = resolveColIndex(
            col,
            colName,
            columnsRef.current,
          );
          const anchor = mergeStore.resolveAnchor(row, resolvedCol);
          metaStore.setMeta(anchor.row, anchor.col, meta);
        },
        getCellMeta(row: number, col: number | null, colName?: string) {
          const resolvedCol = resolveColIndex(
            col,
            colName,
            columnsRef.current,
          );
          const anchor = mergeStore.resolveAnchor(row, resolvedCol);
          return resolveCellMeta(
            metaStore,
            anchor.row,
            anchor.col,
            columnsRef.current,
          );
        },
        setCellsMeta(cells: ICellMetaInput[]) {
          metaStore.setMetas(
            cells.map(({ row, col, colName, meta }) => {
              const resolvedCol = resolveColIndex(
                col ?? null,
                colName,
                columnsRef.current,
              );
              const anchor = mergeStore.resolveAnchor(row, resolvedCol);
              return {
                row: anchor.row,
                col: anchor.col,
                meta,
              };
            }),
          );
        },
        mergeCells(range?: INormalizedRange) {
          const targetRange =
            range ?? (selection ? normalizeSelection(selection) : null);
          if (!targetRange) {
            onError?.({
              code: "MERGE_INVALID_RANGE",
              message: locale.errors.mergeInvalidRange,
            });
            return false;
          }
          if (!mergeStore.canMerge(targetRange)) {
            onError?.({
              code: "MERGE_OVERLAP",
              message: locale.errors.mergeOverlap,
            });
            return false;
          }
          if (
            hasActiveSortOrFilter(
              columnFilters,
              columnSort,
              columnsRef.current,
            )
          ) {
            onError?.({
              code: "MERGE_SORT_FILTER_ACTIVE",
              message: locale.errors.mergeWhileSortFilterActive,
            });
            return false;
          }
          const merged = mergeStore.merge(targetRange, store, metaStore);
          if (merged) {
            setSelection(
              createSelection({
                row: targetRange.startRow,
                col: targetRange.startCol,
              }),
            );
          }
          return merged;
        },
        unmergeCells(range?: INormalizedRange) {
          const targetRange =
            range ?? (selection ? normalizeSelection(selection) : null);
          if (!targetRange) {
            return false;
          }
          const count = mergeStore.unmergeInRange(targetRange);
          if (count > 0) {
            setSelection(
              createSelection({
                row: targetRange.startRow,
                col: targetRange.startCol,
              }),
            );
          }
          return count > 0;
        },
        getMergedRanges() {
          return mergeStore.getAll();
        },
        hasMergedCells() {
          return mergeStore.hasAny();
        },
      }),
      [
        store,
        metaStore,
        mergeStore,
        selection,
        setActiveCell,
        setSelection,
        rowCount,
        onError,
        columnFilters,
        columnSort,
        locale,
      ],
    );
    useEffect(() => {
      const identity = buildIdentityRowOrder(rowCount);
      baselineRowOrderRef.current = identity;
      setDisplayRowOrder(identity);
      setColumnFilters(new Map());
      setColumnSort(null);
    }, [rowCount]);
    const startEditing = useCallback(
      (cell: ICellAddress, initialValue?: string) => {
        const anchor = mergeStore.resolveAnchor(cell.row, cell.col);
        const meta = resolveCellMeta(
          metaStore,
          anchor.row,
          anchor.col,
          columnsRef.current,
        );
        if (!isCellEditable(meta)) return;
        clearClipboard();
        if (initialValue !== undefined) {
          if (meta.type === "select" || meta.type === "multiSelect") {
            setEditingInitialInput(initialValue);
          } else {
            store.setValue(anchor.row, anchor.col, initialValue);
            setEditingInitialInput(undefined);
          }
        } else {
          setEditingInitialInput(undefined);
        }
        setSelection(createSelection(anchor));
        setEditingCell(anchor);
      },
      [clearClipboard, metaStore, mergeStore, store, setSelection],
    );
    const handleCellMouseDown = useCallback(
      (row: number, col: number) => {
        onRangeMouseDown(row, col);
        gridContainerRef.current?.focus();
      },
      [onRangeMouseDown],
    );
    const handleColumnHeaderMouseDown = useCallback(
      (col: number) => {
        onColumnHeaderMouseDown(col);
        gridContainerRef.current?.focus();
      },
      [onColumnHeaderMouseDown],
    );
    const handleRowHeaderMouseDown = useCallback(
      (row: number) => {
        onRowHeaderMouseDown(row);
        gridContainerRef.current?.focus();
      },
      [onRowHeaderMouseDown],
    );
    const handleCellDoubleClick = useCallback(
      (row: number, col: number) => {
        startEditing({ row, col });
        gridContainerRef.current?.focus();
      },
      [startEditing],
    );
    const handleCommitEdit = useCallback(
      (
        row: number,
        col: number,
        value: string,
        direction: "stay" | "down" | "right",
      ) => {
        store.setValue(row, col, value);
        setEditingCell(null);
        setEditingInitialInput(undefined);
        const column = columnsRef.current?.[col];
        onChange?.([
          { row, col, value: fromStoreValue(value, column) },
        ]);
        if (value.includes("\n") && !dimensions.isRowHeightManual(row)) {
          const lineCount = value.split("\n").length;
          const neededHeight = Math.max(
            rowHeight,
            lineCount * CELL_LINE_HEIGHT + CELL_VERTICAL_PADDING,
          );
          dimensions.setRowHeight(row, neededHeight);
          onRowResize?.(row, neededHeight);
        }

        if (direction === "down") {
          const next = {
            row: Math.min(rowCount - 1, row + 1),
            col,
          };
          setSelection(createSelection(next));
        } else if (direction === "right") {
          const next = {
            row,
            col: Math.min(effectiveColumnCount - 1, col + 1),
          };
          setSelection(createSelection(next));
        }
      },
      [
        store,
        onChange,
        rowCount,
        effectiveColumnCount,
        setSelection,
        rowHeight,
        dimensions,
        onRowResize,
      ],
    );
    const handleCancelEdit = useCallback(() => {
      setEditingCell(null);
      setEditingInitialInput(undefined);
    }, []);
    const handleBooleanToggle = useCallback(
      (row: number, col: number, nextValue: string) => {
        const meta = resolveCellMeta(
          metaStore,
          row,
          col,
          columnsRef.current,
        );
        if (isCellDisabled(meta)) return;
        store.setValue(row, col, nextValue);
        onChange?.([{ row, col, value: nextValue }]);
      },
      [store, metaStore, onChange],
    );
    const handleOpenColumnFilter = useCallback(
      (col: number, anchorRect: DOMRect) => {
        if (mergeStore.hasAny()) {
          onError?.({
            code: "MERGE_SORT_FILTER_ACTIVE",
            message: locale.errors.filterWhileMerged,
          });
          return;
        }
        setOpenFilterCol(col);
        setFilterAnchorRect(anchorRect);
      },
      [mergeStore, onError, locale],
    );
    const handleCloseColumnFilter = useCallback(() => {
      setOpenFilterCol(null);
      setFilterAnchorRect(null);
    }, []);
    const handleApplyColumnFilter = useCallback(
      (col: number, nextState: IColumnFilterState) => {
        if (mergeStore.hasAny()) {
          onError?.({
            code: "MERGE_SORT_FILTER_ACTIVE",
            message: locale.errors.filterWhileMerged,
          });
          return;
        }
        setColumnFilters((prev) => {
          const next = new Map(prev);
          next.set(col, {
            condition: nextState.condition,
            conditionValue: nextState.conditionValue,
            selectedValues: nextState.selectedValues,
          });
          return next;
        });
      },
      [mergeStore, onError, locale],
    );
    const handleSortColumn = useCallback(
      (col: number, direction: TSortDirection) => {
        if (mergeStore.hasAny()) {
          onError?.({
            code: "MERGE_SORT_FILTER_ACTIVE",
            message: locale.errors.sortWhileMerged,
          });
          return;
        }
        setDisplayRowOrder((prev) =>
          sortDisplayRowOrder(store, col, direction, prev),
        );
        setColumnSort({ col, direction });
      },
      [store, mergeStore, onError, locale],
    );
    const handleResetColumnFilter = useCallback((col: number) => {
      setDisplayRowOrder(baselineRowOrderRef.current);
      setColumnSort(null);
      setColumnFilters((prev) => {
        const next = new Map(prev);
        next.set(col, createDefaultColumnFilterState());
        return next;
      });
    }, []);
    const visiblePhysicalRows = useMemo(
      () => computeVisibleRowIndices(store, rowCount, columns, columnFilters),
      [store, rowCount, columns, columnFilters],
    );
    const visibleRowLayout = useMemo(
      () =>
        buildVisibleRowLayout(
          displayRowOrder,
          visiblePhysicalRows,
          dimensions.rowHeights,
        ),
      [displayRowOrder, visiblePhysicalRows, dimensions.rowHeights],
    );
    visibleRowIndicesRef.current = visibleRowLayout.visibleRowIndices;
    const onCopy = useCallback(() => {
      if (selection) handleCopy(selection);
    }, [selection, handleCopy]);
    const onPaste = useCallback(() => {
      if (selection) void handlePaste(selection.focus);
    }, [selection, handlePaste]);
    useKeyboardNavigation({
      rowCount,
      columnCount: effectiveColumnCount,
      selection,
      editingCell,
      setSelection,
      startEditing,
      stopEditing: handleCancelEdit,
      store,
      metaStore,
      mergeStore,
      columnsRef,
      visibleRowIndicesRef,
      containerRef: gridContainerRef,
      onChange,
      onCopy,
      onPaste,
    });
    const hasMergedCells = mergeStore.hasAny();
    const { needsViewportFallback, fallbackHeightPx } =
      useSpreadsheetHostHeight(gridContainerRef);
    const hostClassName = [
      styles.host,
      needsViewportFallback ? styles.hostFallback : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");
    return (
      <SpreadsheetLocaleProvider locale={locale}>
        <div
          ref={gridContainerRef}
          className={hostClassName}
          style={
            needsViewportFallback && fallbackHeightPx !== null
              ? { height: fallbackHeightPx, maxHeight: "100vh" }
              : undefined
          }
          tabIndex={0}
        >
          <SpreadsheetGrid
          store={store}
          metaStore={metaStore}
          mergeStore={mergeStore}
          rowCount={rowCount}
          columnCount={effectiveColumnCount}
          frozenColumnCount={frozenColumnCount}
          columns={columns}
          customCellRegistry={customCellRegistry}
          dimensions={dimensions}
          visibleRowLayout={visibleRowLayout}
          overscan={overscan}
          colHeaderHeight={colHeaderHeight}
          selection={selection}
          clipboardRange={clipboard?.range ?? null}
          editingCell={editingCell}
          editingInitialInput={editingInitialInput}
          isDragging={isDragging}
          dragMode={dragMode}
          headerResize={headerResize}
          sortFilterDisabled={hasMergedCells}
          onCellMouseDown={handleCellMouseDown}
          onCellMouseEnter={handleCellMouseEnter}
          onColumnHeaderMouseDown={handleColumnHeaderMouseDown}
          onColumnHeaderMouseEnter={handleColumnHeaderMouseEnter}
          onOpenColumnFilter={handleOpenColumnFilter}
          openFilterCol={openFilterCol}
          filterAnchorRect={filterAnchorRect}
          columnFilters={columnFilters}
          columnSort={columnSort}
          onApplyColumnFilter={handleApplyColumnFilter}
          onSortColumn={handleSortColumn}
          onResetColumnFilter={handleResetColumnFilter}
          onCloseColumnFilter={handleCloseColumnFilter}
          onRowHeaderMouseDown={handleRowHeaderMouseDown}
          onRowHeaderMouseEnter={handleRowHeaderMouseEnter}
          onCellDoubleClick={handleCellDoubleClick}
          onCommitEdit={handleCommitEdit}
          onCancelEdit={handleCancelEdit}
          onBooleanToggle={handleBooleanToggle}
        />
        </div>
      </SpreadsheetLocaleProvider>
    );
  },
);

