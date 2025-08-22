
import { optramisDB } from "../utils/config.js";
import { defError } from "../utils/constants.js";

// FETCH USER NOTIFICATIONS
export const getNotifications = async (req, res) => {
  const mail = req.params.mail;
  const actor = req.user;

  if (!actor) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (actor.mail !== mail) {
    return res.status(403).json({ error: "Forbidden" });
  } else {
    const userId = actor.id;

    const query = `
    SELECT * FROM notifications 
    WHERE JSON_CONTAINS(recipients, JSON_QUOTE(?), '$') 
    ORDER BY dateCreated DESC;
  `;

    try {
      const [result] = await optramisDB.query(query, [userId]);
      return res.json({ notifications: result });
    } catch (err) {
      console.error("Error executing query:", err);
      return res.json({ error: defError });
    }
  }
};

// REMOVE ONE NOTIFICATION FOR SPECIFIC USER
// export const removeNotifications = async (req, res) => {
//   const { id, projectId, mail } = req.body;

//   const updateQuery = `
//     UPDATE notifications
//     SET recipients = (
//       SELECT JSON_ARRAYAGG(
//         JSON_OBJECT('mail', r.mail, 'displayName', r.displayName)
//       )
//       FROM JSON_TABLE(
//         recipients, '$[*]'
//         COLUMNS (
//           mail VARCHAR(255) PATH '$.mail',
//           displayName VARCHAR(255) PATH '$.displayName'
//         )
//       ) AS r
//       WHERE r.mail != ?
//     )
//     WHERE id = ? AND projectId = ?;
//   `;

//   const deleteQuery = `
//     DELETE FROM notifications
//     WHERE id = ?
//     AND (recipients IS NULL OR JSON_LENGTH(recipients) = 0);
//   `;

//   try {
//     await optramisDB.query(updateQuery, [mail, id, projectId]);
//     await optramisDB.query(deleteQuery, [id]);
//     return res.json({ message: "Success" });
//   } catch (err) {
//     console.error("Error removing notifications:", err);
//     return res.status(500).send("Error updating/deleting notifications");
//   }
// };

export const removeNotifications = async (req, res) => {
  const { id, projectId, mail } = req.body;
  const actor = req.user;

  if (!actor) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = actor.id;

  if (actor.mail !== mail) {
    return res.status(403).json({ error: "Forbidden" });
  } else {
    // Remove the userId from the recipients array
    const updateQuery = `
    UPDATE notifications 
    SET recipients = JSON_ARRAYAGG(r.userId)
    FROM (
      SELECT value AS userId
      FROM JSON_TABLE(
        recipients, '$[*]' COLUMNS (value VARCHAR(255) PATH '$')
      ) AS t
      WHERE t.value != ?
    ) AS r
    WHERE id = ? AND projectId = ?;
  `;

    // Fallback for MySQL versions < 8.0.24 (which don't support subqueries in SET)
    const fallbackUpdateQuery = `
    UPDATE notifications
    SET recipients = (
      SELECT JSON_ARRAYAGG(userId)
      FROM (
        SELECT value AS userId
        FROM JSON_TABLE(
          recipients, '$[*]' COLUMNS (value VARCHAR(255) PATH '$')
        ) AS t
        WHERE t.value != ?
      ) AS filtered
    )
    WHERE id = ? AND projectId = ?;
  `;

    const deleteQuery = `
    DELETE FROM notifications 
    WHERE id = ? 
    AND (recipients IS NULL OR JSON_LENGTH(recipients) = 0);
  `;

    try {
      await optramisDB.query(updateQuery, [userId, id, projectId]);
      await optramisDB.query(deleteQuery, [id]);
      return res.json({ message: "Success" });
    } catch (err) {
      console.error("Error removing notifications:", err);
      return res.status(500).send("Error updating/deleting notifications");
    }
  }
};

// REMOVE USER FROM ALL NOTIFICATIONS

// export const removeAllNotifications = async (req, res) => {
//   const { mail } = req.body;

//   const updateQuery = `
//     UPDATE notifications 
//     SET recipients = (
//       SELECT JSON_ARRAYAGG(
//         JSON_OBJECT('mail', r.mail, 'displayName', r.displayName)
//       )
//       FROM JSON_TABLE(
//         recipients, '$[*]' 
//         COLUMNS (
//           mail VARCHAR(255) PATH '$.mail',
//           displayName VARCHAR(255) PATH '$.displayName'
//         )
//       ) AS r
//       WHERE r.mail != ?
//     ) 
//     WHERE JSON_LENGTH(recipients) > 0;
//   `;

//   const deleteQuery = `
//     DELETE FROM notifications 
//     WHERE recipients IS NULL OR JSON_LENGTH(recipients) = 0;
//   `;

//   try {
//     await optramisDB.query(updateQuery, [mail]);
//     await optramisDB.query(deleteQuery);
//     return res.json({ message: "Success" });
//   } catch (err) {
//     console.error("Error removing all notifications:", err);
//     return res.status(500).send("Error updating/deleting notifications");
//   }
// };

export const removeAllNotifications = async (req, res) => {
  const { mail } = req.body;
  const actor = req.user;

  if (!actor) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (actor.mail !== mail) {
    return res.status(403).json({ error: "Forbidden" });
  } else {
    // Remove the userId from the recipients array
  
  const userId = actor.id;

  const updateQuery = `
    UPDATE notifications 
    SET recipients = (
      SELECT JSON_ARRAYAGG(userId)
      FROM (
        SELECT value AS userId
        FROM JSON_TABLE(
          recipients, '$[*]' COLUMNS (value VARCHAR(255) PATH '$')
        ) AS t
        WHERE t.value != ?
      ) AS filtered
    )
    WHERE JSON_CONTAINS(recipients, JSON_QUOTE(?), '$');
  `;

  const deleteQuery = `
    DELETE FROM notifications 
    WHERE recipients IS NULL OR JSON_LENGTH(recipients) = 0;
  `;

  try {
    const [updateResult] = await optramisDB.query(updateQuery, [userId, userId]);
    const [deleteResult] = await optramisDB.query(deleteQuery);

    return res.json({
      message: "Success",
      removedFromNotifications: updateResult.affectedRows,
      deletedNotifications: deleteResult.affectedRows,
    });
  } catch (err) {
    console.error("Error removing all notifications:", err);
    return res.status(500).send("Error updating/deleting notifications");
  }
  }
};
