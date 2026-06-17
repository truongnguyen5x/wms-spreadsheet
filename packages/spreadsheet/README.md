# @wms/spreadsheet

Thư viện Spreadsheet React — virtual window, API imperative qua ref.

Xem [README gốc](../../README.md) để biết hướng dẫn đầy đủ (API, cell types, filter, clipboard, merge, locale, v.v.).

## Tính năng chính

- Virtual window 2 chiều — render mượt 10.000+ dòng
- API imperative qua `ref` — `setCellValue`, `loadData`, `mergeCells`, …
- Cell types: `text`, `select`, `multiSelect`, `boolean`, `switch`, `date`, `custom`
- Filter & sort cột, frozen columns, copy/paste range
- **Merge cells** — `mergeCells()` / `unmergeCells()` qua ref
- **Đa ngôn ngữ** — prop `locale` (partial override)
- **Xử lý lỗi** — callback `onError` với `TSpreadsheetErrorCode`

## Cài đặt (trong monorepo)

```json
{
  "dependencies": {
    "@wms/spreadsheet": "workspace:*"
  }
}
```

## Import nhanh

```tsx
import { Spreadsheet, type ISpreadsheetRef } from "@wms/spreadsheet";
import "@wms/spreadsheet/style.css";
```

## Export chính

```typescript
// Component & ref
export { Spreadsheet };

// Types
export type {
  ISpreadsheetProps,
  ISpreadsheetRef,
  ISpreadsheetColumn,
  ISpreadsheetLocale,
  ISpreadsheetError,
  IMergedRange,
  INormalizedRange,
  ICellMeta,
  ICustomCellDefinition,
  TSpreadsheetErrorCode,
  TCellValue,
  TSheetDataInput,
  TSheetDataOutput,
  DeepPartial,
};

// Stores & utils
export {
  CellStore,
  MetaStore,
  MergeStore,
  cellKey,
  columnLabel,
  DEFAULT_SPREADSHEET_LOCALE,
  resolveSpreadsheetLocale,
  DEFAULT_DATE_FORMAT,
  DEFAULT_ROW_HEIGHT,
  DEFAULT_COLUMN_WIDTH,
  COLUMN_HEADER_HEIGHT,
  ROW_HEADER_WIDTH,
  FILTER_BLANK_VALUE,
};
```

## Peer dependencies

- `react` ^18 || ^19
- `react-dom` ^18 || ^19

## Build

```bash
npx vite build
```

## Cấu trúc source

```
src/
├── Spreadsheet.tsx              # forwardRef, expose ISpreadsheetRef
├── context/
│   └── SpreadsheetLocaleContext.tsx
├── locale/
│   ├── defaultLocale.ts         # DEFAULT_SPREADSHEET_LOCALE
│   └── resolveSpreadsheetLocale.ts
├── store/
│   ├── CellStore.ts             # Data layer (values) ngoài React
│   ├── MetaStore.ts             # Meta layer (type, disabled, …)
│   └── MergeStore.ts            # Merge ranges layer
├── hooks/
│   ├── useCellValue.ts          # useSyncExternalStore per cell
│   ├── useCellMeta.ts
│   ├── useVirtualWindow.ts      # Virtual window + rAF scroll
│   ├── useKeyboardNavigation.ts
│   ├── useRangeSelection.ts
│   ├── useClipboard.ts
│   ├── useHeaderResize.ts
│   ├── useGridDimensions.ts
│   └── useMergeRevision.ts
├── components/
│   ├── SpreadsheetGrid/         # 4-pane layout + frozen pane
│   ├── SpreadsheetCell/
│   ├── ColumnHeaderRow/
│   ├── RowHeaderColumn/
│   ├── CornerCell/
│   ├── CellEditor/
│   ├── SelectionOverlay/
│   ├── ClipboardOverlay/
│   ├── ColumnFilter/
│   ├── FrozenColumnPane/
│   └── SwitchCell/
├── utils/
│   ├── cellKey.ts
│   ├── columnLabel.ts
│   ├── computeVisibleRange.ts
│   ├── dataAdapter.ts
│   ├── clipboard.ts
│   ├── columnFilter.ts
│   ├── rowSort.ts
│   ├── visibleRowLayout.ts
│   ├── resolveCellMeta.ts
│   ├── mergeCell.ts
│   └── dateUtils.ts
└── styles/spreadsheet.module.scss
```
