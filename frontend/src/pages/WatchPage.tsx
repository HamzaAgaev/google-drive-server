import { useEffect } from "react";
import { Link, useParams } from "react-router";
import { api, ApiError, fileUrl } from "../api";
import { useApi } from "../useApi";
import { Message } from "../ui/Message";
import { VideoPlayer } from "../ui/VideoPlayer";
import styles from "./WatchPage.module.css";

export function WatchPage() {
  const { id = "" } = useParams();
  const watch = useApi((signal) => api.video(id, signal), [id]);
  const title = watch.status === "success" ? watch.data.video.title : "Лекции";

  useEffect(() => {
    document.title = title;
  }, [title]);

  if (watch.status === "loading") return <Message>Загрузка…</Message>;
  if (watch.status === "error") {
    const notFound = watch.error instanceof ApiError && watch.error.status === 404;
    return <Message>{notFound ? "Видео не найдено" : "Не удалось загрузить видео"}</Message>;
  }

  const { video, course, previous, next } = watch.data;

  return (
    <>
      <h1 className={styles.title}>{video.title}</h1>
      <p className={styles.course}>{course}</p>
      <VideoPlayer key={video.id} src={fileUrl(video.id)} />
      <nav className={styles.navigation}>
        {previous ? <Link to={`/watch/${previous.id}`}>← Предыдущее</Link> : <span />}
        {next ? <Link to={`/watch/${next.id}`}>Следующее →</Link> : <span />}
      </nav>
    </>
  );
}
