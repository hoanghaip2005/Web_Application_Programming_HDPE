import { useEffect, useState } from "react";
import GameCatalogBoard from "../../components/GameCatalogBoard";
import { gameCatalog } from "../../data/games";
import { api } from "../../lib/api";

function GamesPage() {
  const [games, setGames] = useState(gameCatalog);

  useEffect(() => {
    api
      .listGames()
      .then((payload) => {
        const merged = gameCatalog.map((localGame) => {
          const remote = payload.data.find((item) => item.code === localGame.code);
          return remote
            ? {
                ...localGame,
                ...remote,
                rows: remote.defaultBoardRows || localGame.rows,
                cols: remote.defaultBoardCols || localGame.cols,
                description: remote.description || localGame.description,
                status: remote.isEnabled ? localGame.status : "disabled"
              }
            : localGame;
        });
        setGames(merged.filter((game) => game.status !== "disabled"));
      })
      .catch(() => setGames(gameCatalog));
  }, []);

  return (
    <div className="games-hub-view">
      <GameCatalogBoard games={games} />
    </div>
  );
}

export default GamesPage;
