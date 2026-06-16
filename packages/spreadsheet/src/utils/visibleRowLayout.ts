import { findIndexAtOffset } from "./gridDimensions";

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
