const bcrypt = require("bcryptjs");

const USER_IDS = {
  admin: "00000000-0000-4000-8000-000000000001",
  "player-one": "00000000-0000-4000-8000-000000000002",
  "player-two": "00000000-0000-4000-8000-000000000003",
  "player-three": "00000000-0000-4000-8000-000000000004",
  "pixel-artist": "00000000-0000-4000-8000-000000000005",
  "board-master": "00000000-0000-4000-8000-000000000006",
  "combo-queen": "00000000-0000-4000-8000-000000000007",
  "speed-runner": "00000000-0000-4000-8000-000000000008",
  "logic-lantern": "00000000-0000-4000-8000-000000000009",
  "rank-hunter": "00000000-0000-4000-8000-00000000000a",
  "sleep-mode": "00000000-0000-4000-8000-00000000000b"
};

exports.seed = async function seed(knex) {
  await knex("user_profiles").del();
  await knex("users").del();

  const roles = await knex("roles").select("role_id", "code");
  const roleMap = Object.fromEntries(roles.map((role) => [role.code, role.role_id]));
  const passwordHash = await bcrypt.hash("123456", 10);

  const insertedUsers = await knex("users").insert(
    [
      {
        user_id: USER_IDS.admin,
        role_id: roleMap.admin,
        email: "admin@hdpe.local",
        username: "admin",
        password_hash: passwordHash,
        status: "active",
        theme_preference: "dark"
      },
      {
        user_id: USER_IDS["player-one"],
        role_id: roleMap.user,
        email: "user@hdpe.local",
        username: "player-one",
        password_hash: passwordHash,
        status: "active",
        theme_preference: "light"
      },
      {
        user_id: USER_IDS["player-two"],
        role_id: roleMap.user,
        email: "player-two@hdpe.local",
        username: "player-two",
        password_hash: passwordHash,
        status: "active",
        theme_preference: "dark"
      },
      {
        user_id: USER_IDS["player-three"],
        role_id: roleMap.user,
        email: "player-three@hdpe.local",
        username: "player-three",
        password_hash: passwordHash,
        status: "active",
        theme_preference: "light"
      },
      {
        user_id: USER_IDS["pixel-artist"],
        role_id: roleMap.user,
        email: "artist@hdpe.local",
        username: "pixel-artist",
        password_hash: passwordHash,
        status: "active",
        theme_preference: "light"
      },
      {
        user_id: USER_IDS["board-master"],
        role_id: roleMap.user,
        email: "strategist@hdpe.local",
        username: "board-master",
        password_hash: passwordHash,
        status: "active",
        theme_preference: "dark"
      },
      {
        user_id: USER_IDS["combo-queen"],
        role_id: roleMap.user,
        email: "combo-queen@hdpe.local",
        username: "combo-queen",
        password_hash: passwordHash,
        status: "active",
        theme_preference: "light"
      },
      {
        user_id: USER_IDS["speed-runner"],
        role_id: roleMap.user,
        email: "speed-runner@hdpe.local",
        username: "speed-runner",
        password_hash: passwordHash,
        status: "active",
        theme_preference: "dark"
      },
      {
        user_id: USER_IDS["logic-lantern"],
        role_id: roleMap.user,
        email: "logic-lantern@hdpe.local",
        username: "logic-lantern",
        password_hash: passwordHash,
        status: "active",
        theme_preference: "light"
      },
      {
        user_id: USER_IDS["rank-hunter"],
        role_id: roleMap.user,
        email: "rank-hunter@hdpe.local",
        username: "rank-hunter",
        password_hash: passwordHash,
        status: "active",
        theme_preference: "dark"
      },
      {
        user_id: USER_IDS["sleep-mode"],
        role_id: roleMap.user,
        email: "sleep-mode@hdpe.local",
        username: "sleep-mode",
        password_hash: passwordHash,
        status: "disabled",
        theme_preference: "system"
      }
    ],
    ["user_id", "username", "email"]
  );

  await knex("user_profiles").insert(
    insertedUsers.map((user) => {
      const profileMap = {
        admin: {
          displayName: "System Admin",
          city: "Ho Chi Minh City",
          bio: "Quan ly he thong, game catalog va thong ke van hanh."
        },
        "player-one": {
          displayName: "Player One",
          city: "Da Nang",
          bio: "Thuong choi tic-tac-toe va caro de leo ranking."
        },
        "player-two": {
          displayName: "Player Two",
          city: "Ha Noi",
          bio: "Nguoi choi thich snake va cac game arcade co toc do cao."
        },
        "player-three": {
          displayName: "Player Three",
          city: "Can Tho",
          bio: "Tap trung vao memory game va social feature trong he thong."
        },
        "pixel-artist": {
          displayName: "Pixel Artist",
          city: "Hue",
          bio: "Demo user cho Bang Ve Tu Do, rat hop de test save/load."
        },
        "board-master": {
          displayName: "Board Master",
          city: "Hai Phong",
          bio: "Nguoi choi chien thuat, test caro 4 va caro 5."
        },
        "combo-queen": {
          displayName: "Combo Queen",
          city: "Quy Nhon",
          bio: "Nguoi choi thich match-3, ranking va cac bang diem co nhieu trang."
        },
        "speed-runner": {
          displayName: "Speed Runner",
          city: "Vung Tau",
          bio: "Tap trung vao toc do choi snake va tictactoe de leo top nhanh."
        },
        "logic-lantern": {
          displayName: "Logic Lantern",
          city: "Bien Hoa",
          bio: "Thuong test memory, tic-tac-toe va cac tinh nang social."
        },
        "rank-hunter": {
          displayName: "Rank Hunter",
          city: "Da Lat",
          bio: "Tai khoan duoc seed de kiem tra ranking, filter va pagination."
        },
        "sleep-mode": {
          displayName: "Sleep Mode",
          city: "Nha Trang",
          bio: "Tai khoan bi khoa de demo chuc nang admin disable user."
        }
      };

      const profile = profileMap[user.username] || {
        displayName: user.username,
        city: "Ho Chi Minh City",
        bio: `Demo profile for ${user.username}`
      };

      return {
        user_id: user.user_id,
        display_name: profile.displayName,
        bio: profile.bio,
        city: profile.city
      };
    })
  );
};
