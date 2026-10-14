import { formatTimecode } from "../../timecode";
import styles from "./Controls.module.css";

export const playbackRates = [0.75, 1, 1.25, 1.5, 1.75, 2];

type Props = {
  playing: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  rate: number;
  zoomPercent: number;
  fullscreen: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onVolume: (volume: number) => void;
  onToggleMute: () => void;
  onRate: (rate: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onToggleFullscreen: () => void;
};

export function Controls(props: Props) {
  return (
    <div className={styles.controls}>
      <input
        className={styles.timeline}
        type="range"
        min={0}
        max={props.duration || 0}
        step={1}
        value={props.currentTime}
        aria-label="Перемотка"
        onChange={(event) => props.onSeek(Number(event.target.value))}
      />
      <div className={styles.row}>
        <div className={styles.group}>
          <button type="button" className={styles.button} onClick={props.onTogglePlay}>
            {props.playing ? "Пауза" : "Смотреть"}
          </button>
          <span className={styles.time}>
            {formatTimecode(props.currentTime)} / {formatTimecode(props.duration)}
          </span>
        </div>
        <div className={styles.group}>
          <span className={styles.cluster}>
            <button type="button" className={styles.button} onClick={props.onToggleMute}>
              {props.muted || props.volume === 0 ? "Звук выкл." : "Звук"}
            </button>
            <input
              className={styles.volume}
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={props.muted ? 0 : props.volume}
              aria-label="Громкость"
              onChange={(event) => props.onVolume(Number(event.target.value))}
            />
          </span>
          <select
            className={styles.button}
            value={props.rate}
            aria-label="Скорость"
            onChange={(event) => props.onRate(Number(event.target.value))}
          >
            {playbackRates.map((rate) => (
              <option key={rate} value={rate}>
                {rate}×
              </option>
            ))}
          </select>
          <span className={styles.cluster}>
            <button type="button" className={styles.button} onClick={props.onZoomOut} aria-label="Уменьшить">
              −
            </button>
            <button type="button" className={styles.button} onClick={props.onResetZoom}>
              {props.zoomPercent}%
            </button>
            <button type="button" className={styles.button} onClick={props.onZoomIn} aria-label="Увеличить">
              +
            </button>
          </span>
          <button type="button" className={styles.button} onClick={props.onToggleFullscreen}>
            {props.fullscreen ? "Выйти" : "Во весь экран"}
          </button>
        </div>
      </div>
    </div>
  );
}
