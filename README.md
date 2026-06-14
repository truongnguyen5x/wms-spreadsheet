# WMS Spreadsheet

Thư viện Spreadsheet cho React — giao diện giống Google Sheets, hỗ trợ **10.000+ dòng** mượt mà nhờ virtual window tự xây.

## Tính năng

- Virtual window 2 chiều — chỉ render cell trong viewport (~600 cell thay vì hàng trăm nghìn)
- **API imperative qua `ref`** — set/get cell mà không re-render parent hay cả bảng
- `CellStore` ngoài React tree — mỗi cell subscribe riêng qua `useSyncExternalStore`
- Nhập text (không hỗ trợ công thức)
- Zero UI dependency — không MUI, không react-virtual
- Keyboard navigation: Arrow, Tab, Enter, Escape, F2

## Cấu trúc monorepo

```
wms-sheets/
├── packages/spreadsheet/   # @wms/spreadsheet — thư viện chính
└── apps/demo/              # App demo 10.000 rows × 26 cols
```

## Cài đặt

```bash
pnpm install
```

## Chạy demo

```bash
pnpm dev
# hoặc
cd apps/demo && npx vite
```

Mở http://localhost:5173

## Build thư viện

```bash
pnpm build
# hoặc
cd packages/spreadsheet && npx vite build
```

Output: `dist/index.js`, `dist/spreadsheet.css`, `dist/index.d.ts`

---

## Sử dụng

### Import

```tsx
import { useRef } from "react";
import {
  Spreadsheet,
  type ISpreadsheetRef,
} from "@wms/spreadsheet";
import "@wms/spreadsheet/style.css";
```

### Ví dụ cơ bản

```tsx
function App() {
  const sheetRef = useRef<ISpreadsheetRef>(null);

  const fillRow = () => {
    // Parent KHÔNG re-render — chỉ các cell thay đổi cập nhật
    sheetRef.current?.setCellValues(
      Array.from({ length: 26 }, (_, col) => ({
        row: 0,
        col,
        value: `Col ${col}`,
      })),
    );
  };

  return (
    <>
      <button onClick={fillRow}>Fill row 1</button>
      <div style={{ width: "100%", height: "600px" }}>
        <Spreadsheet
          ref={sheetRef}
          rowCount={10000}
          columnCount={26}
          onCellChange={(row, col, value) => {
            console.log("User edited:", row, col, value);
          }}
        />
      </div>
    </>
  );
}
```

---

## API

### `ISpreadsheetProps`

| Prop | Kiểu | Mặc định | Mô tả |
|------|------|----------|-------|
| `rowCount` | `number` | — | Số hàng (bắt buộc) |
| `columnCount` | `number` | — | Số cột (bắt buộc) |
| `rowHeight` | `number` | `28` | Chiều cao mỗi hàng (px) |
| `columnWidth` | `number` | `100` | Chiều rộng mỗi cột (px) |
| `overscan` | `number` | `3` | Số hàng/cột buffer ngoài viewport |
| `className` | `string` | — | Class CSS cho wrapper |
| `initialData` | `ISheetData` | — | Dữ liệu ban đầu (load 1 lần lúc mount) |
| `onCellChange` | `(row, col, value) => void` | — | Callback khi **user** edit cell (không fire khi gọi ref) |

> **Lưu ý:** Không có prop `data` / `onChange` controlled — tránh re-render toàn bảng.

### `ISpreadsheetRef`

| Method | Mô tả |
|--------|-------|
| `setCellValue(row, col, value)` | Set 1 cell — chỉ cell đó re-render |
| `getCellValue(row, col)` | Đọc giá trị 1 cell |
| `setCellValues(cells)` | Set hàng loạt — chỉ cell thay đổi re-render |
| `loadData(data)` | Bulk load / thay thế data |
| `getData()` | Export toàn bộ sparse data |
| `getActiveCell()` | Lấy cell đang được chọn |
| `setActiveCell({ row, col })` | Focus cell |

### Định dạng dữ liệu

Key sparse format: `"row:col"` (zero-based)

```typescript
type ISheetData = Record<string, string>;

// Ví dụ: cell C15 (row=14, col=2)
const data: ISheetData = {
  "14:2": "Hello",
  "0:0": "A1",
};
```

---

## Phím tắt

| Phím | Hành động |
|------|-----------|
| Click | Chọn cell |
| Double-click / Enter / F2 | Bắt đầu edit |
| Gõ ký tự | Edit (thay thế nội dung) |
| Arrow keys | Di chuyển selection |
| Tab | Commit + sang cell phải |
| Enter | Commit + xuống cell dưới |
| Escape | Hủy edit |

---

## Hiệu năng — phạm vi re-render

| Hành động | Parent | Spreadsheet | Cell |
|-----------|--------|-------------|------|
| `ref.setCellValue(r,c,v)` | Không | Không | Chỉ cell (r,c) nếu visible |
| `ref.setCellValues([...])` | Không | Không | Chỉ cell thay đổi |
| User scroll | Không | Grid (virtual range) | Mount/unmount visible |
| Click chọn cell | Không | Có (active state) | Cell cũ + mới |
| User edit cell | Không | Không | Cell được edit sau commit |

---

## Kiến trúc

```
App (ref.setCellValue)
    ↓
CellStore (Map ngoài React)
    ↓ notify theo key "row:col"
SpreadsheetCell (useSyncExternalStore)
    ↑
SpreadsheetGrid (useVirtualWindow — chỉ render visible range)
```

### Virtual window

- `computeVisibleRange` — tính hàng/cột visible từ scroll position
- `useVirtualWindow` — rAF batch scroll, ResizeObserver cho viewport
- Layout 4 pane: corner, column header, row header, body (headers sync qua CSS transform)

---

## Phạm vi v1 (chưa hỗ trợ)

- Công thức / formula bar
- Merge cells, resize row/col
- Copy/paste, multi-select
- Drag fill handle
- Controlled `data` prop

---

## Export khác

```typescript
import {
  CellStore,
  cellKey,
  columnLabel,
  DEFAULT_ROW_HEIGHT,
  DEFAULT_COLUMN_WIDTH,
} from "@wms/spreadsheet";

cellKey(14, 2);    // "14:2"
columnLabel(2);    // "C"
```

## License

Private — WMS internal use.
