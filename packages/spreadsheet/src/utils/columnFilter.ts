import type { CellStore } from "../store/CellStore";
import type {
  IColumnFilterState,
  ISpreadsheetColumn,
  TFilterCondition,
} from "../types";
import { FILTER_BLANK_VALUE } from "../types";

function normalizeValue(value: string): string {
  return value.trim().toLowerCase();
}

function isBlankValue(value: string): boolean {
  return value.trim() === "";
}

function compareStringAsc(left: string, right: string): number {
  return left.localeCompare(right, undefined, { sensitivity: "base" });
}

export function getColumnUniqueValues(
  store: CellStore,
  col: number,
  rowCount: number,
): string[] {
  const values = new Set<string>();
  for (let row = 0; row < rowCount; row++) {
    const value = store.getValue(row, col);
    if (isBlankValue(value)) continue;
    values.add(value);
  }
  return Array.from(values).sort(compareStringAsc);
}

export function hasBlankCells(
  store: CellStore,
  col: number,
  rowCount: number,
): boolean {
  for (let row = 0; row < rowCount; row++) {
    if (isBlankValue(store.getValue(row, col))) return true;
  }
  return false;
}

export function isConditionWithInput(condition: TFilterCondition): boolean {
  return (
    condition === "isEqualTo" ||
    condition === "isNotEqualTo" ||
    condition === "beginsWith" ||
    condition === "endsWith" ||
    condition === "contains" ||
    condition === "doesNotContain"
  );
}

export function matchesCondition(
  value: string,
  condition: TFilterCondition,
  conditionValue?: string,
): boolean {
  const normalizedValue = normalizeValue(value);
  const normalizedCondition = normalizeValue(conditionValue ?? "");

  switch (condition) {
    case "none":
      return true;
    case "isEmpty":
      return isBlankValue(value);
    case "isNotEmpty":
      return !isBlankValue(value);
    case "isEqualTo":
      return normalizedValue === normalizedCondition;
    case "isNotEqualTo":
      return normalizedValue !== normalizedCondition;
    case "beginsWith":
      return normalizedValue.startsWith(normalizedCondition);
    case "endsWith":
      return normalizedValue.endsWith(normalizedCondition);
    case "contains":
      return normalizedValue.includes(normalizedCondition);
    case "doesNotContain":
      return !normalizedValue.includes(normalizedCondition);
    default:
      return true;
  }
}

export function isColumnFilterActive(filter: IColumnFilterState): boolean {
  return filter.condition !== "none" || filter.selectedValues !== null;
}

export function createDefaultColumnFilterState(): IColumnFilterState {
  return {
    condition: "none",
    selectedValues: null,
  };
}

export function rowPassesFilter(
  store: CellStore,
  row: number,
  col: number,
  filter: IColumnFilterState,
): boolean {
  const cellValue = store.getValue(row, col);
  if (!matchesCondition(cellValue, filter.condition, filter.conditionValue)) {
    return false;
  }
  if (filter.selectedValues === null) {
    return true;
  }
  const valueKey = isBlankValue(cellValue) ? FILTER_BLANK_VALUE : cellValue;
  return filter.selectedValues.includes(valueKey);
}

export function computeVisibleRowIndices(
  store: CellStore,
  rowCount: number,
  columns: ISpreadsheetColumn[] | undefined,
  columnFilters: ReadonlyMap<number, IColumnFilterState>,
): number[] {
  const filterEntries = Array.from(columnFilters.entries()).filter(
    ([col, filter]) => {
      const column = columns?.[col];
      if (!column?.showFilter) return false;
      return isColumnFilterActive(filter);
    },
  );
  if (filterEntries.length === 0) {
    return Array.from({ length: rowCount }, (_, index) => index);
  }

  const visibleRows: number[] = [];
  for (let row = 0; row < rowCount; row++) {
    let passesAll = true;
    for (const [col, filter] of filterEntries) {
      if (!rowPassesFilter(store, row, col, filter)) {
        passesAll = false;
        break;
      }
    }
    if (passesAll) {
      visibleRows.push(row);
    }
  }
  return visibleRows;
}
