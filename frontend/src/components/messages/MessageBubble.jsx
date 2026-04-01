import { memo } from "react";

function formatMessageTime(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function MessageBubble({ senderName, body, sentAt, isOwn }) {
  return (
    <article className={`message-bubble ${isOwn ? "is-own" : ""}`}>
      {!isOwn ? <strong>{senderName}</strong> : null}
      <p>{body}</p>
      <span>{formatMessageTime(sentAt)}</span>
    </article>
  );
}

export default memo(MessageBubble);
