import { Link } from "react-router-dom";
import { gameCatalog } from "../data/games";

function HomePage() {
  return (
    <div className="landing-page">
      <section className="hero-card">
        <p className="eyebrow">Dự án Lập trình Ứng dụng Web</p>
        <h1>HDPE Board Game Platform</h1>
        <p>
          Khung dự án gồm React SPA cho Client/Admin, backend Express + Knex, và
          menu board game theo đúng yêu cầu đã phân tích.
        </p>
        <div className="button-row">
          <Link to="/login" className="primary-button">
            Đăng nhập
          </Link>
          <Link to="/register" className="secondary-button">
            Tạo tài khoản
          </Link>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Danh mục trò chơi</p>
            <h2>7 game bắt buộc trong đề bài</h2>
          </div>
        </div>
        <div className="card-grid">
          {gameCatalog.map((game) => (
            <article key={game.code} className="feature-card">
              <strong>{game.name}</strong>
              <p>{game.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default HomePage;
