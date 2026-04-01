exports.seed = async function seed(knex) {
  await knex("roles").del();
  await knex("roles").insert([
    {
      code: "user",
      name: "User",
      description: "Client user role"
    },
    {
      code: "admin",
      name: "Admin",
      description: "System administrator role"
    }
  ]);
};
