import type { ButtonHTMLAttributes } from "react";
import { cx } from "@/core/cx";
import styles from "./Button.module.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
}

export function Button({ variant = "secondary", className, type = "button", ...rest }: ButtonProps) {
  return <button type={type} {...rest} className={cx(styles.button, styles[variant], className)} />;
}
