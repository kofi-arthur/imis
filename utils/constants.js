import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';


dotenv.config();

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

export const systemID = process.env.SYSTEM_ID;
export const defError = "An error occurred. Please try again later.";
export const PROJECT_UPLOADS_DIR = path.join(__dirname, "../projectFiles");
export const PROFILE_UPLOADS_DIR = path.join(__dirname, "../users");
export const CLIENT_UPLOADS_DIR = path.join(__dirname, "../clients");
// export const PROFILE_UPLOADS_DIR = path.join(__dirname, "/home/hstgr-srv432552/htdocs/srv432552.hstgr.cloud/images/users");
// export const CLIENT_UPLOADS_DIR = path.join(__dirname, "/home/hstgr-srv432552/htdocs/srv432552.hstgr.cloud/images/clients");
export const isProduction = process.env.NODE_ENV === "production";
export const frontendUrl = process.env.FRONTEND_URL;