import { useRef } from "react";
import {
  Spreadsheet,
  type ISpreadsheetRef,
} from "@wms/spreadsheet";
import styles from "./App.module.scss";

let renderCount = 0;

export default function App() {
  renderCount += 1;
  const sheetRef = useRef<ISpreadsheetRef>(null);

  const fillRow = () => {
    sheetRef.current?.setCellValues(
      Array.from({ length: 26 }, (_, col) => ({
        row: 0,
        col,
        value: `Col ${col}`,
      })),
    );
  };

  const fill1000Cells = () => {
    const cells = Array.from({ length: 1000 }, (_, i) => ({
      row: Math.floor(i / 26) + 1,
      col: i % 26,
      value: `R${Math.floor(i / 26) + 1}C${i % 26}`,
    }));
    sheetRef.current?.setCellValues(cells);
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
          <button type="button" onClick={fillRow}>
            Fill row 1
          </button>
          <button type="button" onClick={fill1000Cells}>
            Fill 1000 cells
          </button>
          <button type="button" onClick={readActiveCell}>
            Read active cell
          </button>
        </div>
        <span className={styles.stats}>
          App renders: {renderCount} | 10.000 rows × 26 cols
        </span>
      </header>
      <main className={styles.sheetContainer}>
        <Spreadsheet
          ref={sheetRef}
          rowCount={10000}
          columnCount={26}
          initialData={{
            "2:2": "Hello",
            "4:1": "World",
          }}
          onCellChange={(row, col, value) => {
            console.log("User edited:", row, col, value);
          }}
        />
      </main>
    </div>
  );
}
