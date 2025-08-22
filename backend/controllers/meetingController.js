import {
  getActiveUsers,
  getSocketInstance,
} from "../services/socketService.js";
import { optramisDB } from "../utils/config.js";
import { defError } from "../utils/constants.js";
import {
  emailNotif,
  getUsersInfoByIds,
  logProjectActivity,
  logSystem,
} from "../utils/helpers.js";
import {
  createTeamsMeeting,
  deleteTeamsMeeting,
  updateTeamsMeeting,
} from "../utils/helpers/helpers.meeting.js";
import { DateTime } from "luxon";

// FETCH MEETINGS
export const fetchMeetings = async (req, res) => {
  const { projectId, mail } = req.params;
  const actor = req.user;

  if (actor.mail !== mail) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const query = `
    SELECT * 
    FROM projectmeetings 
    WHERE JSON_CONTAINS(attendants, JSON_QUOTE(?), '$') 
    AND projectId = ? 
    ORDER BY dateCreated DESC
  `;

  try {
    const [meetings] = await optramisDB.query(query, [actor.id, projectId]);

    if (!meetings.length) return res.json({ meetings: [] });

    const userIdsSet = new Set();

    // Collect all user IDs from attendants and scheduledBy
    const parsedMeetings = meetings.map((meeting) => {
      const attendants = Array.isArray(meeting.attendants)
        ? meeting.attendants
        : [];
      attendants.forEach((id) => userIdsSet.add(id));

      if (meeting.scheduledBy) userIdsSet.add(meeting.scheduledBy);

      return {
        ...meeting,
        _attendantIds: attendants,
      };
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

    const enrichedMeetings = parsedMeetings.map((meeting) => ({
      id: meeting.id,
      projectId: meeting.projectId,
      projectTitle: meeting.projectTitle,
      type: meeting.type,
      title: meeting.title,
      description: meeting.description,
      meetingLink: meeting.meetingLink,
      dateCreated: meeting.dateCreated,
      dateEdited: meeting.dateEdited,
      scheduledBy: userMap[meeting.scheduledBy] || null,
      attendants: meeting._attendantIds
        .map((id) => userMap[id])
        .filter(Boolean),
      startTime: meeting.startTime,
      endTime: meeting.endTime,
    }));

    return res.json({ meetings: enrichedMeetings });
  } catch (err) {
    console.error("Error fetching meetings:", err);
    return res.status(500).json({ error: defError });
  }
};

// ADD MEETING
export const addMeeting = async (req, res) => {
  const actor = req.user;
  const meeting = req.body;
  try {
    const attendantIds = meeting.attendants;

    if (meeting.type === "Online") {
      // ✅ Convert SQL-formatted time to ISO 8601 (UTC) for Microsoft Graph
      const isoStartTime = DateTime.fromFormat(
        meeting.startTime,
        "yyyy-MM-dd HH:mm:ss",
        { zone: "UTC" }
      ).toISO();
      const isoEndTime = DateTime.fromFormat(
        meeting.endTime,
        "yyyy-MM-dd HH:mm:ss",
        { zone: "UTC" }
      ).toISO();

      // ✅ Create Teams meeting with ISO-formatted time
      const teamsMeeting = await createTeamsMeeting({
        title: meeting.title,
        description: meeting.description,
        attendants: meeting.attendants,
        startTime: isoStartTime,
        endTime: isoEndTime,
        organizer: actor,
      });

      // ✅ Store the original SQL-friendly format in the DB
      meeting.meetingLink = teamsMeeting.joinWebUrl;
      meeting.eventId = teamsMeeting.eventId;
    }
    meeting.attendants = JSON.stringify(meeting.attendants); // store array of IDs

    const query = `INSERT INTO projectmeetings SET ?`;
    await optramisDB.query(query, [meeting]);

    // 🔔 Notify users
    const attendantsInfo = await getUsersInfoByIds(attendantIds);
    eventBus.emit("notifyUsers", {
      action: "newMeeting",
      recipients: attendantsInfo,
      item: meeting,
      extra: { actor: actor },
    });

    await logSystem({
      projectId: meeting.projectId,
      details: `created a meeting - ${meeting.title}.`,
      actor: actor.id,
      version: "client",
      type: "syslog",
    });

    await logProjectActivity({
      projectId: meeting.projectId,
      details: `created a new meeting - ${meeting.title}.`,
      actor: actor.id,
      version: "client",
      type: "activity",
    });

    return res.json({ message: "Meeting created successfully." });
  } catch (err) {
    console.error("Error executing meeting insert:", err);
    return res.status(500).json({ error: defError });
  }
};

// UPDATE MEETING
export const updateMeeting = async (req, res) => {
  const actor = req.user;
  const meeting = req.body;
  if (actor.id !== meeting.scheduledBy) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    // Ensure attendants is stored as JSON string of IDs

    meeting.attendants = JSON.stringify(meeting.attendants); // ensure it's stored as JSON

    // ✅ Update Teams meeting if event ID is available
    if (meeting.type === "Online" && meeting.eventId) {
      const isoStartTime = DateTime.fromFormat(
        meeting.startTime,
        "yyyy-MM-dd HH:mm:ss",
        { zone: "UTC" }
      ).toISO();
      const isoEndTime = DateTime.fromFormat(
        meeting.endTime,
        "yyyy-MM-dd HH:mm:ss",
        { zone: "UTC" }
      ).toISO();

      await updateTeamsMeeting({
        eventId: meeting.eventId,
        organizer: actor,
        title: meeting.title,
        description: meeting.description,
        startTime: isoStartTime,
        endTime: isoEndTime,
        attendants: JSON.parse(meeting.attendants),
      });
    } // store array of IDs

    const query = `UPDATE projectmeetings SET ? WHERE id = ? AND projectId = ?`;
    await optramisDB.query(query, [meeting, meeting.id, meeting.projectId]);

    // Log the update
    await logSystem({
      projectId: meeting.projectId,
      details: `modified a meeting - ${meeting.title}.`,
      actor: actor.id,
      version: "client",
      type: "syslog",
    });

    await logProjectActivity({
      projectId: meeting.projectId,
      details: `modified a meeting - ${meeting.title}.`,
      actor: actor.id,
      version: "client",
      type: "activity",
    });

    return res.json({ message: "Meeting modified successfully." });
  } catch (err) {
    console.error("Error updating meeting:", err);
    return res.status(500).json({ error: defError });
  }
};

// DELETE MEETING
export const deleteMeeting = async (req, res) => {
  const meeting = req.body;
  const actor = req.user;

  const query = `DELETE FROM projectmeetings WHERE id = ?`;

  if (actor.id !== meeting.scheduledBy) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    if (meeting.type === "Online" && meeting.eventId) {
      await deleteTeamsMeeting(meeting.eventId, actor);
    }

    await optramisDB.query(query, [meeting.id]);

    logSystem({
      projectId: meeting.projectId,
      details: `deleted a meeting - ${meeting.title}.`,
      actor: actor.id,
      version: "client",
      type: "syslog",
    });

    return res.json({ message: "Meeting deleted successfully." });
  } catch (err) {
    console.error("Error deleting meeting:", err);
    return res.json({ error: defError });
  }
};
