import styles from "./SwitchCell.module.scss";

export interface ISwitchCellProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}

export function SwitchCell({ checked, onChange, disabled }: ISwitchCellProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={styles.switch}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onChange(!checked);
      }}
    >
      <span
        className={`${styles.track} ${checked ? styles.trackChecked : ""}`}
      >
        <span className={styles.knob} />
      </span>
    </button>
  );
}
