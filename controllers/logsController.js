
import { imisDB } from "../utils/config.js";
import { defError } from "../utils/constants.js";
import { getUsersInfoByIds } from "../utils/helpers.js";

const enrichLogsWithUserInfo = async (logs) => {
  if (!logs.length) return logs;

  const actorIds = [...new Set(logs.map((log) => log.actor))];
  const usersInfo = await getUsersInfoByIds(actorIds);
  const userMap = new Map(usersInfo.map((user) => [user.id, user]));

  return logs.map((log) => ({
    ...log,
    actor: userMap.get(log.actor) || { id: log.actor, displayName: "Unknown" },
  }));
};

export const fetchLogsByType = async (req, res) => {
  const { projectId, type } = req.params;
  const validTypes = ["syslog", "activity"];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: "Invalid log type" });
  }

  const query = `
    SELECT * FROM logs 
    WHERE projectId = ? 
      AND type = ? 
      AND version = 'client' 
    ORDER BY date DESC
  `;

  try {
    const [logs] = await imisDB.query(query, [projectId, type]);
    const enrichedLogs = await enrichLogsWithUserInfo(logs);
    return res.json({ recentActivities: enrichedLogs });
  } catch (err) {
    console.error("Error executing query:", err);
    return res.json({ error: defError });
  }
};
