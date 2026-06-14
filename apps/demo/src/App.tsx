import { useEffect, useRef } from "react";
import {
  Spreadsheet,
  type ICustomCellDefinition,
  type ISpreadsheetColumn,
  type ISpreadsheetRef,
} from "@wms/spreadsheet";
import styles from "./App.module.scss";

const SELECT_OPTIONS = [
  { id: "1", label: "Lựa chọn 1", color: "#e8eaed" },
  { id: "2", label: "Lựa chọn 2", color: "#d2e3fc" },
  { id: "3", label: "Lựa chọn 3", color: "#ceead6" },
];

const CUSTOM_CELLS: Record<string, ICustomCellDefinition> = {
  statusBadge: {
    render: ({ value }) => (
      <span
        style={{
          display: "inline-block",
          padding: "2px 8px",
          borderRadius: 4,
          background: value === "done" ? "#ceead6" : "#fce8e6",
          color: value === "done" ? "#137333" : "#c5221f",
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        {value === "done" ? "Hoàn thành" : "Chờ xử lý"}
      </span>
    ),
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
          boxSizing: "border-box",
        }}
        value={value}
        autoFocus
        onChange={(e) => onCommit(e.target.value)}
        onBlur={onCancel}
      >
        <option value="pending">Chờ xử lý</option>
        <option value="done">Hoàn thành</option>
      </select>
    ),
  },
};

const COLUMNS: ISpreadsheetColumn[] = [
  { colName: "sku", colText: "Mã SKU", width: 120 },
  {
    colName: "qty",
    colText: "SL",
    width: 80,
    colRender: () => <span style={{ fontWeight: 700 }}>SL</span>,
  },
  { colName: "name", width: 200 },
  { colName: "choice", colText: "Lựa chọn", width: 140 },
  { colName: "active", colText: "Kích hoạt", width: 90 },
  {
    colName: "status",
    colText: "Trạng thái",
    width: 130,
    customKey: "statusBadge",
  },
];

const INITIAL_DATA = [
  {
    sku: "A001",
    qty: "10",
    name: "Item A",
    choice: "1",
    active: "true",
    status: "pending",
  },
  {
    sku: "A002",
    qty: "5",
    name: "Item B",
    choice: "2",
    active: "false",
    status: "done",
  },
  {
    sku: "A003",
    qty: "3",
    name: "Item C",
    choice: "",
    active: "true",
    status: "pending",
  },
];

let renderCount = 0;

export default function App() {
  renderCount += 1;
  const sheetRef = useRef<ISpreadsheetRef>(null);

  useEffect(() => {
    const ref = sheetRef.current;
    if (!ref) return;

    ref.setCellsMeta([
      {
        row: 0,
        colName: "choice",
        meta: { type: "select", options: SELECT_OPTIONS },
      },
      {
        row: 1,
        colName: "choice",
        meta: { type: "select", options: SELECT_OPTIONS },
      },
      {
        row: 2,
        colName: "choice",
        meta: { type: "select", options: SELECT_OPTIONS },
      },
      { row: 0, colName: "active", meta: { type: "boolean" } },
      { row: 1, colName: "active", meta: { type: "boolean" } },
      { row: 2, colName: "active", meta: { type: "boolean" } },
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
      "choice",
    );
    sheetRef.current?.setCellValue(5, null, "1", "choice");
  };

  const readData = () => {
    const data = sheetRef.current?.getData();
    console.log("Sheet data:", data);
    alert(JSON.stringify(data, null, 2));
  };

  const readActiveCell = () => {
    const active = sheetRef.current?.getActiveCell();
    if (!active) return;

    const value = sheetRef.current?.getCellValue(active.row, active.col);
    const meta = sheetRef.current?.getCellMeta(active.row, active.col);
    alert(
      `Cell (${active.row + 1}, ${active.col + 1}): "${value}"\nMeta: ${JSON.stringify(meta)}`,
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
          <button type="button" onClick={readActiveCell}>
            Read active cell
          </button>
        </div>
        <span className={styles.stats}>
          App renders: {renderCount} | Kéo chuột chọn range | Delete xóa
        </span>
      </header>
      <main className={styles.sheetContainer}>
        <Spreadsheet
          ref={sheetRef}
          rowCount={10000}
          columnCount={26}
          columns={COLUMNS}
          frozenColumnCount={1}
          initialData={INITIAL_DATA}
          customCellRegistry={CUSTOM_CELLS}
          onChange={(changes) => {
            console.log("Changes:", changes);
          }}
        />
      </main>
    </div>
  );
}
