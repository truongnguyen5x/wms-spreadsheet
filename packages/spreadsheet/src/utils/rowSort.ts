import type { CellStore } from "../store/CellStore";
import type { TSortDirection } from "../types";

function isBlank(value: string): boolean {
  return value.trim() === "";
}

function parseNumberOrNull(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function compareCellValue(left: string, right: string): number {
  const leftNumber = parseNumberOrNull(left);
  const rightNumber = parseNumberOrNull(right);
  if (leftNumber !== null && rightNumber !== null) {
    return leftNumber - rightNumber;
  }
  return left.localeCompare(right, undefined, { sensitivity: "base" });
}

export function sortDisplayRowOrder(
  store: CellStore,
  col: number,
  direction: TSortDirection,
  displayRowOrder: readonly number[],
): number[] {
  const dataRows: number[] = [];
  const blankRows: number[] = [];

  for (const row of displayRowOrder) {
    if (isBlank(store.getValue(row, col))) {
      blankRows.push(row);
    } else {
      dataRows.push(row);
    }
  }

  const sortedDataRows = [...dataRows];
  sortedDataRows.sort((leftRow, rightRow) => {
    const compared = compareCellValue(
      store.getValue(leftRow, col),
      store.getValue(rightRow, col),
    );
    if (compared !== 0) {
      return direction === "asc" ? compared : -compared;
    }
    return leftRow - rightRow;
  });

  return [...sortedDataRows, ...blankRows];
}
