import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const links = [
  ["games", "Trò chơi"],
  ["profile", "Hồ sơ"],
  ["friends", "Bạn bè"],
  ["messages", "Tin nhắn"],
  ["achievements", "Thành tựu"],
  ["ranking", "Xếp hạng"]
];

function ClientLayout() {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="app-layout">
      <aside className="sidebar sidebar--client">
        <div>
          <p className="eyebrow">HDPE Client</p>
          <h2>{user?.username || "Người chơi"}</h2>
          <p className="muted">{user?.email || "Tài khoản demo"}</p>
          <span className="layout-pill">Client zone</span>
        </div>

        <nav className="nav-list">
          {links.map(([path, label]) => (
            <NavLink key={path} to={`/app/${path}`} className="nav-link">
              {label}
            </NavLink>
          ))}
          {isAdmin ? (
            <NavLink to="/admin/users" className="nav-link">
              Quản trị
            </NavLink>
          ) : null}
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

export default ClientLayout;
