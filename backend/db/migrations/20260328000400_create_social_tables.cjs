exports.up = async function up(knex) {
  await knex.schema.createTable("friendships", (table) => {
    table.uuid("friendship_id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("requester_id")
      .notNullable()
      .references("user_id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .uuid("addressee_id")
      .notNullable()
      .references("user_id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .enu("status", ["pending", "accepted", "rejected", "blocked"])
      .notNullable()
      .defaultTo("pending");
    table.timestamp("requested_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("responded_at", { useTz: true });
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw(`
    create unique index friendships_unique_pair
    on friendships (
      least(requester_id, addressee_id),
      greatest(requester_id, addressee_id)
    )
  `);

  await knex.schema.createTable("conversations", (table) => {
    table.uuid("conversation_id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("conversation_type", 20).notNullable().defaultTo("direct");
    table.uuid("created_by").notNullable().references("user_id").inTable("users");
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("conversation_members", (table) => {
    table
      .uuid("conversation_id")
      .notNullable()
      .references("conversation_id")
      .inTable("conversations")
      .onDelete("CASCADE");
    table
      .uuid("user_id")
      .notNullable()
      .references("user_id")
      .inTable("users")
      .onDelete("CASCADE");
    table.uuid("last_read_message_id");
    table.timestamp("joined_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("last_read_at", { useTz: true });
    table.primary(["conversation_id", "user_id"]);
  });

  await knex.schema.createTable("messages", (table) => {
    table.uuid("message_id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("conversation_id")
      .notNullable()
      .references("conversation_id")
      .inTable("conversations")
      .onDelete("CASCADE");
    table.uuid("sender_id").notNullable().references("user_id").inTable("users");
    table.text("message_body").notNullable();
    table.timestamp("sent_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("edited_at", { useTz: true });
    table.timestamp("deleted_at", { useTz: true });
  });

  await knex.schema.createTable("achievements", (table) => {
    table.uuid("achievement_id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("game_id").references("game_id").inTable("games").onDelete("SET NULL");
    table.string("code", 100).notNullable().unique();
    table.string("name", 150).notNullable();
    table.text("description").notNullable();
    table.text("icon_url");
    table.integer("points").notNullable().defaultTo(0);
    table.string("condition_type", 50).notNullable();
    table.jsonb("condition_config").notNullable().defaultTo("{}");
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("user_achievements", (table) => {
    table
      .uuid("user_id")
      .notNullable()
      .references("user_id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .uuid("achievement_id")
      .notNullable()
      .references("achievement_id")
      .inTable("achievements")
      .onDelete("CASCADE");
    table.timestamp("unlocked_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.integer("progress_value");
    table.jsonb("metadata").notNullable().defaultTo("{}");
    table.primary(["user_id", "achievement_id"]);
  });

  await knex.schema.createTable("game_ratings", (table) => {
    table.uuid("rating_id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("game_id").notNullable().references("game_id").inTable("games").onDelete("CASCADE");
    table.uuid("user_id").notNullable().references("user_id").inTable("users").onDelete("CASCADE");
    table.smallint("rating_value").notNullable();
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.unique(["game_id", "user_id"]);
  });

  await knex.schema.createTable("game_comments", (table) => {
    table.uuid("comment_id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("game_id").notNullable().references("game_id").inTable("games").onDelete("CASCADE");
    table.uuid("user_id").notNullable().references("user_id").inTable("users").onDelete("CASCADE");
    table.text("comment_body").notNullable();
    table.enu("status", ["visible", "hidden", "deleted"]).notNullable().defaultTo("visible");
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("game_comments");
  await knex.schema.dropTableIfExists("game_ratings");
  await knex.schema.dropTableIfExists("user_achievements");
  await knex.schema.dropTableIfExists("achievements");
  await knex.schema.dropTableIfExists("messages");
  await knex.schema.dropTableIfExists("conversation_members");
  await knex.schema.dropTableIfExists("conversations");
  await knex.raw("drop index if exists friendships_unique_pair");
  await knex.schema.dropTableIfExists("friendships");
};
