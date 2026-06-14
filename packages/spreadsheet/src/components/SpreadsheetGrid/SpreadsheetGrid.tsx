import { memo, useCallback, useEffect, useMemo, useRef } from "react";

import type { CellStore } from "../../store/CellStore";

import type { ISelection } from "../../types";

import { useVirtualWindow } from "../../hooks/useVirtualWindow";

import { useDragAutoScroll } from "../../hooks/useDragAutoScroll";

import type { TSelectionDragMode } from "../../hooks/useRangeSelection";

import {

  isHeaderStyleSelection,

  normalizeSelection,

} from "../../utils/normalizeRange";

import { CornerCell } from "../CornerCell";

import { ColumnHeaderRow } from "../ColumnHeaderRow";

import { RowHeaderColumn } from "../RowHeaderColumn";

import { SpreadsheetCell } from "../SpreadsheetCell";

import { CellEditor } from "../CellEditor";

import { SelectionOverlay } from "../SelectionOverlay";

import styles from "../../styles/spreadsheet.module.scss";



export interface ISpreadsheetGridProps {

  store: CellStore;

  rowCount: number;

  columnCount: number;

  rowHeight: number;

  columnWidth: number;

  overscan: number;

  selection: ISelection | null;

  editingCell: { row: number; col: number } | null;

  isDragging: boolean;

  dragMode: TSelectionDragMode;

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

  rowHeight,

  columnWidth,

  overscan,

  selection,

  editingCell,

  isDragging,

  dragMode,

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

  const rowHeaderRef = useRef<HTMLDivElement>(null);



  const virtual = useVirtualWindow({

    rowCount,

    columnCount,

    rowHeight,

    columnWidth,

    overscan,

  });



  const { visibleRange, scrollTop, scrollLeft, totalWidth, totalHeight } =

    virtual;



  useDragAutoScroll({

    isDragging,

    dragMode,

    scrollRef: virtual.scrollRef,

    columnHeaderRef,

    rowHeaderRef,

    rowHeight,

    columnWidth,

    rowCount,

    columnCount,

    onCellFocus: onCellMouseEnter,

    onColumnFocus: onColumnHeaderMouseEnter,

    onRowFocus: onRowHeaderMouseEnter,

  });



  const focusCell = selection?.focus ?? null;

  const selectionRange = selection ? normalizeSelection(selection) : null;



  useEffect(() => {

    if (!focusCell || isDragging) return;

    if (
      selection &&
      isHeaderStyleSelection(selection, rowCount, columnCount)
    ) {
      return;
    }

    const el = virtual.scrollRef.current;

    if (!el) return;



    const cellTop = focusCell.row * rowHeight;

    const cellLeft = focusCell.col * columnWidth;

    const cellBottom = cellTop + rowHeight;

    const cellRight = cellLeft + columnWidth;



    const viewTop = el.scrollTop;

    const viewLeft = el.scrollLeft;

    const viewBottom = viewTop + el.clientHeight;

    const viewRight = viewLeft + el.clientWidth;



    if (cellTop < viewTop) {

      el.scrollTop = cellTop;

    } else if (cellBottom > viewBottom) {

      el.scrollTop = cellBottom - el.clientHeight;

    }



    if (cellLeft < viewLeft) {

      el.scrollLeft = cellLeft;

    } else if (cellRight > viewRight) {

      el.scrollLeft = cellRight - el.clientWidth;

    }

  }, [focusCell, isDragging, selection, rowCount, columnCount, rowHeight, columnWidth, virtual.scrollRef]);



  const cells = useMemo(() => {

    const result: React.ReactNode[] = [];

    for (let row = visibleRange.startRow; row <= visibleRange.endRow; row++) {

      for (let col = visibleRange.startCol; col <= visibleRange.endCol; col++) {

        result.push(

          <SpreadsheetCell

            key={`${row}:${col}`}

            store={store}

            row={row}

            col={col}

            top={row * rowHeight}

            left={col * columnWidth}

            width={columnWidth}

            height={rowHeight}

            onMouseDown={onCellMouseDown}

            onMouseEnter={onCellMouseEnter}

            onDoubleClick={onCellDoubleClick}

          />,

        );

      }

    }

    return result;

  }, [

    visibleRange,

    store,

    rowHeight,

    columnWidth,

    onCellMouseDown,

    onCellMouseEnter,

    onCellDoubleClick,

  ]);



  const handleCommit = useCallback(

    (value: string, direction: "stay" | "down" | "right") => {

      if (!editingCell) return;

      onCommitEdit(editingCell.row, editingCell.col, value, direction);

    },

    [editingCell, onCommitEdit],

  );



  const editorOverlay =

    editingCell !== null ? (

      <CellEditor

        row={editingCell.row}

        col={editingCell.col}

        value={store.getValue(editingCell.row, editingCell.col)}

        top={editingCell.row * rowHeight}

        left={editingCell.col * columnWidth}

        width={columnWidth}

        height={rowHeight}

        onCommit={handleCommit}

        onCancel={onCancelEdit}

      />

    ) : null;



  const selectionOverlay =

    selection !== null ? (

      <SelectionOverlay

        selection={selection}

        rowHeight={rowHeight}

        columnWidth={columnWidth}

      />

    ) : null;



  return (

    <div className={styles.spreadsheet} role="grid">

      <div className={styles.topRow}>

        <CornerCell />

        <ColumnHeaderRow

          visibleRange={visibleRange}

          columnWidth={columnWidth}

          scrollLeft={scrollLeft}

          totalWidth={totalWidth}

          selectionRange={selectionRange}

          headerPaneRef={columnHeaderRef}

          onColumnMouseDown={onColumnHeaderMouseDown}

          onColumnMouseEnter={onColumnHeaderMouseEnter}

        />

      </div>

      <div className={styles.bottomRow}>

        <RowHeaderColumn

          visibleRange={visibleRange}

          rowHeight={rowHeight}

          scrollTop={scrollTop}

          totalHeight={totalHeight}

          selectionRange={selectionRange}

          headerPaneRef={rowHeaderRef}

          onRowMouseDown={onRowHeaderMouseDown}

          onRowMouseEnter={onRowHeaderMouseEnter}

        />

        <div ref={virtual.scrollRef} className={styles.bodyScroll}>

          <div

            className={styles.canvas}

            style={{ width: totalWidth, height: totalHeight }}

          >

            {cells}

            {selectionOverlay}

            {editorOverlay}

          </div>

        </div>

      </div>

    </div>

  );

});


