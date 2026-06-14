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
import { useRangeSelection } from "./hooks/useRangeSelection";
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
      onCellChange,
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
      isDragging,
    } = useRangeSelection({ row: 0, col: 0 });

    const [editingCell, setEditingCell] = useState<ICellAddress | null>(null);
    const gridContainerRef = useRef<HTMLDivElement>(null);

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
        if (initialValue !== undefined) {
          store.setValue(cell.row, cell.col, initialValue);
        }
        setSelection(createSelection(cell));
        setEditingCell(cell);
      },
      [store, setSelection],
    );

    const handleCellMouseDown = useCallback(
      (row: number, col: number) => {
        onRangeMouseDown(row, col);
        setEditingCell(null);
        gridContainerRef.current?.focus();
      },
      [onRangeMouseDown],
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
        onCellChange?.(row, col, value);

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
      [store, onCellChange, rowCount, columnCount, setSelection],
    );

    const handleCancelEdit = useCallback(() => {
      setEditingCell(null);
    }, []);

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
      onCellChange,
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
          rowHeight={rowHeight}
          columnWidth={columnWidth}
          overscan={overscan}
          selection={selection}
          editingCell={editingCell}
          isDragging={isDragging}
          onCellMouseDown={handleCellMouseDown}
          onCellMouseEnter={handleCellMouseEnter}
          onCellDoubleClick={handleCellDoubleClick}
          onCommitEdit={handleCommitEdit}
          onCancelEdit={handleCancelEdit}
        />
      </div>
    );
  },
);
