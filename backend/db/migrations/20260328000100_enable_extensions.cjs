exports.up = async function up(knex) {
  await knex.raw('create extension if not exists "pgcrypto"');
};

exports.down = async function down(knex) {
  await knex.raw('drop extension if exists "pgcrypto"');
};
