import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { api } from "../lib/api";

const adminLinks = [
  ["dashboard", "Dashboard"],
  ["users", "Người dùng"],
  ["achievements", "Thành tựu"],
  ["games", "Trò chơi"],
  ["statistics", "Thống kê"]
];

function AdminLayout() {
  const { user, token, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="app-layout app-layout--admin">
      <aside className="sidebar sidebar--admin">
        <div>
          <p className="eyebrow">HDPE Quản trị</p>
          <p className="muted">Quản trị hệ thống và danh mục trò chơi</p>
          <span className="layout-pill layout-pill--admin">Admin zone</span>
        </div>

        <nav className="nav-list">
          {adminLinks.map(([path, label]) => (
            <NavLink key={path} to={`/admin/${path}`} className="nav-link">
              {label}
            </NavLink>
          ))}
          <a
            href={api.docsUrl(token)}
            className="nav-link"
            target="_blank"
            rel="noreferrer"
          >
            Swagger UI
          </a>
          <NavLink to="/app/games" className="nav-link">
            Quay lại khu vực người chơi
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="secondary-button" onClick={toggleTheme}>
            Giao diện: {theme}
          </button>
          <button type="button" className="secondary-button" onClick={logout}>
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
