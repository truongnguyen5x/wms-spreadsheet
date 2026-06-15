import { useCallback, useState, type RefObject } from "react";
import type { CellStore } from "../store/CellStore";
import type { MetaStore } from "../store/MetaStore";
import type {
  ICellAddress,
  ICellInput,
  IClipboardData,
  ISpreadsheetColumn,
  ISelection,
} from "../types";
import {
  clipboardToTsv,
  copyRange,
  pasteAt,
  tsvToMatrix,
} from "../utils/clipboard";
import { normalizeSelection } from "../utils/normalizeRange";
import { isCellDisabled, resolveCellMeta } from "../utils/resolveCellMeta";

export interface IUseClipboardOptions {
  store: CellStore;
  metaStore: MetaStore;
  columnsRef: RefObject<ISpreadsheetColumn[] | undefined>;
  rowCount: number;
  columnCount: number;
  onChange?: (changes: ICellInput[]) => void;
}

export interface IUseClipboardResult {
  clipboard: IClipboardData | null;
  handleCopy: (selection: ISelection) => void;
  handlePaste: (focusCell: ICellAddress) => void;
  clearClipboard: () => void;
}

export function useClipboard({
  store,
  metaStore,
  columnsRef,
  rowCount,
  columnCount,
  onChange,
}: IUseClipboardOptions): IUseClipboardResult {
  const [clipboard, setClipboard] = useState<IClipboardData | null>(null);
  const canWriteCell = useCallback(
    (row: number, col: number) => {
      const meta = resolveCellMeta(
        metaStore,
        row,
        col,
        columnsRef.current ?? undefined,
      );
      return !isCellDisabled(meta);
    },
    [metaStore, columnsRef],
  );
  const clearClipboard = useCallback(() => {
    setClipboard(null);
  }, []);
  const handleCopy = useCallback(
    (selection: ISelection) => {
      const range = normalizeSelection(selection);
      const data = copyRange(store, range);
      setClipboard(data);
      const tsv = clipboardToTsv(data);
      void navigator.clipboard?.writeText(tsv).catch(() => {
        // Permission denied or clipboard unavailable — internal clipboard still works
      });
    },
    [store],
  );
  const handlePaste = useCallback(
    async (focusCell: ICellAddress) => {
      let values: string[][] | null = clipboard?.values ?? null;
      if (!values) {
        try {
          const text = await navigator.clipboard?.readText();
          if (text) {
            values = tsvToMatrix(text);
          }
        } catch {
          // Clipboard read failed
        }
      }

      if (values && values.length > 0) {
        const changes = pasteAt(
          store,
          values,
          focusCell.row,
          focusCell.col,
          rowCount,
          columnCount,
          canWriteCell,
        );
        if (changes.length > 0) {
          onChange?.(changes);
        }
      }
      setClipboard(null);
    },
    [clipboard, store, rowCount, columnCount, onChange, canWriteCell],
  );
  return { clipboard, handleCopy, handlePaste, clearClipboard };
}

