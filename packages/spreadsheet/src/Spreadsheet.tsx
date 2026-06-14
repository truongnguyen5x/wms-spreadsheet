import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { CellStore } from "./store/CellStore";
import { SpreadsheetGrid } from "./components/SpreadsheetGrid";
import { useKeyboardNavigation } from "./hooks/useKeyboardNavigation";
import { useClipboard } from "./hooks/useClipboard";
import { useRangeSelection } from "./hooks/useRangeSelection";
import { useGridDimensions } from "./hooks/useGridDimensions";
import { useHeaderResize } from "./hooks/useHeaderResize";
import {
  DEFAULT_COLUMN_WIDTH,
  DEFAULT_OVERSCAN,
  DEFAULT_ROW_HEIGHT,
  type ICellAddress,
  type ISheetData,
  type ISpreadsheetProps,
  type ISpreadsheetRef,
  type ISelection,
} from "./types";
import { createSelection } from "./utils/normalizeRange";

export const Spreadsheet = forwardRef<ISpreadsheetRef, ISpreadsheetProps>(
  function Spreadsheet(
    {
      rowCount,
      columnCount,
      rowHeight = DEFAULT_ROW_HEIGHT,
      columnWidth = DEFAULT_COLUMN_WIDTH,
      overscan = DEFAULT_OVERSCAN,
      className,
      onChange,
      onColumnResize,
      onRowResize,
      initialData,
    },
    ref,
  ) {
    const storeRef = useRef<CellStore | null>(null);
    if (storeRef.current === null) {
      storeRef.current = new CellStore();
    }
    const store = storeRef.current;

    const initialLoadedRef = useRef(false);
    useEffect(() => {
      if (initialData && !initialLoadedRef.current) {
        store.clearAndLoad(initialData);
        initialLoadedRef.current = true;
      }
    }, [initialData, store]);

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
    } = useRangeSelection({ rowCount, columnCount });

    const dimensions = useGridDimensions({
      rowCount,
      columnCount,
      defaultRowHeight: rowHeight,
      defaultColumnWidth: columnWidth,
    });

    const headerResize = useHeaderResize({
      dimensions,
      onColumnResize,
      onRowResize,
    });

    const [editingCell, setEditingCell] = useState<ICellAddress | null>(null);
    const gridContainerRef = useRef<HTMLDivElement>(null);

    const { clipboard, handleCopy, handlePaste, clearClipboard } = useClipboard({
      store,
      rowCount,
      columnCount,
      onChange,
    });

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
        setCellValue(row: number, col: number, value: string) {
          store.setValue(row, col, value);
        },
        getCellValue(row: number, col: number) {
          return store.getValue(row, col);
        },
        setCellValues(cells) {
          store.setValues(cells);
        },
        loadData(data: ISheetData) {
          store.clearAndLoad(data);
        },
        getData() {
          return store.getAllData();
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
      }),
      [store, selection, setActiveCell, setSelection],
    );

    const startEditing = useCallback(
      (cell: ICellAddress, initialValue?: string) => {
        clearClipboard();
        if (initialValue !== undefined) {
          store.setValue(cell.row, cell.col, initialValue);
        }
        setSelection(createSelection(cell));
        setEditingCell(cell);
      },
      [clearClipboard, store, setSelection],
    );

    const handleCellMouseDown = useCallback(
      (row: number, col: number) => {
        onRangeMouseDown(row, col);
        setEditingCell(null);
        gridContainerRef.current?.focus();
      },
      [onRangeMouseDown],
    );

    const handleColumnHeaderMouseDown = useCallback(
      (col: number) => {
        onColumnHeaderMouseDown(col);
        setEditingCell(null);
        gridContainerRef.current?.focus();
      },
      [onColumnHeaderMouseDown],
    );

    const handleRowHeaderMouseDown = useCallback(
      (row: number) => {
        onRowHeaderMouseDown(row);
        setEditingCell(null);
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

        if (direction === "down") {
          const next = {
            row: Math.min(rowCount - 1, row + 1),
            col,
          };
          setSelection(createSelection(next));
        } else if (direction === "right") {
          const next = {
            row,
            col: Math.min(columnCount - 1, col + 1),
          };
          setSelection(createSelection(next));
        }
      },
      [store, onChange, rowCount, columnCount, setSelection],
    );

    const handleCancelEdit = useCallback(() => {
      setEditingCell(null);
    }, []);

    const onCopy = useCallback(() => {
      if (selection) handleCopy(selection);
    }, [selection, handleCopy]);

    const onPaste = useCallback(() => {
      if (selection) void handlePaste(selection.focus);
    }, [selection, handlePaste]);

    useKeyboardNavigation({
      rowCount,
      columnCount,
      selection,
      editingCell,
      setSelection,
      startEditing,
      stopEditing: handleCancelEdit,
      store,
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
          rowCount={rowCount}
          columnCount={columnCount}
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
        />
      </div>
    );
  },
);
