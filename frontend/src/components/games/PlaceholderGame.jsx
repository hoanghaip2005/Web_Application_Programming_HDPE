import BoardGrid from "../BoardGrid";
import GameChrome from "../GameChrome";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { ReviewsPanel } from "./gameHelpers";

function PlaceholderGame({ game }) {
  const { token } = useAuth();
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    api
      .getGameReviews(game.code)
      .then((payload) => setReviews(payload.data.reviews))
      .catch(() => setReviews([]));
  }, [game.code]);
  const cells = Array.from({ length: game.rows * game.cols }, (_, index) => ({
    value: index % 4 === 0 ? "•" : "",
    style: {
      background: index % 3 === 0 ? game.accent : "rgba(255,255,255,0.08)"
    }
  }));

  return (
    <GameChrome
      title={game.name}
      description={game.description}
      score={0}
      timeLabel="00:00"
      onSave={() => {}}
      onLoad={() => {}}
      onReset={() => {}}
      onHint={() => {}}
      hintVisible={false}
      sidebar={
        <div className="game-sidebar">
          <section>
            <p className="eyebrow">Trạng thái triển khai</p>
            <p>
              Khung trang này đã có board, trợ giúp, đánh giá/bình luận và route riêng.
              Logic gameplay sẽ được làm ở pha tiếp theo.
            </p>
          </section>
          <ReviewsPanel
            reviews={reviews}
            onAddReview={(payload) => {
              if (!token) {
                return;
              }

              api
                .postGameReview(token, game.code, {
                  ratingValue: payload.rating,
                  commentBody: payload.comment
                })
                .then((response) => setReviews(response.data.reviews))
                .catch(() => {});
            }}
          />
        </div>
      }
    >
      <div className="status-banner">
        Game này đang ở giai đoạn scaffold, đã sẵn sàng để nối thêm logic luật,
        thời gian, điểm số và lưu/tải.
      </div>

      <BoardGrid rows={game.rows} cols={game.cols} cells={cells} size="small" />
    </GameChrome>
  );
}

export default PlaceholderGame;
