import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import SectionTitle from "../../components/ui/SectionTitle";
import EmptyState from "../../components/ui/EmptyState";
import AdminTable from "../../components/admin/AdminTable";
import { api } from "../../lib/api";

function AdminStatisticsPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState([]);
  const [userStats, setUserStats] = useState(null);

  useEffect(() => {
    Promise.all([api.getAdminGameStatistics(token), api.getAdminUserStatistics(token)])
      .then(([gamesPayload, usersPayload]) => {
        setRows(gamesPayload.data);
        setUserStats(usersPayload.data);
      })
      .catch(() => {
        setRows([]);
        setUserStats(null);
      });
  }, [token]);

  return (
    <div className="page-stack">
      <section className="panel">
        <SectionTitle
          eyebrow="Thống kê"
          title="Thống kê hệ thống"
        />

        {rows.length ? (
          <AdminTable
            columns={[
              { key: "name", label: "Trò chơi" },
              { key: "totalResults", label: "Lượt chơi" },
              { key: "totalPlayers", label: "Người chơi" },
              { key: "totalRatings", label: "Đánh giá" },
              { key: "totalComments", label: "Bình luận" },
              {
                key: "averageRating",
                label: "Điểm trung bình",
                render: (row) => Number(row.averageRating || 0).toFixed(2)
              }
            ]}
            rows={rows}
            getRowKey={(row) => row.code}
          />
        ) : (
          <EmptyState
            title="Chưa có số liệu thống kê"
            description="Dữ liệu thống kê sẽ xuất hiện khi hệ thống có hoạt động."
          />
        )}
      </section>

      <section className="panel">
        <SectionTitle
          eyebrow="User Metrics"
          title="Phân bố tài khoản"
          description="Hiển thị tối thiểu 2 tiêu chí theo rubric: role và trạng thái tài khoản."
        />

        {userStats ? (
          <div className="admin-summary-grid">
            {userStats.byRole.map((item) => (
              <article key={`role-${item.label}`} className="summary-card">
                <span>Role: {item.label}</span>
                <strong>{item.total}</strong>
              </article>
            ))}
            {userStats.byStatus.map((item) => (
              <article key={`status-${item.label}`} className="summary-card">
                <span>Trạng thái: {item.label}</span>
                <strong>{item.total}</strong>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Chưa có thống kê user"
            description="Thống kê tài khoản sẽ xuất hiện khi backend trả dữ liệu."
          />
        )}
      </section>
    </div>
  );
}

export default AdminStatisticsPage;
