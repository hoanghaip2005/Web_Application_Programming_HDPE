import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import EmptyState from "../../components/ui/EmptyState";
import Pagination from "../../components/ui/Pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../../components/ui/select";
import { gameCatalog } from "../../data/games";
import { api } from "../../lib/api";

const PAGE_SIZE = 6;

function RankingPage() {
  const { token } = useAuth();
  const [gameCode, setGameCode] = useState("tictactoe");
  const [scope, setScope] = useState("global");
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    api
      .getRanking(gameCode, scope, token)
      .then((payload) => {
        setRows(payload.data);
        setMessage("");
        setPage(1);
      })
      .catch((error) => {
        setRows([]);
        setMessage(error.message);
      });
  }, [gameCode, scope, token]);

  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const visibleRows = useMemo(
    () => rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [page, rows]
  );

  return (
    <section className="panel">
      <p className="eyebrow">Xếp hạng</p>
      <h1>Bảng xếp hạng theo từng game</h1>
      <div className="button-row">
        <Select value={gameCode} onValueChange={setGameCode}>
          <SelectTrigger className="select-control">
            <SelectValue placeholder="Chọn game" />
          </SelectTrigger>
          <SelectContent>
            {gameCatalog.map((game) => (
              <SelectItem key={game.code} value={game.code}>
                {game.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={scope} onValueChange={setScope}>
          <SelectTrigger className="select-control">
            <SelectValue placeholder="Phạm vi xếp hạng" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="global">Toàn hệ thống</SelectItem>
            <SelectItem value="friends">Bạn bè</SelectItem>
            <SelectItem value="personal">Cá nhân</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {visibleRows.length ? (
        <>
          <div className="stack-list">
            {visibleRows.map((row, index) => (
              <article
                key={`${row.userId || row.username}-${index}`}
                className="feature-card ranking-row"
              >
                <strong className="ranking-row__identity">
                  #{(page - 1) * PAGE_SIZE + index + 1} {row.username}
                </strong>
                <div className="ranking-row__stats">
                  <span>Điểm: {row.totalScore}</span>
                  <span>Số trận: {row.totalMatches}</span>
                  <span>Thắng: {row.winsCount}</span>
                </div>
              </article>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      ) : (
        <EmptyState
          title="Chưa có dữ liệu xếp hạng"
          description="Kết quả chơi sẽ xuất hiện tại đây theo từng game."
        />
      )}
      {message ? <p className="muted">{message}</p> : null}
    </section>
  );
}

export default RankingPage;
