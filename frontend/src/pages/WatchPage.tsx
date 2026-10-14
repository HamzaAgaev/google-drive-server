import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { api, ApiError, fileUrl } from "../api";
import { formatTimecode, parseTimecode, timecodeParam } from "../timecode";
import { useApi } from "../useApi";
import { Button } from "../ui/Button";
import { Message } from "../ui/Message";
import { SegmentedControl } from "../ui/SegmentedControl";
import { VideoPlayer } from "../ui/VideoPlayer";
import styles from "./WatchPage.module.css";

export function WatchPage() {
  const { id = "" } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shareStatus, setShareStatus] = useState<string>();
  const watch = useApi((signal) => api.video(id, signal), [id]);
  const title = watch.status === "success" ? watch.data.title : "Лекции";
  const startTime = parseTimecode(searchParams.get("t"));

  useEffect(() => {
    document.title = title;
  }, [title]);

  useEffect(() => {
    if (!shareStatus) return;
    const timeout = setTimeout(() => setShareStatus(undefined), 3000);
    return () => clearTimeout(timeout);
  }, [shareStatus]);

  if (watch.status === "loading") return <Message>Загрузка…</Message>;
  if (watch.status === "error") {
    const notFound = watch.error instanceof ApiError && watch.error.status === 404;
    return <Message>{notFound ? "Видео не найдено" : "Не удалось загрузить видео"}</Message>;
  }

  const lecture = watch.data;
  const currentTime = () => Math.floor(videoRef.current?.currentTime ?? 0);
  const watchPath = (videoId: string, time: number) =>
    `/watch/${videoId}${time > 0 ? `?t=${timecodeParam(time)}` : ""}`;

  const share = async () => {
    const time = currentTime();
    const url = new URL(watchPath(lecture.id, time), window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus(time > 0 ? `Ссылка скопирована (${formatTimecode(time)})` : "Ссылка скопирована");
    } catch {
      window.prompt("Скопируйте ссылку", url);
    }
  };

  return (
    <>
      <h1 className={styles.title}>{lecture.title}</h1>
      <p className={styles.course}>{lecture.course}</p>
      <div className={styles.toolbar}>
        {lecture.variants.length > 1 ? (
          <SegmentedControl
            options={lecture.variants.map((variant) => ({ value: variant.id, label: variant.name }))}
            value={lecture.id}
            onChange={(variantId) => navigate(watchPath(variantId, currentTime()))}
          />
        ) : (
          <span />
        )}
        <div className={styles.share}>
          {shareStatus && <span className={styles.shareStatus}>{shareStatus}</span>}
          <Button onClick={share}>Поделиться</Button>
        </div>
      </div>
      <VideoPlayer key={lecture.id} ref={videoRef} src={fileUrl(lecture.id)} startTime={startTime} />
      <nav className={styles.navigation}>
        {lecture.previous ? <Link to={`/watch/${lecture.previous.id}`}>← Предыдущая</Link> : <span />}
        {lecture.next ? <Link to={`/watch/${lecture.next.id}`}>Следующая →</Link> : <span />}
      </nav>
    </>
  );
}
