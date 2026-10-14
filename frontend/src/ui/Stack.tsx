import type { ReactNode } from "react";
import styles from "./Stack.module.css";

type Gap = 1 | 2 | 3 | 4 | 5 | 6 | 7;

type Props = {
  gap?: Gap;
  children: ReactNode;
};

export function Stack({ gap = 4, children }: Props) {
  return (
    <div className={styles.stack} style={{ gap: `var(--space-${gap})` }}>
      {children}
    </div>
  );
}

type ClusterProps = Props & {
  justify?: "start" | "between" | "end";
};

export function Cluster({ gap = 2, justify = "start", children }: ClusterProps) {
  return (
    <div className={`${styles.cluster} ${styles[justify]}`} style={{ gap: `var(--space-${gap})` }}>
      {children}
    </div>
  );
}
