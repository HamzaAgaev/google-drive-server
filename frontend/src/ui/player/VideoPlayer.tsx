import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
  type Ref,
} from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { Spinner } from "../Spinner";
import { Controls } from "./Controls";
import { loadPosition, loadRate, savePosition, saveRate } from "./playbackStorage";
import type { TimeRange } from "./Timeline";
import { useAutoHide } from "./useAutoHide";
import { useZoom } from "./useZoom";
import styles from "./VideoPlayer.module.css";

const seekStep = 10;
const positionSaveInterval = 5;
const doubleTapDelay = 300;
const flashIconSize = 32;

type Props = {
  src: string;
  videoId: string;
  startTime?: number;
  ref?: Ref<HTMLVideoElement | null>;
};

type Flash = {
  id: number;
  content: ReactNode;
};

type WebkitVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void };

export function VideoPlayer({ src, videoId, startTime, ref }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSavedPosition = useRef(0);
  const lastTap = useRef<number>(undefined);
  const previousScale = useRef(1);
  const singleTapTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState<TimeRange[]>([]);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);
  const [hoveringControls, setHoveringControls] = useState(false);
  const [flash, setFlash] = useState<Flash>();
  const controls = useAutoHide(playing && !menuOpen && !scrubbing && !hoveringControls);
  const { zoom, zoomIn, zoomOut, resetZoom, pointerHandlers } = useZoom(surfaceRef, onTap);

  useImperativeHandle(ref, () => videoRef.current!, []);

  const video = () => videoRef.current!;
  const showFlash = (content: ReactNode) => setFlash({ id: Date.now(), content });

  const togglePlay = () => {
    if (video().paused) void video().play();
    else video().pause();
  };

  const togglePlayWithFlash = () => {
    showFlash(video().paused ? <Play size={flashIconSize} /> : <Pause size={flashIconSize} />);
    togglePlay();
  };

  const seek = (time: number) => {
    video().currentTime = Math.min(Math.max(time, 0), video().duration || time);
  };

  const seekBy = (seconds: number) => {
    seek(video().currentTime + seconds);
    showFlash(`${seconds > 0 ? "+" : "−"}${Math.abs(seconds)} с`);
  };

  const toggleMute = () => {
    video().muted = !video().muted;
  };

  const toggleFullscreen = () => {
    const container = containerRef.current!;
    if (document.fullscreenElement) void document.exitFullscreen();
    else if (container.requestFullscreen) void container.requestFullscreen();
    else (video() as WebkitVideo).webkitEnterFullscreen?.();
  };

  function onTap(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse") {
      togglePlayWithFlash();
      return;
    }
    const now = performance.now();
    if (lastTap.current !== undefined && now - lastTap.current < doubleTapDelay) {
      clearTimeout(singleTapTimer.current);
      lastTap.current = undefined;
      const rect = event.currentTarget.getBoundingClientRect();
      const position = (event.clientX - rect.left) / rect.width;
      if (position < 1 / 3) seekBy(-seekStep);
      else if (position > 2 / 3) seekBy(seekStep);
      return;
    }
    lastTap.current = now;
    singleTapTimer.current = setTimeout(() => {
      if (controls.visible) controls.hide();
      else controls.show();
    }, doubleTapDelay);
  }

  useEffect(() => {
    if (zoom.scale === previousScale.current) return;
    previousScale.current = zoom.scale;
    showFlash(`${Math.round(zoom.scale * 100)}%`);
  }, [zoom.scale]);

  useEffect(() => {
    if (playing) controls.show();
  }, [playing]);

  useEffect(() => {
    const onChange = () => {
      setFullscreen(document.fullscreenElement === containerRef.current);
      resetZoom();
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      clearTimeout(singleTapTimer.current);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest("input, select, textarea, [contenteditable]")
      ) {
        return;
      }
      const actions: Record<string, () => void> = {
        " ": togglePlayWithFlash,
        k: togglePlayWithFlash,
        ArrowLeft: () => seekBy(-seekStep),
        ArrowRight: () => seekBy(seekStep),
        f: toggleFullscreen,
        m: () => {
          showFlash(
            video().muted ? <Volume2 size={flashIconSize} /> : <VolumeX size={flashIconSize} />,
          );
          toggleMute();
        },
        "+": zoomIn,
        "=": zoomIn,
        "-": zoomOut,
        "0": resetZoom,
      };
      const action = actions[event.key];
      if (!action) return;
      event.preventDefault();
      controls.show();
      action();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const updateBuffered = (element: HTMLVideoElement) => {
    const ranges = element.buffered;
    setBuffered(
      Array.from({ length: ranges.length }, (_, index) => ({
        start: ranges.start(index),
        end: ranges.end(index),
      })),
    );
  };

  return (
    <div
      ref={containerRef}
      className={styles.player}
      data-fullscreen={fullscreen}
      data-controls={controls.visible}
      onPointerMove={(event) => {
        if (event.pointerType === "mouse") controls.show();
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse" && playing) controls.hide();
      }}
    >
      <div
        ref={surfaceRef}
        className={styles.surface}
        data-zoomed={zoom.scale > 1}
        {...pointerHandlers}
      >
        <video
          ref={videoRef}
          className={styles.video}
          src={src}
          preload="metadata"
          playsInline
          style={{ transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})` }}
          onLoadedMetadata={(event) => {
            const element = event.currentTarget;
            element.playbackRate = loadRate() ?? 1;
            const position = startTime ?? loadPosition(videoId);
            if (position && position < element.duration) element.currentTime = position;
            setDuration(element.duration);
          }}
          onPlay={() => setPlaying(true)}
          onPause={(event) => {
            setPlaying(false);
            savePosition(videoId, event.currentTarget.currentTime);
          }}
          onEnded={() => savePosition(videoId, undefined)}
          onWaiting={() => setBuffering(true)}
          onPlaying={() => setBuffering(false)}
          onCanPlay={() => setBuffering(false)}
          onProgress={(event) => updateBuffered(event.currentTarget)}
          onTimeUpdate={(event) => {
            const time = event.currentTarget.currentTime;
            setCurrentTime(time);
            if (Math.abs(time - lastSavedPosition.current) >= positionSaveInterval) {
              lastSavedPosition.current = time;
              savePosition(videoId, time);
            }
          }}
          onDurationChange={(event) => setDuration(event.currentTarget.duration)}
          onVolumeChange={(event) => {
            setVolume(event.currentTarget.volume);
            setMuted(event.currentTarget.muted);
          }}
          onRateChange={(event) => {
            setRate(event.currentTarget.playbackRate);
            saveRate(event.currentTarget.playbackRate);
          }}
        />
      </div>
      {buffering && (
        <div className={styles.center}>
          <span className={styles.spinner}>
            <Spinner size={40} />
          </span>
        </div>
      )}
      {flash && (
        <div className={styles.center}>
          <span key={flash.id} className={styles.flash} onAnimationEnd={() => setFlash(undefined)}>
            {flash.content}
          </span>
        </div>
      )}
      <div
        className={styles.controls}
        onPointerEnter={(event) => event.pointerType === "mouse" && setHoveringControls(true)}
        onPointerLeave={() => setHoveringControls(false)}
      >
        <Controls
          playing={playing}
          currentTime={currentTime}
          duration={duration}
          buffered={buffered}
          volume={volume}
          muted={muted}
          rate={rate}
          zoomPercent={Math.round(zoom.scale * 100)}
          fullscreen={fullscreen}
          onTogglePlay={togglePlay}
          onSeek={seek}
          onScrubbingChange={setScrubbing}
          onVolume={(value) => {
            video().volume = value;
            video().muted = value === 0;
          }}
          onToggleMute={toggleMute}
          onRate={(value) => {
            video().playbackRate = value;
          }}
          onMenuChange={setMenuOpen}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onResetZoom={resetZoom}
          onToggleFullscreen={toggleFullscreen}
        />
      </div>
    </div>
  );
}
