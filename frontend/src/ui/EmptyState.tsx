import type { ReactNode } from "react";
import styles from "./EmptyState.module.css";

type Props = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className={styles.empty}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <h2>{title}</h2>
      {description && <p className={styles.description}>{description}</p>}
      {action}
    </div>
  );
}
