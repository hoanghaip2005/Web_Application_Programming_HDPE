import { memo } from "react";
import { LoaderCircle, MessageSquareMore } from "lucide-react";

function getInitials(label) {
  return String(label || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function formatTimestamp(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit"
  });
}

function ConversationListItem({
  title,
  timestamp,
  unreadCount = 0,
  active = false,
  loading = false,
  onClick
}) {
  const initials = getInitials(title);

  return (
    <button
      type="button"
      className={`conversation-item ${active ? "is-active" : ""}`}
      onClick={onClick}
    >
      <div className="conversation-item__avatar" aria-hidden="true">
        {initials ? <span>{initials}</span> : <MessageSquareMore size={18} />}
      </div>

      <div className="conversation-item__copy">
        <div className="conversation-item__top">
          <strong>{title}</strong>
          {timestamp ? <span>{formatTimestamp(timestamp)}</span> : null}
        </div>
      </div>

      {loading ? (
        <span className="conversation-item__loading" aria-hidden="true">
          <LoaderCircle size={16} />
        </span>
      ) : null}
      {unreadCount > 0 ? <span className="conversation-item__badge">{unreadCount}</span> : null}
    </button>
  );
}

export default memo(ConversationListItem);
