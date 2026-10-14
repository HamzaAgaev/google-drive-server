import type { ReactNode } from "react";
import styles from "./Badge.module.css";

type Props = {
  tone?: "neutral" | "accent";
  children: ReactNode;
};

export function Badge({ tone = "neutral", children }: Props) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>;
}
