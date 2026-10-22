import type { ReactNode } from "react";
import { cx } from "@/core/cx";
import styles from "./Field.module.css";

interface FieldProps {
  label: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}

/** Etiqueta + control (+ ayuda). La etiqueta envuelve al control, así que es accesible sin ids. */
export function Field({ label, hint, className, children }: FieldProps) {
  return (
    <label className={cx(styles.field, className)}>
      <span className={styles.label}>{label}</span>
      {children}
      {hint && <span className={styles.hint}>{hint}</span>}
    </label>
  );
}
