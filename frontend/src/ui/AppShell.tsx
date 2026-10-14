import type { ReactNode } from "react";
import { Link } from "react-router";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../theme";
import { Button } from "./Button";
import styles from "./AppShell.module.css";

export const siteTitle = "MHS · Лекции";

export function AppShell({ children }: { children: ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.brand}>
            <img src="/favicon.svg" alt="" className={styles.logo} />
            {siteTitle}
          </Link>
          <Button
            variant="ghost"
            icon={theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            label={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
            onClick={toggleTheme}
          />
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
