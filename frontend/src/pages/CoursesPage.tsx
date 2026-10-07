import { Link } from "react-router";
import { api } from "../api";
import { formatDate } from "../formatDate";
import { useApi } from "../useApi";
import { Message } from "../ui/Message";
import styles from "./CoursesPage.module.css";

export function CoursesPage() {
  const courses = useApi(api.courses, []);

  if (courses.status === "loading") return <Message>Загрузка…</Message>;
  if (courses.status === "error") return <Message>Не удалось загрузить список видео</Message>;
  if (courses.data.length === 0) return <Message>Пока нет скачанных видео</Message>;

  return courses.data.map((course) => (
    <section key={course.title} className={styles.course}>
      <h2 className={styles.title}>{course.title}</h2>
      <ul className={styles.videos}>
        {course.videos.map((video) => (
          <li key={video.id} className={styles.video}>
            <Link to={`/watch/${video.id}`}>{video.title}</Link>
            <span className={styles.date}>{formatDate(video.createdTime)}</span>
          </li>
        ))}
      </ul>
    </section>
  ));
}
