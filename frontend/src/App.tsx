import { Route, Routes } from "react-router";
import { CoursesPage } from "./pages/CoursesPage";
import { WatchPage } from "./pages/WatchPage";
import { Layout } from "./ui/Layout";
import { Message } from "./ui/Message";

export function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<CoursesPage />} />
        <Route path="/watch/:id" element={<WatchPage />} />
        <Route path="*" element={<Message>Страница не найдена</Message>} />
      </Routes>
    </Layout>
  );
}
