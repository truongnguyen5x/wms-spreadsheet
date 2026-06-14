function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function pointerToColumn(
  clientX: number,
  headerPaneEl: HTMLElement,
  scrollLeft: number,
  columnWidth: number,
  columnCount: number,
): number {
  const rect = headerPaneEl.getBoundingClientRect();
  const totalWidth = columnCount * columnWidth;

  const contentX = clamp(
    scrollLeft + (clientX - rect.left),
    0,
    Math.max(0, totalWidth - 1),
  );

  return clamp(Math.floor(contentX / columnWidth), 0, columnCount - 1);
}

export function pointerToRow(
  clientY: number,
  headerPaneEl: HTMLElement,
  scrollTop: number,
  rowHeight: number,
  rowCount: number,
): number {
  const rect = headerPaneEl.getBoundingClientRect();
  const totalHeight = rowCount * rowHeight;

  const contentY = clamp(
    scrollTop + (clientY - rect.top),
    0,
    Math.max(0, totalHeight - 1),
  );

  return clamp(Math.floor(contentY / rowHeight), 0, rowCount - 1);
}
