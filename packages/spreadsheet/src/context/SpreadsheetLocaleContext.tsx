import { createContext, useContext, type ReactNode } from "react";
import type { ISpreadsheetLocale } from "../types";
import { DEFAULT_SPREADSHEET_LOCALE } from "../locale/defaultLocale";

const SpreadsheetLocaleContext = createContext<ISpreadsheetLocale>(
  DEFAULT_SPREADSHEET_LOCALE,
);

export interface ISpreadsheetLocaleProviderProps {
  locale: ISpreadsheetLocale;
  children: ReactNode;
}

export function SpreadsheetLocaleProvider({
  locale,
  children,
}: ISpreadsheetLocaleProviderProps) {
  return (
    <SpreadsheetLocaleContext.Provider value={locale}>
      {children}
    </SpreadsheetLocaleContext.Provider>
  );
}

export function useSpreadsheetLocale(): ISpreadsheetLocale {
  return useContext(SpreadsheetLocaleContext);
}
