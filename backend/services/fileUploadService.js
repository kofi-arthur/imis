import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import express from "express";

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

import {
  CLIENT_UPLOADS_DIR,
  PROFILE_UPLOADS_DIR,
  PROJECT_UPLOADS_DIR,
} from "../utils/constants.js";

if (!fs.existsSync(PROJECT_UPLOADS_DIR)) {
  fs.mkdirSync(PROJECT_UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(CLIENT_UPLOADS_DIR)) {
  fs.mkdirSync(CLIENT_UPLOADS_DIR, { recursive: true });
}

// Document Upload Service
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { projectId } = req.body;

    if (!projectId) {
      return cb(new Error("File must be attached to a project."));
    }

    const projectFolder = path.join(PROJECT_UPLOADS_DIR, projectId);

    if (!fs.existsSync(projectFolder)) {
      fs.mkdirSync(projectFolder, { recursive: true });
    }

    cb(null, projectFolder);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

export const uploadDocuments = multer({
  storage: documentStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Invalid file type"));
    }
    cb(null, true);
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Profile Upload Service
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const actor = req.user;
    const profileFolder = path.join(PROFILE_UPLOADS_DIR, actor.id, "avatar");

    if (!fs.existsSync(profileFolder)) {
      fs.mkdirSync(profileFolder, { recursive: true });
    }
    cb(null, profileFolder);
  },

  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

export const uploadProfilePicture = multer({
  storage: profileStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png" ,"image/webp"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Invalid file type"));
    }
    cb(null, true);
  },
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB limit
});

//Client Upload Service
const clientStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const clientId = req.headers["clientid"]; 
    const clientAvatar = path.join(CLIENT_UPLOADS_DIR, clientId, "avatar");

    if (!fs.existsSync(clientAvatar)) {
      fs.mkdirSync(clientAvatar, { recursive: true });
    }
    cb(null, clientAvatar);
  },

  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

export const uploadClientAvatar = multer({
  storage: clientStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png" , "image/webp"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Invalid file type"));
    }
    cb(null, true);
  },
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB limit
});

export async function serveStaticFiles(app) {
  app.use("/projectFiles", express.static(PROJECT_UPLOADS_DIR));
  // app.use("/profilePictures", express.static(PROFILE_UPLOADS_DIR));
}
