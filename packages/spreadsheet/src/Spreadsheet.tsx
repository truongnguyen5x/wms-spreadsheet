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
import {
  DEFAULT_COLUMN_WIDTH,
  DEFAULT_OVERSCAN,
  DEFAULT_ROW_HEIGHT,
  type ICellAddress,
  type ISheetData,
  type ISpreadsheetProps,
  type ISpreadsheetRef,
} from "./types";

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

    const [activeCell, setActiveCellState] = useState<ICellAddress | null>({
      row: 0,
      col: 0,
    });
    const [editingCell, setEditingCell] = useState<ICellAddress | null>(null);
    const gridContainerRef = useRef<HTMLDivElement>(null);

    const setActiveCell = useCallback((cell: ICellAddress) => {
      setActiveCellState(cell);
      setEditingCell(null);
    }, []);

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
          return activeCell;
        },
        setActiveCell(cell: ICellAddress) {
          setActiveCell(cell);
        },
      }),
      [store, activeCell, setActiveCell],
    );

    const startEditing = useCallback(
      (cell: ICellAddress, initialValue?: string) => {
        if (initialValue !== undefined) {
          store.setValue(cell.row, cell.col, initialValue);
        }
        setActiveCellState(cell);
        setEditingCell(cell);
      },
      [store],
    );

    const handleCellClick = useCallback(
      (row: number, col: number) => {
        setActiveCell({ row, col });
        gridContainerRef.current?.focus();
      },
      [setActiveCell],
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
          setActiveCellState({
            row: Math.min(rowCount - 1, row + 1),
            col,
          });
        } else if (direction === "right") {
          setActiveCellState({
            row,
            col: Math.min(columnCount - 1, col + 1),
          });
        }
      },
      [store, onCellChange, rowCount, columnCount],
    );

    const handleCancelEdit = useCallback(() => {
      setEditingCell(null);
    }, []);

    useKeyboardNavigation({
      rowCount,
      columnCount,
      activeCell,
      editingCell,
      setActiveCell,
      startEditing,
      stopEditing: handleCancelEdit,
      store,
      containerRef: gridContainerRef,
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
          activeCell={activeCell}
          editingCell={editingCell}
          onCellClick={handleCellClick}
          onCellDoubleClick={handleCellDoubleClick}
          onCommitEdit={handleCommitEdit}
          onCancelEdit={handleCancelEdit}
        />
      </div>
    );
  },
);
