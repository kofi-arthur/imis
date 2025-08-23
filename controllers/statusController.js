import { imisDB } from "../utils/config.js";
import { defError } from "../utils/constants.js";
import { logSystem } from "../utils/helpers.js";

// Fetch all statuses
export const fetchStatuses = async (req, res) => {
  const query = `SELECT * FROM statuses;`;
  try {
    const [statuses] = await imisDB.query(query);
    return res.json({ statuses });
  } catch (err) {
    console.error("Error fetching statuses:", err);
    return res.json({ error: defError });
  }
};

// Add a status
export const addStatus = async (req, res) => {
  const { status } = req.body;
  const actor = req.user;
  const query = `INSERT INTO statuses SET ?`;

  try {
    await imisDB.query(query, [status]);

    logSystem({
      details: `Added a status, ${status.statusName}`,
      actor: actor.id,
      version: "admin",
      type: "syslog",
    });

    return res.json({ message: "Status added successfully" });
  } catch (err) {
    console.error("Error adding status:", err);
    return res.json({ error: defError });
  }
};
// Update a status
export const updateStatus = async (req, res) => {
  const { status } = req.body;
  const actor = req.user;
  const query = `UPDATE statuses SET ? WHERE id = ?`;

  try {
    await imisDB.query(query, [status, status.id]);

    logSystem({
      details: `edited a status, ${status.name}`,
      actor: actor.id,
      version: "admin",
      type: "syslog",
    });

    return res.json({ message: "Status updated successfully" });
  } catch (err) {
    console.error("Error updating status:", err);
    return res.json({ error: defError });
  }
};
// Delete a status
export const deleteStatus = async (req, res) => {
  const { status } = req.body;
  const actor = req.user;
  const query = `DELETE FROM statuses WHERE id = ?`;

  try {
    await imisDB.query(query, [status.id]);

    logSystem({
      details: `deleted a status, ${status.name}`,
      actor: actor.id,
      version: "admin",
      type: "syslog",
    });

    return res.json({ message: "Status deleted successfully" });
  } catch (err) {
    console.error("Error deleting status:", err);
    return res.json({ error: defError });
  }
};
