import { useEffect, useRef, useState } from "react";
import {
  Spreadsheet,
  type ICustomCellDefinition,
  type ISpreadsheetColumn,
  type ISpreadsheetError,
  type ISpreadsheetRef
} from "wms-spreadsheet";
import styles from "./App.module.scss";

const SELECT_OPTIONS = [
  { id: "1", label: "Lựa chọn 1", color: "#e8eaed" },
  { id: "2", label: "Lựa chọn 2", color: "#d2e3fc" },
  { id: "3", label: "Lựa chọn 3", color: "#ceead6" },
  { id: "4", label: "Giao hàng nhanhhhhhhhhhhhhhhh", color: "#fce8e6" },
  { id: "5", label: "Giao hàng tiêu chuẩn", color: "#fff3e0" },
  { id: "6", label: "Lưu kho tạm", color: "#e6f4ea" },
  { id: "7", label: "Hủy đơn", color: "#f1f3f4" },
  { id: "8", label: "Lựa chọn đặc biệt A", color: "#d2e3fc" },
  { id: "9", label: "Lựa chọn đặc biệt B", color: "#ceead6" }
];

const MULTI_SELECT_OPTIONS = [
  { id: "1", label: "Tag A", color: "#e8eaed" },
  { id: "2", label: "Tag B", color: "#d2e3fc" },
  { id: "3", label: "Tag C", color: "#ceead6" },
  { id: "4", label: "Giao hàng nhanh", color: "#fce8e6" },
  { id: "5", label: "Giao hàng tiêu chuẩn", color: "#fff3e0" },
  { id: "6", label: "Lưu kho tạm", color: "#e6f4ea" }
];

const CUSTOM_CELLS: Record<string, ICustomCellDefinition> = {
  statusBadge: {
    render: ({ value }) =>
      !!value ? (
        <span
          style={{
            display: "inline-block",
            padding: "2px 8px",
            borderRadius: 4,
            background: value === "done" ? "#ceead6" : "#fce8e6",
            color: value === "done" ? "#137333" : "#c5221f",
            fontSize: 12,
            fontWeight: 600
          }}
        >
          {value === "done" ? "Hoàn thành" : "Chờ xử lý"}
        </span>
      ) : null,
    editor: ({ value, onCommit, onCancel }) => (
      <select
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          border: "2px solid #1a73e8",
          fontSize: 13,
          boxSizing: "border-box"
        }}
        value={value}
        autoFocus
        onChange={(e) => onCommit(e.target.value)}
        onBlur={onCancel}
      >
        <option value="pending">Chờ xử lý</option>
        <option value="done">Hoàn thành</option>
      </select>
    )
  }
};

const COLUMNS: ISpreadsheetColumn[] = [
  { colName: "sku", colText: "Mã SKU", width: 120, showFilter: true },
  {
    colName: "qty",
    colText: "SL",
    width: 110,
    showFilter: true,
    colRender: () => (
      <div
        style={{
          display: "flex",
          gap: "2px",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <p
          style={{
            maxWidth: "60px",
            wordBreak: "break-word",
            whiteSpace: "pre-line"
          }}
        >
          Số lượng tối đa
        </p>
        <p style={{ color: "red" }}>*</p>
      </div>
    )
  },
  { colName: "name", width: 200, verticalAlign: "middle", showFilter: true },
  {
    colName: "choice",
    colText: "Lựa chọn",
    width: 140,
    meta: { type: "select", options: SELECT_OPTIONS },
    verticalAlign: "middle"
  },
  {
    colName: "tags",
    colText: "Tags",
    width: 180,
    meta: { type: "multiSelect", options: MULTI_SELECT_OPTIONS },
    verticalAlign: "middle"
  },
  {
    colName: "active",
    colText: "Kích hoạt",
    width: 90,
    meta: { type: "switch" },
    horizontalAlign: "center",
    verticalAlign: "middle"
  },
  {
    colName: "status",
    colText: "Trạng thái",
    width: 130,
    meta: { customKey: "statusBadge" }
  },
  {
    colName: "self_ship",
    colText: "Tự ship",
    width: 90,
    meta: { type: "boolean" },
    horizontalAlign: "right",
    verticalAlign: "bottom"
  },
  {
    colName: "due_date",
    colText: "Ngày hạn",
    width: 130,
    meta: {
      type: "date",
      dateFormat: "DD/MM/YYYY"
    }
  }
];

const INITIAL_DATA = [
  {
    sku: "A001",
    qty: "10",
    name: "Item A",
    choice: "1",
    tags: ["1", "3"],
    active: "true",
    status: "pending"
  },
  {
    sku: "A002",
    qty: "5",
    name: "Item B",
    choice: "2",
    tags: ["2", "4", "5"],
    active: "false",
    status: "done"
  },
  {
    sku: "A003",
    qty: "3",
    name: "Item C",
    choice: "",
    tags: [],
    active: "true",
    status: "pending",
    due_date: ""
  }
];

let renderCount = 0;

export default function App() {
  renderCount += 1;
  const sheetRef = useRef<ISpreadsheetRef>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!errorMessage) return;
    const timer = window.setTimeout(() => setErrorMessage(null), 4000);
    return () => window.clearTimeout(timer);
  }, [errorMessage]);

  const handleSpreadsheetError = (error: ISpreadsheetError) => {
    setErrorMessage(error.message);
  };

  const mergeSelection = () => {
    sheetRef.current?.mergeCells();
  };

  const unmergeSelection = () => {
    sheetRef.current?.unmergeCells();
  };

  useEffect(() => {
    const ref = sheetRef.current;
    if (!ref) return;

    ref.setCellsMeta([
      {
        row: 1,
        colName: "due_date",
        meta: { maxDate: "2026-06-20" }
      },
      { row: 0, colName: "sku", meta: { invalid: true } },
      { row: 1, colName: "sku", meta: { disabled: true } },
      { row: 2, colName: "sku", meta: { invalid: true, disabled: true } }
    ]);
  }, []);

  const setQtyByColName = () => {
    sheetRef.current?.setCellValue(0, null, "99", "qty");
  };

  const setupSelectCell = () => {
    sheetRef.current?.setCellMeta(
      5,
      null,
      { type: "select", options: SELECT_OPTIONS },
      "choice"
    );
    sheetRef.current?.setCellValue(5, null, "1", "choice");
  };

  const readData = () => {
    const data = sheetRef.current?.getData();
    console.log("Sheet data:", data);
    alert(JSON.stringify(data, null, 2));
  };

  const readRowData = () => {
    const active = sheetRef.current?.getActiveCell();
    const row = active?.row ?? 0;
    const data = sheetRef.current?.getRowData(row);
    console.log(`Row ${row} data:`, data);
    alert(`Row ${row + 1}:\n${JSON.stringify(data, null, 2)}`);
  };

  const readActiveCell = () => {
    const active = sheetRef.current?.getActiveCell();
    if (!active) return;

    const value = sheetRef.current?.getCellValue(active.row, active.col);
    const meta = sheetRef.current?.getCellMeta(active.row, active.col);
    alert(
      `Cell (${active.row + 1}, ${active.col + 1}): "${value}"\nMeta: ${JSON.stringify(meta)}`
    );
  };

  const setOptionForCell = () => {
    sheetRef?.current?.setCellMeta(
      0,
      null,
      {
        type: "select",
        options: [{ id: "1", label: "aaaa" }]
      },
      "self_ship"
    );
  };
  return (
    <div className={styles.app}>
      <header className={styles.toolbar}>
        <h1 className={styles.title}>WMS Spreadsheet Demo</h1>
        <div className={styles.actions}>
          <button type="button" onClick={setQtyByColName}>
            Set qty row 1 = 99 (colName)
          </button>
          <button type="button" onClick={setupSelectCell}>
            setCellMeta select row 6
          </button>
          <button type="button" onClick={readData}>
            getData()
          </button>
          <button type="button" onClick={readRowData}>
            getRowData()
          </button>
          <button type="button" onClick={readActiveCell}>
            Read active cell
          </button>
          <button type="button" onClick={setOptionForCell}>
            Set option for cell
          </button>
          <button type="button" onClick={mergeSelection}>
            Gộp ô (merge)
          </button>
          <button type="button" onClick={unmergeSelection}>
            Bỏ gộp (unmerge)
          </button>
        </div>
        <span className={styles.stats}>
          App renders: {renderCount} | Kéo chuột chọn range | Delete xóa
        </span>
      </header>
      <main className={styles.sheetContainer}>
        <Spreadsheet
          ref={sheetRef}
          rowCount={20000}
          columnCount={26}
          columns={COLUMNS}
          // colHeaderHeight={50}
          frozenColumnCount={2}
          initialData={INITIAL_DATA}
          customCellRegistry={CUSTOM_CELLS}
          onChange={(changes) => {
            console.log("Changes:", changes);
          }}
          onError={handleSpreadsheetError}
        />
      </main>
      {errorMessage && (
        <div className={styles.snackbar} role="alert">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
