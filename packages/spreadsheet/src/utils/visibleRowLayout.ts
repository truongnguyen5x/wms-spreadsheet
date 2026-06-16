import type { INormalizedRange } from "../types";
import { findIndexAtOffset, sumSizes } from "./gridDimensions";

export interface IVisibleRowLayout {
  visibleRowIndices: readonly number[];
  visibleCount: number;
  physicalToDisplay: ReadonlyMap<number, number>;
  displayRowHeights: readonly number[];
}

export function buildVisibleRowLayout(
  displayRowOrder: readonly number[],
  visiblePhysicalRows: readonly number[],
  rowHeights: readonly number[],
): IVisibleRowLayout {
  const visibleSet = new Set<number>(visiblePhysicalRows);
  const visibleRowIndices: number[] = [];
  const physicalToDisplay = new Map<number, number>();
  const displayRowHeights: number[] = [];

  for (const physicalRow of displayRowOrder) {
    if (!visibleSet.has(physicalRow)) continue;
    const displayIndex = visibleRowIndices.length;
    visibleRowIndices.push(physicalRow);
    physicalToDisplay.set(physicalRow, displayIndex);
    displayRowHeights.push(rowHeights[physicalRow] ?? 0);
  }

  return {
    visibleRowIndices,
    visibleCount: visibleRowIndices.length,
    physicalToDisplay,
    displayRowHeights,
  };
}

export function getDisplayRowTop(
  layout: IVisibleRowLayout,
  displayIndex: number,
): number {
  let top = 0;
  for (let index = 0; index < displayIndex; index++) {
    top += layout.displayRowHeights[index] ?? 0;
  }
  return top;
}

export function getTotalVisibleHeight(layout: IVisibleRowLayout): number {
  return layout.displayRowHeights.reduce((sum, height) => sum + height, 0);
}

export function findDisplayIndexAtOffset(
  layout: IVisibleRowLayout,
  offset: number,
): number {
  if (layout.displayRowHeights.length === 0) return 0;
  return findIndexAtOffset(layout.displayRowHeights, offset);
}

export function getVisiblePhysicalRowsInRange(
  range: INormalizedRange,
  visibleRowIndices: readonly number[],
): number[] {
  const minRow = Math.min(range.startRow, range.endRow);
  const maxRow = Math.max(range.startRow, range.endRow);
  return visibleRowIndices.filter(
    (physicalRow) => physicalRow >= minRow && physicalRow <= maxRow,
  );
}

export function computeVisiblePhysicalRangeBounds(
  layout: IVisibleRowLayout,
  startPhysical: number,
  endPhysical: number,
): { offset: number; size: number } | null {
  const minPhysical = Math.min(startPhysical, endPhysical);
  const maxPhysical = Math.max(startPhysical, endPhysical);
  let minDisplay = Infinity;
  let maxDisplay = -Infinity;

  for (let displayIndex = 0; displayIndex < layout.visibleRowIndices.length; displayIndex++) {
    const physicalRow = layout.visibleRowIndices[displayIndex];
    if (physicalRow === undefined) continue;
    if (physicalRow < minPhysical || physicalRow > maxPhysical) continue;
    minDisplay = Math.min(minDisplay, displayIndex);
    maxDisplay = Math.max(maxDisplay, displayIndex);
  }

  if (minDisplay === Infinity || maxDisplay < 0) return null;

  return {
    offset: getDisplayRowTop(layout, minDisplay),
    size: sumSizes(layout.displayRowHeights, minDisplay, maxDisplay),
  };
}
