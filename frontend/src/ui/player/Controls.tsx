import {
  Gauge,
  Maximize,
  Minimize,
  Pause,
  Play,
  Volume1,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { formatTimecode } from "../../timecode";
import { Button } from "../Button";
import { Menu } from "../Menu";
import { Slider } from "../Slider";
import { Tooltip } from "../Tooltip";
import { Timeline, type TimeRange } from "./Timeline";
import styles from "./Controls.module.css";

export const playbackRates = [0.75, 1, 1.25, 1.5, 1.75, 2];

const iconSize = 20;

type Props = {
  playing: boolean;
  currentTime: number;
  duration: number;
  buffered: TimeRange[];
  volume: number;
  muted: boolean;
  rate: number;
  zoomPercent: number;
  fullscreen: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onScrubbingChange: (scrubbing: boolean) => void;
  onVolume: (volume: number) => void;
  onToggleMute: () => void;
  onRate: (rate: number) => void;
  onMenuChange: (open: boolean) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onToggleFullscreen: () => void;
};

export function Controls(props: Props) {
  const silent = props.muted || props.volume === 0;
  const VolumeIcon = silent ? VolumeX : props.volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className={styles.controls}>
      <Timeline
        currentTime={props.currentTime}
        duration={props.duration}
        buffered={props.buffered}
        onSeek={props.onSeek}
        onScrubbingChange={props.onScrubbingChange}
      />
      <div className={styles.row}>
        <div className={styles.group}>
          <Tooltip text={props.playing ? "Пауза (K)" : "Смотреть (K)"}>
            <Button
              variant="overlay"
              icon={props.playing ? <Pause size={iconSize} /> : <Play size={iconSize} />}
              label={props.playing ? "Пауза" : "Смотреть"}
              onClick={props.onTogglePlay}
            />
          </Tooltip>
          <div className={styles.volume}>
            <Tooltip text={silent ? "Включить звук (M)" : "Выключить звук (M)"}>
              <Button
                variant="overlay"
                icon={<VolumeIcon size={iconSize} />}
                label={silent ? "Включить звук" : "Выключить звук"}
                onClick={props.onToggleMute}
              />
            </Tooltip>
            <div className={styles.volumeSlider}>
              <Slider
                value={silent ? 0 : props.volume}
                label="Громкость"
                onChange={props.onVolume}
              />
            </div>
          </div>
          <span className={styles.time}>
            {formatTimecode(props.currentTime)} / {formatTimecode(props.duration)}
          </span>
        </div>
        <div className={styles.group}>
          <Menu
            placement="top"
            items={playbackRates.map((rate) => ({ value: String(rate), label: `${rate}×` }))}
            value={String(props.rate)}
            onSelect={(value) => props.onRate(Number(value))}
            onOpenChange={props.onMenuChange}
            trigger={({ open, toggle }) => (
              <Tooltip text="Скорость">
                <Button
                  variant="overlay"
                  icon={<Gauge size={iconSize} />}
                  pressed={open}
                  onClick={toggle}
                >
                  {props.rate}×
                </Button>
              </Tooltip>
            )}
          />
          <div className={styles.zoom} data-zoomed={props.zoomPercent > 100}>
            <Tooltip text="Уменьшить (−)">
              <Button
                variant="overlay"
                icon={<ZoomOut size={iconSize} />}
                label="Уменьшить"
                onClick={props.onZoomOut}
              />
            </Tooltip>
            <Tooltip text="Сбросить зум (0)">
              <Button variant="overlay" onClick={props.onResetZoom}>
                {props.zoomPercent}%
              </Button>
            </Tooltip>
            <Tooltip text="Увеличить (+)">
              <Button
                variant="overlay"
                icon={<ZoomIn size={iconSize} />}
                label="Увеличить"
                onClick={props.onZoomIn}
              />
            </Tooltip>
          </div>
          <Tooltip
            text={props.fullscreen ? "Выйти из полноэкранного режима (F)" : "Во весь экран (F)"}
          >
            <Button
              variant="overlay"
              icon={props.fullscreen ? <Minimize size={iconSize} /> : <Maximize size={iconSize} />}
              label={props.fullscreen ? "Выйти из полноэкранного режима" : "Во весь экран"}
              onClick={props.onToggleFullscreen}
            />
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
