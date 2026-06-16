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
import { SpreadsheetGrid } from "./components/SpreadsheetGrid";
import { useKeyboardNavigation } from "./hooks/useKeyboardNavigation";
import { useClipboard } from "./hooks/useClipboard";
import { useRangeSelection } from "./hooks/useRangeSelection";
import { useGridDimensions } from "./hooks/useGridDimensions";
import { useHeaderResize } from "./hooks/useHeaderResize";
import {
  CELL_LINE_HEIGHT,
  DEFAULT_COLUMN_WIDTH,
  DEFAULT_OVERSCAN,
  DEFAULT_ROW_HEIGHT,
  type ICellAddress,
  type IColumnFilterState,
  type IColumnSortState,
  type ICellMetaInput,
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
import { createSelection } from "./utils/normalizeRange";
import {
  computeVisibleRowIndices,
  createDefaultColumnFilterState,
} from "./utils/columnFilter";
import { sortDisplayRowOrder } from "./utils/rowSort";
import { buildVisibleRowLayout } from "./utils/visibleRowLayout";

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
      columnWidth = DEFAULT_COLUMN_WIDTH,
      overscan = DEFAULT_OVERSCAN,
      className,
      onChange,
      onColumnResize,
      onRowResize,
      initialData,
      frozenColumnCount,
      customCellRegistry,
    } = props;
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
    } = useRangeSelection({ rowCount, columnCount: effectiveColumnCount });
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
        columnsRef,
        rowCount,
        columnCount: effectiveColumnCount,
        visibleRowIndicesRef,
        onChange,
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
          const column = columnsRef.current?.[resolvedCol];
          store.setValue(row, resolvedCol, toStoreValue(value, column));
        },
        getCellValue(row: number, col: number | null, colName?: string) {
          const resolvedCol = resolveColIndex(
            col,
            colName,
            columnsRef.current,
          );
          const column = columnsRef.current?.[resolvedCol];
          return fromStoreValue(
            store.getValue(row, resolvedCol),
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
          return selection?.focus ?? null;
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
          metaStore.setMeta(row, resolvedCol, meta);
        },
        getCellMeta(row: number, col: number | null, colName?: string) {
          const resolvedCol = resolveColIndex(
            col,
            colName,
            columnsRef.current,
          );
          return resolveCellMeta(
            metaStore,
            row,
            resolvedCol,
            columnsRef.current,
          );
        },
        setCellsMeta(cells: ICellMetaInput[]) {
          metaStore.setMetas(
            cells.map(({ row, col, colName, meta }) => ({
              row,
              col: resolveColIndex(
                col ?? null,
                colName,
                columnsRef.current,
              ),
              meta,
            })),
          );
        },
      }),
      [store, metaStore, selection, setActiveCell, setSelection, rowCount],
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
        const meta = resolveCellMeta(
          metaStore,
          cell.row,
          cell.col,
          columnsRef.current,
        );
        if (!isCellEditable(meta)) return;
        clearClipboard();
        if (initialValue !== undefined) {
          if (meta.type === "select" || meta.type === "multiSelect") {
            setEditingInitialInput(initialValue);
          } else {
            store.setValue(cell.row, cell.col, initialValue);
            setEditingInitialInput(undefined);
          }
        } else {
          setEditingInitialInput(undefined);
        }
        setSelection(createSelection(cell));
        setEditingCell(cell);
      },
      [clearClipboard, metaStore, store, setSelection],
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
          const CELL_PADDING = 8;
          const lineCount = value.split("\n").length;
          const neededHeight = Math.max(
            rowHeight,
            lineCount * CELL_LINE_HEIGHT + CELL_PADDING,
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
        setOpenFilterCol(col);
        setFilterAnchorRect(anchorRect);
      },
      [],
    );
    const handleCloseColumnFilter = useCallback(() => {
      setOpenFilterCol(null);
      setFilterAnchorRect(null);
    }, []);
    const handleApplyColumnFilter = useCallback(
      (col: number, nextState: IColumnFilterState) => {
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
      [],
    );
    const handleSortColumn = useCallback(
      (col: number, direction: TSortDirection) => {
        setDisplayRowOrder((prev) =>
          sortDisplayRowOrder(store, col, direction, prev),
        );
        setColumnSort({ col, direction });
      },
      [store],
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
      columnsRef,
      visibleRowIndicesRef,
      containerRef: gridContainerRef,
      onChange,
      onCopy,
      onPaste,
    });
    return (
      <div
        ref={gridContainerRef}
        className={className}
        style={{ width: "100%", height: "100%", outline: "none" }}
        tabIndex={0}
      >
        <SpreadsheetGrid
          store={store}
          metaStore={metaStore}
          rowCount={rowCount}
          columnCount={effectiveColumnCount}
          frozenColumnCount={frozenColumnCount}
          columns={columns}
          customCellRegistry={customCellRegistry}
          dimensions={dimensions}
          visibleRowLayout={visibleRowLayout}
          overscan={overscan}
          selection={selection}
          clipboardRange={clipboard?.range ?? null}
          editingCell={editingCell}
          editingInitialInput={editingInitialInput}
          isDragging={isDragging}
          dragMode={dragMode}
          headerResize={headerResize}
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
    );
  },
);

