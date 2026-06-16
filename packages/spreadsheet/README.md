# @wms/spreadsheet

Thư viện Spreadsheet React — virtual window, API imperative qua ref.

Xem [README gốc](../../README.md) để biết hướng dẫn đầy đủ (API, cell types, filter, clipboard, v.v.).

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
├── store/
│   ├── CellStore.ts             # Data layer (values) ngoài React
│   └── MetaStore.ts             # Meta layer (type, disabled, …)
├── hooks/
│   ├── useCellValue.ts          # useSyncExternalStore per cell
│   ├── useCellMeta.ts
│   ├── useVirtualWindow.ts      # Virtual window + rAF scroll
│   ├── useKeyboardNavigation.ts
│   ├── useRangeSelection.ts
│   ├── useClipboard.ts
│   ├── useHeaderResize.ts
│   └── useGridDimensions.ts
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
│   └── resolveCellMeta.ts
└── styles/spreadsheet.module.scss
```
