import { get } from "http";
import { imisDB } from "../utils/config.js";
import { defError } from "../utils/constants.js";
import {
  getClientInfo,
  getItemInfo,
  getProjectMembers,
  getUserInfo,
  getUsersInfoByIds,
  logProjectActivity,
  logSystem,
} from "../utils/helpers.js";
import crypto from "crypto";
import { getActiveUsers, getSocketInstance } from "../services/socketService.js";

// Fetch project with tasks (with nested subtasks)
export const fetchProjectAll = async (req, res) => {
  const { projectId } = req.params;
  const query = `
    SELECT 
        p.*, 
        t.id AS taskId, 
        t.parentId AS taskParentId,
        t.title AS taskName, 
        t.description AS taskDescription, 
        t.assignees, 
        t.status AS taskStatus, 
        t.dateCreated AS taskDateCreated, 
        t.dateEdited AS taskDateEdited, 
        t.dueDate AS taskDueDate, 
        t.dateCompleted AS taskDateCompleted 
    FROM 
        projects p
    LEFT JOIN 
        tasks t ON p.projectId = t.projectId 
    WHERE 
        p.projectId = ?
  `;

  try {
    const [results] = await imisDB.query(query, [projectId]);
    if (results.length === 0)
      return res.json({ error: "Project not found or no tasks associated" });

    const taskMap = {};
    const rootTasks = [];

    results.forEach((row) => {
      if (!row.taskId) return;
      const task = {
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
      taskMap[row.taskId] = task;
    });

    Object.values(taskMap).forEach((task) => {
      if (task.parentId && taskMap[task.parentId]) {
        taskMap[task.parentId].subtasks.push(task);
      } else {
        rootTasks.push(task);
      }
    });

    const project = {
      ...results[0],
      tasks: rootTasks,
    };

    return res.json({ project });
  } catch (err) {
    console.error("Error fetching project", err);
    return res.json({ error: defError });
  }
};

export const fetchProjectInfo = async (req, res) => {
  const { projectId } = req.params;
  try {
    const [projectRows] = await imisDB.query(
      "SELECT * FROM projects WHERE projectId = ?",
      [projectId]
    );

    if (projectRows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    const project = projectRows[0];

    const client = await getClientInfo(project.client);
    if (client !== null) {
      project.client = {
        id: client.id,
        displayName: client.displayName,
        website: client.website,
        primaryContactName: client.primaryContactName,
        primaryContactMail: client.primaryContactMail,
        primaryContactPhone: client.primaryContactPhone,
        backupContactName: client.backupContactName,
        backupContactMail: client.backupContactMail,
        backupContactPhone: client.backupContactPhone,
        avatar: client.avatar,
        notes: client.notes,
      };
    } else {
      project.client = null;
    }
    // const projectMembers = await getProjectMembers(projectId);

    // for (const member of projectMembers[projectId]) {
    //   delete member.mail, delete member.jobTitle, delete member.department;
    // }

    // Enrich user fields
    const [createdBy, projectOwner] = await Promise.all([
      getUserInfo(project.createdBy),
      getUserInfo(project.projectOwner),
    ]);

    // console.log({
    //   project: {
    //     ...project,
    //     members: projectMembers[projectId] || [],
    //     createdBy,
    //     projectOwner,
    //   },
    // });

    return res.json({
      project: {
        ...project,
        // members: projectMembers[projectId] || [],
        createdBy,
        projectOwner,
      },
    });
  } catch (err) {
    console.error("Error fetching project info", err);
    return res.status(500).json({ error: defError });
  }
};

export const fetchUserProjects = async (req, res) => {
  const userId = req.params.userId;
  const user = req.user;

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (user.id !== userId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const [memberships] = await imisDB.query(
      "SELECT projectId FROM projectmembers WHERE userId = ?",
      [user.id]
    );

    if (memberships.length === 0) {
      return res.json({ projects: [] });
    }

    const projectIds = memberships.map((row) => row.projectId);
    const [rawProjects] = await imisDB.query(
      "SELECT * FROM projects WHERE projectId IN (?)",
      [projectIds]
    );
    if (rawProjects.length === 0) {
      return res.json({ projects: [] });
    }

    // Batch client fetching
    const clientIds = [...new Set(rawProjects.map(p => p.client).filter(Boolean))];
    const clientMap = {};
    await Promise.all(clientIds.map(async (clientId) => {
      const client = await getClientInfo(clientId);
      if (client) {
        clientMap[clientId] = {
          id: client.id,
          displayName: client.displayName,
          website: client.website,
          primaryContactName: client.primaryContactName,
          primaryContactMail: client.primaryContactMail,
          primaryContactPhone: client.primaryContactPhone,
          backupContactName: client.backupContactName,
          backupContactMail: client.backupContactMail,
          backupContactPhone: client.backupContactPhone,
          avatar: client.avatar,
          notes: client.notes,
        };
      }
    }));

    // Batch project members fetching
    const membersMap = {};
    await Promise.all(projectIds.map(async (projectId) => {
      const projectMembers = await getProjectMembers(projectId);
      membersMap[projectId] = (projectMembers[projectId] || []).map(m => ({
        id: m.id,
        displayName: m.displayName,
        avatar: m.avatar, // Keep only relevant fields
      }));
    }));

    // Collect all unique userIds (createdBy & projectOwner)
    const userIdsSet = new Set();
    rawProjects.forEach((project) => {
      if (project.createdBy) userIdsSet.add(project.createdBy);
      if (project.projectOwner) userIdsSet.add(project.projectOwner);
    });

    const users = await getUsersInfoByIds([...userIdsSet]);
    const userMap = {};
    users.forEach((u) => {
      userMap[u.id] = {
        id: u.id,
        mail: u.mail,
        displayName: u.displayName,
        avatar: u.avatar,
      };
    });

    // Assemble enriched projects
    const enrichedProjects = rawProjects.map((project) => ({
      ...project,
      client: clientMap[project.client] || null,
      members: membersMap[project.projectId] || [],
      createdBy: userMap[project.createdBy] || null,
      projectOwner: userMap[project.projectOwner] || null,
    }));

    return res.json({ projects: enrichedProjects });
  } catch (err) {
    console.error("Error fetching user projects:", err);
    return res.status(500).json({ error: defError });
  }
};

export const addProject = async (req, res) => {
  let project = req.body;
  const actor = req.user;

  try {
    const [existing] = await imisDB.query(
      "SELECT * FROM projects WHERE workOrderNo = ? OR productionJobNo = ?",
      [project.workOrderNo, project.productionJobNo]
    );
    if (existing.length > 0) {
      return res.json({
        error:
          "Project with this work order number and/or production job number already exists",
      });
    }

    const [idCheck] = await imisDB.query(
      "SELECT projectId FROM projects WHERE projectId = ?",
      [project.projectId]
    );

    if (idCheck.length > 0) {
      project.projectId = crypto.randomUUID();
    }

    project.createdBy = actor.id;
    project.projectOwner = project.projectOwner?.trim() || actor.id;

    await imisDB.query("INSERT INTO projects SET ?", [project]);

    logSystem({
      type: "syslog",
      projectId: project.projectId,
      details: `created a project with Work Order No. - ${project.workOrderNo}.`,
      actor: actor.id,
      version: "admin",
    });

    return res.json({ message: "Project added successfully" });
  } catch (err) {
    console.error("Error adding project", err);
    return res.json({ error: defError });
  }
};

export const updateProject = async (req, res) => {
  const project = req.body;
  const actor = req.user;

  try {
    await imisDB.query("UPDATE projects SET ? WHERE projectId = ?", [
      project,
      project.projectId,
    ]);

    logProjectActivity({
      projectId: project.projectId,
      details: `modified the project details.`,
      actor: actor.id,
      version: "client",
      type: "activity",
    });

    logSystem({
      projectId: project.projectId,
      details: `modified the project details.`,
      actor: actor.id,
      version: "client",
      type: "syslog",
    });

    return res.json({ message: "Project updated successfully" });
  } catch (err) {
    console.error("Error updating project", err);
    return res.json({ error: defError });
  }
};

export const deleteProject = async (req, res) => {
  const projectId = req.params.projectId;
  const actor = req.user;
  const projectInfo = await getItemInfo(projectId, "projects");

  try {
    const projectMembers = await getProjectMembers(projectId);
    const memberIds =
      projectMembers[projectId]?.map((m) => m.id) || [];

    const io = await getSocketInstance();
    const activeUsers = await getActiveUsers();
    for (const userId of memberIds) {
      const connection = activeUsers[userId];
      if (connection) {
        io.sockets.to(connection.socketId)
          .emit("projectDelete", projectId);
      }
    }

    await imisDB.query("DELETE FROM projects WHERE projectId = ?", [
      projectId,
    ]);

    logSystem({
      type: "syslog",
      projectId: projectId,
      details: `deleted project  - ${projectInfo.projectName}.`,
      actor: actor.id,
      version: "admin",
    });

    return res.json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error("Error deleting project", err);
    return res.json({ error: defError });
  }
};

export const recoverProject = async (req, res) => {
  const { projectId } = req.body;
  const actor = req.user;
  const project = getItemInfo(projectId, "projects");

  try {
    await imisDB.query("CALL recoverProject(?)", [projectId]);

    logSystem({
      type: "syslog",
      projectId: projectId,
      details: `deleted project Work Order No. - ${project.workOrderNo}.`,
      actor: actor.id,
      version: "admin",
    });
    return res.json({ message: "Project recovered successfully" });
  } catch (err) {
    console.error("Error recovering project", err);
    return res.json({ error: defError });
  }
};
