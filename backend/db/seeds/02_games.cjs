exports.seed = async function seed(knex) {
  await knex("games").del();
  await knex("games").insert([
    {
      code: "caro5",
      name: "Caro Hàng 5",
      description: "Đánh 5 quân liên tiếp trên bàn 15x15.",
      default_board_rows: 15,
      default_board_cols: 15,
      default_timer_seconds: 600,
      display_order: 1
    },
    {
      code: "caro4",
      name: "Caro Hàng 4",
      description: "Đánh 4 quân liên tiếp trên bàn 8x8.",
      default_board_rows: 8,
      default_board_cols: 8,
      default_timer_seconds: 300,
      display_order: 2
    },
    {
      code: "tictactoe",
      name: "Tic-Tac-Toe",
      description: "Game 3x3 nhập môn cho nhóm trò chơi theo hàng.",
      default_board_rows: 3,
      default_board_cols: 3,
      default_timer_seconds: 180,
      display_order: 3
    },
    {
      code: "snake",
      name: "Rắn Săn Mồi",
      description: "Game arcade điều hướng rắn trên bàn 19x19.",
      default_board_rows: 19,
      default_board_cols: 19,
      default_timer_seconds: 180,
      display_order: 4
    },
    {
      code: "match3",
      name: "Ghép Hàng 3",
      description: "Game giải đố match-3 trên bàn 19x19.",
      default_board_rows: 19,
      default_board_cols: 19,
      default_timer_seconds: 180,
      display_order: 5
    },
    {
      code: "memory",
      name: "Cờ Trí Nhớ",
      description: "Game lật thẻ tìm cặp giống nhau trong thời gian giới hạn.",
      default_board_rows: 4,
      default_board_cols: 4,
      default_timer_seconds: 180,
      display_order: 6
    },
    {
      code: "free-draw",
      name: "Bảng Vẽ Tự Do",
      description: "Tô màu và lưu tranh sáng tạo trên bàn 15x15.",
      default_board_rows: 15,
      default_board_cols: 15,
      default_timer_seconds: 300,
      display_order: 7
    }
  ]);
};
