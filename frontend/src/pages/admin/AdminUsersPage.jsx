import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ui/toast";
import SectionTitle from "../../components/ui/SectionTitle";
import EmptyState from "../../components/ui/EmptyState";
import AdminTable from "../../components/admin/AdminTable";
import SearchInput from "../../components/ui/SearchInput";
import Pagination from "../../components/ui/Pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../../components/ui/select";
import { api } from "../../lib/api";

const PAGE_SIZE = 8;
const ALL_STATUS_VALUE = "all-status";
const ALL_ROLE_VALUE = "all-role";

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("vi-VN");
}

function AdminUsersPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [draftQuery, setDraftQuery] = useState("");
  const [filters, setFilters] = useState({
    query: "",
    status: "",
    role: "",
    page: 1
  });
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 0,
    totalItems: 0
  });
  const [busyUserId, setBusyUserId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [roleDraft, setRoleDraft] = useState("user");

  function refresh(nextFilters = filters) {
    api
      .getAdminUsers(token, {
        query: nextFilters.query,
        status: nextFilters.status,
        role: nextFilters.role,
        page: nextFilters.page,
        pageSize: PAGE_SIZE
      })
      .then((payload) => {
        setUsers(payload.data.items);
        setPagination(payload.data.pagination);
      })
      .catch((error) =>
        toast({
          title: "Không tải được danh sách người dùng",
          description: error.message,
          variant: "destructive"
        })
      );
  }

  useEffect(() => {
    refresh(filters);
  }, [filters, token]);

  useEffect(() => {
    if (!users.length) {
      setSelectedUserId("");
      setSelectedUser(null);
      return;
    }

    const hasSelectedUser = users.some((user) => String(user.userId) === String(selectedUserId));
    if (!selectedUserId || !hasSelectedUser) {
      setSelectedUserId(String(users[0].userId));
    }
  }, [selectedUserId, users]);

  useEffect(() => {
    if (!selectedUserId) {
      return;
    }

    api
      .getAdminUserDetail(token, selectedUserId)
      .then((payload) => {
        setSelectedUser(payload.data);
        setRoleDraft(payload.data.role);
      })
      .catch((error) =>
        toast({
          title: "Không tải được chi tiết người dùng",
          description: error.message,
          variant: "destructive"
        })
      );
  }, [selectedUserId, toast, token]);

  async function handleToggleStatus(item) {
    setBusyUserId(item.userId);

    try {
      await api.patchAdminUser(token, item.userId, {
        status: item.status === "active" ? "disabled" : "active"
      });

      toast({
        title: "Đã cập nhật trạng thái người dùng",
        description: `${item.username} đã được cập nhật thành công.`
      });
      refresh();
      const detailPayload = await api.getAdminUserDetail(token, item.userId);
      setSelectedUser(detailPayload.data);
    } catch (error) {
      toast({
        title: "Không thể cập nhật người dùng",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setBusyUserId("");
    }
  }

  async function handleUpdateRole() {
    if (!selectedUser) {
      return;
    }

    setBusyUserId(selectedUser.userId);

    try {
      const payload = await api.patchAdminUser(token, selectedUser.userId, {
        roleCode: roleDraft
      });
      setSelectedUser(payload.data);
      toast({
        title: "Đã cập nhật vai trò",
        description: `${selectedUser.username} hiện có role ${roleDraft}.`
      });
      refresh();
    } catch (error) {
      toast({
        title: "Không thể cập nhật vai trò",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setBusyUserId("");
    }
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <SectionTitle
          eyebrow="Người dùng"
          title="Quản lý người dùng"
          meta={`${pagination.totalItems || 0} tài khoản`}
        />

        <div className="admin-filters">
          <SearchInput
            value={draftQuery}
            onChange={setDraftQuery}
            onSubmit={() =>
              setFilters((current) => ({ ...current, query: draftQuery.trim(), page: 1 }))
            }
            placeholder="Tìm theo username, email hoặc display name"
            buttonLabel="Tìm user"
          />

          <div className="admin-filter-row">
            <Select
              value={filters.status || ALL_STATUS_VALUE}
              onValueChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  status: value === ALL_STATUS_VALUE ? "" : value,
                  page: 1
                }))
              }
            >
              <SelectTrigger className="admin-filter-select">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_STATUS_VALUE}>Tất cả trạng thái</SelectItem>
                <SelectItem value="active">Đang hoạt động</SelectItem>
                <SelectItem value="disabled">Đã khóa</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.role || ALL_ROLE_VALUE}
              onValueChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  role: value === ALL_ROLE_VALUE ? "" : value,
                  page: 1
                }))
              }
            >
              <SelectTrigger className="admin-filter-select">
                <SelectValue placeholder="Tất cả vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_ROLE_VALUE}>Tất cả vai trò</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {users.length ? (
          <>
            <AdminTable
              columns={[
                {
                  key: "identity",
                  label: "Người dùng",
                  render: (item) => (
                    <button
                      type="button"
                      className="admin-identity-button"
                      onClick={() => setSelectedUserId(String(item.userId))}
                    >
                      <strong>{item.displayName || item.username}</strong>
                      <span>{item.email}</span>
                    </button>
                  )
                },
                { key: "role", label: "Vai trò" },
                {
                  key: "city",
                  label: "Thành phố",
                  render: (item) => item.city || "-"
                },
                {
                  key: "status",
                  label: "Trạng thái",
                  render: (item) => (
                    <span
                      className={`tag ${
                        item.status === "active" ? "tag--success" : "tag--warning"
                      }`}
                    >
                      {item.status === "active" ? "Đang hoạt động" : "Đã khóa"}
                    </span>
                  )
                },
                {
                  key: "actions",
                  label: "Thao tác",
                  render: (item) => (
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={busyUserId === item.userId}
                      onClick={() => handleToggleStatus(item)}
                    >
                      {busyUserId === item.userId
                        ? "Đang cập nhật..."
                        : item.status === "active"
                          ? "Khóa"
                          : "Mở"}
                    </button>
                  )
                }
              ]}
              rows={users}
              getRowKey={(row) => row.userId}
            />
            <Pagination
              page={pagination.page || 1}
              totalPages={pagination.totalPages || 0}
              onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
            />
          </>
        ) : (
          <EmptyState
            title="Chưa có người dùng"
            description="Danh sách người dùng sẽ xuất hiện tại đây."
          />
        )}
      </section>

      <section className="panel admin-user-detail">
        <SectionTitle
          eyebrow="Chi tiết"
          title="Thông tin người dùng đang chọn"
          description="Có thể xem thêm metrics và cập nhật role trực tiếp."
        />

        {selectedUser ? (
          <div className="admin-user-detail__content">
            <div className="admin-user-detail__summary">
              <strong>{selectedUser.displayName || selectedUser.username}</strong>
              <p>@{selectedUser.username}</p>
              <p>{selectedUser.email}</p>
              <p className="muted">Tạo lúc: {formatDateTime(selectedUser.createdAt)}</p>
            </div>

            <div className="admin-summary-grid">
              <article className="summary-card">
                <span>Bạn bè</span>
                <strong>{selectedUser.metrics.totalFriends}</strong>
              </article>
              <article className="summary-card">
                <span>Hội thoại</span>
                <strong>{selectedUser.metrics.totalConversations}</strong>
              </article>
              <article className="summary-card">
                <span>Lượt chơi</span>
                <strong>{selectedUser.metrics.totalResults}</strong>
              </article>
              <article className="summary-card">
                <span>Thành tựu</span>
                <strong>{selectedUser.metrics.totalAchievements}</strong>
              </article>
            </div>

            <div className="admin-user-actions">
              <label className="profile-field">
                Vai trò
                <Select value={roleDraft} onValueChange={setRoleDraft}>
                  <SelectTrigger className="admin-filter-select">
                    <SelectValue placeholder="Chọn vai trò" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </label>

              <div className="button-row">
                <button
                  type="button"
                  className="primary-button"
                  disabled={busyUserId === selectedUser.userId || roleDraft === selectedUser.role}
                  onClick={handleUpdateRole}
                >
                  {busyUserId === selectedUser.userId ? "Đang lưu..." : "Lưu role"}
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={busyUserId === selectedUser.userId}
                  onClick={() => handleToggleStatus(selectedUser)}
                >
                  {selectedUser.status === "active" ? "Khóa tài khoản" : "Mở tài khoản"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            title="Chưa chọn người dùng"
            description="Chọn một user trong bảng để xem chi tiết quản trị."
          />
        )}
      </section>
    </div>
  );
}

export default AdminUsersPage;
