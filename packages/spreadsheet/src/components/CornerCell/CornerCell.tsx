import styles from "../../styles/spreadsheet.module.scss";

interface ICornerCellProps {
  colHeaderHeight: number;
}

export function CornerCell({ colHeaderHeight }: ICornerCellProps) {
  return <div className={styles.corner} style={{ height: colHeaderHeight }} />;
}
