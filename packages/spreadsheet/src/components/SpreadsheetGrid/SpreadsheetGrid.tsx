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

  normalizeSelection,

} from "../../utils/normalizeRange";

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

  const rowHeaderRef = useRef<HTMLDivElement>(null);



  const virtual = useVirtualWindow({

    rowCount,

    columnCount,

    rowHeights: dimensions.rowHeights,

    columnWidths: dimensions.columnWidths,

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

    rowHeights: dimensions.rowHeights,

    columnWidths: dimensions.columnWidths,

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



    const cellTop = dimensions.getRowTop(focusCell.row);

    const cellLeft = dimensions.getColumnLeft(focusCell.col);

    const cellBottom = cellTop + dimensions.getRowHeight(focusCell.row);

    const cellRight = cellLeft + dimensions.getColumnWidth(focusCell.col);



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

  }, [

    focusCell,

    isDragging,

    selection,

    rowCount,

    columnCount,

    dimensions,

    virtual.scrollRef,

  ]);



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

            top={dimensions.getRowTop(row)}

            left={dimensions.getColumnLeft(col)}

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

  }, [

    visibleRange,

    store,

    dimensions,

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

        top={dimensions.getRowTop(editingCell.row)}

        left={dimensions.getColumnLeft(editingCell.col)}

        width={dimensions.getColumnWidth(editingCell.col)}

        height={dimensions.getRowHeight(editingCell.row)}

        onCommit={handleCommit}

        onCancel={onCancelEdit}

      />

    ) : null;



  const clipboardCoversSelection =

    clipboardRange !== null &&

    selection !== null &&

    areRangesEqual(clipboardRange, normalizeSelection(selection));

  const selectionOverlay =

    selection !== null && !clipboardCoversSelection ? (

      <SelectionOverlay selection={selection} dimensions={dimensions} />

    ) : null;



  const clipboardOverlay =

    clipboardRange !== null ? (

      <ClipboardOverlay range={clipboardRange} dimensions={dimensions} />

    ) : null;



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

        <ColumnHeaderRow

          visibleRange={visibleRange}

          dimensions={dimensions}

          scrollLeft={scrollLeft}

          totalWidth={totalWidth}

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

        <div ref={virtual.scrollRef} className={styles.bodyScroll}>

          <div

            className={styles.canvas}

            style={{ width: totalWidth, height: totalHeight }}

          >

            {cells}

            {selectionOverlay}

            {clipboardOverlay}

            {editorOverlay}

          </div>

        </div>

      </div>

    </div>

  );

});

