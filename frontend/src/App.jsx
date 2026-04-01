import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ClientLayout from "./layouts/ClientLayout";
import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import GamesPage from "./pages/client/GamesPage";
import ProfilePage from "./pages/client/ProfilePage";
import FriendsPage from "./pages/client/FriendsPage";
import MessagesPage from "./pages/client/MessagesPage";
import AchievementsPage from "./pages/client/AchievementsPage";
import RankingPage from "./pages/client/RankingPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminAchievementsPage from "./pages/admin/AdminAchievementsPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminGamesPage from "./pages/admin/AdminGamesPage";
import AdminStatisticsPage from "./pages/admin/AdminStatisticsPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <ClientLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="games" replace />} />
        <Route path="dashboard" element={<Navigate to="/app/games" replace />} />
        <Route path="games" element={<GamesPage />} />
        <Route path="games/:gameCode" element={<Navigate to="/app/games" replace />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="friends" element={<FriendsPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="achievements" element={<AchievementsPage />} />
        <Route path="ranking" element={<RankingPage />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="achievements" element={<AdminAchievementsPage />} />
        <Route path="games" element={<AdminGamesPage />} />
        <Route path="statistics" element={<AdminStatisticsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
