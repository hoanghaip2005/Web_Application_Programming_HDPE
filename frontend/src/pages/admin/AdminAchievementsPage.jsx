import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ui/toast";
import SectionTitle from "../../components/ui/SectionTitle";
import EmptyState from "../../components/ui/EmptyState";
import AdminTable from "../../components/admin/AdminTable";
import SearchInput from "../../components/ui/SearchInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../../components/ui/select";
import { api } from "../../lib/api";

const ALL_STATUS_VALUE = "all-status";
const ALL_GAME_VALUE = "all-games";
const CONDITION_OPTIONS = [
  ["wins", "Số trận thắng"],
  ["score", "Mốc điểm"],
  ["colored_cells", "Số ô đã tô"]
];

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("vi-VN");
}

function buildDraft(achievement) {
  return {
    name: achievement.name,
    description: achievement.description,
    points: achievement.points,
    conditionValue: achievement.conditionValue,
    isActive: achievement.isActive
  };
}

function createEmptyAchievementDraft(games = []) {
  return {
    gameCode: games[0]?.code || "",
    code: "",
    name: "",
    description: "",
    points: 10,
    conditionType: "wins",
    conditionValue: 1,
    isActive: true
  };
}

function sortAchievements(items = []) {
  return [...items].sort((left, right) => {
    if (left.isActive !== right.isActive) {
      return Number(right.isActive) - Number(left.isActive);
    }

    if (left.points !== right.points) {
      return right.points - left.points;
    }

    return left.name.localeCompare(right.name, "vi");
  });
}

function AdminAchievementsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [games, setGames] = useState([]);
  const [draftQuery, setDraftQuery] = useState("");
  const [filters, setFilters] = useState({
    query: "",
    status: "",
    gameCode: ""
  });
  const [achievements, setAchievements] = useState([]);
  const [selectedAchievementId, setSelectedAchievementId] = useState("");
  const [mode, setMode] = useState("edit");
  const [draft, setDraft] = useState(null);
  const [createDraft, setCreateDraft] = useState(createEmptyAchievementDraft());
  const [busyAchievementId, setBusyAchievementId] = useState("");

  useEffect(() => {
    api
      .getAdminGames(token)
      .then((payload) => {
        setGames(payload.data);
        setCreateDraft((current) => ({
          ...current,
          gameCode: current.gameCode || payload.data[0]?.code || ""
        }));
      })
      .catch((error) =>
        toast({
          title: "Không tải được danh mục game",
          description: error.message,
          variant: "destructive"
        })
      );
  }, [toast, token]);

  useEffect(() => {
    api
      .getAdminAchievements(token, filters)
      .then((payload) => {
        setAchievements(sortAchievements(payload.data.items));
      })
      .catch((error) =>
        toast({
          title: "Không tải được danh sách thành tựu",
          description: error.message,
          variant: "destructive"
        })
      );
  }, [filters, toast, token]);

  useEffect(() => {
    if (!achievements.length) {
      setSelectedAchievementId("");
      setDraft(null);
      return;
    }

    const hasSelectedAchievement = achievements.some(
      (achievement) => achievement.achievementId === selectedAchievementId
    );

    if (!selectedAchievementId || !hasSelectedAchievement) {
      setSelectedAchievementId(achievements[0].achievementId);
    }
  }, [achievements, selectedAchievementId]);

  const selectedAchievement = useMemo(
    () =>
      achievements.find((achievement) => achievement.achievementId === selectedAchievementId) ||
      null,
    [achievements, selectedAchievementId]
  );

  useEffect(() => {
    if (!selectedAchievement) {
      setDraft(null);
      return;
    }

    setDraft(buildDraft(selectedAchievement));
  }, [selectedAchievement]);

  function openCreateMode() {
    setMode("create");
    setCreateDraft(createEmptyAchievementDraft(games));
  }

  function openEditMode(achievementId) {
    setMode("edit");
    setSelectedAchievementId(achievementId);
  }

  async function handleSaveAchievement() {
    if (!selectedAchievement || !draft) {
      return;
    }

    setBusyAchievementId(selectedAchievement.achievementId);

    try {
      const payload = await api.patchAdminAchievement(token, selectedAchievement.achievementId, {
        name: draft.name.trim(),
        description: draft.description.trim(),
        points: Number(draft.points),
        conditionValue: Number(draft.conditionValue),
        isActive: draft.isActive
      });

      setAchievements((current) =>
        sortAchievements(current.map((achievement) =>
          achievement.achievementId === selectedAchievement.achievementId
            ? payload.data
            : achievement
        ))
      );
      setDraft(buildDraft(payload.data));

      toast({
        title: "Đã cập nhật thành tựu",
        description: `${payload.data.name} đã được lưu thành công.`
      });
    } catch (error) {
      toast({
        title: "Không thể cập nhật thành tựu",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setBusyAchievementId("");
    }
  }

  async function handleCreateAchievement() {
    setBusyAchievementId("create");

    try {
      const payload = await api.postAdminAchievement(token, {
        gameCode: createDraft.gameCode,
        code: createDraft.code.trim(),
        name: createDraft.name.trim(),
        description: createDraft.description.trim(),
        points: Number(createDraft.points),
        conditionType: createDraft.conditionType,
        conditionValue: Number(createDraft.conditionValue),
        isActive: createDraft.isActive
      });

      setAchievements((current) => sortAchievements([payload.data, ...current]));
      setSelectedAchievementId(payload.data.achievementId);
      setMode("edit");
      setDraft(buildDraft(payload.data));
      setDraftQuery("");
      setFilters({
        query: "",
        status: "",
        gameCode: ""
      });
      setCreateDraft(createEmptyAchievementDraft(games));

      toast({
        title: "Đã tạo thành tựu mới",
        description: `${payload.data.name} đã được thêm vào hệ thống.`
      });
    } catch (error) {
      toast({
        title: "Không thể tạo thành tựu",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setBusyAchievementId("");
    }
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <SectionTitle
          eyebrow="Thành tựu"
          title="Quản lý thành tựu"
          meta={`${achievements.length} thành tựu`}
        />

        <div className="admin-filters">
          <SearchInput
            value={draftQuery}
            onChange={setDraftQuery}
            onSubmit={() =>
              setFilters((current) => ({
                ...current,
                query: draftQuery.trim()
              }))
            }
            placeholder="Tìm theo tên, mã hoặc mô tả thành tựu"
            buttonLabel="Tìm thành tựu"
          />

          <div className="admin-filter-row">
            <Select
              value={filters.status || ALL_STATUS_VALUE}
              onValueChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  status: value === ALL_STATUS_VALUE ? "" : value
                }))
              }
            >
              <SelectTrigger className="admin-filter-select">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_STATUS_VALUE}>Tất cả trạng thái</SelectItem>
                <SelectItem value="active">Đang bật</SelectItem>
                <SelectItem value="inactive">Đang tắt</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.gameCode || ALL_GAME_VALUE}
              onValueChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  gameCode: value === ALL_GAME_VALUE ? "" : value
                }))
              }
            >
              <SelectTrigger className="admin-filter-select">
                <SelectValue placeholder="Tất cả game" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_GAME_VALUE}>Tất cả game</SelectItem>
                {games.map((game) => (
                  <SelectItem key={game.code} value={game.code}>
                    {game.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="button-row">
            <button type="button" className="primary-button" onClick={openCreateMode}>
              Tạo thành tựu mới
            </button>
            {mode === "create" ? (
              <button
                type="button"
                className="secondary-button"
                onClick={() => setMode("edit")}
              >
                Quay lại chỉnh sửa
              </button>
            ) : null}
          </div>
        </div>

        {achievements.length ? (
          <AdminTable
            columns={[
              {
                key: "achievement",
                label: "Thành tựu",
                render: (achievement) => (
                  <button
                    type="button"
                    className="admin-identity-button"
                    onClick={() => openEditMode(achievement.achievementId)}
                  >
                    <strong>{achievement.name}</strong>
                    <span>{achievement.code}</span>
                  </button>
                )
              },
              { key: "gameName", label: "Trò chơi" },
              { key: "points", label: "Điểm" },
              {
                key: "condition",
                label: "Điều kiện",
                render: (achievement) =>
                  `${achievement.conditionLabel}: ${achievement.conditionValue}`
              },
              {
                key: "isActive",
                label: "Trạng thái",
                render: (achievement) => (
                  <span
                    className={`tag ${achievement.isActive ? "tag--success" : "tag--warning"}`}
                  >
                    {achievement.isActive ? "Đang bật" : "Đang tắt"}
                  </span>
                )
              },
              { key: "unlockedUsers", label: "Đã mở khóa" }
            ]}
            rows={achievements}
            getRowKey={(row) => row.achievementId}
          />
        ) : (
          <EmptyState
            title="Chưa có thành tựu"
            description="Danh sách thành tựu sẽ xuất hiện tại đây khi backend trả dữ liệu."
          />
        )}
      </section>

      <section className="panel admin-achievement-detail">
        <SectionTitle
          eyebrow="Chi tiết"
          title={mode === "create" ? "Tạo thành tựu mới" : "Cấu hình thành tựu đang chọn"}
          description={
            mode === "create"
              ? "Tạo một thành tựu mới với game, điều kiện và điểm thưởng riêng."
              : "Chỉnh sửa nội dung hiển thị, điểm thưởng và ngưỡng điều kiện mở khóa."
          }
        />

        {mode === "create" ? (
          <div className="admin-user-detail__content">
            <div className="admin-user-detail__summary">
              <strong>Tạo thành tựu mới</strong>
              <p>Điền đủ game, mã và điều kiện để hệ thống bắt đầu theo dõi.</p>
            </div>

            <div className="admin-user-actions">
              <div className="admin-detail-grid">
                <label className="profile-field">
                  Trò chơi
                  <Select
                    value={createDraft.gameCode}
                    onValueChange={(value) =>
                      setCreateDraft((current) => ({
                        ...current,
                        gameCode: value
                      }))
                    }
                  >
                    <SelectTrigger className="admin-filter-select">
                      <SelectValue placeholder="Chọn game" />
                    </SelectTrigger>
                    <SelectContent>
                      {games.map((game) => (
                        <SelectItem key={game.code} value={game.code}>
                          {game.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>

                <label className="profile-field">
                  Mã thành tựu
                  <input
                    value={createDraft.code}
                    placeholder="vd: snake-master"
                    onChange={(event) =>
                      setCreateDraft((current) => ({
                        ...current,
                        code: event.target.value
                      }))
                    }
                  />
                </label>

                <label className="profile-field">
                  Tên thành tựu
                  <input
                    value={createDraft.name}
                    onChange={(event) =>
                      setCreateDraft((current) => ({
                        ...current,
                        name: event.target.value
                      }))
                    }
                  />
                </label>

                <label className="profile-field">
                  Điểm thưởng
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    value={createDraft.points}
                    onChange={(event) =>
                      setCreateDraft((current) => ({
                        ...current,
                        points: Number(event.target.value || 0)
                      }))
                    }
                  />
                </label>

                <label className="profile-field">
                  Loại điều kiện
                  <Select
                    value={createDraft.conditionType}
                    onValueChange={(value) =>
                      setCreateDraft((current) => ({
                        ...current,
                        conditionType: value
                      }))
                    }
                  >
                    <SelectTrigger className="admin-filter-select">
                      <SelectValue placeholder="Chọn điều kiện" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITION_OPTIONS.map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>

                <label className="profile-field">
                  Giá trị điều kiện
                  <input
                    type="number"
                    min="1"
                    max="100000"
                    value={createDraft.conditionValue}
                    onChange={(event) =>
                      setCreateDraft((current) => ({
                        ...current,
                        conditionValue: Number(event.target.value || 0)
                      }))
                    }
                  />
                </label>

                <label className="profile-field profile-field--full">
                  Mô tả
                  <textarea
                    rows="4"
                    value={createDraft.description}
                    onChange={(event) =>
                      setCreateDraft((current) => ({
                        ...current,
                        description: event.target.value
                      }))
                    }
                  />
                </label>

                <label className="profile-field">
                  Trạng thái
                  <button
                    type="button"
                    className="secondary-button admin-toggle-button"
                    onClick={() =>
                      setCreateDraft((current) => ({
                        ...current,
                        isActive: !current.isActive
                      }))
                    }
                  >
                    {createDraft.isActive ? "Tạo ở trạng thái bật" : "Tạo ở trạng thái tắt"}
                  </button>
                </label>
              </div>

              <div className="button-row">
                <button
                  type="button"
                  className="primary-button"
                  disabled={busyAchievementId === "create"}
                  onClick={handleCreateAchievement}
                >
                  {busyAchievementId === "create" ? "Đang tạo..." : "Lưu thành tựu mới"}
                </button>
              </div>
            </div>
          </div>
        ) : selectedAchievement && draft ? (
          <div className="admin-user-detail__content">
            <div className="admin-user-detail__summary">
              <strong>{selectedAchievement.name}</strong>
              <p>Mã: {selectedAchievement.code}</p>
              <p>Game: {selectedAchievement.gameName}</p>
              <p className="muted">
                Cập nhật lần cuối: {formatDateTime(selectedAchievement.updatedAt)}
              </p>
            </div>

            <div className="admin-summary-grid">
              <article className="summary-card">
                <span>Điểm thưởng</span>
                <strong>{selectedAchievement.points}</strong>
              </article>
              <article className="summary-card">
                <span>Đã mở khóa</span>
                <strong>{selectedAchievement.unlockedUsers}</strong>
              </article>
              <article className="summary-card">
                <span>Loại điều kiện</span>
                <strong>{selectedAchievement.conditionLabel}</strong>
              </article>
              <article className="summary-card">
                <span>Trạng thái</span>
                <strong>{selectedAchievement.isActive ? "Đang bật" : "Đang tắt"}</strong>
              </article>
            </div>

            <div className="admin-user-actions">
              <div className="admin-detail-grid">
                <label className="profile-field">
                  Tên thành tựu
                  <input
                    value={draft.name}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        name: event.target.value
                      }))
                    }
                  />
                </label>

                <label className="profile-field">
                  Điểm thưởng
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    value={draft.points}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        points: Number(event.target.value || 0)
                      }))
                    }
                  />
                </label>

                <label className="profile-field">
                  {selectedAchievement.conditionLabel}
                  <input
                    type="number"
                    min="1"
                    max="100000"
                    value={draft.conditionValue}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        conditionValue: Number(event.target.value || 0)
                      }))
                    }
                  />
                </label>

                <label className="profile-field">
                  Trạng thái
                  <button
                    type="button"
                    className="secondary-button admin-toggle-button"
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        isActive: !current.isActive
                      }))
                    }
                  >
                    {draft.isActive ? "Đang bật, bấm để tắt" : "Đang tắt, bấm để bật"}
                  </button>
                </label>

                <label className="profile-field profile-field--full">
                  Mô tả
                  <textarea
                    rows="4"
                    value={draft.description}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        description: event.target.value
                      }))
                    }
                  />
                </label>
              </div>

              <div className="button-row">
                <button
                  type="button"
                  className="primary-button"
                  disabled={busyAchievementId === selectedAchievement.achievementId}
                  onClick={handleSaveAchievement}
                >
                  {busyAchievementId === selectedAchievement.achievementId
                    ? "Đang lưu..."
                    : "Lưu thành tựu"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            title="Chưa chọn thành tựu"
            description="Chọn một thành tựu trong bảng để chỉnh sửa cấu hình."
          />
        )}
      </section>
    </div>
  );
}

export default AdminAchievementsPage;
