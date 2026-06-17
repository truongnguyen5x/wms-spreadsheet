# wms-spreadsheet

Thư viện Spreadsheet cho React — giao diện giống Google Sheets, hỗ trợ **10.000+ dòng** mượt mà nhờ virtual window.

## Cài đặt

```bash
npm install wms-spreadsheet
# hoặc
pnpm add wms-spreadsheet
```

**Peer dependencies:** `react` và `react-dom` (^18 hoặc ^19).

## Sử dụng nhanh

```tsx
import { useRef } from "react";
import {
  Spreadsheet,
  type ISpreadsheetColumn,
  type ISpreadsheetRef,
} from "wms-spreadsheet";
import "wms-spreadsheet/style.css";

const COLUMNS: ISpreadsheetColumn[] = [
  { colName: "sku", colText: "Mã SKU", width: 120, showFilter: true },
  { colName: "qty", colText: "SL", width: 80 },
  { colName: "active", colText: "Kích hoạt", width: 90, meta: { type: "switch" } },
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

## Tính năng

- Virtual window 2 chiều — chỉ render cell trong viewport
- API imperative qua `ref` — `setCellValue`, `loadData`, `mergeCells`, …
- Cell types: `text`, `select`, `multiSelect`, `boolean`, `switch`, `date`, `custom`
- Copy/paste range (Ctrl+C / Ctrl+V), filter & sort cột, frozen columns
- Merge cells, resize cột/hàng, đa ngôn ngữ (`locale` prop)

## Tài liệu đầy đủ

Xem [README trên GitHub](https://github.com/truongnguyen5x/wms-spreadsheet#readme) để biết API ref, cell meta, custom cells, locale, xử lý lỗi, v.v.

## License

MIT
