import { useState, type PointerEvent } from "react";
import { formatTimecode } from "../../timecode";
import styles from "./Timeline.module.css";

export type TimeRange = {
  start: number;
  end: number;
};

type Props = {
  currentTime: number;
  duration: number;
  buffered: TimeRange[];
  onSeek: (time: number) => void;
  onScrubbingChange: (scrubbing: boolean) => void;
};

export function Timeline({ currentTime, duration, buffered, onSeek, onScrubbingChange }: Props) {
  const [hoverTime, setHoverTime] = useState<number>();
  const [scrubbing, setScrubbing] = useState(false);
  const percent = (time: number) => (duration > 0 ? (time / duration) * 100 : 0);

  const timeAt = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const fraction = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    return fraction * duration;
  };

  const setScrub = (value: boolean) => {
    setScrubbing(value);
    onScrubbingChange(value);
  };

  return (
    <div
      className={styles.timeline}
      data-scrubbing={scrubbing}
      role="slider"
      aria-label="Перемотка"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(currentTime)}
      aria-valuetext={formatTimecode(currentTime)}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        setScrub(true);
        onSeek(timeAt(event));
      }}
      onPointerMove={(event) => {
        const time = timeAt(event);
        setHoverTime(time);
        if (scrubbing) onSeek(time);
      }}
      onPointerUp={() => setScrub(false)}
      onPointerCancel={() => setScrub(false)}
      onPointerLeave={() => setHoverTime(undefined)}
    >
      <div className={styles.track}>
        {buffered.map((range) => (
          <div
            key={range.start}
            className={styles.buffered}
            style={{
              left: `${percent(range.start)}%`,
              width: `${percent(range.end - range.start)}%`,
            }}
          />
        ))}
        <div className={styles.progress} style={{ width: `${percent(currentTime)}%` }} />
        <div className={styles.thumb} style={{ left: `${percent(currentTime)}%` }} />
      </div>
      {hoverTime !== undefined && (
        <span className={styles.hoverTime} style={{ left: `${percent(hoverTime)}%` }}>
          {formatTimecode(hoverTime)}
        </span>
      )}
    </div>
  );
}
