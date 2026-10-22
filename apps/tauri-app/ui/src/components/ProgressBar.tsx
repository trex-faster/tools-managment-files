import styles from "./ProgressBar.module.css";

interface ProgressBarProps {
  /** 0 a 100. */
  percent: number;
  label?: string;
}

export function ProgressBar({ percent, label }: ProgressBarProps) {
  const value = Math.min(100, Math.max(0, percent));
  return (
    <div
      className={styles.track}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
    >
      <div className={styles.fill} style={{ width: `${value}%` }} />
    </div>
  );
}
