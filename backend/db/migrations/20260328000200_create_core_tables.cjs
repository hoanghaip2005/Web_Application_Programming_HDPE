exports.up = async function up(knex) {
  await knex.schema.createTable("roles", (table) => {
    table.uuid("role_id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("code", 50).notNullable().unique();
    table.string("name", 100).notNullable();
    table.text("description");
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("users", (table) => {
    table.uuid("user_id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("role_id").notNullable().references("role_id").inTable("roles");
    table.string("email", 255).notNullable().unique();
    table.string("username", 100).notNullable().unique();
    table.text("password_hash").notNullable();
    table.enu("status", ["active", "disabled", "pending"]).notNullable().defaultTo("active");
    table
      .enu("theme_preference", ["light", "dark", "system"])
      .notNullable()
      .defaultTo("light");
    table.timestamp("email_verified_at", { useTz: true });
    table.timestamp("last_login_at", { useTz: true });
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("user_profiles", (table) => {
    table
      .uuid("user_id")
      .primary()
      .references("user_id")
      .inTable("users")
      .onDelete("CASCADE");
    table.string("display_name", 150);
    table.text("avatar_url");
    table.text("bio");
    table.string("country", 100);
    table.date("birth_date");
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("user_sessions", (table) => {
    table.uuid("session_id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("user_id")
      .notNullable()
      .references("user_id")
      .inTable("users")
      .onDelete("CASCADE");
    table.text("refresh_token_hash").notNullable();
    table.string("ip_address", 64);
    table.text("user_agent");
    table.timestamp("expires_at", { useTz: true }).notNullable();
    table.timestamp("revoked_at", { useTz: true });
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("user_sessions");
  await knex.schema.dropTableIfExists("user_profiles");
  await knex.schema.dropTableIfExists("users");
  await knex.schema.dropTableIfExists("roles");
};
