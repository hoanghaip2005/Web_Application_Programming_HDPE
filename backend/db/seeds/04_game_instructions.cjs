exports.seed = async function seed(knex) {
  await knex("game_instructions").del();

  const games = await knex("games").select("game_id", "code", "name");

  await knex("game_instructions").insert(
    games.map((game) => ({
      game_id: game.game_id,
      title: `${game.name} Hướng Dẫn`,
      content_md: `Left/Right để di chuyển, ENTER để xác nhận, Back để quay lại, Hint/Help để xem hướng dẫn cho ${game.name}.`,
      version: 1,
      is_active: true
    }))
  );
};
