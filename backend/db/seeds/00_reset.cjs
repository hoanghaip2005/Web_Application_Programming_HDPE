exports.seed = async function seed(knex) {
  await knex.raw(`
    truncate table
      daily_user_statistics,
      daily_game_statistics,
      admin_audit_logs,
      game_comments,
      game_ratings,
      user_achievements,
      achievements,
      messages,
      conversation_members,
      conversations,
      friendships,
      game_saves,
      game_results,
      game_sessions,
      game_instructions,
      games,
      user_sessions,
      user_profiles,
      users,
      roles
    restart identity cascade
  `);
};
