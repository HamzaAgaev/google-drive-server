import styles from "./Skeleton.module.css";

export function Skeleton({ height = 16, width = "100%" }: { height?: number; width?: number | string }) {
  return <span className={styles.skeleton} style={{ height, width }} />;
}
