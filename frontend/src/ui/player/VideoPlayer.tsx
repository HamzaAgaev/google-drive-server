import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { Controls } from "./Controls";
import { loadPosition, loadRate, savePosition, saveRate } from "./playbackStorage";
import { useZoom } from "./useZoom";
import styles from "./VideoPlayer.module.css";

const seekStep = 10;
const positionSaveInterval = 5;

type Props = {
  src: string;
  videoId: string;
  startTime?: number;
  ref?: Ref<HTMLVideoElement | null>;
};

type WebkitVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void };

export function VideoPlayer({ src, videoId, startTime, ref }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSavedPosition = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const { zoom, zoomIn, zoomOut, resetZoom, consumeDrag, pointerHandlers } = useZoom(surfaceRef);

  useImperativeHandle(ref, () => videoRef.current!, []);

  const video = () => videoRef.current!;

  const togglePlay = () => {
    if (video().paused) void video().play();
    else video().pause();
  };

  const seek = (time: number) => {
    video().currentTime = Math.min(Math.max(time, 0), video().duration || time);
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

  useEffect(() => {
    const onChange = () => {
      setFullscreen(document.fullscreenElement === containerRef.current);
      resetZoom();
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target;
      if (target instanceof Element && target.closest("input, select, textarea, [contenteditable]")) {
        return;
      }
      const actions: Record<string, () => void> = {
        " ": togglePlay,
        k: togglePlay,
        ArrowLeft: () => seek(video().currentTime - seekStep),
        ArrowRight: () => seek(video().currentTime + seekStep),
        f: toggleFullscreen,
        m: toggleMute,
        "+": zoomIn,
        "=": zoomIn,
        "-": zoomOut,
        "0": resetZoom,
      };
      const action = actions[event.key];
      if (!action) return;
      event.preventDefault();
      action();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <div ref={containerRef} className={styles.player} data-fullscreen={fullscreen}>
      <div
        ref={surfaceRef}
        className={styles.surface}
        data-zoomed={zoom.scale > 1}
        onClick={() => {
          if (!consumeDrag()) togglePlay();
        }}
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
      <Controls
        playing={playing}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        muted={muted}
        rate={rate}
        zoomPercent={Math.round(zoom.scale * 100)}
        fullscreen={fullscreen}
        onTogglePlay={togglePlay}
        onSeek={seek}
        onVolume={(value) => {
          video().volume = value;
          video().muted = value === 0;
        }}
        onToggleMute={toggleMute}
        onRate={(value) => {
          video().playbackRate = value;
        }}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetZoom={resetZoom}
        onToggleFullscreen={toggleFullscreen}
      />
    </div>
  );
}
