import { useCallback, useState, type RefObject } from "react";
import type { CellStore } from "../store/CellStore";
import type { MergeStore } from "../store/MergeStore";
import type { MetaStore } from "../store/MetaStore";
import type {
  ICellAddress,
  ICellInput,
  IClipboardData,
  ISpreadsheetColumn,
  ISpreadsheetError,
  ISpreadsheetLocale,
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
  mergeStore: MergeStore;
  columnsRef: RefObject<ISpreadsheetColumn[] | undefined>;
  rowCount: number;
  columnCount: number;
  visibleRowIndicesRef: RefObject<readonly number[]>;
  onChange?: (changes: ICellInput[]) => void;
  onError?: (error: ISpreadsheetError) => void;
  locale: ISpreadsheetLocale;
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
  mergeStore,
  columnsRef,
  rowCount,
  columnCount,
  visibleRowIndicesRef,
  onChange,
  onError,
  locale,
}: IUseClipboardOptions): IUseClipboardResult {
  const [clipboard, setClipboard] = useState<IClipboardData | null>(null);
  const canWriteCell = useCallback(
    (row: number, col: number) => {
      const anchor = mergeStore.resolveAnchor(row, col);
      const meta = resolveCellMeta(
        metaStore,
        anchor.row,
        anchor.col,
        columnsRef.current ?? undefined,
      );
      return !isCellDisabled(meta);
    },
    [metaStore, columnsRef, mergeStore],
  );
  const clearClipboard = useCallback(() => {
    setClipboard(null);
  }, []);
  const handleCopy = useCallback(
    (selection: ISelection) => {
      const range = normalizeSelection(selection);
      if (mergeStore.rangeIntersectsMerge(range)) {
        onError?.({
          code: "MERGE_COPY_NOT_ALLOWED",
          message: locale.errors.copyMergedNotAllowed,
        });
        return;
      }
      const visibleRowIndices = visibleRowIndicesRef.current ?? [];
      const isFiltered = visibleRowIndices.length < rowCount;
      const data = copyRange(
        store,
        range,
        isFiltered ? visibleRowIndices : undefined,
      );
      setClipboard(data);
      const tsv = clipboardToTsv(data);
      void navigator.clipboard?.writeText(tsv).catch(() => {
        // Permission denied or clipboard unavailable — internal clipboard still works
      });
    },
    [store, rowCount, visibleRowIndicesRef, mergeStore, onError, locale],
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

      if (!values || values.length === 0) return;

      const anchor = mergeStore.resolveAnchor(focusCell.row, focusCell.col);
      const pasteRange = {
        startRow: anchor.row,
        endRow: anchor.row + values.length - 1,
        startCol: anchor.col,
        endCol:
          anchor.col +
          Math.max(0, ...values.map((row) => row.length)) -
          1,
      };
      if (mergeStore.rangeIntersectsMerge(pasteRange)) {
        onError?.({
          code: "MERGE_PASTE_NOT_ALLOWED",
          message: locale.errors.pasteMergedNotAllowed,
        });
        return;
      }

      const visibleRowIndices = visibleRowIndicesRef.current ?? [];
      const isFiltered = visibleRowIndices.length < rowCount;
      const changes = pasteAt(
        store,
        values,
        anchor.row,
        anchor.col,
        rowCount,
        columnCount,
        canWriteCell,
        isFiltered ? visibleRowIndices : undefined,
      );
      if (changes.length > 0) {
        onChange?.(changes);
      }
      setClipboard(null);
    },
    [
      clipboard,
      store,
      rowCount,
      columnCount,
      onChange,
      canWriteCell,
      visibleRowIndicesRef,
      mergeStore,
      onError,
      locale,
    ],
  );
  return { clipboard, handleCopy, handlePaste, clearClipboard };
}
