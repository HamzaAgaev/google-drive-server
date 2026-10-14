import type { ReactNode } from "react";
import styles from "./Tooltip.module.css";

type Props = {
  text: string;
  placement?: "top" | "bottom";
  children: ReactNode;
};

export function Tooltip({ text, placement = "top", children }: Props) {
  return (
    <span className={`${styles.anchor} ${styles[placement]}`} data-tooltip={text}>
      {children}
    </span>
  );
}
