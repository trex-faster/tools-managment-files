import type { InputHTMLAttributes } from "react";
import { cx } from "@/core/cx";
import controls from "./controls.module.css";

export function TextInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="text" autoComplete="off" spellCheck={false} {...rest} className={cx(controls.control, className)} />;
}
