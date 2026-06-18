# WMS Spreadsheet

React Spreadsheet library — Google Sheets-like UI, smoothly handles **10,000+ rows** via a custom virtual window.

## Features

- Two-dimensional virtual window — only renders cells in the viewport (~600 cells instead of hundreds of thousands)
- **Imperative API via `ref`** — set/get cells without re-rendering the parent or the entire grid
- `CellStore` + `MetaStore` + `MergeStore` outside the React tree — each cell subscribes individually via `useSyncExternalStore`
- Zero UI dependency — no MUI, no react-virtual
- **Column definitions** (`columns`) — `colName`, width, default meta, alignment, custom render/editor
- **Cell types** — `text`, `select`, `multiSelect`, `boolean`, `switch`, `date`, `custom` (via `customCellRegistry`)
- **Cell meta** — `disabled`, `invalid`, per-cell/column meta overrides
- **Copy/paste range** — Ctrl+C / Ctrl+V (Cmd on macOS), TSV format; internal clipboard fallback when the system clipboard is unavailable
- **Range selection** — drag cells, drag column/row headers; Delete/Backspace clears the entire range
- **Column filter & sort** — popup UI on headers (`showFilter: true`); internal state, not yet exposed via ref
- **Merge cells** — merge/unmerge via `ref.mergeCells()` / `ref.unmergeCells()`; span display on the grid
- **Frozen columns** — `frozenColumnCount`
- **Resize** — drag column/row header borders; `onColumnResize` / `onRowResize` callbacks
- **Internationalization** — `locale` prop (partial override), English default via `DEFAULT_SPREADSHEET_LOCALE`
- **Error handling** — `onError` callback with typed error codes (`TSpreadsheetErrorCode`)
- **Column header height** — `colHeaderHeight` prop
- Keyboard navigation: Arrow, Tab, Shift+Tab, Enter, Escape, F2, Delete, Backspace, Ctrl+C/V
- **Filter-aware ops** — copy/paste/delete only operate on **visible rows** when a filter is active

## Monorepo structure

```
wms-sheets/
├── packages/spreadsheet/   # wms-spreadsheet — main library
└── apps/demo/              # Demo app: 20,000 rows × 26 cols
```

## Install

```bash
pnpm install
```

## Run demo

```bash
pnpm dev
# or
cd apps/demo && npx vite
```

Open http://localhost:5173

## Build library

```bash
pnpm build
# or
cd packages/spreadsheet && npx vite build
```

Output: `dist/index.js`, `dist/spreadsheet.css`, `dist/index.d.ts`

---

## Usage

### Import

```tsx
import { useRef } from "react";
import {
  Spreadsheet,
  type ISpreadsheetColumn,
  type ISpreadsheetRef,
} from "wms-spreadsheet";
import "wms-spreadsheet/style.css";
```

### Example with columns (recommended)

```tsx
const COLUMNS: ISpreadsheetColumn[] = [
  { colName: "sku", colText: "SKU", width: 120, showFilter: true },
  { colName: "qty", colText: "Qty", width: 80, meta: { type: "text" } },
  {
    colName: "active",
    colText: "Active",
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
        onError={(error) => {
          console.warn(error.code, error.message);
        }}
      />
    </div>
  );
}
```

### Sparse example (no columns)

```tsx
function SimpleSheet() {
  const sheetRef = useRef<ISpreadsheetRef>(null);

  const fillRow = () => {
    // Parent does NOT re-render — only changed cells update
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

### Using `colName` via ref

```tsx
// col can be null when passing colName (requires columns prop)
sheetRef.current?.setCellValue(0, null, "99", "qty");
sheetRef.current?.setCellMeta(1, null, { disabled: true }, "sku");
```

### Merge cells via ref

```tsx
// Merge current selection
sheetRef.current?.mergeCells();

// Merge a specific range
sheetRef.current?.mergeCells({
  startRow: 0,
  endRow: 1,
  startCol: 0,
  endCol: 2,
});

// Unmerge all merges intersecting the current selection
sheetRef.current?.unmergeCells();

// Unmerge a specific range
sheetRef.current?.unmergeCells({
  startRow: 0,
  endRow: 1,
  startCol: 0,
  endCol: 2,
});
```

---

## API

### `ISpreadsheetProps`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `rowCount` | `number` | — | Number of rows (required) |
| `columnCount` | `number` | — | Number of columns (required) |
| `columns` | `ISpreadsheetColumn[]` | — | Column definitions (width, meta, filter, render) |
| `rowHeight` | `number` | `28` | Row height (px) |
| `colHeaderHeight` | `number` | `28` | Column header row height (px) |
| `columnWidth` | `number` | `100` | Default column width (px) |
| `overscan` | `number` | `3` | Rows/columns buffered outside the viewport |
| `className` | `string` | — | CSS class for the wrapper |
| `initialData` | `TSheetDataInput` | — | Initial data (loaded once on mount) |
| `onChange` | `(changes: ICellInput[]) => void` | — | Callback when the **user** edits (edit, paste, delete, toggle) |
| `onError` | `(error: ISpreadsheetError) => void` | — | Callback when an operation is blocked (merge, copy/paste, filter/sort) |
| `onColumnResize` | `(col, width) => void` | — | After the user resizes a column |
| `onRowResize` | `(row, height) => void` | — | After the user resizes a row |
| `frozenColumnCount` | `number` | `0` | Number of columns frozen from the left (e.g. `2` → columns A, B) |
| `customCellRegistry` | `Record<string, ICustomCellDefinition>` | — | Render/editor registry for `meta.customKey` |
| `locale` | `DeepPartial<ISpreadsheetLocale>` | — | Override UI strings; English by default |

> **Note:** `onChange` receives an array of `{ row, col?, colName?, value }` and does **not** fire when calling `ref.setCellValue`, `ref.setCellValues`, or `ref.loadData`. There is no controlled `data` prop — avoids re-rendering the entire grid.

### `ISpreadsheetRef`

| Method | Description |
|--------|-------------|
| `setCellValue(row, col, value, colName?)` | Set one cell — `col` can be `null` when using `colName` |
| `getCellValue(row, col, colName?)` | Read one cell value |
| `setCellValues(cells)` | Batch set — only changed cells re-render |
| `loadData(data)` | Bulk load / replace data; resets filter, sort, and merge |
| `getData()` | Export all data (format depends on whether `columns` is set) |
| `getRowData(row)` | Export one row (same format as `getData()`) |
| `getActiveCell()` | Get the focused cell (selection endpoint) |
| `setActiveCell({ row, col })` | Select one cell (collapse range) |
| `getSelection()` | Get `{ anchor, focus }` |
| `setSelection({ anchor, focus })` | Set range selection |
| `setCellMeta(row, col, meta, colName?)` | Set cell meta — merged with column meta |
| `getCellMeta(row, col, colName?)` | Read merged meta (column + cell) |
| `setCellsMeta(cells)` | Batch set meta |
| `mergeCells(range?)` | Merge current selection or `INormalizedRange`; returns `boolean` |
| `unmergeCells(range?)` | Unmerge all merges intersecting selection or `INormalizedRange` |
| `getMergedRanges()` | Returns `IMergedRange[]` |
| `hasMergedCells()` | Returns `boolean` |

### `ISpreadsheetColumn`

| Field | Type | Description |
|-------|------|-------------|
| `colName` | `string` | Key in data objects and `colName` API (required) |
| `width` | `number` | Column width (px) |
| `colText` | `string` | Header text; defaults to `colName` |
| `colRender` | `(params) => ReactNode` | Custom header render; takes precedence over `colText` |
| `showFilter` | `boolean` | Show filter icon/popup on the header |
| `meta` | `Partial<ICellMeta>` | Default meta for the entire column |
| `horizontalAlign` | `"left" \| "center" \| "right"` | Horizontal body cell alignment (default `"left"`) |
| `verticalAlign` | `"top" \| "middle" \| "bottom"` | Vertical body cell alignment (default `"top"`) |
| `cellRender` | `(params) => ReactNode` | Override body cell render |
| `cellEditor` | `(params) => ReactNode` | Override cell editor |

### Cell types

| Type | How to edit | Notes |
|------|-------------|-------|
| `text` | Double-click / F2 / type | Default |
| `select` | Selection popup | `options: ISelectOption[]` |
| `multiSelect` | Multi-select popup | `options: ISelectOption[]` (supports `color`); value is `string[]` (ids); view shows colored pills |
| `boolean` | Click toggle | Does not enter edit mode |
| `switch` | Click toggle | Values `"true"` / `"false"` |
| `date` | Date picker | `dateFormat`, `minDate`, `maxDate` |
| `number` | Number input | `maxValue`, `decimalPlaces`; only `>= 0` |
| `custom` | Via `customCellRegistry` | `customKey` in meta |

`disabled` cells cannot be edited or pasted into; `invalid` shows an error state.

### Data formats

**Input (`initialData` / `loadData`)** — `TSheetDataInput`:

| Format | Example | Notes |
|--------|---------|-------|
| Sparse | `{ "0:0": "A1", "14:2": "Hello" }` | Key `"row:col"` (zero-based) |
| 2D array | `[["A1", "B1"], ["A2", "B2"]]` | |
| Object array | `[{ sku: "A001", qty: "10" }]` | **Requires** `columns` prop |

**Output (`getData` / `getRowData`)**:

| Has `columns` | `getData()` | `getRowData(row)` |
|---------------|-------------|-------------------|
| No | `ISheetData` sparse | Sparse keys for that row |
| Yes | `TSheetRowRecord[]` (rows with data only) | `TSheetRowRecord` |

`TCellValue = string | string[]` — `multiSelect` columns return `string[]` (array of ids).

`ICellInput` and `ICellMetaInput` support specifying columns via `col` (index) or `colName`.

```typescript
type ISheetData = Record<string, string>;
type TSheetRowRecord = Record<string, TCellValue>;

// Sparse example: cell C15 (row=14, col=2)
const data: ISheetData = { "14:2": "Hello", "0:0": "A1" };
```

---

## Merge cells

Merge/unmerge cells via the ref API — no built-in toolbar UI.

```tsx
// Merge current selection
const merged = sheetRef.current?.mergeCells();

// Merge a specific range
sheetRef.current?.mergeCells({
  startRow: 0,
  endRow: 1,
  startCol: 0,
  endCol: 2,
});

// Unmerge current selection (all merges intersecting selection)
sheetRef.current?.unmergeCells();

// Unmerge a specific range
sheetRef.current?.unmergeCells({
  startRow: 0,
  endRow: 1,
  startCol: 0,
  endCol: 2,
});

// Check state
sheetRef.current?.hasMergedCells();
sheetRef.current?.getMergedRanges();
```

**Limitations:**

- Cannot merge while filtering or sorting
- Cannot filter/sort when the sheet has merged cells (filter UI disabled; filter/sort calls fire `onError`)
- Copy range containing merged cells → `MERGE_COPY_NOT_ALLOWED`
- Paste into range containing merged cells → `MERGE_PASTE_NOT_ALLOWED`
- `loadData()` resets merge along with filter and sort
- Meta/value operations on merged regions always resolve to the **anchor cell** (top-left cell)

---

## Locale / i18n

The `locale` prop accepts `DeepPartial<ISpreadsheetLocale>` — shallow-merged with `DEFAULT_SPREADSHEET_LOCALE` (English).

Three string groups:

- `errors` — merge, copy/paste, filter/sort error messages
- `filter` — filter/sort popup UI (includes `conditions` for each filter condition)
- `datepicker` — date picker UI (`monthNames` must have 12 entries, `weekdayLabels` must have 7)

```tsx
import { Spreadsheet } from "wms-spreadsheet";

<Spreadsheet
  locale={{
    filter: {
      sortAsc: "Sort A-Z",
      sortDesc: "Sort Z-A",
      ok: "OK",
      cancel: "Cancel",
    },
    datepicker: {
      today: "Today",
      clear: "Clear",
      monthNames: [
        "January", "February", "March", "April",
        "May", "June", "July", "August",
        "September", "October", "November", "December",
      ],
      weekdayLabels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    },
    errors: {
      mergeInvalidRange: "Please select a cell range to merge.",
    },
  }}
/>
```

Exported helpers: `DEFAULT_SPREADSHEET_LOCALE`, `resolveSpreadsheetLocale(partial?)`.

---

## `onError`

The `onError` callback fires when an operation is blocked. Payload: `ISpreadsheetError` with `code` and `message` (message from `locale`).

| Code | When |
|------|------|
| `MERGE_INVALID_RANGE` | Merge with no valid range |
| `MERGE_OVERLAP` | Range overlaps another merge |
| `MERGE_SORT_FILTER_ACTIVE` | Merge while filter/sort active; or filter/sort while merges exist |
| `MERGE_COPY_NOT_ALLOWED` | Copy range contains merged cells |
| `MERGE_PASTE_NOT_ALLOWED` | Paste into range contains merged cells |

```tsx
<Spreadsheet
  onError={(error) => {
    // error.code: TSpreadsheetErrorCode
    // error.message: string (localized)
    toast.error(error.message);
  }}
/>
```

---

## Filter & sort

- Enable with `showFilter: true` on `ISpreadsheetColumn`
- Filter popup supports sort asc/desc, filter conditions (`isEqualTo`, `contains`, `isEmpty`, …), and value checkboxes
- When a filter is active: row display order changes; copy/paste/delete map to **visible rows** (hidden rows unaffected)
- Filter/sort state is **not yet exposed** via ref — reset on `loadData()` or when `rowCount` changes

**Interaction with merge cells:**

- When `hasMergedCells()` → sort/filter UI is disabled
- When filter or sort is active → `mergeCells()` is blocked (fires `onError`)

---

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| Click | Select one cell |
| Hold + drag (body) | Select cell range |
| Hold + drag (column header) | Select entire column |
| Hold + drag (row header) | Select entire row |
| Double-click / Enter / F2 | Start editing (if cell is editable) |
| Type | Edit (replace content); does not apply to `date` cells |
| Arrow keys | Move (collapse range to one cell) |
| Tab / Shift+Tab | Move right / left |
| Enter (while editing) | Commit + move down |
| Tab (while editing) | Commit + move right |
| Ctrl+C / Cmd+C | Copy range (writes TSV to clipboard) |
| Ctrl+V / Cmd+V | Paste at focus cell |
| Delete / Backspace | Clear cell content or entire range |
| Escape | Cancel edit |
| Drag header border | Resize column / row |

> **Not yet supported:** Shift+Click, Shift+Arrow to extend range.

---

## Performance — re-render scope

| Action | Parent | Spreadsheet | Cell |
|--------|--------|-------------|------|
| `ref.setCellValue(r,c,v)` | No | No | Only cell (r,c) if visible |
| `ref.setCellValues([...])` | No | No | Only changed cells |
| `ref.setCellMeta` / `setCellsMeta` | No | No | Only cells with meta changes |
| `ref.mergeCells` / `unmergeCells` | No | Yes (merge layout) | Re-mount cells in merge region |
| User scroll | No | Grid (virtual range) | Mount/unmount visible |
| User drag range | No | Yes (selection state) | No (single overlay DOM) |
| Copy range | No | Yes (clipboard overlay) | No |
| Paste range | No | No | Only written cells |
| Delete range | No | No | Only cells with data in range |
| User edit cell | No | No | Edited cell after commit |
| Filter / sort | No | Yes (display row order) | Re-mount by visible rows |

---

## Architecture

```
App (ref)
  ↓
CellStore (values) + MetaStore (meta) + MergeStore (merged ranges)
  ↓ notify by key "row:col"
SpreadsheetLocaleContext (locale strings)
  ↓
SpreadsheetCell (useSyncExternalStore)
  ↑
SpreadsheetGrid (useVirtualWindow + frozen pane)
  ↑ overlays: SelectionOverlay, ClipboardOverlay
```

### Virtual window

- `computeVisibleRange` — compute visible rows/columns from scroll position
- `useVirtualWindow` — rAF-batched scroll, ResizeObserver for viewport
- 4-pane layout: corner, column header, row header, body (headers synced via CSS transform)
- `FrozenColumnPane` — frozen columns in a separate scrollable pane

### Key hooks & utils

- `useClipboard` — copy/paste TSV, internal clipboard
- `useRangeSelection` — cell / column / row selection
- `useKeyboardNavigation` — keyboard shortcuts
- `useHeaderResize` — column/row resize
- `useMergeRevision` — subscribe to merge layout changes
- `columnFilter` / `rowSort` — filter & sort UI
- `visibleRowLayout` — map selection/clipboard to visible rows when filtered
- `mergeCell` — validate/expand merge range logic

---

## v1 scope (not yet supported)

- Formulas / formula bar
- Drag fill handle
- Shift+Click / Shift+Arrow to extend range
- Controlled `data` prop
- Expose filter/sort state via ref API

---

## Other exports

```typescript
import {
  CellStore,
  MetaStore,
  MergeStore,
  cellKey,
  columnLabel,
  DEFAULT_ROW_HEIGHT,
  DEFAULT_COLUMN_WIDTH,
  DEFAULT_OVERSCAN,
  COLUMN_HEADER_HEIGHT,
  ROW_HEADER_WIDTH,
  FILTER_BLANK_VALUE,
  DEFAULT_DATE_FORMAT,
  DEFAULT_SPREADSHEET_LOCALE,
  resolveSpreadsheetLocale,
} from "wms-spreadsheet";

cellKey(14, 2);    // "14:2"
columnLabel(2);    // "C"
```

Additional exported types: `ISpreadsheetLocale`, `IMergedRange`, `INormalizedRange`, `ISpreadsheetError`, `TSpreadsheetErrorCode`, `TCellValue`, `TSheetRowRecord`, `DeepPartial`, …

## Publish to npm

```bash
# Inspect package contents before publishing
pnpm pack:spreadsheet

# Log in to npm (first time)
npm login

# Publish publicly to npm
pnpm publish:spreadsheet
```

After publishing, install from npm:

```bash
pnpm add wms-spreadsheet
```

## License

MIT — see [packages/spreadsheet/LICENSE](packages/spreadsheet/LICENSE).
