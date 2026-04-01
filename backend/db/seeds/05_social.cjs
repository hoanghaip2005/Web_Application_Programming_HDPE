exports.seed = async function seed(knex) {
  await knex("messages").del();
  await knex("conversation_members").del();
  await knex("conversations").del();
  await knex("friendships").del();

  const users = await knex("users").select("user_id", "username");
  const userMap = Object.fromEntries(users.map((user) => [user.username, user.user_id]));

  await knex("friendships").insert([
    {
      requester_id: userMap["player-one"],
      addressee_id: userMap["player-two"],
      status: "accepted",
      requested_at: knex.fn.now(),
      responded_at: knex.fn.now()
    },
    {
      requester_id: userMap["player-one"],
      addressee_id: userMap["pixel-artist"],
      status: "accepted",
      requested_at: knex.fn.now(),
      responded_at: knex.fn.now()
    },
    {
      requester_id: userMap["player-one"],
      addressee_id: userMap["combo-queen"],
      status: "accepted",
      requested_at: knex.fn.now(),
      responded_at: knex.fn.now()
    },
    {
      requester_id: userMap["player-one"],
      addressee_id: userMap["speed-runner"],
      status: "accepted",
      requested_at: knex.fn.now(),
      responded_at: knex.fn.now()
    },
    {
      requester_id: userMap["player-one"],
      addressee_id: userMap["logic-lantern"],
      status: "accepted",
      requested_at: knex.fn.now(),
      responded_at: knex.fn.now()
    },
    {
      requester_id: userMap["player-one"],
      addressee_id: userMap["rank-hunter"],
      status: "accepted",
      requested_at: knex.fn.now(),
      responded_at: knex.fn.now()
    },
    {
      requester_id: userMap["player-two"],
      addressee_id: userMap["board-master"],
      status: "accepted",
      requested_at: knex.fn.now(),
      responded_at: knex.fn.now()
    },
    {
      requester_id: userMap["player-three"],
      addressee_id: userMap["pixel-artist"],
      status: "accepted",
      requested_at: knex.fn.now(),
      responded_at: knex.fn.now()
    },
    {
      requester_id: userMap["board-master"],
      addressee_id: userMap["player-one"],
      status: "pending",
      requested_at: knex.fn.now()
    },
    {
      requester_id: userMap["player-three"],
      addressee_id: userMap["player-two"],
      status: "rejected",
      requested_at: knex.fn.now(),
      responded_at: knex.fn.now()
    }
  ]);

  const [conversationOne, conversationTwo, conversationThree, conversationFour] = await knex("conversations")
    .insert(
      [
        {
          conversation_type: "direct",
          created_by: userMap["player-one"]
        },
        {
          conversation_type: "direct",
          created_by: userMap["player-one"]
        },
        {
          conversation_type: "direct",
          created_by: userMap["player-two"]
        },
        {
          conversation_type: "direct",
          created_by: userMap["player-three"]
        }
      ],
      ["conversation_id"]
    );

  await knex("conversation_members").insert([
    {
      conversation_id: conversationOne.conversation_id,
      user_id: userMap["player-one"]
    },
    {
      conversation_id: conversationOne.conversation_id,
      user_id: userMap["player-two"]
    },
    {
      conversation_id: conversationTwo.conversation_id,
      user_id: userMap["player-one"]
    },
    {
      conversation_id: conversationTwo.conversation_id,
      user_id: userMap["pixel-artist"]
    },
    {
      conversation_id: conversationThree.conversation_id,
      user_id: userMap["player-two"]
    },
    {
      conversation_id: conversationThree.conversation_id,
      user_id: userMap["board-master"]
    },
    {
      conversation_id: conversationFour.conversation_id,
      user_id: userMap["player-three"]
    },
    {
      conversation_id: conversationFour.conversation_id,
      user_id: userMap["pixel-artist"]
    }
  ]);

  await knex("messages").insert([
    {
      conversation_id: conversationOne.conversation_id,
      sender_id: userMap["player-one"],
      message_body: "Ready cho tran caro toi nay khong?"
    },
    {
      conversation_id: conversationOne.conversation_id,
      sender_id: userMap["player-two"],
      message_body: "San sang, toi muon phuc thu!"
    },
    {
      conversation_id: conversationTwo.conversation_id,
      sender_id: userMap["pixel-artist"],
      message_body: "Mau moi cho free-draw dep hon roi do."
    },
    {
      conversation_id: conversationTwo.conversation_id,
      sender_id: userMap["player-one"],
      message_body: "Oke, toi se vao test save/load sau."
    },
    {
      conversation_id: conversationThree.conversation_id,
      sender_id: userMap["player-two"],
      message_body: "Hom nay dua snake hay caro 4 len ranking day?"
    },
    {
      conversation_id: conversationThree.conversation_id,
      sender_id: userMap["board-master"],
      message_body: "Caro 5 truoc, toi vua dat diem 100."
    },
    {
      conversation_id: conversationThree.conversation_id,
      sender_id: userMap["player-two"],
      message_body: "De toi phuc thu bang snake va match-3."
    },
    {
      conversation_id: conversationFour.conversation_id,
      sender_id: userMap["player-three"],
      message_body: "Memory game nay hop de luyen ghi nho do."
    },
    {
      conversation_id: conversationFour.conversation_id,
      sender_id: userMap["pixel-artist"],
      message_body: "Free-draw cung vui, nhung can them rating cho dong."
    }
  ]);
};
