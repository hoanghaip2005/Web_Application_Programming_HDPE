exports.up = async function up(knex) {
  await knex.schema.createTable("games", (table) => {
    table.uuid("game_id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("code", 50).notNullable().unique();
    table.string("name", 150).notNullable();
    table.text("description");
    table.boolean("is_enabled").notNullable().defaultTo(true);
    table.integer("default_board_rows");
    table.integer("default_board_cols");
    table.integer("default_timer_seconds");
    table.boolean("supports_save_load").notNullable().defaultTo(true);
    table.boolean("supports_rating").notNullable().defaultTo(true);
    table.boolean("supports_comment").notNullable().defaultTo(true);
    table.integer("display_order").notNullable().defaultTo(0);
    table.jsonb("metadata").notNullable().defaultTo("{}");
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("game_instructions", (table) => {
    table.uuid("instruction_id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("game_id")
      .notNullable()
      .references("game_id")
      .inTable("games")
      .onDelete("CASCADE");
    table.string("title", 200).notNullable();
    table.text("content_md").notNullable();
    table.integer("version").notNullable().defaultTo(1);
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("game_sessions", (table) => {
    table.uuid("session_id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("game_id").notNullable().references("game_id").inTable("games");
    table.uuid("user_id").notNullable().references("user_id").inTable("users");
    table
      .enu("status", ["idle", "selecting", "playing", "paused", "completed", "saved", "abandoned"])
      .notNullable();
    table.jsonb("board_state").notNullable().defaultTo("{}");
    table.jsonb("game_state").notNullable().defaultTo("{}");
    table.integer("current_score").notNullable().defaultTo(0);
    table.string("timer_mode", 20);
    table.integer("time_limit_seconds");
    table.integer("elapsed_seconds").notNullable().defaultTo(0);
    table.integer("remaining_seconds");
    table.string("current_turn", 20);
    table.timestamp("started_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("ended_at", { useTz: true });
    table.timestamp("last_action_at", { useTz: true });
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("game_results", (table) => {
    table.uuid("result_id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("session_id")
      .notNullable()
      .unique()
      .references("session_id")
      .inTable("game_sessions")
      .onDelete("CASCADE");
    table.uuid("game_id").notNullable().references("game_id").inTable("games");
    table.uuid("user_id").notNullable().references("user_id").inTable("users");
    table.string("opponent_type", 20).notNullable().defaultTo("computer");
    table
      .enu("outcome", ["win", "lose", "draw", "timeout", "abandoned"])
      .notNullable();
    table.integer("final_score").notNullable().defaultTo(0);
    table.integer("moves_count");
    table.integer("duration_seconds");
    table.timestamp("completed_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.boolean("ranking_eligible").notNullable().defaultTo(true);
    table.jsonb("metadata").notNullable().defaultTo("{}");
  });

  await knex.schema.createTable("game_saves", (table) => {
    table.uuid("save_id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("game_id").notNullable().references("game_id").inTable("games");
    table.uuid("user_id").notNullable().references("user_id").inTable("users");
    table
      .uuid("session_id")
      .references("session_id")
      .inTable("game_sessions")
      .onDelete("SET NULL");
    table.string("save_name", 150);
    table.jsonb("board_state").notNullable().defaultTo("{}");
    table.jsonb("game_state").notNullable().defaultTo("{}");
    table.integer("score").notNullable().defaultTo(0);
    table.integer("elapsed_seconds").notNullable().defaultTo(0);
    table.integer("remaining_seconds");
    table.timestamp("saved_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("game_saves");
  await knex.schema.dropTableIfExists("game_results");
  await knex.schema.dropTableIfExists("game_sessions");
  await knex.schema.dropTableIfExists("game_instructions");
  await knex.schema.dropTableIfExists("games");
};
