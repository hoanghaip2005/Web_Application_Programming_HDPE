import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { useToast } from "../../components/ui/toast";

function getInitials(displayName, username) {
  const source = (displayName || username || "Người chơi").trim();
  const parts = source.split(/\s+/).filter(Boolean);

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Không thể đọc file ảnh."));
    reader.readAsDataURL(file);
  });
}

function ProfilePage() {
  const { user, token } = useAuth();
  const { toast, dismiss } = useToast();
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [form, setForm] = useState({
    displayName: "",
    bio: "",
    city: ""
  });

  useEffect(() => {
    api
      .getProfile(token)
      .then((payload) => {
        setProfile(payload.data);
        setForm({
          displayName: payload.data.displayName || "",
          bio: payload.data.bio || "",
          city: payload.data.city || ""
        });
      })
      .catch((error) =>
        toast({
          title: "Không tải được hồ sơ",
          description: error.message,
          variant: "destructive"
        })
      );
  }, [toast, token]);

  const previewName = form.displayName.trim() || profile?.displayName || user?.username || "Người chơi";
  const previewAvatar = profile?.avatarUrl || "";
  const previewCity = form.city.trim() || profile?.city || "Chưa cập nhật";
  const initials = useMemo(
    () => getInitials(form.displayName || profile?.displayName, user?.username),
    [form.displayName, profile?.displayName, user?.username]
  );

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "File không hợp lệ",
        description: "Chỉ chấp nhận file ảnh.",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Ảnh quá lớn",
        description: "Dung lượng tối đa là 5MB.",
        variant: "destructive"
      });
      return;
    }

    setUploadingAvatar(true);
    const loadingToastId = toast({
      title: "Đang tải ảnh đại diện",
      description: "Ảnh đang được gửi lên Supabase.",
      variant: "loading",
      duration: 60000
    });

    try {
      const base64Data = await readFileAsBase64(file);
      const payload = await api.uploadProfileAvatar(token, {
        fileName: file.name,
        contentType: file.type,
        base64Data
      });

      setProfile(payload.data);
      dismiss(loadingToastId);
      toast({
        title: "Đã cập nhật ảnh đại diện",
        description: "Ảnh mới đã được lưu lên Supabase."
      });
    } catch (error) {
      dismiss(loadingToastId);
      toast({
        title: "Tải ảnh thất bại",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploadingAvatar(false);
    }
  }

  return (
    <div className="page-stack">
      <section className="panel profile-page">
        <div className="profile-simple-head">
          <button
            type="button"
            className="profile-avatar profile-avatar--button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            title="Nhấn để tải ảnh đại diện"
          >
            {previewAvatar ? (
              <img src={previewAvatar} alt={`Avatar của ${previewName}`} />
            ) : (
              <span>{initials}</span>
            )}
          </button>

          <div className="profile-simple-copy">
            <p className="eyebrow">Hồ sơ</p>
            <h1>{previewName}</h1>
            <p>{user?.email || "-"}</p>
            <p className="muted">
              {uploadingAvatar ? "Đang tải ảnh lên..." : "Nhấn vào avatar để tải ảnh lên Supabase."}
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => {
            handleAvatarChange(event).catch((error) =>
              toast({
                title: "Tải ảnh thất bại",
                description: error.message,
                variant: "destructive"
              })
            );
          }}
        />

        <form
          className="stack-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (savingProfile) {
              return;
            }

            setSavingProfile(true);
            const loadingToastId = toast({
              title: "Đang lưu hồ sơ",
              description: "Thông tin của bạn đang được cập nhật.",
              variant: "loading",
              duration: 60000
            });

            api
              .updateProfile(token, form)
              .then((payload) => {
                setProfile(payload.data);
                dismiss(loadingToastId);
                toast({
                  title: "Đã cập nhật hồ sơ",
                  description: "Thông tin mới đã được lưu thành công."
                });
              })
              .catch((error) => {
                dismiss(loadingToastId);
                toast({
                  title: "Cập nhật thất bại",
                  description: error.message,
                  variant: "destructive"
                });
              })
              .finally(() => {
                setSavingProfile(false);
              });
          }}
        >
          <div className="profile-form-grid">
            <label className="profile-field">
              Tên hiển thị
              <input
                value={form.displayName}
                placeholder="Ví dụ: Hoàng Hải"
                onChange={(event) =>
                  setForm((current) => ({ ...current, displayName: event.target.value }))
                }
              />
            </label>

            <label className="profile-field">
              Thành phố
              <input
                value={form.city}
                placeholder="Ví dụ: Hồ Chí Minh"
                onChange={(event) =>
                  setForm((current) => ({ ...current, city: event.target.value }))
                }
              />
            </label>

            <label className="profile-field profile-field--full">
              Giới thiệu
              <textarea
                rows="4"
                placeholder="Viết vài dòng ngắn về bạn..."
                value={form.bio}
                onChange={(event) =>
                  setForm((current) => ({ ...current, bio: event.target.value }))
                }
              />
            </label>
          </div>

          <div className="profile-actions">
            <button type="submit" className="primary-button" disabled={savingProfile}>
              {savingProfile ? "Đang lưu..." : "Lưu hồ sơ"}
            </button>
            <p className="muted">{previewCity}</p>
          </div>
        </form>
      </section>
    </div>
  );
}

export default ProfilePage;
