import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ui/toast";
import SectionTitle from "../../components/ui/SectionTitle";
import EmptyState from "../../components/ui/EmptyState";
import AdminTable from "../../components/admin/AdminTable";
import { api } from "../../lib/api";

const GAME_CONFIG_RULES = {
  tictactoe: {
    rows: { min: 3, max: 3 },
    cols: { min: 3, max: 3 },
    note: "Cố định 3x3 để giữ đúng luật Tic-Tac-Toe."
  },
  caro4: {
    rows: { min: 4, max: 19 },
    cols: { min: 4, max: 19 },
    note: "Board hub là 20x20 nên bàn chơi chỉ nên nằm trong 4x4 đến 19x19."
  },
  caro5: {
    rows: { min: 5, max: 19 },
    cols: { min: 5, max: 19 },
    note: "Board hub là 20x20 nên bàn chơi chỉ nên nằm trong 5x5 đến 19x19."
  },
  snake: {
    rows: { min: 8, max: 19 },
    cols: { min: 8, max: 19 },
    note: "Board hub là 20x20 nên rắn chỉ cấu hình đến 19x19 để còn vùng giới hạn rõ."
  },
  match3: {
    rows: { min: 6, max: 19 },
    cols: { min: 6, max: 19 },
    note: "Board hub là 20x20 nên ghép hàng 3 chỉ cấu hình đến 19x19."
  },
  memory: {
    rows: { min: 2, max: 6 },
    cols: { min: 2, max: 6 },
    requireEvenCells: true,
    note: "Tổng số ô phải chẵn để ghép cặp, tối đa 6x6 để còn dễ đọc."
  },
  "free-draw": {
    rows: { min: 4, max: 15 },
    cols: { min: 4, max: 15 },
    note: "Vùng vẽ chỉ nên nhỏ hơn 16x16 để hiển thị gọn trong board."
  }
};

function getGameRule(gameCode) {
  return (
    GAME_CONFIG_RULES[gameCode] || {
      rows: { min: 1, max: 19 },
      cols: { min: 1, max: 19 },
      note: "Dùng cấu hình trong giới hạn board hub."
    }
  );
}

function validateGameDraft(gameCode, draft) {
  const rule = getGameRule(gameCode);
  const rows = Number(draft.defaultBoardRows);
  const cols = Number(draft.defaultBoardCols);

  if (!Number.isInteger(rows) || rows < rule.rows.min || rows > rule.rows.max) {
    if (rule.rows.min === rule.rows.max) {
      return `Số hàng của ${gameCode} phải cố định là ${rule.rows.min}.`;
    }

    return `Số hàng của ${gameCode} phải nằm trong khoảng ${rule.rows.min}-${rule.rows.max}.`;
  }

  if (!Number.isInteger(cols) || cols < rule.cols.min || cols > rule.cols.max) {
    if (rule.cols.min === rule.cols.max) {
      return `Số cột của ${gameCode} phải cố định là ${rule.cols.min}.`;
    }

    return `Số cột của ${gameCode} phải nằm trong khoảng ${rule.cols.min}-${rule.cols.max}.`;
  }

  if (rule.requireEvenCells && (rows * cols) % 2 !== 0) {
    return `${gameCode} yêu cầu tổng số ô là số chẵn để ghép cặp.`;
  }

  return "";
}

function buildDrafts(games = []) {
  return Object.fromEntries(
    games.map((game) => [
      game.code,
      {
        defaultBoardRows: game.defaultBoardRows,
        defaultBoardCols: game.defaultBoardCols,
        defaultTimerSeconds: game.defaultTimerSeconds,
        isEnabled: game.isEnabled
      }
    ])
  );
}

function AdminGamesPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [games, setGames] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [busyGameCode, setBusyGameCode] = useState("");

  function refresh() {
    api
      .getAdminGames(token)
      .then((payload) => {
        setGames(payload.data);
        setDrafts(buildDrafts(payload.data));
      })
      .catch((error) =>
        toast({
          title: "Không tải được danh sách trò chơi",
          description: error.message,
          variant: "destructive"
        })
      );
  }

  useEffect(() => {
    refresh();
  }, [token]);

  async function handleSaveGame(game) {
    const validationMessage = validateGameDraft(game.code, drafts[game.code]);

    if (validationMessage) {
      toast({
        title: "Cấu hình chưa hợp lệ",
        description: validationMessage,
        variant: "destructive"
      });
      return;
    }

    setBusyGameCode(game.code);

    try {
      const payload = await api.patchAdminGame(token, game.code, drafts[game.code]);
      const nextGame = payload.data;
      setGames((current) =>
        current.map((item) => (item.code === game.code ? nextGame : item))
      );
      setDrafts((current) => ({
        ...current,
        [game.code]: {
          defaultBoardRows: nextGame.defaultBoardRows,
          defaultBoardCols: nextGame.defaultBoardCols,
          defaultTimerSeconds: nextGame.defaultTimerSeconds,
          isEnabled: nextGame.isEnabled
        }
      }));

      toast({
        title: "Đã cập nhật cấu hình trò chơi",
        description: `${game.name} đã được cập nhật thành công.`
      });
    } catch (error) {
      toast({
        title: "Không thể cập nhật trò chơi",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setBusyGameCode("");
    }
  }

  return (
    <section className="panel">
      <SectionTitle
        eyebrow="Trò chơi"
        title="Quản lý trò chơi"
      />

      {games.length ? (
        <AdminTable
          columns={[
            { key: "name", label: "Trò chơi" },
            {
              key: "isEnabled",
              label: "Trạng thái",
              render: (game) => (
                <span
                  className={`tag ${
                    drafts[game.code]?.isEnabled ? "tag--success" : "tag--warning"
                  }`}
                >
                  {drafts[game.code]?.isEnabled ? "Đang bật" : "Đang tắt"}
                </span>
              )
            },
            {
              key: "board",
              label: "Bàn mặc định",
              render: (game) => (
                <div>
                  <div className="admin-inline-grid">
                    <input
                      type="number"
                      min={getGameRule(game.code).rows.min}
                      max={getGameRule(game.code).rows.max}
                      disabled={
                        getGameRule(game.code).rows.min === getGameRule(game.code).rows.max
                      }
                      value={drafts[game.code]?.defaultBoardRows ?? game.defaultBoardRows}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [game.code]: {
                            ...current[game.code],
                            defaultBoardRows: Number(event.target.value || 0)
                          }
                        }))
                      }
                    />
                    <input
                      type="number"
                      min={getGameRule(game.code).cols.min}
                      max={getGameRule(game.code).cols.max}
                      disabled={
                        getGameRule(game.code).cols.min === getGameRule(game.code).cols.max
                      }
                      value={drafts[game.code]?.defaultBoardCols ?? game.defaultBoardCols}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [game.code]: {
                            ...current[game.code],
                            defaultBoardCols: Number(event.target.value || 0)
                          }
                        }))
                      }
                    />
                  </div>
                  <p className="muted">{getGameRule(game.code).note}</p>
                </div>
              )
            },
            {
              key: "timer",
              label: "Thời gian",
              render: (game) => (
                <input
                  type="number"
                  min="10"
                  max="7200"
                  value={drafts[game.code]?.defaultTimerSeconds ?? game.defaultTimerSeconds}
                  onChange={(event) =>
                    setDrafts((current) => ({
                      ...current,
                      [game.code]: {
                        ...current[game.code],
                        defaultTimerSeconds: Number(event.target.value || 0)
                      }
                    }))
                  }
                />
              )
            },
            {
              key: "actions",
              label: "Thao tác",
              render: (game) => (
                <div className="button-row">
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={busyGameCode === game.code}
                    onClick={() =>
                      setDrafts((current) => ({
                        ...current,
                        [game.code]: {
                          ...current[game.code],
                          isEnabled: !current[game.code].isEnabled
                        }
                      }))
                    }
                  >
                    {drafts[game.code]?.isEnabled ? "Chuyển sang tắt" : "Chuyển sang bật"}
                  </button>
                  <button
                    type="button"
                    className="primary-button"
                    disabled={busyGameCode === game.code}
                    onClick={() => handleSaveGame(game)}
                  >
                    {busyGameCode === game.code ? "Đang lưu..." : "Lưu cấu hình"}
                  </button>
                </div>
              )
            }
          ]}
          rows={games}
          getRowKey={(row) => row.code}
        />
      ) : (
        <EmptyState title="Chưa có trò chơi" description="Danh sách trò chơi sẽ xuất hiện tại đây." />
      )}
    </section>
  );
}

export default AdminGamesPage;
