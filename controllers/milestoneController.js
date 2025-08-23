import { imisDB } from "../utils/config.js";
import { defError } from "../utils/constants.js";
import { getItemInfo, getUserInfo, getUsersInfoByIds, logProjectActivity, logSystem } from "../utils/helpers.js";

// FETCH MILESTONES
export const fetchMilestones = async (req, res) => {
  const projectId = req.params.projectId;
  const query = `SELECT * FROM milestones WHERE projectId = ?`;

  try {
    const [results] = await imisDB.query(query, [projectId]);

    if (!results.length) {
      return res.json({ milestones: [] });
    }

    // Step 1: Collect unique user IDs
    const userIds = [...new Set(results.map(m => m.createdBy))];

    // Step 2: Fetch user info for all IDs
    const userInfoList = await getUsersInfoByIds(userIds); // Should return array of users

    // Convert to a lookup object for fast mapping
    const userLookup = {};
    userInfoList.forEach(user => {
      userLookup[user.id] = {
        id: user.id,
        mail: user.mail,
        displayName: user.displayName,
        avatar: user.avatar,
      };
    });

    // Step 3: Map enriched user info to milestones
    const enrichedResults = results.map(milestone => ({
      ...milestone,
      createdBy: userLookup[milestone.createdBy] || milestone.createdBy, // fallback if user not found
    }));

    return res.json({ milestones: enrichedResults });
  } catch (err) {
    console.error("Error executing query", err);
    return res.status(500).json({ error: defError });
  }
};

// ADD MILESTONE
export const addMilestone = async (req, res) => {
  const milestone = req.body;
  const actor = req.user;

  const query = `INSERT INTO milestones SET ?`;

  try {
    await imisDB.query(query, [milestone]);
    const project = await getItemInfo(milestone.projectId, "projects");

    logSystem({
      projectId: milestone.projectId,
      details: `created a milestone - ${milestone.title}.`,
      actor: actor.id,
      version: "client",
      type: "syslog",
    });

    logProjectActivity({
      projectId: milestone.projectId,
      details: `created a new milestone - ${milestone.title} in Project ${project.title}.`,
      actor: actor.id,
      version: "client",
      type: "activity",
    });

    return res.json({ message: "Milestone created successfully." });
  } catch (err) {
    console.error("Error executing query", err);
    return res.json({ error: "An error occurred while adding milestone." });
  }
};

// UPDATE MILESTONE
export const updateMilestone = async (req, res) => {
  const milestone = req.body;
  const actor = req.user;

  const query = `UPDATE milestones SET ? WHERE id = ? AND projectId = ?`;

  try {
    await imisDB.query(query, [
      milestone,
      milestone.id,
      milestone.projectId,
    ]);

    logSystem({
      projectId: milestone.projectId,
      details: `modified a milestone - ${milestone.title}.`,
      actor: actor.id,
      version: "client",
      type: "syslog",
    });

    logProjectActivity({
      projectId: milestone.projectId,
      details: `modified a milestone - ${milestone.title}.`,
      actor: actor.id,
      version: "client",
      type: "activity",
    });

    return res.json({ message: "Milestone details updated." });
  } catch (err) {
    console.error("Error executing query", err);
    return res.json({ error: "An error occurred while updating milestone." });
  }
};

// DELETE MILESTONE
export const deleteMilestone = async (req, res) => {
  const { milestone } = req.body;
  const actor = req.user;
  const query = `DELETE FROM milestones WHERE projectId = ? AND id = ?`;

  try {
    await imisDB.query(query, [milestone.projectId, milestone.id]);

    logSystem({
      projectId: milestone.projectId,
      details: `deleted a milestone - ${milestone.title}.`,
      actor: actor.id,
      version: "client",
      type: "syslog",
    });

    logProjectActivity({
      projectId: milestone.projectId,
      details: `deleted a milestone - ${milestone.title}.`,
      actor: actor.id,
      version: "client",
      type: "activity",
    });

    return res.json({ message: "Milestone deleted." });
  } catch (err) {
    console.error("Error executing query", err);
    return res.json({ error: "An error occurred while deleting milestone." });
  }
};
