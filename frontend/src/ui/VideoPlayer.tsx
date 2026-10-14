import type { Ref } from "react";
import styles from "./VideoPlayer.module.css";

type Props = {
  src: string;
  startTime?: number;
  ref?: Ref<HTMLVideoElement>;
};

export function VideoPlayer({ src, startTime, ref }: Props) {
  return (
    <video
      ref={ref}
      className={styles.video}
      src={src}
      controls
      preload="metadata"
      onLoadedMetadata={(event) => {
        if (startTime) event.currentTarget.currentTime = startTime;
      }}
    />
  );
}
