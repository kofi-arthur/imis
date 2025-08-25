import axios from "axios";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import * as nodemailer from "nodemailer";
import { v4 as uuidv4 } from "uuid";

import { clearSessionCookie, imisDB, userDB } from "../config.js";
import { systemID } from "../constants.js";
import { getClientIP } from "../helpers/helper.general.js";
import { getToken } from "../microsoftAuth.js";


dotenv.config();

// Nodemailer Transporter---------------------------------------------------------------
export const transporter = nodemailer.createTransport({
  service: "outlook",
  auth: {
    user: process.env.DevEmail,
    pass: process.env.DevPassword,
  },
});

export async function verifyUserOnMicrosoft(mail) {
  const accessToken = await getToken();

  const headerOption = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ConsistencyLevel: "eventual",
    },
  };

  try {
    const request = await axios.get(
      `https://graph.microsoft.com/v1.0/users?$select=id,displayName,mail,mobilePhone,department,jobTitle,country,state,city,officeLocation&$filter=mail eq '${mail}'`,
      headerOption
    );

    const user = request.data.value[0];
    if (!user) return false;

    return user;
  } catch (err) {
    console.log("Error verifying user", err);
  }
}

export async function getAccessToken() {
  const url = `https://login.microsoftonline.com/${process.env.TENANTID}/oauth2/v2.0/token`;
  const params = new URLSearchParams();
  params.append("client_id", process.env.CLIENTID);
  params.append("scope", "https://graph.microsoft.com/.default");
  params.append("client_secret", process.env.CLIENTSECRET);
  params.append("grant_type", "client_credentials");

  const { data } = await axios.post(url, params);
  return data.access_token;
}

export const syncToSystemDB = async (user) => {
  const query = `
    INSERT INTO users (id, displayName, mail)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE displayName = VALUES(displayName), mail = VALUES(mail)
  `;

  imisDB.query(
    query,
    [user.id, user.displayName, user.mail, user.avatar ?? "default.jpg"],
    (err, info) => {
      if (err) {
        console.error("Error syncing user to the database", err);
        return;
      }
      console.log("User synced successfully.");
    }
  );
};

export async function sendMail(mail, subject, body) {
  const mailOptions = {
    from: `itdevelopers@wayoeltd.com`,
    to: mail,
    subject: subject,
    html: body,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(13);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
}

export async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

export async function calculateExpiry(expiresInSeconds) {
  return new Date(Date.now() + expiresInSeconds * 1000);
}
export async function generateSessionID() {
  return uuidv4();
}

export async function generateLogID() {
  return uuidv4();
}

export async function fetchRole(role) {
  try {
    const query = "SELECT * FROM roles WHERE role = ? AND systemID = ?;";
    const [info] = await userDB.query(query, [role, systemID]);
    return info[0];
  } catch (err) {
    console.log("Error executing roles query:", err);
    throw err;
  }
}

export async function fetchUserRole(userID) {
  try {
    const query =
      "SELECT role FROM roles WHERE id = (SELECT roleID FROM userRoles WHERE userID = ? AND systemID = ?);";

    const [roleInfo] = await userDB.query(query, [userID, systemID]);

    return roleInfo[0].role;
  } catch (err) {
    console.log("Error executing roles query:", e);
    throw err;
  }
}

export async function fetchSession(sessionID) {
  try {
    const query = "SELECT * FROM sessions WHERE id = ? AND systemID = ?;";
    const [info] = await userDB.query(query, [sessionID, systemID]);
    return info[0];
  } catch (err) {
    console.log("Error executing sessions query:", err);
    throw err;
  }
}

export async function logUserSessionActivity(
  req,
  userID,
  userRole,
  actionType
) {
  const insertLogQuery = "INSERT INTO logs SET ?";

  const logInfo = {
    id: await generateLogID(),
    userID,
    userRole,
    actionType,
    entityType: "USER",
    entityID: userID,
    systemID: systemID,
    ipAddress: req.headers["cf-connecting-ip"] || getClientIP(req),
    userAgent: req.headers["user-agent"],
  };

  try {
    await userDB.query(insertLogQuery, logInfo);

    return { success: true };
  } catch (err) {
    console.log("Error insert log", err);
    return { error: err };
  }
}

export async function handleUnauthorizedSessions(res, req) {
  const sessionID = req.cookies.imis_session_id;

  if (sessionID) {
    try {
      const deleteSessionQuery =
        "DELETE FROM sessions WHERE id = ? AND systemID = ?";
      await userDB.query(deleteSessionQuery, [sessionID, systemID]);
    } catch {
      console.error("error delteting session from db");
    }
  }

  clearSessionCookie(res);

  return res.status(401).json({ error: "Unauthorized" });
}

export async function fetchUser(id) {
  const fetchQuery = "SELECT * FROM users WHERE id = ?;";
  try {
    const [user] = await userDB.query(fetchQuery, id);
    return user[0];
  } catch (err) {
    console.log("Error fetching user query:", err);
    throw err;
  }
}
