import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import LineGame from "../../components/games/LineGame";
import FreeDrawGame from "../../components/games/FreeDrawGame";
import Match3Game from "../../components/games/Match3Game";
import MemoryGame from "../../components/games/MemoryGame";
import PlaceholderGame from "../../components/games/PlaceholderGame";
import SnakeGame from "../../components/games/SnakeGame";
import { gameByCode } from "../../data/games";
import { api } from "../../lib/api";

function GamePage() {
  const { gameCode } = useParams();
  const localGame = gameByCode[gameCode];
  const [game, setGame] = useState(localGame || null);
  const [loading, setLoading] = useState(Boolean(localGame));

  useEffect(() => {
    if (!localGame) {
      setGame(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    api
      .getGame(gameCode)
      .then((payload) => {
        const remote = payload.data;
        setGame({
          ...localGame,
          ...remote,
          rows: remote.defaultBoardRows || localGame.rows,
          cols: remote.defaultBoardCols || localGame.cols,
          description: remote.description || localGame.description
        });
      })
      .catch(() => setGame(localGame))
      .finally(() => setLoading(false));
  }, [gameCode, localGame]);

  if (!localGame) {
    return (
      <section className="panel">
        <p className="eyebrow">Trò chơi</p>
        <h1>Không tìm thấy game</h1>
        <Link to="/app/games" className="primary-button">
          Quay lại danh sách game
        </Link>
      </section>
    );
  }

  if (loading && !game) {
    return (
      <section className="panel">
        <p className="eyebrow">Trò chơi</p>
        <h1>Đang tải thông tin game</h1>
      </section>
    );
  }

  if (game?.isEnabled === false) {
    return (
      <section className="panel">
        <p className="eyebrow">Trò chơi</p>
        <h1>Game tạm thời bị khóa</h1>
        <p>Quản trị viên đã tắt game này trên hệ thống.</p>
        <Link to="/app/games" className="primary-button">
          Quay lại danh sách game
        </Link>
      </section>
    );
  }

  if (["tictactoe", "caro4", "caro5"].includes(game.code)) {
    return <LineGame key={game.code} game={game} />;
  }

  if (game.code === "snake") {
    return <SnakeGame key={game.code} game={game} />;
  }

  if (game.code === "match3") {
    return <Match3Game key={game.code} game={game} />;
  }

  if (game.code === "memory") {
    return <MemoryGame key={game.code} game={game} />;
  }

  if (game.code === "free-draw") {
    return <FreeDrawGame key={game.code} game={game} />;
  }

  return <PlaceholderGame game={game} />;
}

export default GamePage;
