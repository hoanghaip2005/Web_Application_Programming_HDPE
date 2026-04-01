export const gameCatalog = [
  {
    code: "caro5",
    name: "Caro Hàng 5",
    shortName: "C5",
    description: "Đánh 5 quân liên tiếp trên bàn 15x15.",
    category: "Trò theo hàng",
    rows: 15,
    cols: 15,
    winLength: 5,
    accent: "var(--accent-red)",
    status: "playable"
  },
  {
    code: "caro4",
    name: "Caro Hàng 4",
    shortName: "C4",
    description: "Phiên bản nhỏ gọn, thắng khi tạo được 4 quân liên tiếp.",
    category: "Trò theo hàng",
    rows: 8,
    cols: 8,
    winLength: 4,
    accent: "var(--accent-orange)",
    status: "playable"
  },
  {
    code: "tictactoe",
    name: "Tic-Tac-Toe",
    shortName: "TTT",
    description: "Game nhập môn 3x3 với máy đi ngẫu nhiên.",
    category: "Trò theo hàng",
    rows: 3,
    cols: 3,
    winLength: 3,
    accent: "var(--accent-blue)",
    status: "playable"
  },
  {
    code: "snake",
    name: "Rắn Săn Mồi",
    shortName: "SNK",
    description: "Điều hướng rắn trên bàn 19x19, ăn mồi và tránh va chạm.",
    category: "Arcade",
    rows: 19,
    cols: 19,
    accent: "var(--accent-green)",
    status: "playable"
  },
  {
    code: "match3",
    name: "Ghép Hàng 3",
    shortName: "M3",
    description: "Đổi chỗ hai ô kề nhau để tạo hàng 3 và ghi điểm trên bàn 19x19.",
    category: "Giải đố",
    rows: 19,
    cols: 19,
    accent: "var(--accent-pink)",
    status: "playable"
  },
  {
    code: "memory",
    name: "Cờ Trí Nhớ",
    shortName: "MEM",
    description: "Lật thẻ tìm cặp giống nhau trong giới hạn thời gian.",
    category: "Giải đố",
    rows: 4,
    cols: 4,
    accent: "var(--accent-violet)",
    status: "playable"
  },
  {
    code: "free-draw",
    name: "Bảng Vẽ Tự Do",
    shortName: "DRAW",
    description: "Tô màu và lưu tranh trên bàn game 15x15.",
    category: "Sáng tạo",
    rows: 15,
    cols: 15,
    accent: "var(--accent-teal)",
    status: "playable"
  }
];

export const gameByCode = Object.fromEntries(
  gameCatalog.map((game) => [game.code, game])
);
