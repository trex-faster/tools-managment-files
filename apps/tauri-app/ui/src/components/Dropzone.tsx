import type { ReactNode } from "react";
import { cx } from "@/core/cx";
import styles from "./Dropzone.module.css";

interface DropzoneProps {
  hovering: boolean;
  disabled?: boolean;
  onPick: () => void;
  children: ReactNode;
}

export function Dropzone({ hovering, disabled = false, onPick, children }: DropzoneProps) {
  return (
    <button
      type="button"
      className={cx(styles.dropzone, hovering && styles.hover)}
      disabled={disabled}
      onClick={onPick}
    >
      {children}
    </button>
  );
}
