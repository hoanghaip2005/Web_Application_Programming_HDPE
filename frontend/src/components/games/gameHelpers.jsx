import { useState } from "react";

export function formatTime(totalSeconds) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (safeSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}

export function shouldIgnoreGameHotkeys(event) {
  const target = event?.target;

  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  return Boolean(
    target.closest(
      'input, textarea, select, [contenteditable="true"], [role="textbox"]'
    )
  );
}

export function ReviewsPanel({ reviews, onAddReview }) {
  const [form, setForm] = useState({ rating: 5, comment: "" });

  function handleSubmit(event) {
    event.preventDefault();

    if (!form.comment.trim()) {
      return;
    }

    onAddReview({
      rating: Number(form.rating),
      comment: form.comment.trim()
    });
    setForm({ rating: 5, comment: "" });
  }

  return (
    <div className="game-sidebar">
      <section>
        <p className="eyebrow">Đánh giá</p>
        <form className="review-card" onSubmit={handleSubmit}>
          <label>
            Điểm
            <input
              type="number"
              min="1"
              max="5"
              value={form.rating}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  rating: event.target.value
                }))
              }
            />
          </label>
          <label>
            Bình luận
            <textarea
              rows="4"
              value={form.comment}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  comment: event.target.value
                }))
              }
            />
          </label>
          <button type="submit" className="primary-button">
            Gửi đánh giá
          </button>
        </form>
      </section>

      <section>
        <p className="eyebrow">Lịch sử đánh giá</p>
        <div className="review-list">
          {reviews.length === 0 ? (
            <div className="review-card">
              <strong>Chưa có đánh giá</strong>
              <p className="muted">Bạn có thể thêm đánh giá để demo yêu cầu.</p>
            </div>
          ) : (
            reviews.map((review) => (
              <article
                key={review.commentId || review.id || review.createdAt}
                className="review-card"
              >
                <strong>{review.ratingValue || review.rating}/5</strong>
                <p>{review.commentBody || review.comment}</p>
                <small className="muted">
                  {new Date(review.createdAt).toLocaleString()}
                </small>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export function InstructionsPanel({ instructions = [], fallbackItems = [] }) {
  const items = instructions.length
    ? instructions.map((instruction) => ({
        key: instruction.instructionId || instruction.title,
        title: instruction.title,
        content: instruction.content
      }))
    : fallbackItems.map((content, index) => ({
        key: `fallback-${index}`,
        title: `Bước ${index + 1}`,
        content
      }));

  return (
    <section>
      <p className="eyebrow">Hướng dẫn</p>
      <div className="stack-list">
        {items.map((item) => (
          <article key={item.key} className="review-card">
            <strong>{item.title}</strong>
            <p>{item.content}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
