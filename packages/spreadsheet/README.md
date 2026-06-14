# @wms/spreadsheet

Thư viện Spreadsheet React — virtual window, API imperative qua ref.

Xem [README gốc](../../README.md) để biết hướng dẫn đầy đủ.

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
├── Spreadsheet.tsx          # forwardRef, expose ISpreadsheetRef
├── store/CellStore.ts       # Data layer ngoài React
├── hooks/
│   ├── useCellValue.ts      # useSyncExternalStore per cell
│   ├── useVirtualWindow.ts  # Virtual window + rAF scroll
│   └── useKeyboardNavigation.ts
├── components/
│   ├── SpreadsheetGrid/     # 4-pane layout
│   ├── SpreadsheetCell/
│   ├── ColumnHeaderRow/
│   ├── RowHeaderColumn/
│   ├── CornerCell/
│   └── CellEditor/
├── utils/
│   ├── cellKey.ts
│   ├── columnLabel.ts
│   └── computeVisibleRange.ts
└── styles/spreadsheet.module.scss
```
