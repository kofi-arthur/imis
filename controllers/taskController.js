import { eventBus } from "../services/socketService.js";
import { imisDB } from "../utils/config.js";
import { defError } from "../utils/constants.js";
import {
  getItemInfo,
  getProjectMembers,
  getUsersInfoByIds,
  logProjectActivity,
  logSystem,
} from "../utils/helpers.js";

import { v4 as uuidv4 } from "uuid";

export const fetchProjectTasks = async (req, res) => {
  const projectId = req.params.projectId;
  const taskQuery = `SELECT * FROM tasks WHERE projectId = ? ORDER BY dateCreated ASC`;

  try {
    const [tasks] = await imisDB.query(taskQuery, [projectId]);

    if (tasks.length === 0) return res.json({ tasks: [] });

    // Step 1: Extract unique userIds from tasks
    const userIds = [...new Set(tasks.map((task) => task.createdBy))];
    const assigneesId = [...new Set(tasks.flatMap((task) => task.assignedTo))];

    // Step 2: Get user info for those IDs
    const userInfoMap = {};
    const users = await getUsersInfoByIds(userIds); // returns array of user info
    const assigneeInfomap = {};
    const assignees = await getUsersInfoByIds(assigneesId); // returns array of user info

    users.forEach((user) => {
      userInfoMap[user.id] = {
        id: user.id,
        mail: user.mail,
        displayName: user.displayName,
        jobTitle: user.jobTitle,
        avatar: user.avatar,
      };
    });

    assignees.forEach((user) => {
      assigneeInfomap[user.id] = {
        id: user.id,
        mail: user.mail,
        displayName: user.displayName,
        jobTitle: user.jobTitle,
        avatar: user.avatar,
      };
    });

    // Step 3: Merge the user info into each task
    const enrichedTasks = tasks.map((task) => ({
      ...task,
      assignedTo: task.assignedTo.map((id) => assigneeInfomap[id]),
      createdBy: userInfoMap[task.createdBy] || null, // fallback to null if not found
    }));

    return res.json({ tasks: enrichedTasks });
  } catch (err) {
    console.error("Error fetching project tasks:", err);
    return res.status(500).json({ error: defError });
  }
};

// Fetch single task with comments and attachments
export const fetchTaskAll = async (req, res) => {
  const taskId = req.params.id;
  const taskQuery = `SELECT * FROM tasks WHERE taskId = ?`;
  const commentsQuery = `SELECT * FROM comments WHERE taskId = ? ORDER BY dateCreated`;
  const attachmentsQuery = `SELECT fileName, fileSize, createdBy, dateCreated FROM projectFiles WHERE taskId = ?`;

  try {
    const [[task]] = await imisDB.query(taskQuery, [taskId]);
    if (!task) return res.status(404).json({ error: "Task not found" });

    const [comments] = await imisDB.query(commentsQuery, [taskId]);
    const [attachments] = await imisDB.query(attachmentsQuery, [taskId]);

    return res.json({ task: { ...task, comments, attachments } });
  } catch (err) {
    console.error("Error fetching task details:", err);
    return res.status(500).json({ error: defError });
  }
};

// Add a new project task
export const addProjectTask = async (req, res) => {
  const task = req.body;
  const actor = req.user;

  const checkQuery = `SELECT taskId FROM tasks WHERE taskId = ? AND projectId = ?`;
  const insertQuery = `INSERT INTO tasks SET ?`;

  try {
    const [exists] = await imisDB.query(checkQuery, [
      task.taskId,
      task.projectId,
    ]);
    if (exists.length > 0) task.taskId = uuidv4();

    const assignees = task.assignedTo || [];
    const assignedIds = (task.assignedTo || []).map((user) => user.id);
    task.assignedTo = assignedIds;
    task.assignedTo = JSON.stringify(assignedIds);
    task.createdBy = task.createdBy.id;
    delete task.dateCreated;
    delete task.dateEdited;
    await imisDB.query(insertQuery, [task]);

    // const [[newTask]] = await imisDB.query(
    //   `SELECT * FROM tasks WHERE id = ?`,
    //   [task.taskId]
    // );

    // Notify all assigned users at once
    if (assignedIds.length > 0) {
      eventBus.emit("notifyUsers", {
        action: "assignTask",
        recipients: assignees,
        item: task,
        extra: { actor: actor },
      });
    }

    logSystem({
      projectId: task.projectId,
      details: `created a Task - ${task.title}.`,
      actor: actor.id,
      version: "client",
      type: "syslog",
    });

    logProjectActivity({
      projectId: task.projectId,
      details: `created a new Task - ${task.title}.`,
      actor: actor.id,
      version: "client",
      type: "activity",
    });
    return res.json({ message: "Task added successfully" });
  } catch (err) {
    console.error("Error adding task:", err);
    return res.status(500).json({ error: defError });
  }
};

// Update a project task
export const updateProjectTask = async (req, res) => {
  const task = req.body;
  const actor = req.user;

  try {
    task.createdBy = task.createdBy.id;

    const newAssignees = task.assignedTo || [];
    // Get array of new assigned IDs
    const newAssigneeIds = (task.assignedTo || []).map((user) => user.id);

    // Fetch existing assignees from DB
    const fetchAssigneesQuery = `
      SELECT assignedTo 
      FROM tasks 
      WHERE taskId = ? AND projectId = ?
    `;
    const [assignees] = await imisDB.query(fetchAssigneesQuery, [
      task.taskId,
      task.projectId,
    ]);
    const existingAssignees = await getUsersInfoByIds(assignees[0]?.assignedTo || []);

    // Find only newly added assignees
    const newlyAdded = newAssigneeIds.filter(
      (id) => !existingAssignees.map((user) => user.id).includes(id)
    );

    const newlyRemoved = existingAssignees.filter(
      (user) => !newAssigneeIds.includes(user.id)
    );

    // Store updated list in DB
    task.assignedTo = JSON.stringify(newAssigneeIds);
    delete task.dateCreated;
    delete task.dateEdited;

    const query = `
      UPDATE tasks SET ? 
      WHERE taskId = ? AND projectId = ?
    `;
    await imisDB.query(query, [task, task.taskId, task.projectId]);

    // Notify only the new assignees
    if (newlyAdded.length > 0) {
      eventBus.emit("notifyUsers", {
        action: "assignTask",
        recipients: newAssignees.filter((user) => newlyAdded.includes(user.id)),
        item: task,
        extra: { actor: actor },
      });
    }
    
    if(newlyRemoved.length > 0) {
      eventBus.emit("notifyUsers", {
        action: "unassignTask",
        recipients: newlyRemoved,
        item: task,
        extra: { actor: actor },
      });
    }

    logSystem({
      projectId: task.projectId,
      details: `edited Task - ${task.title}.`,
      actor: actor.id,
      version: "client",
      type: "syslog",
    });

    logProjectActivity({
      projectId: task.projectId,
      details: `modified details of Task - ${task.title}.`,
      actor: actor.id,
      version: "client",
      type: "activity",
    });

    return res.json({ message: "Task edited successfully" });
  } catch (err) {
    console.error("Error updating task:", err);
    return res.status(500).json({ error: defError });
  }
};

// Delete a project task
export const deleteProjectTask = async (req, res) => {
  const taskId = req.params.taskId;
  const actor = req.user;
  const query = `DELETE FROM tasks WHERE taskId = ? OR parentId = ?`;

  try {
    const taskInfo = await getItemInfo(taskId, "tasks");
    const [result] = await imisDB.query(query, [taskId, taskId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    logSystem({
      projectId: taskInfo.projectId,
      details: `deleted Task - ${taskInfo.title}.`,
      actor: actor.id,
      version: "client",
      type: "syslog",
    });

    logProjectActivity({
      projectId: taskInfo.projectId,
      details: `deleted Task - ${taskInfo.title}.`,
      actor: actor.id,
      version: "client",
      type: "activity",
    });

    return res.json({ message: "Task deleted successfully" });
  } catch (err) {
    console.error("Error deleting task:", err);
    return res.status(500).json({ error: defError });
  }
};

// Recover task (uses stored procedure)
export const recoverTask = async (req, res) => {
  const { taskId } = req.body;
  const actor = req.user;
  const query = `CALL recoverTask(?)`;

  try {
    await imisDB.query(query, [taskId]);
    await logSystem({
      projectId: task.projectId,
      details: `deleted Task - ${task.title}.`,
      actor: actor.id,
      version: "client",
      type: "syslog",
    });

    await logProjectActivity({
      projectId: task.projectId,
      details: `deleted Task - ${task.title}.`,
      actor: actor.id,
      version: "client",
      type: "activity",
    });
    return res.json({ message: "Task recovered successfully" });
  } catch (err) {
    console.error("Error recovering task:", err);
    return res.status(500).json({ error: defError });
  }
};

// Fetch comments on task
export const fetchTaskComments = async (req, res) => {
  const taskId = req.params.taskId;
  const query = `SELECT * FROM taskcomments WHERE taskId = ? ORDER BY dateCreated`;

  try {
    const [comments] = await imisDB.query(query, [taskId]);

    if (comments.length === 0) {
      return res.json({ comments: [] });
    }

    // Fetch full user info (only for those present in imisDB)
    const actorIds = comments.map((comment) => comment.createdBy);
    const actors = await getUsersInfoByIds(actorIds);

    const likedIds = comments.flatMap((comment) => comment.likedBy || []);
    const likedUsers = await getUsersInfoByIds(likedIds);

    const parsed = comments.map((comment) => {
      const actor = actors.find((user) => user.id === comment.createdBy);
      const likers = likedUsers.filter((user) =>
        comment.likedBy.includes(user.id)
      );
      return { ...comment, createdBy: actor, likedBy: likers };
    });

    return res.json({ comments: parsed });
  } catch (err) {
    console.error("Error fetching comments:", err);
    return res.status(500).json({ error: defError });
  }
};

// Add comment to task
export const addTaskComment = async (req, res) => {
  const { comment } = req.body;
  const actor = req.user;
  const query = `INSERT INTO taskcomments SET ?`;
  const projectMembers = await getProjectMembers(comment.projectId);

  try {
    await imisDB.query(query, [comment]);

    eventBus.emit("notifyUsers", {
      action: "comment",
      recipients: projectMembers,
      item: comment,
      extra: { type: "task", actor: actor },
    });

    logSystem({
      projectId: comment.projectId,
      details: `added a comment to Task - ${comment.taskId}.`,
      actor: actor.id,
      version: "client",
      type: "syslog",
    });

    logProjectActivity({
      projectId: comment.projectId,
      details: `added a new comment to Task - ${comment.taskId}.`,
      actor: actor.id,
      version: "client",
      type: "activity",
    });

    return res.json({ message: "Comment added successfully" });
  } catch (err) {
    console.error("Error adding comment:", err);
    return res.status(500).json({ error: defError });
  }
};

// Fetch attachments
export const fetchTaskAttachments = async (req, res) => {
  const taskId = req.params.taskId;
  const query = `
    SELECT fileId, fileName, fileSize, createdBy, dateCreated
    FROM projectFiles
    WHERE taskId = ?
  `;

  try {
    const [attachments] = await imisDB.query(query, [taskId]);
    return res.json({ attachments });
  } catch (err) {
    console.error("Error fetching attachments:", err);
    return res.status(500).json({ error: defError });
  }
};

// Delete attachment
export const deleteTaskAttachment = async (req, res) => {
  const { fileId, taskId } = req.body;
  const actor = req.user;
  const document = await getItemInfo(fileId, "projectFiles");
  const query = `DELETE FROM projectFiles WHERE fileId = ? AND taskId = ?`;

  try {
    const [result] = await imisDB.query(query, [fileId, taskId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Attachment not found" });
    }
    logSystem({
      projectId: comment.projectId,
      details: `deleted a Task ${document.type} - ${document.name}.`,
      actor: actor.id,
      version: "client",
      type: "syslog",
    });
    return res.json({ message: "Attachment deleted successfully" });
  } catch (err) {
    console.error("Error deleting attachment:", err);
    return res.status(500).json({ error: defError });
  }
};
