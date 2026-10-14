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
      <ul className={styles.lectures}>
        {course.lectures.map((lecture) => (
          <li key={lecture.title} className={styles.lecture}>
            <div>
              <Link to={`/watch/${lecture.variants[0].id}`}>{lecture.title}</Link>
              <div className={styles.variants}>
                {lecture.variants.map((variant) => (
                  <Link key={variant.id} className={styles.variant} to={`/watch/${variant.id}`}>
                    {variant.name}
                  </Link>
                ))}
              </div>
            </div>
            <span className={styles.date}>{formatDate(lecture.createdTime)}</span>
          </li>
        ))}
      </ul>
    </section>
  ));
}
