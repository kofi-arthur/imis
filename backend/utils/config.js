import mysql from "mysql2/promise";
import * as nodemailer from "nodemailer";
import dotenv from "dotenv";
import { frontendUrl } from "./constants.js";

dotenv.config();


// Database Connections---------------------------------------------------------------
export const userDB = mysql.createPool({
  host: process.env.MYSQL_USERS_HOST,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USERS_DB_USER,
  password: process.env.MYSQL_USERS_DB_PASS,
  database: process.env.MYSQL_USERS_DB,
  multipleStatements: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const optramisDB = mysql.createPool({
  host: process.env.MYSQL_SYSTEM_HOST,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_SYSTEM_USER,
  password: process.env.MYSQL_SYSTEM_PASS,
  database: process.env.MYSQL_SYSTEM_DB,
  multipleStatements: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});


// Cookie Generation
export function setSessionCookie(res, sessionID) {
    res.cookie('optramis_session_id', sessionID, {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === 'production',
        maxAge: 8 * 60 * 60 * 1000, // 8 hours
    })
}

export function clearSessionCookie(res) {
    res.clearCookie('optramis_session_id', {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === 'production',
    })
}

// Nodemailer Transporter---------------------------------------------------------------
export const transporter = nodemailer.createTransport({
  service: "outlook",
  auth: {
    user: process.env.DevEmail,
    pass: process.env.DevPassword,
  },
});

export const corsConfig = {
  origin: [
    `http://localhost:5174`,
    `http://localhost:5174`,
    frontendUrl,
    `http://192.168.203.54:5173`,
  ],
  credentials: true,
};
