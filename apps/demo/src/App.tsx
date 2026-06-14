import { useRef } from "react";
import {
  Spreadsheet,
  type ISpreadsheetColumn,
  type ISpreadsheetRef,
} from "@wms/spreadsheet";
import styles from "./App.module.scss";

const COLUMNS: ISpreadsheetColumn[] = [
  { colName: "sku", colText: "Mã SKU", width: 120 },
  {
    colName: "qty",
    colText: "SL",
    width: 80,
    colRender: () => <span style={{ fontWeight: 700 }}>SL</span>,
  },
  { colName: "name", width: 200 },
];

const INITIAL_DATA = [
  { sku: "A001", qty: "10", name: "Item A" },
  { sku: "A002", qty: "5", name: "Item B" },
  { sku: "A003", qty: "3", name: "Item C" },
];

let renderCount = 0;

export default function App() {
  renderCount += 1;
  const sheetRef = useRef<ISpreadsheetRef>(null);

  const setQtyByColName = () => {
    sheetRef.current?.setCellValue(0, null, "99", "qty");
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
    alert(`Cell (${active.row + 1}, ${active.col + 1}): "${value}"`);
  };

  return (
    <div className={styles.app}>
      <header className={styles.toolbar}>
        <h1 className={styles.title}>WMS Spreadsheet Demo</h1>
        <div className={styles.actions}>
          <button type="button" onClick={setQtyByColName}>
            Set qty row 1 = 99 (colName)
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
          onChange={(changes) => {
            console.log("Changes:", changes);
          }}
        />
      </main>
    </div>
  );
}
