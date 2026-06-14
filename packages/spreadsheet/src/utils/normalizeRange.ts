import type { ICellAddress, INormalizedRange, ISelection } from "../types";

export function normalizeRange(
  anchor: ICellAddress,
  focus: ICellAddress,
): INormalizedRange {
  return {
    startRow: Math.min(anchor.row, focus.row),
    endRow: Math.max(anchor.row, focus.row),
    startCol: Math.min(anchor.col, focus.col),
    endCol: Math.max(anchor.col, focus.col),
  };
}

export function normalizeSelection(
  selection: ISelection,
): INormalizedRange {
  return normalizeRange(selection.anchor, selection.focus);
}

export function isInRange(
  row: number,
  col: number,
  range: INormalizedRange,
): boolean {
  return (
    row >= range.startRow &&
    row <= range.endRow &&
    col >= range.startCol &&
    col <= range.endCol
  );
}

export function isSingleCellSelection(selection: ISelection): boolean {
  return (
    selection.anchor.row === selection.focus.row &&
    selection.anchor.col === selection.focus.col
  );
}

export function* iterRangeCells(
  range: INormalizedRange,
): Generator<ICellAddress> {
  for (let row = range.startRow; row <= range.endRow; row++) {
    for (let col = range.startCol; col <= range.endCol; col++) {
      yield { row, col };
    }
  }
}

export function createSelection(cell: ICellAddress): ISelection {
  return { anchor: cell, focus: cell };
}
