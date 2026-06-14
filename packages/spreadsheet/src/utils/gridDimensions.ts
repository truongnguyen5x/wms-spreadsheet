export function getOffsetAtIndex(
  sizes: readonly number[],
  index: number,
): number {
  let offset = 0;
  for (let i = 0; i < index; i++) {
    offset += sizes[i] ?? 0;
  }
  return offset;
}

export function getTotalSize(sizes: readonly number[]): number {
  return sizes.reduce((sum, size) => sum + size, 0);
}

export function sumSizes(
  sizes: readonly number[],
  start: number,
  end: number,
): number {
  let sum = 0;
  for (let i = start; i <= end; i++) {
    sum += sizes[i] ?? 0;
  }
  return sum;
}

export function findIndexAtOffset(
  sizes: readonly number[],
  offset: number,
): number {
  if (sizes.length === 0) return 0;
  let accumulated = 0;
  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i];
    if (offset < accumulated + size) {
      return i;
    }
    accumulated += size;
  }

  return sizes.length - 1;
}

export function computeRangeBounds(
  sizes: readonly number[],
  start: number,
  end: number,
): { offset: number; size: number } {
  return {
    offset: getOffsetAtIndex(sizes, start),
    size: sumSizes(sizes, start, end),
  };
}

export function resizeArray(
  current: readonly number[],
  count: number,
  defaultSize: number,
): number[] {
  const next = current.slice(0, count);
  while (next.length < count) {
    next.push(defaultSize);
  }
  return next;
}

