import type { ICellAddress, IMergedRange, INormalizedRange } from "../types";

export type TMergeCellRole = "anchor" | "covered" | "none";

export function mergedRangeToBounds(range: IMergedRange): INormalizedRange {
  return {
    startRow: range.anchorRow,
    endRow: range.anchorRow + range.rowSpan - 1,
    startCol: range.anchorCol,
    endCol: range.anchorCol + range.colSpan - 1,
  };
}

export function rangeToMergedRange(range: INormalizedRange): IMergedRange {
  return {
    anchorRow: range.startRow,
    anchorCol: range.startCol,
    rowSpan: range.endRow - range.startRow + 1,
    colSpan: range.endCol - range.startCol + 1,
  };
}

export function isValidMergeRange(range: INormalizedRange): boolean {
  return range.endRow > range.startRow || range.endCol > range.startCol;
}

export function rangesOverlap(
  a: INormalizedRange,
  b: INormalizedRange,
): boolean {
  return !(
    a.endRow < b.startRow ||
    a.startRow > b.endRow ||
    a.endCol < b.startCol ||
    a.startCol > b.endCol
  );
}

export function isRangeFullyInside(
  inner: INormalizedRange,
  outer: INormalizedRange,
): boolean {
  return (
    inner.startRow >= outer.startRow &&
    inner.endRow <= outer.endRow &&
    inner.startCol >= outer.startCol &&
    inner.endCol <= outer.endCol
  );
}

export function rangesEqual(a: INormalizedRange, b: INormalizedRange): boolean {
  return (
    a.startRow === b.startRow &&
    a.endRow === b.endRow &&
    a.startCol === b.startCol &&
    a.endCol === b.endCol
  );
}

export function isCellInRange(
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

export function getRoleInMerge(
  row: number,
  col: number,
  merge: IMergedRange,
): TMergeCellRole {
  const bounds = mergedRangeToBounds(merge);
  if (!isCellInRange(row, col, bounds)) return "none";
  if (row === merge.anchorRow && col === merge.anchorCol) return "anchor";
  return "covered";
}

export function expandRangeWithMerges(
  range: INormalizedRange,
  merges: readonly IMergedRange[],
): INormalizedRange {
  let expanded = { ...range };
  let changed = true;

  while (changed) {
    changed = false;
    for (const merge of merges) {
      const bounds = mergedRangeToBounds(merge);
      if (!rangesOverlap(expanded, bounds)) continue;
      if (isRangeFullyInside(bounds, expanded)) continue;

      const next = {
        startRow: Math.min(expanded.startRow, bounds.startRow),
        endRow: Math.max(expanded.endRow, bounds.endRow),
        startCol: Math.min(expanded.startCol, bounds.startCol),
        endCol: Math.max(expanded.endCol, bounds.endCol),
      };

      if (!rangesEqual(next, expanded)) {
        expanded = next;
        changed = true;
      }
    }
  }

  return expanded;
}

export function rangePartiallyOverlapsMerge(
  range: INormalizedRange,
  merges: readonly IMergedRange[],
): boolean {
  for (const merge of merges) {
    const bounds = mergedRangeToBounds(merge);
    if (!rangesOverlap(range, bounds)) continue;
    if (isRangeFullyInside(bounds, range) || isRangeFullyInside(range, bounds)) {
      continue;
    }
    return true;
  }
  return false;
}

export function rangeIntersectsAnyMerge(
  range: INormalizedRange,
  merges: readonly IMergedRange[],
): boolean {
  for (const merge of merges) {
    if (rangesOverlap(range, mergedRangeToBounds(merge))) {
      return true;
    }
  }
  return false;
}

export function selectionFromExpandedRange(
  expanded: INormalizedRange,
  original: { anchor: ICellAddress; focus: ICellAddress },
): { anchor: ICellAddress; focus: ICellAddress } {
  const anchorInExpanded = isCellInRange(
    original.anchor.row,
    original.anchor.col,
    expanded,
  );
  const focusInExpanded = isCellInRange(
    original.focus.row,
    original.focus.col,
    expanded,
  );

  return {
    anchor: anchorInExpanded
      ? original.anchor
      : { row: expanded.startRow, col: expanded.startCol },
    focus: focusInExpanded
      ? original.focus
      : { row: expanded.endRow, col: expanded.endCol },
  };
}

export function resolveCellForInteraction(
  row: number,
  col: number,
  resolveAnchor: (row: number, col: number) => ICellAddress,
): ICellAddress {
  return resolveAnchor(row, col);
}
