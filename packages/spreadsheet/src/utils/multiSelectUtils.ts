import type { ISelectOption } from "../types";

export function parseMultiSelectValue(raw: string): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

export function serializeMultiSelectValue(ids: string[]): string {
  if (!ids.length) return "";
  return JSON.stringify(ids);
}

export function formatMultiSelectLabels(
  options: ISelectOption[] | undefined,
  ids: string[],
): string {
  if (!ids.length) return "";
  return ids
    .map((id) => {
      const option = options?.find((item) => item.id === id);
      return option?.label ?? id;
    })
    .join(", ");
}

export interface IResolvedMultiSelectOption {
  id: string;
  label: string;
  color?: string;
}

export function resolveMultiSelectOptions(
  options: ISelectOption[] | undefined,
  ids: string[],
): IResolvedMultiSelectOption[] {
  if (!ids.length) return [];
  const orderedFromOptions =
    options
      ?.filter((option) => ids.includes(option.id))
      .map((option) => ({
        id: option.id,
        label: option.label,
        color: option.color,
      })) ?? [];
  const knownIds = new Set(orderedFromOptions.map((item) => item.id));
  const unknownItems = ids
    .filter((id) => !knownIds.has(id))
    .map((id) => ({ id, label: id }));
  return [...orderedFromOptions, ...unknownItems];
}

export const DEFAULT_MULTI_SELECT_CHIP_COLOR = "#e8eaed";
