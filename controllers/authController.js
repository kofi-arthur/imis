import dotenv from "dotenv";
import {
  clearSessionCookie,
  setSessionCookie,
  userDB,
} from "../utils/config.js";
import { defError, systemID } from "../utils/constants.js";

import { getClientIP } from "../utils/helpers/helper.general.js";
import {
  comparePassword,
  fetchSession,
  fetchUserRole,
  generateSessionID,
  hashPassword,
  logUserSessionActivity,
  sendMail,
  syncToSystemDB,
  verifyUserOnMicrosoft
} from "../utils/helpers/helpers.auth.js";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

export const test = async (req, res) => {
  return res.json({ message: "I am working." });
};


export const checkSession = async (req, res) => {
  const clientSession = req.cookies.imis_session_id;

  const sessionErrMsg = "Session expired. Please login again";

  if (!clientSession) {
    console.log("Session not found");
    return res.status(204).end();
  }

  const fetchSessionQuery = "SELECT * FROM sessions WHERE id = ?";

  const [session] = await userDB.query(fetchSessionQuery, clientSession);
  const DBSession = session[0];
  if (!DBSession) {
    clearSessionCookie(res);
    return res.json({ error: sessionErrMsg });
  }

  if (DBSession.expiresAt < Date.now()) {
    return res.json({ error: sessionErrMsg });
  }

  const fetchUserQuery = "SELECT * FROM users WHERE id = ?";

  const [userInfo] = await userDB.query(fetchUserQuery, DBSession.userID);
  const user = userInfo[0];

  if (!user) {
    return res.json({ error: sessionErrMsg });
  }

  const fetchUserRoleQuery =
    "SELECT role FROM roles WHERE systemID = ? AND id = (SELECT roleID FROM userRoles WHERE userID = ? AND systemID = ?);";

  const [roleInfo] = await userDB.query(fetchUserRoleQuery, [
    systemID,
    user.id,
    systemID,
  ]);

  user.role = roleInfo[0].role;

  delete user.jobTitle;
  delete user.password;
  delete user.country;
  delete user.state;
  delete user.city;
  delete user.officeLocation;
  delete user.isActive;
  delete user.createdAt;
  delete user.updatedAt;

  return res.json({ success: true, user });
};

export const signup = async (req, res) => {
  const { mail, password } = req.body;

  const exisingUserQuery = "SELECT * FROM users WHERE mail = ?";
  const [existingUser] = await userDB.query(exisingUserQuery, mail);

  if (existingUser[0]) {
    return res.json({ error: "User already exists" });
  }

  const userInfo = await verifyUserOnMicrosoft(mail);

  if (!userInfo) {
    return res.json({ error: "Unverified Email. Please confirm your email." });
  }

  const fetchRoleQuery = "SELECT * FROM roles WHERE role = ? AND systemID = ?";

  const [role] = await userDB.query(fetchRoleQuery, ["user", systemID]);

  if (!role[0]) {
    console.log("Role not found");
    return
  }

  userInfo.password = await hashPassword(password);

  const roleInfo = {
    userID: userInfo.id,
    roleID: role[0].id,
    systemID: systemID,
  };

  const userDbConn = await userDB.getConnection();

  try {
    await userDbConn.beginTransaction();

    const createUserQuery = "INSERT INTO users SET ?";
    const createUserRoleQuery = "INSERT INTO userRoles SET ?";

    await userDbConn.query(createUserQuery, userInfo);
    await userDbConn.query(createUserRoleQuery, roleInfo);

    await userDbConn.commit();
    await syncToSystemDB(userInfo);

    await logUserSessionActivity(req, userInfo.id, "client", "ACCOUNT_CREATED");
  } catch (err) {
    await userDbConn.rollback();
    console.log("Login transaction failed:", err);
    return res.status(500).json({ error: defError });
  } finally {
    userDbConn.release();
  }

  return res.json({ success: "Account created successfully" });
};

export const login = async (req, res) => {
  const { mail, password } = req.body;

  try {
    const fetchUserQuery = "SELECT * FROM users WHERE mail = ?";

    const [userInfo] = await userDB.query(fetchUserQuery, mail);
    const user = userInfo[0];

    if (!user) {
      return res.json({ error: "Incorrect email or password" });
    }

    if (
      !["Production", "IT", "HSE", "HR", "Admin", "Executive"].includes(
        user.department
      )
    ) {
      return res.json({ error: "Sorry, you are not authorized to login" });
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.json({ error: "Incorrect email or password" });
    }

    const fetchUserRoleQuery = `SELECT role FROM roles WHERE systemID = ? AND id = (
                                    SELECT roleID FROM userRoles WHERE userID = ? AND systemID = ?);`;

    const [userRoleInfo] = await userDB.query(fetchUserRoleQuery, [
      systemID,
      user.id,
      systemID,
    ]);
    user.role = userRoleInfo[0].role;
    const sessionInfo = {
      id: await generateSessionID(),
      userID: user.id,
      systemID: systemID,
      ipAddress: req.headers["cf-connecting-ip"] || getClientIP(req),
      userAgent: req.headers["user-agent"],
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
    };

    delete user.jobTitle;
    delete user.password;
    delete user.country;
    delete user.state;
    delete user.city;
    delete user.officeLocation;
    delete user.isActive;
    delete user.createdAt;
    delete user.updatedAt;

    const userDBConn = await userDB.getConnection();

    try {
      await userDBConn.beginTransaction();

      const fetchSessionQuery =
        "SELECT * FROM sessions WHERE userID = ? AND systemID = ?";
      const createSessionQuery = "INSERT INTO sessions SET ?";
      const updateSessionQuery = "UPDATE sessions SET ? WHERE id = ?";

      const [sessionQueryInfo] = await userDBConn.query(fetchSessionQuery, [
        user.id,
        systemID,
      ]);
      const session = sessionQueryInfo[0];

      session
        ? await userDBConn.query(updateSessionQuery, [sessionInfo, session.id])
        : await userDBConn.query(createSessionQuery, sessionInfo);

      await userDBConn.commit();

      await logUserSessionActivity(req, user.id, user.role, "LOGGED_IN");

      setSessionCookie(res, sessionInfo.id);
      await syncToSystemDB(user);

      return res.status(200).json({ user });
    } catch (err) {
      await userDBConn.rollback();

      console.log("Login transaction failed:", err);
      return res.status(500).json({ error: defError });
    } finally {
      userDBConn.release();
    }
  } catch (err) {
    console.log("Error logging in:", err);
    return res.status(500).json({ error: defError });
  }
};

export const forgotPassword = async (req, res) => {
  const { mail } = req.body;
  try {
    const fetchUserQuery =
      "SELECT id, mail, displayName FROM users WHERE mail = ?";
    const [userInfo] = await userDB.query(fetchUserQuery, [mail]);
    const user = userInfo[0];

    if (!user) {
      return res.json({ error: "No user found with that email." });
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    const insertTokenQuery = `INSERT INTO passwordResetTokens (userID, token, expiresAt, used)
                                  VALUES (?, ?, ?, false)`;
    await userDB.query(insertTokenQuery, [user.id, token, expiresAt]);

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const emailBody = `
            <p>Hello ${user.displayName},</p>
            <p>You requested a password reset. Click the link below to set a new password:</p>
            <a href="${resetLink}">${resetLink}</a>
            <p>This link will expire in 1 hour.</p>
        `;

    await sendMail(user.mail, "Reset Your Password", emailBody);

    return res.status(200).json({ message: "Password reset email sent." });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ error: defError });
  }
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const fetchTokenQuery = `
            SELECT * FROM passwordResetTokens 
            WHERE token = ? AND used = false AND expiresAt > NOW()
        `;
    const [tokenInfo] = await userDB.query(fetchTokenQuery, [token]);
    const record = tokenInfo[0];

    if (!record) {
      return res.json({ error: "Invalid or expired token." });
    }

    const hashedPassword = await hashPassword(newPassword);

    const updateUserPasswordQuery = `UPDATE users SET password = ? WHERE id = ?`;
    const markTokenUsedQuery = `UPDATE passwordResetTokens SET used = true WHERE id = ?`;

    const conn = await userDB.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(updateUserPasswordQuery, [
        hashedPassword,
        record.userID,
      ]);
      await conn.query(markTokenUsedQuery, [record.id]);

      await conn.commit();
      return res
        .status(200)
        .json({ success: "Password has been reset successfully." });
    } catch (err) {
      await conn.rollback();
      console.error("Reset password transaction failed:", err);
      return res.status(500).json({ error: defError });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ error: defError });
  }
};

export const logout = async (req, res) => {
  const sessionID = req.cookies.imis_session_id;

  const sessionInfo = await fetchSession(sessionID);

  const userID = sessionInfo.userID;

  const userRole = await fetchUserRole(userID);

  const deleteSessionQuery =
    "DELETE FROM sessions WHERE id = ? AND systemID = ?";

  await userDB.query(deleteSessionQuery, [sessionID, systemID]);

  await logUserSessionActivity(req, userID, userRole, "LOGGED_OUT");

  clearSessionCookie(res);

  return res.status(200).json({ success: "Logout successful" });
};
