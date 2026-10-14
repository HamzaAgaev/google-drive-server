import { useEffect } from "react";
import { Link, NavLink, useParams } from "react-router";
import { api } from "../api";
import { lectureTitle } from "../lectureTitle";
import { lecturesCount } from "../plural";
import { useApi } from "../useApi";
import { siteTitle } from "../ui/AppShell";
import { Breadcrumbs } from "../ui/Breadcrumbs";
import { ButtonLink } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { Skeleton } from "../ui/Skeleton";
import { Stack } from "../ui/Stack";
import { Text } from "../ui/Text";
import styles from "./CoursePage.module.css";

export function CoursePage() {
  const { courseId = "" } = useParams();
  const courses = useApi(api.courses, []);
  const course =
    courses.status === "success" ? courses.data.find((item) => item.id === courseId) : undefined;

  useEffect(() => {
    document.title = course ? `${course.title} · ${siteTitle}` : siteTitle;
  }, [course]);

  if (courses.status === "loading") return <Skeleton height={320} />;
  if (courses.status === "error") return <EmptyState title="Не удалось загрузить курс" />;
  if (!course)
    return <EmptyState title="Курс не найден" action={<ButtonLink to="/">Все курсы</ButtonLink>} />;

  return (
    <div className={styles.layout}>
      <nav className={styles.sidebar} aria-label="Курсы">
        <Text tone="subtle" size="xs">
          КУРСЫ
        </Text>
        {courses.data.map((item) => (
          <NavLink
            key={item.id}
            to={`/courses/${item.id}`}
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ""}`}
          >
            {item.title}
          </NavLink>
        ))}
      </nav>
      <Stack gap={5}>
        <Stack gap={3}>
          <Breadcrumbs items={[{ label: "Курсы", to: "/" }, { label: course.title }]} />
          <h1>{course.title}</h1>
          <Text tone="muted">{lecturesCount(course.lectures.length)}</Text>
        </Stack>
        <ul className={styles.lectures}>
          {course.lectures.map((lecture) => (
            <li key={lecture.title} className={styles.lecture}>
              <Link to={`/watch/${lecture.variants[0].id}`} className={styles.lectureTitle}>
                {lectureTitle(lecture.title)}
              </Link>
              <div className={styles.variants}>
                {lecture.variants.map((variant) => (
                  <ButtonLink
                    key={variant.id}
                    to={`/watch/${variant.id}`}
                    size="sm"
                    variant="ghost"
                  >
                    {variant.name}
                  </ButtonLink>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </Stack>
    </div>
  );
}
