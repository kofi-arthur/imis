// Create teams meeting without Calendar

import axios from "axios";
import { getUsersInfoByIds } from "../helpers.js";
import { getAccessToken } from "./helpers.auth.js";

// Create Teams Meeting with Calendar
export const createTeamsMeeting = async ({
  title,
  description = "",
  startTime,
  endTime,
  attendants = [],
  organizer,
}) => {
  const token = await getAccessToken();
  const participants = await getUsersInfoByIds(attendants);
  const attendees = participants.map((user) => ({
    emailAddress: {
      address: user.mail,
      name: user.displayName || user.mail,
    },
    type: "required",
  }));

  const event = {
    subject: title,
    body: {
      contentType: "HTML",
      content: `${description}` || "Meeting scheduled via imis.",
    },
    start: {
      dateTime: startTime,
      timeZone: "UTC",
    },
    end: {
      dateTime: endTime,
      timeZone: "UTC",
    },
    attendees,
    isOnlineMeeting: true,
    onlineMeetingProvider: "teamsForBusiness",
  };

  const response = await axios.post(
    `https://graph.microsoft.com/v1.0/users/${organizer.id}/calendar/events`,
    event,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return {
    joinWebUrl: response.data?.onlineMeeting?.joinUrl || null,
    eventId: response.data?.id || null, // ✅ Save this!
    raw: response.data,
  };
};

//Update Teams Meeting
export const updateTeamsMeeting = async ({
  eventId,
  organizer,
  title,
  description,
  startTime,
  endTime,
  attendants = [],
}) => {
  const token = await getAccessToken();
  const participants = await getUsersInfoByIds(attendants);

  const attendees = participants.map((user) => ({
    emailAddress: {
      address: user.mail,
      name: user.displayName || user.mail,
    },
    type: "required",
  }));

  const updatedEventBody = {
    subject: title,
    body: {
      contentType: "HTML",
      content: `${description}` || "Meeting scheduled via imis.",
    },
    start: {
      dateTime: startTime,
      timeZone: "UTC",
    },
    end: {
      dateTime: endTime,
      timeZone: "UTC",
    },
    attendees,
    isOnlineMeeting: true,
    onlineMeetingProvider: "teamsForBusiness",
  };

  await axios.patch(
    `https://graph.microsoft.com/v1.0/users/${organizer.id}/calendar/events/${eventId}`,
    updatedEventBody,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
};

export const deleteTeamsMeeting = async (eventId, organizer) => {
  const token = await getAccessToken(organizer);

  await axios.delete(`https://graph.microsoft.com/v1.0/users/${organizer.id}/calendar/events/${eventId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
