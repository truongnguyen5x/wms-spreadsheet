# wms-spreadsheet

React Spreadsheet library — Google Sheets-like UI, smoothly handles **10,000+ rows** via a virtual window.

## Install

```bash
npm install wms-spreadsheet
# or
pnpm add wms-spreadsheet
```

**Peer dependencies:** `react` and `react-dom` (^18 or ^19).

## Quick start

```tsx
import { useRef } from "react";
import {
  Spreadsheet,
  type ISpreadsheetColumn,
  type ISpreadsheetRef,
} from "wms-spreadsheet";
import "wms-spreadsheet/style.css";

const COLUMNS: ISpreadsheetColumn[] = [
  { colName: "sku", colText: "SKU", width: 120, showFilter: true },
  { colName: "qty", colText: "Qty", width: 80 },
  { colName: "active", colText: "Active", width: 90, meta: { type: "switch" } },
];

const INITIAL_DATA = [
  { sku: "A001", qty: "10", active: "true" },
  { sku: "A002", qty: "5", active: "false" },
];

function App() {
  const sheetRef = useRef<ISpreadsheetRef>(null);

  return (
    <div style={{ width: "100%", height: "600px" }}>
      <Spreadsheet
        ref={sheetRef}
        columns={COLUMNS}
        initialData={INITIAL_DATA}
        rowCount={1000}
      />
    </div>
  );
}
```

## Features

- Two-dimensional virtual window — only renders cells in the viewport
- Imperative API via `ref` — `setCellValue`, `loadData`, `mergeCells`, …
- Cell types: `text`, `select`, `multiSelect`, `boolean`, `switch`, `date`, `custom`
- Copy/paste range (Ctrl+C / Ctrl+V), column filter & sort, frozen columns
- Merge cells, column/row resize, internationalization (`locale` prop)

## Full documentation

See the [README on GitHub](https://github.com/truongnguyen5x/wms-spreadsheet#readme) for ref API, cell meta, custom cells, locale, error handling, and more.

## License

MIT
