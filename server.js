import express from "express";
import multer from "multer";
// import * as http from "http";
import fs from 'fs'
import * as https from 'https'
import cookieParser from "cookie-parser";
import cors from "cors";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { serveStaticFiles } from "./services/fileUploadService.js";
import { initializeSocketServer } from "./services/socketService.js";
import { corsConfig } from "./utils/config.js";
import { authenticateUser, loginLimiter } from "./utils/middlewareAuth.js";

// Configurations-----------------------------------------------------------------------

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.json());
app.use(cors(corsConfig));


// const server = http.createServer(app);

// HTTPS SERVER
const serverOptions = {
    key: fs.readFileSync(process.env.LETSENCRYPT_KEY),
    cert: fs.readFileSync(process.env.LETSENCRYPT_CERT)
}

const server = https.createServer(serverOptions, app)

await initializeSocketServer(server);

// File Upload----------------
await serveStaticFiles(app);

// Error handling for file upload
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res
      .status(500)
      .send({ error: "Multer error occurred during file upload." });
  } else if (err) {
    return res.status(400).send({ error: err.message });
  }
  next();
});

// Routes

app.use("/auth", loginLimiter, authRoutes);
app.use("/user-access",authenticateUser, userRoutes);
app.use("/admin-access", authenticateUser, adminRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something broke!" });
});

// listen
const port = process.env.PORT;

server.listen(port, (error) => {
  if (error) {
    console.error("Something broke while starting the server!", error.stack);
    process.exit(1); // Optional: exit the process
  }
  console.log(`Listening on port ${port}`);
});
