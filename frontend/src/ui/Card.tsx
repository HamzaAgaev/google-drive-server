import type { ReactNode } from "react";
import { Link } from "react-router";
import styles from "./Card.module.css";

export function Card({ children }: { children: ReactNode }) {
  return <div className={styles.card}>{children}</div>;
}

export function CardLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className={`${styles.card} ${styles.interactive}`}>
      {children}
    </Link>
  );
}
