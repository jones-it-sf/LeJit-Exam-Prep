import { Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./components/AppShell";
import { AuthProvider } from "./lib/auth-context";
import { RequireAuth } from "./components/RequireAuth";
import CatalogPage from "./routes/CatalogPage";
import LoginPage from "./routes/LoginPage";
import ExamPracticePage from "./routes/ExamPracticePage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route index element={<CatalogPage />} />
          <Route path="exams/:slug/practice" element={<ExamPracticePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
