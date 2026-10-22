import type { SelectHTMLAttributes } from "react";
import { cx } from "@/core/cx";
import controls from "./controls.module.css";

export function Select({ className, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...rest} className={cx(controls.control, className)} />;
}
