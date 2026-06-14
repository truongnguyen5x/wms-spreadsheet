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
  type ICellMetaInput,
  type ISpreadsheetColumn,
  type ISpreadsheetProps,
  type ISpreadsheetRef,
  type ISelection,
  type TSheetDataInput,
} from "./types";
import {
  exportSheetData,
  buildInitialColumnWidths,
  getEffectiveColumnCount,
  normalizeToSheetData,
  resolveColIndex,
} from "./utils/dataAdapter";
import { resolveCellMeta, isCellEditable } from "./utils/resolveCellMeta";
import { createSelection } from "./utils/normalizeRange";

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
    const gridContainerRef = useRef<HTMLDivElement>(null);
    const { clipboard, handleCopy, handlePaste, clearClipboard } = useClipboard(
      {
        store,
        rowCount,
        columnCount: effectiveColumnCount,
        onChange,
      },
    );
    const setActiveCell = useCallback(
      (cell: ICellAddress) => {
        setSelection(createSelection(cell));
        setEditingCell(null);
      },
      [setSelection],
    );
    useImperativeHandle(
      ref,
      () => ({
        setCellValue(
          row: number,
          col: number | null,
          value: string,
          colName?: string,
        ) {
          const resolvedCol = resolveColIndex(
            col,
            colName,
            columnsRef.current,
          );
          store.setValue(row, resolvedCol, value);
        },
        getCellValue(row: number, col: number | null, colName?: string) {
          const resolvedCol = resolveColIndex(
            col,
            colName,
            columnsRef.current,
          );
          return store.getValue(row, resolvedCol);
        },
        setCellValues(cells) {
          store.setValues(
            cells.map(({ row, col, colName, value }) => ({
              row,
              col: resolveColIndex(
                col ?? null,
                colName,
                columnsRef.current,
              ),
              value,
            })),
          );
        },
        loadData(data: TSheetDataInput) {
          store.clearAndLoad(normalizeToSheetData(data, columnsRef.current));
        },
        getData() {
          return exportSheetData(store, columnsRef.current, rowCount);
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
          store.setValue(cell.row, cell.col, initialValue);
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
        onChange?.([{ row, col, value }]);
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
    }, []);
    const handleBooleanToggle = useCallback(
      (row: number, col: number, nextValue: string) => {
        store.setValue(row, col, nextValue);
        onChange?.([{ row, col, value: nextValue }]);
      },
      [store, onChange],
    );
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
          overscan={overscan}
          selection={selection}
          clipboardRange={clipboard?.range ?? null}
          editingCell={editingCell}
          isDragging={isDragging}
          dragMode={dragMode}
          headerResize={headerResize}
          onCellMouseDown={handleCellMouseDown}
          onCellMouseEnter={handleCellMouseEnter}
          onColumnHeaderMouseDown={handleColumnHeaderMouseDown}
          onColumnHeaderMouseEnter={handleColumnHeaderMouseEnter}
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

