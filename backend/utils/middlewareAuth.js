import dotenv from 'dotenv';
import rateLimit from "express-rate-limit";
import { clearSessionCookie, userDB } from './config.js';

dotenv.config();

const SYSTEM_ID = process.env.SYSTEM_ID;


export const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10,
  message: { error: "Too many attempts. Try again later." },
});

// Middleware to protect routes
export async function authenticateUser(req, res, next) {
    const clientSession = req.cookies.optramis_session_id;
    const sessionErrMsg = 'Session expired. Please login again';

    if (!clientSession) {
        console.log('Session not found');
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

    const fetchUserRoleQuery = "SELECT role FROM roles WHERE systemID = ? AND id = (SELECT roleID FROM userRoles WHERE userID = ? AND systemID = ?)";

    const [roleInfo] = await userDB.query(fetchUserRoleQuery, [SYSTEM_ID, user.id, SYSTEM_ID]);
    user.role = roleInfo[0].role;

    req.user = user;
    next();
}

export const roleMiddleware = (req, res, next) => {
  const user = req.user; // Assuming `req.user` contains the authenticated user's details

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Check the user's role and set the API base URL or permissions
  if (user.role === "admin") {
    req.apiBase = "/admin-api";
  } else if (user.role === "manager") {
    req.apiBase = "/manager-api";
  } else if (user.role === "user") {
    req.apiBase = "/user-api";
  } else {
    return res.status(403).json({ error: "Forbidden: Invalid role" });
  }

  next();
};