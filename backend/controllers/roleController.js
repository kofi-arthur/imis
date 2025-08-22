import { imisDB } from "../utils/config.js";
import { defError } from "../utils/constants.js";

export const fetchRoles = async (req, res) => {
  const projectId = req.params.projectId;
  try {
    const [roles] = await imisDB.query(
      `SELECT * FROM projectroles where projectId = ? OR projectId IS NULL;`,
      [projectId]
    );
    if (roles.length === 0) {
      return res.json({ roles: [] });
    }
    res.json({ roles });
  } catch (error) {
    console.error("Error in getRoles:", error);
    res.json({ error: defError });
  }
};
export const createRole = async (req, res) => {
  const role = req.body;
  try {
    const [result] = await imisDB.query("INSERT INTO projectroles SET ?", [role]);
    // Fetch the inserted role using insertId
    const [rows] = await imisDB.query("SELECT * FROM projectroles WHERE id = ?", [
      result.insertId,
    ]);
    res.json({ role: rows[0] });
  } catch (error) {
    console.error("Error in createRole:", error);
    res.json({ error: defError });
  }
};

export const updateRole = async (req, res) => {
  const role = req.body;
  try {
    const [result] = await imisDB.query(
      "UPDATE projectroles SET name = ? WHERE id = ?",
      [role.name, role.id]
    );
    if (result.length === 0) {
      return res.json({ error: "Role not found" });
    }
    const [rows] = await imisDB.query("SELECT * FROM projectroles WHERE id = ?", [
      role.id,
    ]);
    res.json({ message: "Role updated successfully", role: rows[0] });
  } catch (error) {
    console.error("Error in updateRole:", error);
    res.json({ error: defError });
  }
};

export const deleteRole = async (req, res) => {
  const roleId = req.params.id;
  console.log(roleId);
  try {
    const [result] = await imisDB.query(
      "DELETE FROM projectroles WHERE id = ?",
      [roleId]
    );
    if (result.length === 0) {
      return res.json({ error: "Role not found" });
    }
    res.json({ message: "Role deleted successfully" });
  } catch (error) {
    console.error("Error in deleteRole:", error);
    res.json({ error: defError });
  }
};


export const fetchPermissions = async (req, res) => {
  try {
    const [permissions] = await imisDB.query(
      `SELECT * FROM permissions;`,
    );
    if (permissions.length === 0) {
      return res.json({ permissions: [] });
    }
    res.json({ permissions });
  } catch (error) {
    console.error("Error in fetchPermissions: ", error);
    res.json({ error: defError });
  }
};

export const createPermission = async (req, res) => {
  const permission = req.body;
  try {
    const [result] = await imisDB.query("INSERT INTO permissions SET ?", [permission]);
    if (result.affectedRows === 0) {
      return res.json({ error: "Failed to add permission" });
    }
    res.json({ message: "Permission added successfully." });
  } catch (error) {
    console.error("Error in createPermission:", error);
    res.json({ error: defError });
  }
};

export const updatePermission = async (req, res) => {
  const permissison = req.body;
  try {
    const [result] = await imisDB.query(
      "UPDATE permisisons SET name = ? WHERE id = ?",
      [permissison.name, permissison.id]
    );
    if (result.length === 0) {
      return res.json({ error: "Permission not found." });
    }
    const [rows] = await imisDB.query("SELECT * FROM permissions WHERE id = ?", [
      permissison.id,
    ]);
    res.json({ message: "Permission updated successfully", permission: rows[0] });
  } catch (error) {
    console.error("Error in updatePermission:", error);
    res.json({ error: defError });
  }
};

export const deletePermission = async (req, res) => {
  const permissisonId = req.params.id;
  try {
    const [result] = await imisDB.query(
      "DELETE FROM permissisons WHERE id = ?",
      [permissisonId]
    );
    if (result.length === 0) {
      return res.json({ error: "Permission not found" });
    }
    res.json({ message: "Permission deleted successfully" });
  } catch (error) {
    console.error("Error in deletePermission:", error);
    res.json({ error: defError });
  }
};
