import type { ReactNode } from "react";
import { Link } from "react-router";
import styles from "./Layout.module.css";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>
          Лекции
        </Link>
      </header>
      <main>{children}</main>
    </div>
  );
}
