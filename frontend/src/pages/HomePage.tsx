import { useEffect } from "react";
import { FolderOpen } from "lucide-react";
import { api } from "../api";
import { formatDate } from "../formatDate";
import { lecturesCount } from "../plural";
import { useApi } from "../useApi";
import { siteTitle } from "../ui/AppShell";
import { Badge } from "../ui/Badge";
import { CardLink } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { Skeleton } from "../ui/Skeleton";
import { Stack } from "../ui/Stack";
import { Text } from "../ui/Text";
import styles from "./HomePage.module.css";

export function HomePage() {
  const courses = useApi(api.courses, []);

  useEffect(() => {
    document.title = siteTitle;
  }, []);

  return (
    <Stack gap={6}>
      <Stack gap={2}>
        <h1>Курсы</h1>
        <Text tone="muted">Записи лекций, отсортированные по последним занятиям</Text>
      </Stack>
      {courses.status === "loading" && (
        <div className={styles.grid}>
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} height={120} />
          ))}
        </div>
      )}
      {courses.status === "error" && (
        <EmptyState title="Не удалось загрузить курсы" description="Попробуйте обновить страницу" />
      )}
      {courses.status === "success" && courses.data.length === 0 && (
        <EmptyState
          icon={<FolderOpen size={22} />}
          title="Пока пусто"
          description="Записи появятся после первой синхронизации с Google Drive"
        />
      )}
      {courses.status === "success" && courses.data.length > 0 && (
        <div className={styles.grid}>
          {courses.data.map((course) => (
            <CardLink key={course.id} to={`/courses/${course.id}`}>
              <h2 className={styles.title}>{course.title}</h2>
              <div className={styles.meta}>
                <Badge>{lecturesCount(course.lectures.length)}</Badge>
                <Text tone="subtle" size="sm">
                  {formatDate(course.lectures[0].createdTime)}
                </Text>
              </div>
            </CardLink>
          ))}
        </div>
      )}
    </Stack>
  );
}
