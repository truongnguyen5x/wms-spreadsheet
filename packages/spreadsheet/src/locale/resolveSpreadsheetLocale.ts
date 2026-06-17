import type { DeepPartial, ISpreadsheetLocale } from "../types";
import { DEFAULT_SPREADSHEET_LOCALE } from "./defaultLocale";

export function resolveSpreadsheetLocale(
  partial?: DeepPartial<ISpreadsheetLocale>,
): ISpreadsheetLocale {
  if (!partial) {
    return DEFAULT_SPREADSHEET_LOCALE;
  }

  return {
    errors: { ...DEFAULT_SPREADSHEET_LOCALE.errors, ...partial.errors },
    filter: {
      ...DEFAULT_SPREADSHEET_LOCALE.filter,
      ...partial.filter,
      conditions: {
        ...DEFAULT_SPREADSHEET_LOCALE.filter.conditions,
        ...partial.filter?.conditions,
      },
    },
    datepicker: {
      ...DEFAULT_SPREADSHEET_LOCALE.datepicker,
      ...partial.datepicker,
      monthNames:
        partial.datepicker?.monthNames &&
        partial.datepicker.monthNames.length === 12
          ? (partial.datepicker.monthNames as readonly string[])
          : DEFAULT_SPREADSHEET_LOCALE.datepicker.monthNames,
      weekdayLabels:
        partial.datepicker?.weekdayLabels &&
        partial.datepicker.weekdayLabels.length === 7
          ? (partial.datepicker.weekdayLabels as readonly string[])
          : DEFAULT_SPREADSHEET_LOCALE.datepicker.weekdayLabels,
    },
  };
}
