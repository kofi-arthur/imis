import { imisDB } from "../utils/config.js";
import { defError } from "../utils/constants.js";
import { getUserInfo, getUsersInfoByIds } from "../utils/helpers.js";

export const fetchRecentMessages = async (req, res) => {
  const { userId, projectId } = req.params;
  const actor = req.user;

  if (!actor || actor.id !== userId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const query = `
      SELECT m.roomId AS chatId, 
             m.message, 
             m.timeSent, 
             m.sender
      FROM messages m
      JOIN chats c ON m.roomId = c.chatId
      WHERE m.recipient = ?
        AND c.projectId = ?
        AND m.roomId != c.projectId -- exclude project discussion
        AND JSON_CONTAINS(c.recipients, JSON_QUOTE(?), '$')
        AND m.timeSent = (
          SELECT MAX(m2.timeSent)
          FROM messages m2
          WHERE m2.roomId = m.roomId
            AND m2.recipient = ?
        )
      ORDER BY m.timeSent DESC
      LIMIT 5;
    `;

    const [rows] = await imisDB.query(query, [
      userId,
      projectId,
      userId,
      userId,
    ]);

    if (!rows.length) {
      return res.json({ messages: [] });
    }

    // Fetch sender info for all unique senders
    const senderIds = [...new Set(rows.map((m) => m.sender))];
    const senders = await getUsersInfoByIds(senderIds);
    const senderMap = {};
    senders.forEach((u) => {
      senderMap[u.id] = {
        id: u.id,
        mail: u.mail,
        displayName: u.displayName,
        department: u.department,
        jobTitle: u.jobTitle,
        avatar: u.avatar,
      };
    });

    // Attach sender info
    const messages = rows.map((m) => ({
      chatId: m.chatId,
      message: m.message,
      timeSent: m.timeSent,
      sender: senderMap[m.sender] || null,
    }));
    return res.json({ messages });
  } catch (err) {
    console.error("Error fetching recent messages:", err);
    return res.status(500).json({ error: "Error fetching recent messages" });
  }
};

// Get all project discussion messages
export const fetchMessages = async (req, res) => {
  const roomId = req.params.roomId;
  const query = "SELECT * FROM messages WHERE roomId = ?";

  try {
    const [messages] = await imisDB.query(query, [roomId]);
    return res.json({ messages });
  } catch (err) {
    console.error("error executing query", err);
    return res.json({ error: defError });
  }
};

export const fetchPrivateChats = async (req, res) => {
  const { projectId, userId } = req.params;
  const actor = req.user;

  if (!actor || actor.id !== userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const queryChats = `
    SELECT chatId, recipients
    FROM chats
    WHERE projectId = ?
    AND JSON_CONTAINS(recipients, JSON_QUOTE(?), '$')
    ORDER BY dateCreated DESC;
  `;

  const queryLastMessage = `
    SELECT message, timeSent, isRead, sender
    FROM messages
    WHERE roomId = ?
    ORDER BY timeSent DESC
    LIMIT 1;
  `;

  try {
    const [chats] = await imisDB.query(queryChats, [projectId, userId]);

    // Gather all unique userIds across chats
    const allRecipientIds = new Set();
    chats.forEach((chat) => {
      const recipientsArray = Array.isArray(chat.recipients)
        ? chat.recipients
        : JSON.parse(chat.recipients); // fallback if it's a string

      recipientsArray.forEach((id) => {
        if (id !== userId) allRecipientIds.add(id);
      });

      chat.recipientIds = recipientsArray;
    });

    // Get full user info for all recipient IDs
    const enrichedUsers = await getUsersInfoByIds([...allRecipientIds]);
    const userMap = {};
    enrichedUsers.forEach((u) => {
      userMap[u.id] = {
        id: u.id,
        mail: u.mail,
        displayName: u.displayName,
        avatar: u.avatar,
      };
    });

    // Process chats
    const processChats = chats.map(async (chat) => {
      const [messageResult] = await imisDB.query(queryLastMessage, [
        chat.chatId,
      ]);
      const lastMessage = messageResult[0] || {};

      // Get the other participant who isn't the current user
      const otherUser =
        chat.recipientIds
          .filter((id) => id !== userId)
          .map((id) => userMap[id])
          .filter(Boolean)[0] || null;

      return {
        chatId: chat.chatId,
        sender: otherUser,
        message: lastMessage.message || null,
        timeSent: lastMessage.timeSent || null,
        isRead: lastMessage.isRead || false,
      };
    });

    // Include discussion chat
    const discussionChat = (async () => {
      try {
        const [messageResult] = await imisDB.query(queryLastMessage, [
          projectId,
        ]);
        const lastMessage = messageResult[0] || {};
        const senderInfo = lastMessage.sender
          ? await getUserInfo(lastMessage.sender)
          : null;

        return {
          chatId: projectId,
          sender: senderInfo
            ? {
              id: senderInfo.id,
              mail: senderInfo.mail,
              displayName: senderInfo.displayName,
              avatar: senderInfo.avatar,
            }
            : null,
          message: lastMessage.message || null,
          timeSent: lastMessage.timeSent || null,
          isRead: lastMessage.isRead || 0,
        };
      } catch (err) {
        console.error("Error fetching discussion chat:", err);
        return null;
      }
    })();

    const allChats = await Promise.all([...processChats, discussionChat]);
    const validChats = allChats.filter(Boolean);
    return res.json({ chats: validChats });
  } catch (err) {
    console.error("Error fetching chats:", err);
    return res.status(500).json({ error: defError });
  }
};

// Create a new chat
export const createChat = async (req, res) => {
  const chat = req.body;
  chat.recipients = JSON.stringify(chat.recipients);

  const query = `INSERT INTO chats SET ?`;

  try {
    const [result] = await imisDB.query(query, [chat]);
    if (result.affectedRows === 0) {
      return res.json({ error: "Failed to create chat." });
    }
    logSystem({
      projectId: folder.projectId,
      details: `Created a chat.`,
      actor: actor.id,
      version: "admin",
      type: "syslog",
    });
    return res.json({ message: "Chat created." });
  } catch (err) {
    console.error("error executing query", err);
    return res.json({ error: defError });
  }
};

// Delete a chat
export const deleteChat = async (req, res) => {
  const actor = req.actor;
  const { chatId } = req.params;
  const query = `DELETE FROM chats WHERE id = ?`;

  try {
    const [result] = await imisDB.query(query, [chatId]);
    if (result.affectedRows === 0) {
      return res.json({ error: "Failed to delete chat." });
    }
    logSystem({
      projectId: folder.projectId,
      details: `Deleted a chat and its contents.`,
      actor: actor.id,
      version: "admin",
      type: "syslog",
    });
    return res.json({ message: "Chat deleted." });
  } catch (err) {
    console.error("error executing query", err);
    return res.json({ error: defError });
  }
};
