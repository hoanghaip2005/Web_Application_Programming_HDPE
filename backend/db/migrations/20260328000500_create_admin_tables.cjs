exports.up = async function up(knex) {
  await knex.schema.createTable("admin_audit_logs", (table) => {
    table.uuid("audit_id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("admin_user_id").notNullable().references("user_id").inTable("users");
    table.string("action", 100).notNullable();
    table.string("entity_type", 50).notNullable();
    table.uuid("entity_id");
    table.jsonb("before_data");
    table.jsonb("after_data");
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("daily_game_statistics", (table) => {
    table.date("stat_date").notNullable();
    table.uuid("game_id").notNullable().references("game_id").inTable("games").onDelete("CASCADE");
    table.integer("sessions_count").notNullable().defaultTo(0);
    table.integer("completed_sessions_count").notNullable().defaultTo(0);
    table.integer("unique_players_count").notNullable().defaultTo(0);
    table.bigInteger("total_score").notNullable().defaultTo(0);
    table.decimal("average_score", 10, 2).notNullable().defaultTo(0);
    table.integer("ratings_count").notNullable().defaultTo(0);
    table.decimal("average_rating", 4, 2).notNullable().defaultTo(0);
    table.integer("comments_count").notNullable().defaultTo(0);
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.primary(["stat_date", "game_id"]);
  });

  await knex.schema.createTable("daily_user_statistics", (table) => {
    table.date("stat_date").primary();
    table.integer("new_users_count").notNullable().defaultTo(0);
    table.integer("active_users_count").notNullable().defaultTo(0);
    table.integer("disabled_users_count").notNullable().defaultTo(0);
    table.integer("friend_requests_count").notNullable().defaultTo(0);
    table.integer("messages_sent_count").notNullable().defaultTo(0);
    table.integer("achievements_unlocked_count").notNullable().defaultTo(0);
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("daily_user_statistics");
  await knex.schema.dropTableIfExists("daily_game_statistics");
  await knex.schema.dropTableIfExists("admin_audit_logs");
};
