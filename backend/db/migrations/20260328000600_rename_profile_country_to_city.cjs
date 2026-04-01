exports.up = async function up(knex) {
  const hasTable = await knex.schema.hasTable("user_profiles");
  if (!hasTable) {
    return;
  }

  const hasCountry = await knex.schema.hasColumn("user_profiles", "country");
  const hasCity = await knex.schema.hasColumn("user_profiles", "city");

  if (hasCountry && !hasCity) {
    await knex.schema.alterTable("user_profiles", (table) => {
      table.renameColumn("country", "city");
    });
  }
};

exports.down = async function down(knex) {
  const hasTable = await knex.schema.hasTable("user_profiles");
  if (!hasTable) {
    return;
  }

  const hasCity = await knex.schema.hasColumn("user_profiles", "city");
  const hasCountry = await knex.schema.hasColumn("user_profiles", "country");

  if (hasCity && !hasCountry) {
    await knex.schema.alterTable("user_profiles", (table) => {
      table.renameColumn("city", "country");
    });
  }
};
