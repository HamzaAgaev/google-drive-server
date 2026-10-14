import { Fragment } from "react";
import { Link } from "react-router";
import { ChevronRight } from "lucide-react";
import styles from "./Breadcrumbs.module.css";

export type Crumb = {
  label: string;
  to?: string;
};

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className={styles.breadcrumbs} aria-label="Навигация">
      {items.map((item, index) => (
        <Fragment key={item.label}>
          {index > 0 && <ChevronRight size={14} className={styles.separator} />}
          {item.to ? (
            <Link to={item.to} className={styles.link}>
              {item.label}
            </Link>
          ) : (
            <span className={styles.current}>{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
