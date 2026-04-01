exports.seed = async function seed(knex) {
  await knex("game_comments").del();
  await knex("game_ratings").del();
  await knex("user_achievements").del();
  await knex("achievements").del();
  await knex("game_saves").del();
  await knex("game_results").del();
  await knex("game_sessions").del();

  const users = await knex("users").select("user_id", "username");
  const games = await knex("games").select("game_id", "code");
  const userMap = Object.fromEntries(users.map((user) => [user.username, user.user_id]));
  const gameMap = Object.fromEntries(games.map((game) => [game.code, game.game_id]));

  const sessions = await knex("game_sessions").insert(
    [
      {
        game_id: gameMap.tictactoe,
        user_id: userMap["player-one"],
        status: "completed",
        board_state: JSON.stringify({ winner: "player" }),
        game_state: JSON.stringify({ mode: "vs-computer" }),
        current_score: 70,
        time_limit_seconds: 180,
        elapsed_seconds: 90,
        remaining_seconds: 90,
        current_turn: "none",
        started_at: knex.fn.now(),
        ended_at: knex.fn.now(),
        last_action_at: knex.fn.now()
      },
      {
        game_id: gameMap.caro4,
        user_id: userMap["player-two"],
        status: "completed",
        board_state: JSON.stringify({ winner: "computer" }),
        game_state: JSON.stringify({ mode: "vs-computer" }),
        current_score: 10,
        time_limit_seconds: 300,
        elapsed_seconds: 220,
        remaining_seconds: 80,
        current_turn: "none",
        started_at: knex.fn.now(),
        ended_at: knex.fn.now(),
        last_action_at: knex.fn.now()
      },
      {
        game_id: gameMap["free-draw"],
        user_id: userMap["pixel-artist"],
        status: "saved",
        board_state: JSON.stringify({ coloredCells: 18 }),
        game_state: JSON.stringify({ palette: ["#fb5b77", "#4c84ff"] }),
        current_score: 28,
        time_limit_seconds: 300,
        elapsed_seconds: 100,
        remaining_seconds: 200,
        current_turn: "player",
        started_at: knex.fn.now(),
        last_action_at: knex.fn.now()
      },
      {
        game_id: gameMap.caro5,
        user_id: userMap["board-master"],
        status: "completed",
        board_state: JSON.stringify({ winner: "player" }),
        game_state: JSON.stringify({ mode: "vs-computer" }),
        current_score: 100,
        time_limit_seconds: 600,
        elapsed_seconds: 320,
        remaining_seconds: 280,
        current_turn: "none",
        started_at: knex.fn.now(),
        ended_at: knex.fn.now(),
        last_action_at: knex.fn.now()
      },
      {
        game_id: gameMap.snake,
        user_id: userMap["player-two"],
        status: "completed",
        board_state: JSON.stringify({ snakeLength: 11, crashed: false }),
        game_state: JSON.stringify({ mode: "classic", speed: "normal" }),
        current_score: 120,
        time_limit_seconds: 180,
        elapsed_seconds: 150,
        remaining_seconds: 30,
        current_turn: "player",
        started_at: knex.fn.now(),
        ended_at: knex.fn.now(),
        last_action_at: knex.fn.now()
      },
      {
        game_id: gameMap.match3,
        user_id: userMap["player-one"],
        status: "completed",
        board_state: JSON.stringify({ cascades: 4, combos: 2 }),
        game_state: JSON.stringify({ mode: "score-attack" }),
        current_score: 160,
        time_limit_seconds: 180,
        elapsed_seconds: 170,
        remaining_seconds: 10,
        current_turn: "player",
        started_at: knex.fn.now(),
        ended_at: knex.fn.now(),
        last_action_at: knex.fn.now()
      },
      {
        game_id: gameMap.memory,
        user_id: userMap["player-three"],
        status: "completed",
        board_state: JSON.stringify({ matchedPairs: 8 }),
        game_state: JSON.stringify({ mode: "timed" }),
        current_score: 90,
        time_limit_seconds: 180,
        elapsed_seconds: 132,
        remaining_seconds: 48,
        current_turn: "player",
        started_at: knex.fn.now(),
        ended_at: knex.fn.now(),
        last_action_at: knex.fn.now()
      },
      {
        game_id: gameMap["free-draw"],
        user_id: userMap["pixel-artist"],
        status: "completed",
        board_state: JSON.stringify({ coloredCells: 24, paletteUsed: 6 }),
        game_state: JSON.stringify({ mode: "creative", activeColor: "#fb5b77" }),
        current_score: 54,
        time_limit_seconds: 300,
        elapsed_seconds: 240,
        remaining_seconds: 60,
        current_turn: "player",
        started_at: knex.fn.now(),
        ended_at: knex.fn.now(),
        last_action_at: knex.fn.now()
      },
      {
        game_id: gameMap.match3,
        user_id: userMap["board-master"],
        status: "saved",
        board_state: JSON.stringify({ selectedIndex: 13, possibleMoves: 5 }),
        game_state: JSON.stringify({ mode: "score-attack", combo: 1 }),
        current_score: 95,
        time_limit_seconds: 180,
        elapsed_seconds: 88,
        remaining_seconds: 92,
        current_turn: "player",
        started_at: knex.fn.now(),
        last_action_at: knex.fn.now()
      },
      {
        game_id: gameMap.memory,
        user_id: userMap["player-three"],
        status: "saved",
        board_state: JSON.stringify({ matchedPairs: 4, selectedIndex: 6 }),
        game_state: JSON.stringify({ mode: "timed", revealed: [2, 7] }),
        current_score: 40,
        time_limit_seconds: 180,
        elapsed_seconds: 70,
        remaining_seconds: 110,
        current_turn: "player",
        started_at: knex.fn.now(),
        last_action_at: knex.fn.now()
      },
      {
        game_id: gameMap.tictactoe,
        user_id: userMap["player-two"],
        status: "completed",
        board_state: JSON.stringify({ winner: "player", opening: "center" }),
        game_state: JSON.stringify({ mode: "vs-computer" }),
        current_score: 58,
        time_limit_seconds: 180,
        elapsed_seconds: 76,
        remaining_seconds: 104,
        current_turn: "none",
        started_at: knex.fn.now(),
        ended_at: knex.fn.now(),
        last_action_at: knex.fn.now()
      },
      {
        game_id: gameMap.tictactoe,
        user_id: userMap["pixel-artist"],
        status: "completed",
        board_state: JSON.stringify({ winner: "player", paintedMood: "bold" }),
        game_state: JSON.stringify({ mode: "vs-computer" }),
        current_score: 64,
        time_limit_seconds: 180,
        elapsed_seconds: 82,
        remaining_seconds: 98,
        current_turn: "none",
        started_at: knex.fn.now(),
        ended_at: knex.fn.now(),
        last_action_at: knex.fn.now()
      },
      {
        game_id: gameMap.tictactoe,
        user_id: userMap["combo-queen"],
        status: "completed",
        board_state: JSON.stringify({ winner: "player", streak: 2 }),
        game_state: JSON.stringify({ mode: "vs-computer" }),
        current_score: 92,
        time_limit_seconds: 180,
        elapsed_seconds: 68,
        remaining_seconds: 112,
        current_turn: "none",
        started_at: knex.fn.now(),
        ended_at: knex.fn.now(),
        last_action_at: knex.fn.now()
      },
      {
        game_id: gameMap.tictactoe,
        user_id: userMap["speed-runner"],
        status: "completed",
        board_state: JSON.stringify({ winner: "player", opening: "corner" }),
        game_state: JSON.stringify({ mode: "vs-computer" }),
        current_score: 88,
        time_limit_seconds: 180,
        elapsed_seconds: 61,
        remaining_seconds: 119,
        current_turn: "none",
        started_at: knex.fn.now(),
        ended_at: knex.fn.now(),
        last_action_at: knex.fn.now()
      },
      {
        game_id: gameMap.tictactoe,
        user_id: userMap["logic-lantern"],
        status: "completed",
        board_state: JSON.stringify({ winner: "player", defense: "fork-block" }),
        game_state: JSON.stringify({ mode: "vs-computer" }),
        current_score: 73,
        time_limit_seconds: 180,
        elapsed_seconds: 97,
        remaining_seconds: 83,
        current_turn: "none",
        started_at: knex.fn.now(),
        ended_at: knex.fn.now(),
        last_action_at: knex.fn.now()
      },
      {
        game_id: gameMap.tictactoe,
        user_id: userMap["rank-hunter"],
        status: "completed",
        board_state: JSON.stringify({ winner: "player", comeback: true }),
        game_state: JSON.stringify({ mode: "vs-computer" }),
        current_score: 81,
        time_limit_seconds: 180,
        elapsed_seconds: 72,
        remaining_seconds: 108,
        current_turn: "none",
        started_at: knex.fn.now(),
        ended_at: knex.fn.now(),
        last_action_at: knex.fn.now()
      }
    ],
    ["session_id", "game_id", "user_id", "status", "current_score", "elapsed_seconds"]
  );

  await knex("game_results").insert([
    {
      session_id: sessions[0].session_id,
      game_id: gameMap.tictactoe,
      user_id: userMap["player-one"],
      opponent_type: "computer",
      outcome: "win",
      final_score: 70,
      moves_count: 5,
      duration_seconds: 90
    },
    {
      session_id: sessions[1].session_id,
      game_id: gameMap.caro4,
      user_id: userMap["player-two"],
      opponent_type: "computer",
      outcome: "lose",
      final_score: 10,
      moves_count: 12,
      duration_seconds: 220
    },
    {
      session_id: sessions[3].session_id,
      game_id: gameMap.caro5,
      user_id: userMap["board-master"],
      opponent_type: "computer",
      outcome: "win",
      final_score: 100,
      moves_count: 18,
      duration_seconds: 320
    },
    {
      session_id: sessions[4].session_id,
      game_id: gameMap.snake,
      user_id: userMap["player-two"],
      opponent_type: "system",
      outcome: "win",
      final_score: 120,
      moves_count: 42,
      duration_seconds: 150
    },
    {
      session_id: sessions[5].session_id,
      game_id: gameMap.match3,
      user_id: userMap["player-one"],
      opponent_type: "system",
      outcome: "win",
      final_score: 160,
      moves_count: 21,
      duration_seconds: 170
    },
    {
      session_id: sessions[6].session_id,
      game_id: gameMap.memory,
      user_id: userMap["player-three"],
      opponent_type: "system",
      outcome: "win",
      final_score: 90,
      moves_count: 16,
      duration_seconds: 132
    },
    {
      session_id: sessions[7].session_id,
      game_id: gameMap["free-draw"],
      user_id: userMap["pixel-artist"],
      opponent_type: "solo",
      outcome: "draw",
      final_score: 54,
      moves_count: 24,
      duration_seconds: 240
    },
    {
      session_id: sessions[10].session_id,
      game_id: gameMap.tictactoe,
      user_id: userMap["player-two"],
      opponent_type: "computer",
      outcome: "win",
      final_score: 58,
      moves_count: 6,
      duration_seconds: 76
    },
    {
      session_id: sessions[11].session_id,
      game_id: gameMap.tictactoe,
      user_id: userMap["pixel-artist"],
      opponent_type: "computer",
      outcome: "win",
      final_score: 64,
      moves_count: 7,
      duration_seconds: 82
    },
    {
      session_id: sessions[12].session_id,
      game_id: gameMap.tictactoe,
      user_id: userMap["combo-queen"],
      opponent_type: "computer",
      outcome: "win",
      final_score: 92,
      moves_count: 5,
      duration_seconds: 68
    },
    {
      session_id: sessions[13].session_id,
      game_id: gameMap.tictactoe,
      user_id: userMap["speed-runner"],
      opponent_type: "computer",
      outcome: "win",
      final_score: 88,
      moves_count: 5,
      duration_seconds: 61
    },
    {
      session_id: sessions[14].session_id,
      game_id: gameMap.tictactoe,
      user_id: userMap["logic-lantern"],
      opponent_type: "computer",
      outcome: "win",
      final_score: 73,
      moves_count: 8,
      duration_seconds: 97
    },
    {
      session_id: sessions[15].session_id,
      game_id: gameMap.tictactoe,
      user_id: userMap["rank-hunter"],
      opponent_type: "computer",
      outcome: "win",
      final_score: 81,
      moves_count: 6,
      duration_seconds: 72
    }
  ]);

  await knex("game_saves").insert([
    {
      game_id: gameMap["free-draw"],
      user_id: userMap["pixel-artist"],
      session_id: sessions[2].session_id,
      save_name: "Free Draw Demo",
      board_state: JSON.stringify({ coloredCells: 18 }),
      game_state: JSON.stringify({ activeColor: "#fb5b77" }),
      score: 28,
      elapsed_seconds: 100,
      remaining_seconds: 200
    },
    {
      game_id: gameMap.tictactoe,
      user_id: userMap["player-one"],
      save_name: "TicTacToe Demo",
      board_state: JSON.stringify({ cells: ["X", "O", null] }),
      game_state: JSON.stringify({ currentTurn: "player" }),
      score: 25,
      elapsed_seconds: 40,
      remaining_seconds: 140
    },
    {
      game_id: gameMap.match3,
      user_id: userMap["board-master"],
      session_id: sessions[8].session_id,
      save_name: "Match3 Mid Run",
      board_state: JSON.stringify({ selectedIndex: 13, boardSeed: "demo-match3" }),
      game_state: JSON.stringify({ combo: 1, mode: "score-attack" }),
      score: 95,
      elapsed_seconds: 88,
      remaining_seconds: 92
    },
    {
      game_id: gameMap.memory,
      user_id: userMap["player-three"],
      session_id: sessions[9].session_id,
      save_name: "Memory Checkpoint",
      board_state: JSON.stringify({ matchedPairs: 4, revealed: [2, 7] }),
      game_state: JSON.stringify({ currentTurn: "player" }),
      score: 40,
      elapsed_seconds: 70,
      remaining_seconds: 110
    }
  ]);

  const achievements = await knex("achievements").insert(
    [
      {
        game_id: gameMap.tictactoe,
        code: "first-win",
        name: "Chiến Thắng Đầu Tiên",
        description: "Thắng ván đầu tiên.",
        points: 20,
        condition_type: "wins",
        condition_config: JSON.stringify({ wins: 1 })
      },
      {
        game_id: gameMap["free-draw"],
        code: "color-starter",
        name: "Khởi Động Sắc Màu",
        description: "Tô ít nhất 10 ô trong Bảng Vẽ Tự Do.",
        points: 10,
        condition_type: "colored_cells",
        condition_config: JSON.stringify({ coloredCells: 10 })
      },
      {
        game_id: gameMap.snake,
        code: "snake-runner",
        name: "Tay Đua Rắn",
        description: "Đạt ít nhất 100 điểm trong Rắn Săn Mồi.",
        points: 25,
        condition_type: "score",
        condition_config: JSON.stringify({ minScore: 100 })
      },
      {
        game_id: gameMap.memory,
        code: "memory-clear",
        name: "Ghi Nhớ Hoàn Hảo",
        description: "Hoàn thành Cờ Trí Nhớ trong một lượt.",
        points: 15,
        condition_type: "wins",
        condition_config: JSON.stringify({ wins: 1 })
      }
    ],
    ["achievement_id", "code"]
  );

  const achievementMap = Object.fromEntries(
    achievements.map((achievement) => [achievement.code, achievement.achievement_id])
  );

  await knex("user_achievements").insert([
    {
      user_id: userMap["player-one"],
      achievement_id: achievementMap["first-win"],
      progress_value: 1
    },
    {
      user_id: userMap["pixel-artist"],
      achievement_id: achievementMap["color-starter"],
      progress_value: 18
    },
    {
      user_id: userMap["player-two"],
      achievement_id: achievementMap["snake-runner"],
      progress_value: 1
    },
    {
      user_id: userMap["player-three"],
      achievement_id: achievementMap["memory-clear"],
      progress_value: 1
    }
  ]);

  await knex("game_ratings").insert([
    {
      game_id: gameMap.tictactoe,
      user_id: userMap["player-one"],
      rating_value: 5
    },
    {
      game_id: gameMap.tictactoe,
      user_id: userMap["player-two"],
      rating_value: 4
    },
    {
      game_id: gameMap["free-draw"],
      user_id: userMap["pixel-artist"],
      rating_value: 5
    },
    {
      game_id: gameMap.caro5,
      user_id: userMap["board-master"],
      rating_value: 5
    },
    {
      game_id: gameMap.caro4,
      user_id: userMap["player-two"],
      rating_value: 4
    },
    {
      game_id: gameMap.snake,
      user_id: userMap["player-two"],
      rating_value: 5
    },
    {
      game_id: gameMap.match3,
      user_id: userMap["player-one"],
      rating_value: 4
    },
    {
      game_id: gameMap.memory,
      user_id: userMap["player-three"],
      rating_value: 5
    }
  ]);

  await knex("game_comments").insert([
    {
      game_id: gameMap.tictactoe,
      user_id: userMap["player-one"],
      comment_body: "Game nay nho nhung de demo rat tot.",
      status: "visible"
    },
    {
      game_id: gameMap.tictactoe,
      user_id: userMap["player-two"],
      comment_body: "Muon co them AI thong minh hon.",
      status: "visible"
    },
    {
      game_id: gameMap["free-draw"],
      user_id: userMap["pixel-artist"],
      comment_body: "Bang mau rat hop de demo save/load.",
      status: "visible"
    },
    {
      game_id: gameMap.caro5,
      user_id: userMap["board-master"],
      comment_body: "Board 15x15 va timer 600s du de demo chien thuat.",
      status: "visible"
    },
    {
      game_id: gameMap.caro4,
      user_id: userMap["player-two"],
      comment_body: "Ban nho hon nen toc do nhanh, phu hop cho ranking.",
      status: "visible"
    },
    {
      game_id: gameMap.snake,
      user_id: userMap["player-two"],
      comment_body: "Snake da co score, timer va dieu huong ro rang.",
      status: "visible"
    },
    {
      game_id: gameMap.match3,
      user_id: userMap["player-one"],
      comment_body: "Match-3 co combo va diem so de demo rat on.",
      status: "visible"
    },
    {
      game_id: gameMap.memory,
      user_id: userMap["player-three"],
      comment_body: "Memory co du thong tin de choi va luu checkpoint.",
      status: "visible"
    }
  ]);
};
