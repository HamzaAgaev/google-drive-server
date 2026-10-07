import styles from "./Message.module.css";

export function Message({ children }: { children: string }) {
  return <p className={styles.message}>{children}</p>;
}
