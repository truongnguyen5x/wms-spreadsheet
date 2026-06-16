# WMS Spreadsheet

Thư viện Spreadsheet cho React — giao diện giống Google Sheets, hỗ trợ **10.000+ dòng** mượt mà nhờ virtual window tự xây.

## Tính năng

- Virtual window 2 chiều — chỉ render cell trong viewport (~600 cell thay vì hàng trăm nghìn)
- **API imperative qua `ref`** — set/get cell mà không re-render parent hay cả bảng
- `CellStore` + `MetaStore` ngoài React tree — mỗi cell subscribe riêng qua `useSyncExternalStore`
- Zero UI dependency — không MUI, không react-virtual
- **Định nghĩa cột** (`columns`) — `colName`, width, meta mặc định, căn lề, custom render/editor
- **Cell types** — `text`, `select`, `multiSelect`, `boolean`, `switch`, `date`, `custom` (qua `customCellRegistry`)
- **Cell meta** — `disabled`, `invalid`, override meta theo cell/cột
- **Copy/paste range** — Ctrl+C / Ctrl+V (Cmd trên macOS), định dạng TSV; clipboard nội bộ fallback khi system clipboard không khả dụng
- **Range selection** — kéo cell, kéo header cột/hàng; Delete/Backspace xóa cả range
- **Filter & sort cột** — UI popup trên header (`showFilter: true`); state nội bộ, chưa expose qua ref
- **Frozen columns** — `frozenColumnCount`
- **Resize** — kéo viền header cột/hàng; callback `onColumnResize` / `onRowResize`
- Keyboard navigation: Arrow, Tab, Shift+Tab, Enter, Escape, F2, Delete, Backspace, Ctrl+C/V
- **Filter-aware ops** — copy/paste/delete chỉ thao tác trên **visible rows** khi đang filter

## Cấu trúc monorepo

```
wms-sheets/
├── packages/spreadsheet/   # @wms/spreadsheet — thư viện chính
└── apps/demo/              # App demo 20.000 rows × 26 cols
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
  type ISpreadsheetColumn,
  type ISpreadsheetRef,
} from "@wms/spreadsheet";
import "@wms/spreadsheet/style.css";
```

### Ví dụ với columns (khuyến nghị)

```tsx
const COLUMNS: ISpreadsheetColumn[] = [
  { colName: "sku", colText: "Mã SKU", width: 120, showFilter: true },
  { colName: "qty", colText: "SL", width: 80, meta: { type: "text" } },
  {
    colName: "active",
    colText: "Kích hoạt",
    width: 90,
    meta: { type: "switch" },
    horizontalAlign: "center",
  },
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
        rowCount={10000}
        columnCount={8}
        columns={COLUMNS}
        frozenColumnCount={1}
        initialData={INITIAL_DATA}
        onChange={(changes) => {
          console.log("User changes:", changes);
        }}
      />
    </div>
  );
}
```

### Ví dụ sparse (không có columns)

```tsx
function SimpleSheet() {
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
          onChange={(changes) => console.log(changes)}
        />
      </div>
    </>
  );
}
```

### Dùng `colName` qua ref

```tsx
// col có thể null khi truyền colName (cần prop columns)
sheetRef.current?.setCellValue(0, null, "99", "qty");
sheetRef.current?.setCellMeta(1, null, { disabled: true }, "sku");
```

---

## API

### `ISpreadsheetProps`

| Prop | Kiểu | Mặc định | Mô tả |
|------|------|----------|-------|
| `rowCount` | `number` | — | Số hàng (bắt buộc) |
| `columnCount` | `number` | — | Số cột (bắt buộc) |
| `columns` | `ISpreadsheetColumn[]` | — | Định nghĩa cột (width, meta, filter, render) |
| `rowHeight` | `number` | `28` | Chiều cao mỗi hàng (px) |
| `columnWidth` | `number` | `100` | Chiều rộng mỗi cột mặc định (px) |
| `overscan` | `number` | `3` | Số hàng/cột buffer ngoài viewport |
| `className` | `string` | — | Class CSS cho wrapper |
| `initialData` | `TSheetDataInput` | — | Dữ liệu ban đầu (load 1 lần lúc mount) |
| `onChange` | `(changes: ICellInput[]) => void` | — | Callback khi **user** thao tác (edit, paste, delete, toggle) |
| `onColumnResize` | `(col, width) => void` | — | Sau khi user resize cột |
| `onRowResize` | `(row, height) => void` | — | Sau khi user resize hàng |
| `frozenColumnCount` | `number` | `0` | Số cột cố định từ trái (ví dụ `2` → cột A, B) |
| `customCellRegistry` | `Record<string, ICustomCellDefinition>` | — | Registry render/editor cho `meta.customKey` |

> **Lưu ý:** `onChange` nhận mảng `{ row, col?, colName?, value }` và **không** fire khi gọi `ref.setCellValue`, `ref.setCellValues`, `ref.loadData`. Không có prop `data` controlled — tránh re-render toàn bảng.

### `ISpreadsheetRef`

| Method | Mô tả |
|--------|-------|
| `setCellValue(row, col, value, colName?)` | Set 1 cell — `col` có thể `null` nếu dùng `colName` |
| `getCellValue(row, col, colName?)` | Đọc giá trị 1 cell |
| `setCellValues(cells)` | Set hàng loạt — chỉ cell thay đổi re-render |
| `loadData(data)` | Bulk load / thay thế data; reset filter & sort |
| `getData()` | Export toàn bộ data (format phụ thuộc có `columns` hay không) |
| `getRowData(row)` | Export 1 dòng (cùng format với `getData()`) |
| `getActiveCell()` | Lấy cell focus (điểm cuối selection) |
| `setActiveCell({ row, col })` | Chọn 1 cell (collapse range) |
| `getSelection()` | Lấy `{ anchor, focus }` |
| `setSelection({ anchor, focus })` | Set range selection |
| `setCellMeta(row, col, meta, colName?)` | Set meta cell — merge với column meta |
| `getCellMeta(row, col, colName?)` | Đọc meta đã merge (column + cell) |
| `setCellsMeta(cells)` | Set meta hàng loạt |

### `ISpreadsheetColumn`

| Field | Kiểu | Mô tả |
|-------|------|-------|
| `colName` | `string` | Key trong object data và API `colName` (bắt buộc) |
| `width` | `number` | Chiều rộng cột (px) |
| `colText` | `string` | Text header; mặc định `colName` |
| `colRender` | `(params) => ReactNode` | Custom render header; ưu tiên hơn `colText` |
| `showFilter` | `boolean` | Hiển thị icon/filter popup ở header |
| `meta` | `Partial<ICellMeta>` | Meta mặc định cho toàn cột |
| `horizontalAlign` | `"left" \| "center" \| "right"` | Căn ngang body cell (mặc định `"left"`) |
| `verticalAlign` | `"top" \| "middle" \| "bottom"` | Căn dọc body cell (mặc định `"top"`) |
| `cellRender` | `(params) => ReactNode` | Override render body cell |
| `cellEditor` | `(params) => ReactNode` | Override editor cell |

### Cell types

| Type | Cách edit | Ghi chú |
|------|-----------|---------|
| `text` | Double-click / F2 / gõ ký tự | Mặc định |
| `select` | Popup chọn | `options: ISelectOption[]` |
| `multiSelect` | Popup chọn nhiều | `options: ISelectOption[]` (hỗ trợ `color`); giá trị `string[]` (id); view hiển thị nhiều pill màu |
| `boolean` | Click toggle | Không vào edit mode |
| `switch` | Click toggle | Giá trị `"true"` / `"false"` |
| `date` | Date picker | `dateFormat`, `minDate`, `maxDate` |
| `custom` | Theo `customCellRegistry` | `customKey` trong meta |

Cell `disabled` không cho edit/paste; `invalid` hiển thị trạng thái lỗi.

### Định dạng dữ liệu

**Input (`initialData` / `loadData`)** — `TSheetDataInput`:

| Format | Ví dụ | Ghi chú |
|--------|-------|---------|
| Sparse | `{ "0:0": "A1", "14:2": "Hello" }` | Key `"row:col"` (zero-based) |
| 2D array | `[["A1", "B1"], ["A2", "B2"]]` | |
| Object array | `[{ sku: "A001", qty: "10" }]` | **Bắt buộc** có prop `columns` |

**Output (`getData` / `getRowData`)**:

| Có `columns` | `getData()` | `getRowData(row)` |
|--------------|-------------|-------------------|
| Không | `ISheetData` sparse | Sparse keys của dòng đó |
| Có | `Record<string, string>[]` (chỉ dòng có data) | `Record<string, string>` |

`ICellInput` và `ICellMetaInput` hỗ trợ chỉ định cột bằng `col` (index) hoặc `colName`.

```typescript
type ISheetData = Record<string, string>;

// Ví dụ sparse: cell C15 (row=14, col=2)
const data: ISheetData = { "14:2": "Hello", "0:0": "A1" };
```

---

## Filter & sort

- Bật bằng `showFilter: true` trên `ISpreadsheetColumn`
- Popup filter hỗ trợ sort asc/desc, điều kiện lọc (`isEqualTo`, `contains`, `isEmpty`, …) và checkbox chọn giá trị
- Khi filter active: thứ tự hiển thị hàng thay đổi; copy/paste/delete map theo **visible rows** (không ảnh hưởng row bị ẩn)
- Filter/sort state **chưa expose** qua ref — reset khi `loadData()` hoặc đổi `rowCount`

---

## Phím tắt

| Phím | Hành động |
|------|-----------|
| Click | Chọn 1 cell |
| Giữ chuột + kéo (body) | Chọn cell range |
| Giữ chuột + kéo (header cột) | Chọn cả cột |
| Giữ chuột + kéo (header hàng) | Chọn cả hàng |
| Double-click / Enter / F2 | Bắt đầu edit (nếu cell editable) |
| Gõ ký tự | Edit (thay thế nội dung); không áp cell `date` |
| Arrow keys | Di chuyển (collapse range về 1 cell) |
| Tab / Shift+Tab | Di chuyển sang phải / trái |
| Enter (khi edit) | Commit + xuống cell dưới |
| Tab (khi edit) | Commit + sang cell phải |
| Ctrl+C / Cmd+C | Copy range (ghi TSV ra clipboard) |
| Ctrl+V / Cmd+V | Paste tại focus cell |
| Delete / Backspace | Xóa nội dung cell hoặc cả range |
| Escape | Hủy edit |
| Kéo viền header | Resize cột / hàng |

> **Chưa hỗ trợ:** Shift+Click, Shift+Arrow mở rộng range.

---

## Hiệu năng — phạm vi re-render

| Hành động | Parent | Spreadsheet | Cell |
|-----------|--------|-------------|------|
| `ref.setCellValue(r,c,v)` | Không | Không | Chỉ cell (r,c) nếu visible |
| `ref.setCellValues([...])` | Không | Không | Chỉ cell thay đổi |
| `ref.setCellMeta` / `setCellsMeta` | Không | Không | Chỉ cell meta thay đổi |
| User scroll | Không | Grid (virtual range) | Mount/unmount visible |
| User kéo range | Không | Có (selection state) | Không (overlay 1 DOM) |
| Copy range | Không | Có (clipboard overlay) | Không |
| Paste range | Không | Không | Chỉ cell được ghi |
| Delete range | Không | Không | Chỉ cell có data trong range |
| User edit cell | Không | Không | Cell được edit sau commit |
| Filter / sort | Không | Có (display row order) | Re-mount theo visible rows |

---

## Kiến trúc

```
App (ref)
  ↓
CellStore (values) + MetaStore (meta)
  ↓ notify theo key "row:col"
SpreadsheetCell (useSyncExternalStore)
  ↑
SpreadsheetGrid (useVirtualWindow + frozen pane)
  ↑ overlays: SelectionOverlay, ClipboardOverlay
```

### Virtual window

- `computeVisibleRange` — tính hàng/cột visible từ scroll position
- `useVirtualWindow` — rAF batch scroll, ResizeObserver cho viewport
- Layout 4 pane: corner, column header, row header, body (headers sync qua CSS transform)
- `FrozenColumnPane` — cột cố định tách pane scrollable

### Hooks & utils chính

- `useClipboard` — copy/paste TSV, clipboard nội bộ
- `useRangeSelection` — cell / column / row selection
- `useKeyboardNavigation` — phím tắt
- `useHeaderResize` — resize cột/hàng
- `columnFilter` / `rowSort` — filter & sort UI
- `visibleRowLayout` — map selection/clipboard theo visible rows khi filter

---

## Phạm vi v1 (chưa hỗ trợ)

- Công thức / formula bar
- Merge cells
- Drag fill handle
- Shift+Click / Shift+Arrow mở rộng range
- Controlled `data` prop
- Expose filter/sort state qua ref API

---

## Export khác

```typescript
import {
  CellStore,
  MetaStore,
  cellKey,
  columnLabel,
  DEFAULT_ROW_HEIGHT,
  DEFAULT_COLUMN_WIDTH,
  FILTER_BLANK_VALUE,
} from "@wms/spreadsheet";

cellKey(14, 2);    // "14:2"
columnLabel(2);    // "C"
```

## License

Private — WMS internal use.
