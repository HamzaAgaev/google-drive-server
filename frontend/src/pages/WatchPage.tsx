import { useEffect, useRef } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { api, ApiError, fileUrl } from "../api";
import { useApi } from "../useApi";
import { Message } from "../ui/Message";
import { SegmentedControl } from "../ui/SegmentedControl";
import { VideoPlayer } from "../ui/VideoPlayer";
import styles from "./WatchPage.module.css";

export function WatchPage() {
  const { id = "" } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const watch = useApi((signal) => api.video(id, signal), [id]);
  const title = watch.status === "success" ? watch.data.title : "Лекции";
  const startTime = Number(searchParams.get("t")) || undefined;

  useEffect(() => {
    document.title = title;
  }, [title]);

  if (watch.status === "loading") return <Message>Загрузка…</Message>;
  if (watch.status === "error") {
    const notFound = watch.error instanceof ApiError && watch.error.status === 404;
    return <Message>{notFound ? "Видео не найдено" : "Не удалось загрузить видео"}</Message>;
  }

  const lecture = watch.data;

  const switchVariant = (variantId: string) => {
    const time = Math.floor(videoRef.current?.currentTime ?? 0);
    navigate(`/watch/${variantId}${time > 0 ? `?t=${time}` : ""}`);
  };

  return (
    <>
      <h1 className={styles.title}>{lecture.title}</h1>
      <p className={styles.course}>{lecture.course}</p>
      {lecture.variants.length > 1 && (
        <div className={styles.variants}>
          <SegmentedControl
            options={lecture.variants.map((variant) => ({ value: variant.id, label: variant.name }))}
            value={lecture.id}
            onChange={switchVariant}
          />
        </div>
      )}
      <VideoPlayer key={lecture.id} ref={videoRef} src={fileUrl(lecture.id)} startTime={startTime} />
      <nav className={styles.navigation}>
        {lecture.previous ? <Link to={`/watch/${lecture.previous.id}`}>← Предыдущая</Link> : <span />}
        {lecture.next ? <Link to={`/watch/${lecture.next.id}`}>Следующая →</Link> : <span />}
      </nav>
    </>
  );
}
