import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import SectionTitle from "../../components/ui/SectionTitle";
import EmptyState from "../../components/ui/EmptyState";
import { api } from "../../lib/api";

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("vi-VN");
}

function AdminDashboardPage() {
  const { token } = useAuth();
  const [overview, setOverview] = useState(null);
  const [gameStats, setGameStats] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.getAdminOverview(token),
      api.getAdminGameStatistics(token),
      api.getAdminUserStatistics(token)
    ])
      .then(([overviewPayload, gamesPayload, usersPayload]) => {
        setOverview(overviewPayload.data);
        setGameStats(gamesPayload.data);
        setUserStats(usersPayload.data);
        setError("");
      })
      .catch((requestError) => {
        setError(requestError.message);
      });
  }, [token]);

  if (error) {
    return (
      <section className="panel">
        <EmptyState
          title="Không tải được dashboard quản trị"
          description={error}
        />
      </section>
    );
  }

  const topGames = [...gameStats]
    .sort((left, right) => right.totalResults - left.totalResults)
    .slice(0, 4);

  return (
    <div className="page-stack">
      <section className="panel admin-dashboard">
        <SectionTitle
          eyebrow="Dashboard"
          title="Tổng quan hệ thống"
          meta={overview?.databaseConnected ? "DB connected" : "DB unavailable"}
        />

        <div className="stats-grid">
          <article className="stats-card">
            <span>Tổng tài khoản</span>
            <strong>{overview?.totalUsers ?? 0}</strong>
            <p>{overview?.activeUsers ?? 0} đang hoạt động</p>
          </article>
          <article className="stats-card">
            <span>Tổng trò chơi</span>
            <strong>{overview?.totalGames ?? 0}</strong>
            <p>{overview?.topGame?.name || "Chưa có game nổi bật"}</p>
          </article>
          <article className="stats-card">
            <span>Tổng lượt chơi</span>
            <strong>{overview?.totalResults ?? 0}</strong>
            <p>
              Top game: {overview?.topGame?.totalResults ?? 0} lượt
            </p>
          </article>
        </div>
      </section>

      <div className="split-layout admin-dashboard-layout">
        <section className="panel">
          <SectionTitle
            eyebrow="Game hot"
            title="Top trò chơi theo lượt chơi"
            description="Ưu tiên kiểm tra các game đang có lưu lượng cao."
          />

          {topGames.length ? (
            <div className="stack-list">
              {topGames.map((game, index) => (
                <article key={game.code} className="feature-card">
                  <strong>
                    #{index + 1} {game.name}
                  </strong>
                  <p>
                    Lượt chơi: {game.totalResults} | Người chơi: {game.totalPlayers} | Bình
                    chọn: {Number(game.averageRating || 0).toFixed(2)}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Chưa có dữ liệu game"
              description="Thống kê game sẽ xuất hiện khi hệ thống có kết quả chơi."
            />
          )}
        </section>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
