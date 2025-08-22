
import { optramisDB } from "../utils/config.js";
import { defError } from "../utils/constants.js";
import { getUserInfo, logSystem, notifyUsers } from "../utils/helpers.js";

// Basic Admin Operations -----------------------------------
export const fetchProjects = async (req, res) => {
  const query = `SELECT * FROM projects ORDER BY dateCreated DESC;`;
  try {
    const [projectResult] = await optramisDB.query(query);
    return res.json({ projects: projectResult });
  } catch (err) {
    console.error("Error executing query:", err);
    return res.json({ error: defError });
  }
};

// user management Admin-----------------------------------------------------------------------
export const ModifyUserSystemRole = async (req, res) => {
  const { id, role } = req.body;
  const userInfo = await getUserInfo(id);
  const actor = req.user;
  const query = `UPDATE users SET role = ? WHERE id = ?;`;
  try {
    const [result] = await optramisDB.query(query, [role, id]);

    if (result.affectedRows === 0) {
      return res.json({ error: "No changes made." });
    }

    eventBus.emit("notifyUsers", {
      action: "changeUserRole",
      recipients: userInfo,
      item: null,
      extra: { actor: actor },
    });

    logSystem({
      type: "syslog",
      details: `Modified an Optramis user's role ,${userInfo.displayName}.`,
      actor: actor.id,
      version: "admin",
    });

    return res.json({ message: "User role modified successfully." });
  } catch (err) {
    console.log("error executing query", err);
    return res.json({ error: defError });
  }
};

export const deleteUserMis = async (req, res) => {
  const { id } = req.body;
  const user = await getUserInfo(id);
  const actor = req.user;
  const query = "DELETE FROM users WHERE id = ?";
  try {
    await optramisDB.query(query, [id]);

    logSystem({
      type: "syslog",
      details: `deleted an Optramis user,${user.displayName}.`,
     actor: actor.id,
      version: "admin",
    });

    return res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.log("error executing query", err);
    return res.json({ error: defError });
  }
};

