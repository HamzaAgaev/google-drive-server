import { Route, Routes } from "react-router";
import { CoursePage } from "./pages/CoursePage";
import { HomePage } from "./pages/HomePage";
import { WatchPage } from "./pages/WatchPage";
import { AppShell } from "./ui/AppShell";
import { ButtonLink } from "./ui/Button";
import { EmptyState } from "./ui/EmptyState";

export function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/courses/:courseId" element={<CoursePage />} />
        <Route path="/watch/:id" element={<WatchPage />} />
        <Route
          path="*"
          element={
            <EmptyState
              title="Страница не найдена"
              action={<ButtonLink to="/">Все курсы</ButtonLink>}
            />
          }
        />
      </Routes>
    </AppShell>
  );
}
