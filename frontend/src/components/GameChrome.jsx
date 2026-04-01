import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function GameChrome({
  title,
  description,
  score,
  timeLabel,
  onBack,
  onSave,
  onLoad,
  onReset,
  onHint,
  hintVisible,
  children,
  sidebar
}) {
  const navigate = useNavigate();
  const { user } = useAuth();

  function dispatchDirectionalKey(key) {
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        key,
        bubbles: true
      })
    );
  }

  function handleBack() {
    if (onBack) {
      onBack();
      return;
    }

    navigate("/app/games");
  }

  const playerLabel = user?.username || "nguoi-choi";
  const playerRole = user?.role === "admin" ? "Admin" : "User";
  const playerEmail = user?.email || "Khach";

  return (
    <div className="game-shell">
      <section className="panel panel--game">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Phiên chơi</p>
            <h1>{title}</h1>
          </div>
          <div className="game-stats">
            <div>
              <span className="stat-label">Điểm</span>
              <strong>{score}</strong>
            </div>
            <div>
              <span className="stat-label">Thời gian</span>
              <strong>{timeLabel}</strong>
            </div>
          </div>
        </div>

        <div className="game-player-strip">
          <article className="game-player-card">
            <span className="stat-label">Nguoi choi</span>
            <strong>{playerLabel}</strong>
            <p>{playerEmail}</p>
          </article>
          <article className="game-player-card">
            <span className="stat-label">Vai tro</span>
            <strong>{playerRole}</strong>
            <p>Dang choi trong khu vuc client.</p>
          </article>
          <article className="game-player-card">
            <span className="stat-label">Mo ta game</span>
            <strong>{title}</strong>
            <p>{description || "Board game duoc dieu khien bang 5 nut chinh."}</p>
          </article>
        </div>

        {children}

        <section className="control-pad-card">
          <p className="eyebrow">Cụm điều khiển</p>
          <div className="control-pad-grid">
            <button
              type="button"
              className="control-key control-key--arrow control-key--up"
              onClick={() => dispatchDirectionalKey("ArrowUp")}
            >
              ↑
            </button>
            <button
              type="button"
              className="control-key control-key--arrow control-key--left"
              onClick={() => dispatchDirectionalKey("ArrowLeft")}
            >
              ←
            </button>
            <button
              type="button"
              className="control-key control-key--arrow control-key--down"
              onClick={() => dispatchDirectionalKey("ArrowDown")}
            >
              ↓
            </button>
            <button
              type="button"
              className="control-key control-key--arrow control-key--right"
              onClick={() => dispatchDirectionalKey("ArrowRight")}
            >
              →
            </button>
          </div>

          <div className="control-actions">
            <button type="button" className="control-action control-action--back" onClick={handleBack}>
              Quay lại
            </button>
            <button
              type="button"
              className="control-action control-action--enter"
              onClick={() => dispatchDirectionalKey("Enter")}
            >
              Chọn
            </button>
            <button type="button" className="control-action control-action--help" onClick={onHint}>
              {hintVisible ? "Ẩn" : "Trợ giúp"}
            </button>
          </div>
        </section>

        <footer className="game-footer">
          <span>Dieu khien chinh: Left / Right / Enter / Back / Hint</span>
          <span>Reset va Save/Load duoc tach rieng o khung ben phai</span>
          <span>HDPE Board Game Platform</span>
        </footer>
      </section>

      <aside className="panel panel--sidebar">
        <section className="sidebar-action-card">
          <p className="eyebrow">Thiết lập</p>
          <div className="sidebar-action-grid">
            <button type="button" className="secondary-button" onClick={onSave}>
              Lưu
            </button>
            <button type="button" className="secondary-button" onClick={onLoad}>
              Tải
            </button>
            <button type="button" className="secondary-button" onClick={onHint}>
              {hintVisible ? "Ẩn trợ giúp" : "Trợ giúp"}
            </button>
            <button type="button" className="secondary-button" onClick={onReset}>
              Đặt lại
            </button>
          </div>
        </section>

        {sidebar}
      </aside>
    </div>
  );
}

export default GameChrome;
