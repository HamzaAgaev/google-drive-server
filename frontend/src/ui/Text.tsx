import type { ReactNode } from "react";
import styles from "./Text.module.css";

type Props = {
  tone?: "default" | "muted" | "subtle";
  size?: "xs" | "sm" | "md";
  children: ReactNode;
};

export function Text({ tone = "default", size = "md", children }: Props) {
  return <p className={`${styles[tone]} ${styles[size]}`}>{children}</p>;
}
