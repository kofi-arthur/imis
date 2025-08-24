import { imisDB, transporter, userDB } from "./config.js";

// Project Members
export const getProjectMembers = async (projectRoom) => {
  const query = `SELECT userId FROM projectmembers WHERE projectId = ?`;
  try {
    const [results] = await imisDB.query(query, [projectRoom]);
    const userIds = results.map((row) => row.userId);

    if (userIds.length === 0) {
      return { [projectRoom]: [] };
    }

    // Fetch basic user info from imisDB
    const [usersInfo] = await imisDB.query(
      `SELECT id, displayName, mail FROM users WHERE id IN (?)`,
      [userIds]
    );

    // Fetch extra info from userDB
    const [extraData] = await userDB.query(
      `SELECT id, jobTitle, department, avatar FROM users WHERE id IN (?)`,
      [userIds]
    );

    // Convert extraData to a map for faster lookup
    const extraMap = {};
    for (const user of extraData) {
      extraMap[user.id] = user;
    }

    // Merge both datasets by id
    const mergedUsers = usersInfo.map((user) => ({
      id: user.id,
      displayName: user.displayName,
      mail: user.mail,
      jobTitle: extraMap[user.id]?.jobTitle || null,
      department: extraMap[user.id]?.department || null,
      avatar: extraMap[user.id]?.avatar || null,
    }));

    return {
      [projectRoom]: mergedUsers,
    };
  } catch (err) {
    console.error("Error executing getProjectMembers query:", err);
    throw err;
  }
};

export const getUserInfo = async (userId) => {
  if (!userId) return null;

  try {
    // Step 1: Verify the user exists in imisDB
    const [[optramUser]] = await imisDB.query(
      `SELECT id, mail, displayName FROM users WHERE id = ?`,
      [userId]
    );

    if (!optramUser) {
      // User is not registered in the system
      return null;
    }

    // Step 2: Fetch extra details from userDB (based on same ID)
    const [[userExtra]] = await userDB.query(
      `SELECT id,jobTitle, department, avatar FROM users WHERE id = ?`,
      [userId]
    );

    return {
      ...optramUser,
      ...userExtra, // may be undefined or missing values
    };
  } catch (error) {
    console.error(`Error fetching user info for ID ${userId}:`, error);
    return null;
  }
};

export const getUsersInfoByIds = async (userIds = []) => {
  if (!Array.isArray(userIds) || userIds.length === 0) return [];

  try {
    // Step 1: Fetch authorized users from imisDB
    const [optramUsers] = await imisDB.query(
      `SELECT id, mail, displayName FROM users WHERE id IN (?)`,
      [userIds]
    );

    const authorizedUserIds = optramUsers.map((u) => u.id);
    if (authorizedUserIds.length === 0) return [];

    // Step 2: Fetch enriched data from userDB
    const [extraData] = await userDB.query(
      `SELECT id, jobTitle, department, avatar FROM users WHERE id IN (?)`,
      [authorizedUserIds]
    );

    // ✅ Optimize merging with a Map for O(1) lookups
    const extraDataMap = new Map(extraData.map((u) => [u.id, u]));

    // Step 3: Merge efficiently
    const enrichedUsers = optramUsers.map((user) => ({
      ...user,
      ...extraDataMap.get(user.id),
    }));

    return enrichedUsers;
  } catch (error) {
    console.error("Error fetching multiple users:", error);
    return [];
  }
};

export const getClientInfo = async (clientId) => {
  const query = `SELECT * FROM clients WHERE id = ? LIMIT 1`;
  try {
    const [results] = await userDB.query(query, [clientId]);
    return results?.[0] || null;
  } catch (err) {
    console.error("Error fetching client info:", err);
    throw err;
  }
};

// Get item (project/task) info
export const getItemInfo = async (id, type) => {
  let idName;
  switch (type) {
    case "projects":
      idName = "projectId";
      break;
    case "tasks":
      idName = "taskId";
      break;
    default:
      idName = "id";
      break;
  }

  const query = `SELECT * FROM ${type} WHERE ${idName} = ? LIMIT 1`;
  try {
    const [results] = await imisDB.query(query, [id]);
    return results?.[0] || null;
  } catch (err) {
    console.error("Error fetching item info:", err);
    throw err;
  }
};

// Milestone Completion
export const checkMilestonesCompletion = async (milestoneId) => {
  const statusQuery = `
    SELECT COUNT(*) AS total,
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed
    FROM tasks WHERE milestoneId = ?
  `;
  const updateQuery = `
    UPDATE milestones
    SET isCompleted = ?, dateCompleted = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  try {
    const [rows] = await imisDB.query(statusQuery, [milestoneId]);
    const { total, completed } = rows[0];
    const isCompleted = total > 0 && total === completed;
    await imisDB.query(updateQuery, [isCompleted, milestoneId]);
  } catch (err) {
    console.error("Error updating completed milestones:", err);
  }
};

// Update status
export const markAs = async (projectroom, type, status, item) => {
  const query =
    type === "projects"
      ? `UPDATE projects SET status = ? WHERE id = ?`
      : `UPDATE tasks SET status = ? WHERE id = ? AND projectId = ?`;

  const params =
    type === "projects"
      ? [status, projectroom]
      : [status, item.id, projectroom];

  try {
    const [info] = await imisDB.query(query, params);
    return info.affectedRows > 0;
  } catch (err) {
    console.error("Error executing markAs query", err);
    return false;
  }
};

// Change task priority
export const changePriority = async (projectroom, priority, id) => {
  const query = `UPDATE tasks SET priority = ? WHERE projectId = ? AND id = ?`;
  try {
    const [info] = await imisDB.query(query, [priority, projectroom, id]);
    return info.affectedRows > 0;
  } catch (err) {
    console.error("Error executing changePriority query", err);
    return false;
  }
};

// Send email notification
export async function emailNotif(mailOptions) {
  try {
    await transporter.sendMail(mailOptions);
    console.log("Notification sent to email");
  } catch (err) {
    console.error("Error sending mail:", err);
  }
}

// Save in-app notification
export const saveNotification = async (data) => {
  const query = `INSERT INTO notifications SET ?`;
  try {
    await imisDB.query(query, data);
  } catch (err) {
    console.error("Error inserting notification:", err);
  }
};

// // --- Notification wrappers (unchanged) ---
// export const notifyTaskPriority = (task, priority, recipients, actor) => {
//   saveNotification({
//     title: `${task.title} priority - ${priority}`,
//     details: `Task - ${task.title} for project ${task.workOrderNo} is currently ${priority} priority.`,
//     projectId: task.projectId,
//     taskId: task.id,
//     actor: actor,
//     recipients,
//   });
// };

// export const notifyTaskStatus = (task, status, recipients, actor) => {
//   saveNotification({
//     title: `${task.title} status - ${status}`,
//     details: `Task - ${task.title} for project ${task.workOrderNo} is currently ${status}.`,
//     projectId: task.projectId,
//     taskId: task.id,
//     actor: actor,
//     recipients,
//   });
// };

export const notifyProjectPriority = (project, priority, recipients) => {
  saveNotification({
    title: `Project ${project.workOrderNo} priority - ${priority}`,
    details: `${project.projectName}, is currently ${priority} priority.`,
    projectId: project.projectId,
    recipients,
  });
};

export const notifyProjectStatus = (project, status, recipients) => {
  saveNotification({
    title: `Project ${project.workOrderNo} status - ${status}`,
    details: `${project.projectName}, is currently ${status}.`,
    projectId: project.projectId,
    recipients,
  });
};

export const notifyUsers = async (
  action,
  item = {},
  recipients,
  extra = {}
) => {
  let title, details;
  let { type, role, priority, status, comment, actor } = extra;
  switch (action) {
    case "grant":
      title = "Membership Granted";
      details = `You have been added to project - ${item.projectName}.`;
      break;
    case "revoke":
      title = "Membership Revoked";
      details = `You have been removed from project - ${item.projectName}.`;
      break;
    case "changeUserRole":
      title = "Project Role Change";
      details = `Your role in project - ${item.projectName} has been changed to ${role}.`;
      break;
    case "priorityChange":
      title = `${type} Priority Update`;
      details = `The priority of ${type} - ${item.title} has been changed to ${priority}.`;
      break;
    case "statusChange":
      title = `${type} Status Update`;
      details = `The status of ${type} - ${item.title} has been changed to ${status}.`;
      break;
    case "ownershipChange":
      title = "Ownership Change";
      details = `You are now the owner of project - ${item.projectName}.`;
      break;
    case "managerChange":
      title = "Management Change";
      details = `You are now the manager of project - ${item.projectName}.`;
      break;
    case "assignTask":
      title = "Task Assignment";
      details = `Task - ${item.title} has been assigned to you.`;
      break;
    case "comment":
      title = `New Comment on ${type} - ${item.title}`;
      details = `${comment.createdBy.displayName} : ${comment.details}`;
      break;
    default:
      title = `imis Role Change`;
      details = `Your role in imis has been changed to ${role}.`;
  }

  const data = {
    title,
    details,
    projectId: item.projectId || null,
    taskId: item.taskId || null,
    recipients: JSON.stringify(
      Array.isArray(recipients) ? recipients : [recipients]
    ),
  };

  if (actor) {
    data.actor = actor.id;
  }
  await saveNotification(data);
};

// Messaging
export const saveDiscussionMessage = async (
  roomId,
  message,
  sender,
  timeSent
) => {
  const query = `INSERT INTO messages (roomId, sender, message, timeSent) VALUES (?, ?, ?, ?)`;
  try {
    await imisDB.query(query, [roomId, sender, message, timeSent]);
  } catch (err) {
    console.error("Error saving discussion message:", err);
  }
};

export const savePrivateMessage = async (
  roomId,
  message,
  sender,
  recipient,
  timeSent,
  isRead
) => {
  const query = `INSERT INTO messages (roomId, sender, recipient, message, timeSent, isRead) VALUES (?, ?, ?, ?, ?, ?)`;
  try {
    await imisDB.query(query, [
      roomId,
      sender,
      recipient,
      message,
      timeSent,
      isRead,
    ]);
  } catch (err) {
    console.error("Error saving private message:", err);
  }
};

export const readMessages = async (room, recipient) => {
  const query = `UPDATE messages SET isRead = 1 WHERE room = ? AND isRead = 0 AND JSON_CONTAINS(recipient, ?)`;
  try {
    const [result] = await imisDB.query(query, [room, recipient]);
    return result;
  } catch (err) {
    console.error("Error marking messages as read:", err);
    throw err;
  }
};

// Group project & tasks
export function groupProjectsByWorkOrder(results) {
  const projectsMap = {};
  results.forEach((row) => {
    if (!projectsMap[row.workOrderNo]) {
      projectsMap[row.workOrderNo] = {
        id: row.projectId,
        workOrderNo: row.workOrderNo,
        projectName: row.projectName,
        projectCategory: row.projectCategory,
        projectDescription: row.projectDescription,
        client: row.client,
        workOrderReceivedDate: row.workOrderReceivedDate,
        productionJobNo: row.productionJobNo,
        status: row.status,
        startDate: row.startDate,
        endDate: row.endDate,
        createdBy: row.createdBy,
        endDate: row.endDate,
        dateCreated: row.dateCreated,
        tasks: [],
      };
    }
  });

  const taskMap = {};
  results.forEach((row) => {
    if (row.taskId) {
      taskMap[row.taskId] = {
        id: row.taskId,
        parentId: row.taskParentId,
        title: row.taskName,
        description: row.taskDescription,
        assignees: row.assignees,
        status: row.taskStatus,
        dateCreated: row.taskDateCreated,
        dateEdited: row.taskDateEdited,
        dueDate: row.taskDueDate,
        dateCompleted: row.taskDateCompleted,
        subtasks: [],
      };
    }
  });

  Object.values(taskMap).forEach((task) => {
    if (task.parentId && taskMap[task.parentId]) {
      taskMap[task.parentId].subtasks.push(task);
    } else {
      const project = results.find((r) => r.taskId === task.id);
      projectsMap[project.workOrderNo].tasks.push(task);
    }
  });

  return Object.values(projectsMap);
}

// Activity logs-----------------------------------------------------------------------
export const logSystem = async (activity) => {
  const query = `INSERT INTO logs SET ?`;
  try {
    await imisDB.query(query, activity);
  } catch (err) {
    console.error("Error executing query:", err);
  }
};

export const logProjectActivity = async (activity) => {
  const query = `INSERT INTO logs SET ?`;
  try {
    await imisDB.query(query, activity);
  } catch (err) {
    console.error("Error executing query:", err);
  }
};

export async function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export async function generateEmailTemplate({ displayName, title, body }) {
  return `
    <section style="font-family: Segoe UI, Arial, sans-serif; width: 100dvw; display: flex; flex-direction: column; align-items: center; background-color: #F0F0F0;">

        <div style="width: 100%; max-width: 450px; margin-block: 32px; background: #fff !important; border-radius: 24px; box-shadow: 0 15px 35px -20px #0005; padding: 16px; padding-block-end: 32px;">

            <!-- Header -->
            <img src="https://imis.wecltd.io/email.png" alt="imis email header" width="100%" style=" width: 100%; border-radius: 16px; overflow:hidden; margin-bottom: 16px;">

            <h2 style="color: #323130; font-size: 32px; font-weight: 700;margin: 0;">
                ${title || "Notification from imis"}
            </h2>

            <!-- Greeting -->
            <p style="font-size: 16px; color: #323130;">
                Hello ${displayName || "User"},
            </p>

            <!-- Main body -->
            <p style="font-size: 15px; color: #323130; line-height: 1.6;">
                ${body}
            </p>

            <!-- Callout card (like OneDrive uses for shared items) -->
            <div
                style="margin: 25px 0; padding: 20px; background-color: #f8f8f8; border: 1px solid #e1dfdd; border-radius: 4px;">
                <p style="margin: 0; font-size: 15px; color: #201f1e;">
                    You can view this in <strong><a href="https://imis.wecltd.io" target="_blank"
                            style="color: #323130; text-decoration: none;">imis</a></strong> for more details.
                </p>
            </div>

            <!-- Footer -->
            <p style="font-size: 12px; line-height: 12px; color: #605e5c; margin-top: 30px;">
                Please do not reply to this email. It is an automated notification.
            </p>
            <p style="font-size: 12px; width: 100%; color: #605e5c;">
                © ${new Date().getFullYear()} imis.wecltd
            </p>
        </div>
    </section>
  `;
}

export async function buildNotificationMessage(action, item, extra) {
  let { type, role, permission, priority, status, actor } = extra;
  switch (action) {
    case "grant":
      return {
        title: "Membership Granted",
        details: `You have been added to project - ${item.projectName}.`,
      };
    case "revoke":
      return {
        title: "Membership Revoked",
        details: `You have been removed from project - ${item.projectName}.`,
      };
    case "changeUserAccess":
      return {
        title: "Project Access Change",
        details: `Your access in project - ${item.projectName} has been changed to ${role} - ${permission}.`,
      };
    case "priorityChange":
      return {
        title: `${type} Priority Update`,
        details: `The priority of ${type} - ${item.title} has been changed to ${priority}.`,
      };
    case "statusChange":
      return {
        title: `${type} Status Update`,
        details: `The status of ${type} - ${item.title} has been changed to ${status}.`,
      };
    case "ownershipChange":
      return {
        title: "Ownership Change",
        details: `You are now the owner of project - ${item.projectName}.`,
      };
    case "managerChange":
      return {
        title: "Management Change",
        details: `You are now the manager of project - ${item.projectName}.`,
      };
    case "assignTask":
      return {
        title: "Task Assignment",
        details: `Task - ${item.title} has been assigned to you.`,
      };
    case "comment":
      const taskInfo = await getItemInfo(item.taskId, "tasks");
      return {
        title: `New Comment on ${type} - ${taskInfo.title}`,
        details: `${item.createdBy.displayName} : ${item.details}`,
      };
    case "newMeeting":
      return {
        title: "New Meeting Scheduled",
        details: `<h4>A new meeting <strong style="font-size: 18px;">${item.title}</strong> has been scheduled at 
          <strong style="font-size: 18px;">${item.startTime}</strong> by 
          <strong style="font-size: 18px;">${actor.displayName}</strong> 
          for project <strong style="font-size: 18px;">${item.projectTitle}</strong>.
        </h4>
        <br/>
         <a href="${item.meetingLink}" target="_blank" style="font-size: 18px;">Join Meeting.</a>.`,
      };

    default:
      return {
        title: `imis Role Change`,
        details: `Your role in imis has been changed to ${role}.`,
      };
  }
}
