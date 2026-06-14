import type { INormalizedRange } from "../types";
import type { IGridDimensions } from "../hooks/useGridDimensions";
import { sumSizes } from "./gridDimensions";

export function normalizeFrozenColumnCount(
  count: number | undefined,
  columnCount: number,
): number {
  if (count === undefined || count <= 0) return 0;
  return Math.min(Math.floor(count), columnCount);
}

export function getFrozenWidth(
  columnWidths: readonly number[],
  frozenColumnCount: number,
): number {
  if (frozenColumnCount <= 0) return 0;
  return sumSizes(columnWidths, 0, frozenColumnCount - 1);
}

export function getScrollableColumnLeft(
  col: number,
  dimensions: IGridDimensions,
  frozenWidth: number,
): number {
  return dimensions.getColumnLeft(col) - frozenWidth;
}

export interface ISplitFrozenRange {
  frozen: INormalizedRange | null;
  scrollable: INormalizedRange | null;
}

export function splitRangeByFrozenColumns(
  range: INormalizedRange,
  frozenColumnCount: number,
): ISplitFrozenRange {
  if (frozenColumnCount <= 0) {
    return { frozen: null, scrollable: range };
  }

  const frozenEndCol = frozenColumnCount - 1;

  const frozen: INormalizedRange | null =
    range.startCol <= frozenEndCol
      ? {
          startRow: range.startRow,
          endRow: range.endRow,
          startCol: range.startCol,
          endCol: Math.min(range.endCol, frozenEndCol),
        }
      : null;

  const scrollable: INormalizedRange | null =
    range.endCol >= frozenColumnCount
      ? {
          startRow: range.startRow,
          endRow: range.endRow,
          startCol: Math.max(range.startCol, frozenColumnCount),
          endCol: range.endCol,
        }
      : null;

  return { frozen, scrollable };
}

export function isFrozenColumn(
  col: number,
  frozenColumnCount: number,
): boolean {
  return frozenColumnCount > 0 && col < frozenColumnCount;
}
