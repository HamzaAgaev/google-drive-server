import styles from "./VideoPlayer.module.css";

export function VideoPlayer({ src }: { src: string }) {
  return <video className={styles.video} src={src} controls preload="metadata" />;
}
