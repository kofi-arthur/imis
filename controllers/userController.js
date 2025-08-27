import { eventBus } from "../services/socketService.js";
import { imisDB, userDB } from "../utils/config.js";
import { defError, systemID } from "../utils/constants.js";
import {
  getItemInfo,
  getUserInfo,
  getUsersInfoByIds,
  logProjectActivity,
  logSystem,
} from "../utils/helpers.js";

// Fetch all users
export const fetchAllUsers = async (req, res) => {
  const queryUser = `SELECT id ,mail, displayName department,jobTitle,avatar FROM users;`;
  const queryRole = `SELECT roleID FROM userRoles WHERE userID = ?;`;
  const queryExtra = `SELECT role,description,systemID FROM roles WHERE id = ?;`;
  const querySystem = `SELECT name,url,description FROM systems WHERE id = ?;`;
  try {
    const [users] = await userDB.query(queryUser);

    await Promise.all(
      users.map(async (user) => {
        const [role] = await userDB.query(queryRole, [user.id]);
        if (!role[0]) return; // Skip if no role found

        const [extra] = await userDB.query(queryExtra, [role[0].roleID]);
        if (!extra[0]) return; // Skip if no extra info

        const [system] = await userDB.query(querySystem, [extra[0].systemID]);
        user.role = extra[0].role;
        user.roleDescription = extra[0].description;
        user.systemName = system[0]?.name || null;
        user.systemUrl = system[0]?.url || null;
        user.systemDescription = system[0]?.description || null;
      })
    );
    return res.json({ users });
  } catch (error) {
    console.log("error fetching users", error);
    return res.json({ error: defError });
  }
};

// Fetch all system users
export const fetchSystemUsers = async (req, res) => {
  const optramQuery = `SELECT id ,mail, displayName FROM users`;

  const userDbQuery = `SELECT id, mail, jobTitle, department, avatar FROM users`;

  const userRole = `SELECT role , description FROM roles WHERE id = (SELECT roleID FROM userRoles WHERE userID = ? AND systemID = ?)`;

  try {
    // Get users from both databases
    const [optramisUsers] = await imisDB.query(optramQuery);
    const [userDbUsers] = await userDB.query(userDbQuery);

    if (optramisUsers.length === 0) {
      return res.json({ error: "User not found in Optramis." });
    }

    await Promise.all(
      userDbUsers.map(async (user) => {
        const [userRoles] = await userDB.query(userRole, [user.id, systemID]);
        user.role = userRoles?.[0]?.role || null;
        user.roleDescription = userRoles?.[0]?.description || null;
      })
    );

    const userMap = new Map();
    userDbUsers.forEach((user) => userMap.set(user.id, user));

    const mergedUsers = optramisUsers.map((opUser) => {
      const userExtra = userMap.get(opUser.id) || {};
      return {
        ...opUser,
        ...userExtra, // jobTitle, department, avatar, role, roleDescription
      };
    });

    return res.json({ users: mergedUsers });
  } catch (err) {
    console.error("Error fetching merged users:", err);
    return res.json({ error: defError });
  }
};
// Fetch membership
export const fetchProjectMembership = async (req, res) => {
  const { projectId, mail } = req.params;
  const actor = req.user;
  if (mail !== actor.mail) return res.json({ error: "Unauthorized" });

  const query = `
    SELECT projectId
    FROM projectmembers
    WHERE projectId = ? AND userId = ?`;
  try {
    const [result] = await imisDB.query(query, [projectId, actor.id]);
    return res.json({ membership: result[0] });
  } catch (err) {
    console.error("Error fetching membership:", err);
    return res.json({ error: defError });
  }
};

export const fetchProjectMembers = async (req, res) => {
  const projectId = req.params.projectId;

  const memberQuery = `
    SELECT userId, roleId , permissionId
    FROM projectmembers
    WHERE projectId = ?
  `;

  const userSystemRole = `SELECT role , description FROM roles WHERE id = (SELECT roleID FROM userRoles WHERE userID = ? AND systemID = ?)`;

  const userPermission = `SELECT name FROM permissions WHERE id = (SELECT permissionId FROM projectmembers WHERE userId = ? AND projectId = ?)`;

  const userProjectRole = `SELECT name ,description FROM projectroles WHERE id = (SELECT roleId FROM projectmembers WHERE userId = ? AND projectId = ?)`;

  try {
    const [projectMembers] = await imisDB.query(memberQuery, [projectId]);

    if (projectMembers.length === 0) {
      return res.json({ members: [] });
    }
    // Extract user IDs
    const userIds = projectMembers.map((row) => row.userId);

    // Fetch detailed user info from userDB
    const [usersInfo] = await userDB.query(
      `SELECT id, displayName, mail, jobTitle, department, avatar FROM users WHERE id IN (?)`,
      [userIds]
    );
    await Promise.all(
      usersInfo.map(async (user) => {
        const [userRoles] = await userDB.query(userSystemRole, [
          user.id,
          systemID,
        ]);
        const [projectRole] = await imisDB.query(userProjectRole, [
          user.id,
          projectId,
        ]);
        const [userPerm] = await imisDB.query(userPermission, [
          user.id,
          projectId,
        ]);
        user.systemRole = userRoles?.[0]?.role || null;
        user.systemRoleDescription = userRoles?.[0]?.description || null;
        user.projectRole = projectRole?.[0]?.name || null;
        user.projectRoleDescription = projectRole?.[0]?.description || null;
        user.permission = userPerm?.[0]?.name || null;
      })
    );

    return res.json({ members: usersInfo });
  } catch (err) {
    console.error("Error fetching project members:", err);
    return res.status(500).json({ error: defError });
  }
};

// Add user to project
export const addUserToProject = async (req, res) => {
  const { projectId, users } = req.body;
  const projectInfo = await getItemInfo(projectId, "projects");
  const actor = req.user;
  const userSystemRole = `
    SELECT role, description 
    FROM roles 
    WHERE id = (SELECT roleID FROM userRoles WHERE userID = ? AND systemID = ?)
  `;

  const userPermission = `
    SELECT name 
    FROM permissions 
    WHERE id = (SELECT permissionId FROM projectmembers WHERE userId = ? AND projectId = ?)
  `;

  const userProjectRole = `
    SELECT name, description 
    FROM projectroles 
    WHERE id = (SELECT roleId FROM projectmembers WHERE userId = ? AND projectId = ?)
  `;

  try {
    for (const user of users) {
      const existsQuery = `
  SELECT 1
  FROM projectmembers
  WHERE projectId = ? AND userId = ?
  LIMIT 1
`;
      const [exists] = await imisDB.query(existsQuery, [projectId, user.id]);

      if (exists.length === 0) {
        await imisDB.query(
          `INSERT IGNORE INTO projectmembers (projectId, userId) VALUES (?, ?)`,
          [projectId, user.id]
        );
      }

      await logSystem({
        projectId,
        details: `added a user, ${user.displayName} to the project.`,
        actor: actor.id,
        version: "client",
        type: "syslog",
      });

      await logSystem({
        projectId,
        details: `added a user, ${user.displayName} to project - ${projectInfo.projectName}.`,
        actor: actor.id,
        version: "admin",
        type: "syslog",
      });
    }
    // Fetch basic user info
    const userIds = users.map((user) => user.id);
    const [usersInfo] = await userDB.query(
      `SELECT id, displayName, mail, jobTitle, department, avatar 
       FROM users 
       WHERE id IN (?)`,
      [userIds]
    );

    // Enrich with role and permission info
    await Promise.all(
      usersInfo.map(async (user) => {
        const [userRoles] = await userDB.query(userSystemRole, [
          user.id,
          systemID,
        ]);
        const [projectRole] = await imisDB.query(userProjectRole, [
          user.id,
          projectId,
        ]);
        const [userPerm] = await imisDB.query(userPermission, [
          user.id,
          projectId,
        ]);
        user.systemRole = userRoles?.[0]?.role || null;
        user.systemRoleDescription = userRoles?.[0]?.description || null;
        user.projectRole = projectRole?.[0]?.name || null;
        user.projectRoleDescription = projectRole?.[0]?.description || null;
        user.permission = userPerm?.[0]?.name || null;
      })
    );

    eventBus.emit("notifyUsers", {
      action: "grant",
      recipients: users,
      item: projectInfo,
      extra: { actor: actor },
    });

    return res.json({
      message: "Users added successfully",
      members: usersInfo,
    });
  } catch (err) {
    console.error("Error adding user to project:", err);
    return res.json({ error: defError });
  }
};

// Delete user from project
export const deleteUserFromProject = async (req, res) => {
  const { projectId, userIds } = req.body;
  const actor = req.user;

  try {
    const projectInfo = await getItemInfo(projectId, "projects");

    // Prevent self-removal unless admin
    if (userIds.some((id) => id === actor.id) && actor.role !== "admin") {
      return res.json({
        error: "You cannot remove yourself from the project.",
      });
    }

    const usersInfo = await getUsersInfoByIds(userIds);

    for (const user of usersInfo) {
      const [existing] = await imisDB.query(
        `SELECT 1 FROM projectmembers WHERE projectId = ? AND userId = ? LIMIT 1`,
        [projectId, user.id]
      );
      if (existing.length === 0) {
        // Skip non-members instead of aborting everything
        continue;
      }

      await imisDB.query(
        `DELETE FROM projectmembers WHERE projectId = ? AND userId = ?`,
        [projectId, user.id]
      );

      await logSystem({
        projectId,
        details: `removed a user, ${user.displayName} from the project.`,
        actor: actor.id,
        version: "client",
        type: "syslog",
      });
      await logSystem({
        projectId,
        details: `removed a user, ${user.displayName} from project - ${projectInfo.workOrderNo}.`,
        actor: actor.id,
        version: "admin",
        type: "syslog",
      });
    }

    eventBus.emit("notifyUsers", {
      action: "revoke",
      recipients: usersInfo,
      item: projectInfo,
      extra: { actor: actor },
    });

    return res.json({ message: "Users removed successfully." });
  } catch (err) {
    console.error("Error removing user from project:", err);
    return res.status(500).json({ error: defError });
  }
};

// Upload user profile
export const uploadProfile = async (req, res) => {
  const actor = req.user;
  if (err) {
    console.error("Upload error:", err);
    return res.json({ error: err.message });
  }

  const file = req.file;

  if (!file) return res.json({ error: "No file uploaded" });

  const query = `UPDATE users SET avatar = ? WHERE id = ?`;
  try {
    await userDB.query(query, [file.filename, actor.id]);
    return res.json({
      message: "Profile picture updated successfully, ",
      fileName: file.filename,
    });
  } catch (err) {
    console.error("Error updating avatar:", err);
    return res.status(500).json({ error: defError });
  }
};

export const changeProjectOwner = async (req, res) => {
  const { projectId, oldOwnerId, newOwnerId } = req.body;
  const actor = req.user;
  if (actor.id !== oldOwnerId) {
    return res.json({ error: "Unauthorized action." });
  }
  const projectInfo = await getItemInfo(projectId, "projects");

  try {
    const newOwner = await getUserInfo(newOwnerId);
    // const oldOwner = await getUserInfo(oldOwnerId);

    if (!newOwner) {
      return res.json({ error: "New owner not authorized." });
    }

    const [info] = await imisDB.query(
      `UPDATE projects SET projectOwner = ? WHERE projectId = ?`,
      [newOwnerId, projectId]
    );

    if (info.affectedRows === 0) {
      return res.json({ error: "Project not found." });
    }

    eventBus.emit("notifyUsers", {
      action: "ownershipChange",
      recipients: newOwner,
      item: projectInfo,
      extra: { actor: actor },
    });

    logSystem({
      projectId,
      details: `transferred project ownership to ${newOwner.displayName}`,
      actor: actor.id,
      version: "client",
      type: "syslog",
    });

    logProjectActivity({
      projectId,
      details: `changed project owner to ${newOwner.displayName}`,
      actor: actor.id,
      version: "client",
      type: "activity",
    });

    return res.json({
      message: "Project ownership changed successfully",
      newOwner: newOwner,
    });
  } catch (err) {
    console.error("Error changing project owner:", err);
    return res.status(500).json({ error: defError });
  }
};

export const changeUserAccess = async (req, res) => {
  const { projectId, userId, permId, roleId } = req.body;
  const actor = req.user;
  const userInfo = await getUserInfo(userId);
  const roleInfo = await getItemInfo(roleId, "projectroles");
  const permInfo = await getItemInfo(permId, "permissions");
  const projectInfo = await getItemInfo(projectId, "projects");

  try {
    const [existingMember] = await imisDB.query(
      `SELECT * FROM projectmembers WHERE userId = ? AND projectId = ?`,
      [userId, projectId]
    );
    if (existingMember.length > 0) {
      await imisDB.query(
        `UPDATE projectmembers SET roleId = ?, permissionId = ? WHERE userId = ? AND projectId = ?;`,
        [roleId, permId, userId, projectId]
      );
    } else {
      await imisDB.query(
        `INSERT INTO projectmembers (userId, roleId, projectId ,permissionId) VALUES (?, ?, ?,?)`,
        [userId, roleId, projectId, permId]
      );
    }

    eventBus.emit("notifyUsers", {
      action: "changeUserAccess",
      recipients: userInfo,
      item: projectInfo,
      extra: { role: roleInfo.name, permission: permInfo.name, actor: actor },
    });

    logSystem({
      projectId: projectId,
      details: `changed access for user ${userInfo.displayName} to ${roleInfo.name} and ${permInfo.name}`,
      actor: actor.id,
      version: "admin",
      type: "syslog",
    });

    logSystem({
      projectId: projectId,
      details: `changed access for user, ${userInfo.displayName}.`,
      actor: actor.id,
      version: "client",
      type: "syslog",
    });
    return res.json({
      message: "User role updated successfully.",
      role: roleInfo.name,
      permission: permInfo.name,
    });
  } catch (err) {
    console.error("Error changing user role:", err);
    return res.json({ error: defError });
  }
};
