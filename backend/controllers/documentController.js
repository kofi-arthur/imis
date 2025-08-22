import fs from "fs";
import path from "path";
import { imisDB } from "../utils/config.js";
import { defError, PROJECT_UPLOADS_DIR } from "../utils/constants.js";
import { getItemInfo, getUserInfo, logSystem } from "../utils/helpers.js";

// Handle document upload
export const uploadDocument = async (req, res) => {
  const actor = req.user;
  try {
    const { projectId, folderId } = req.body;
    const files = req.files;

    if (!projectId)
      return res.status(400).json({ error: "Unable to upload file." });

    const fileRecords = files.map((file) => [
      projectId,
      file.originalname,
      "file",
      folderId === "null" ? null : folderId,
      file.size,
      `/projectFiles/${projectId}/${file.filename}`,
      actor.id,
    ]);

    const sql = `INSERT INTO projectdocuments (projectId, name, type, parentId, size, path, createdBy) VALUES ?`;
    await imisDB.query(sql, [fileRecords]);

    files.forEach((file) => {
      logSystem({
        projectId,
        details: `Uploaded a File - ${file.originalname}`,
        actor: JSON.stringify({
          id: actor.id,
          mail: actor.mail,
          displayName: actor.displayName,
          avatar: actor.avatar,
        }),
        version: "client",
        type: "syslog",
      });
    });

    res.json({
      message: "Files uploaded and saved to database successfully!",
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Download a project file
export const downloadProjectFile = async (req, res) => {
  const actor = req.user;
  const { id, path: relativePath } = req.params;
  const file = await getItemInfo(id, "projectdocuments");
  const fullPath = path.join(__dirname, relativePath, file.name);

  res.download(fullPath, file.name, async (err) => {
    if (err) res.status(500).send("Error downloading file");

    logSystem({
      projectId: req.params.projectId,
      details: `Downloaded a File - ${file.name}.`,
      actor: actor.id,
      version: "client",
      type: "syslog",
    });
  });
};

// Retrieve local folder files
export const getProjectFilesDetails = async (req, res) => {
  const { projectId } = req.params;
  const folderPath = path.join(PROJECT_UPLOADS_DIR, projectId);

  try {
    if (!fs.existsSync(folderPath)) {
      return res.status(404).send({ error: "Folder not found!" });
    }

    const files = fs.readdirSync(folderPath);
    if (files.length === 0)
      return res.status(404).send({ error: "No files found." });

    const filesWithDetails = files.map((file) => {
      const filePath = path.join(folderPath, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        format: path.extname(file)?.slice(1) || "unknown",
        size: stats.size,
        createdAt: stats.birthtime,
        updatedAt: stats.mtime,
      };
    });

    res.status(200).send({ files: filesWithDetails });
  } catch (err) {
    console.error("Error reading files:", err);
    res.status(500).send({ error: "Error retrieving files." });
  }
};

// Recent files
export const getRecentFiles = async (req, res) => {
  const { projectId } = req.params;
  const query = `SELECT * FROM projectdocuments WHERE projectId = ? AND type = 'file' ORDER BY dateCreated DESC LIMIT 10`;

  try {
    const [result] = await imisDB.query(query, [projectId]);
    await Promise.all(
      result.map(async (file) => {
        const creator = await getUserInfo(file.createdBy);
        file.createdBy = {
          id: creator.id,
          displayName: creator.displayName,
          mail: creator.mail,
          avatar: creator.avatar,
        };
      })
    );
    res.json({ recentFiles: result });
  } catch (err) {
    console.log("error executing query", err);
    res.json({ error: defError });
  }
};

// Root folders
export const getRootDocuments = async (req, res) => {
  const { projectId } = req.params;
  const query = `SELECT * FROM projectdocuments WHERE projectId = ? AND parentId IS NULL`;

  try {
    const [result] = await imisDB.query(query, [projectId]);
    await Promise.all(
      result.map(async (file) => {
        const creator = await getUserInfo(file.createdBy);
        file.createdBy = {
          id: creator.id,
          displayName: creator.displayName,
          mail: creator.mail,
          avatar: creator.avatar,
        };
      })
    );
    res.json({ documents: result });
  } catch (err) {
    console.log("error executing query", err);
    res.json({ error: defError });
  }
};

// Nested folders
export const getNestedDocuments = async (req, res) => {
  const { projectId, folderId } = req.params;
  const query = `SELECT * FROM projectdocuments WHERE projectId = ? AND parentId = ?`;
  try {
    const [result] = await imisDB.query(query, [projectId, folderId]);
    await Promise.all(
      result.map(async (file) => {
        const creator = await getUserInfo(file.createdBy);
        file.createdBy = {
          id: creator.id,
          displayName: creator.displayName,
          mail: creator.mail,
          avatar: creator.avatar,
        };
      })
    );
    res.json({ documents: result });
  } catch (err) {
    console.log("error executing query", err);
    res.json({ error: defError });
  }
};

// Task-specific files
export const getTaskFiles = async (req, res) => {
  const { projectId, taskId } = req.params;
  const query = `SELECT * FROM projectdocuments WHERE projectId = ? AND taskId = ? AND type = 'file'`;

  try {
    const [result] = await imisDB.query(query, [projectId, taskId]);
    await Promise.all(
      result.map(async (file) => {
        const creator = await getUserInfo(file.createdBy);
        file.createdBy = {
          id: creator.id,
          displayName: creator.displayName,
          mail: creator.mail,
          avatar: creator.avatar,
        };
      })
    );
    res.json({ files: result });
  } catch (err) {
    console.log("error executing query", err);
    res.json({ error: defError });
  }
};

// Create folder
export const createProjectFolder = async (req, res) => {
  const folder = req.body;
  const actor = req.user;

  try {
    const [exists] = await imisDB.query(
      `SELECT * FROM projectdocuments WHERE projectId = ? AND name = ? AND type = 'folder'`,
      [folder.projectId, folder.name, folder.id]
    );

    if (exists.length > 0) {
      return res.json({ error: "Folder with similar name already exists." });
    }

    await imisDB.query(
      `INSERT INTO projectdocuments (projectId, name, type, parentId, createdBy) VALUES (?, ?, 'folder', ?, ?)`,
      [folder.projectId, folder.name, folder.id, actor.id]
    );

    logSystem({
      projectId: folder.projectId,
      details: `Created a Folder - ${folder.name}`,
      actor: actor.id,
      version: "client",
      type: "syslog",
    });

    res.json({ message: "Folder created successfully" });
  } catch (err) {
    console.log("error executing query", err);
    res.json({ error: defError });
  }
};


export const updateFolder = async (req, res) => {
  const { id, name, parentId } = req.body;
  const actor = req.user;

  try {
    // Fetch the document to verify it exists
    const [rows] = await imisDB.query(
      `SELECT * FROM projectdocuments WHERE id = ? AND type = 'folder'`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Document not found" });
    }

    const document = rows[0];

    // Optionally check: if a file with the new name already exists in the same folder
    const [duplicate] = await imisDB.query(
      `SELECT * FROM projectdocuments WHERE name = ? AND parentId = ? AND projectId = ? AND id != ?`,
      [name, parentId ?? document.parentId, document.projectId, id]
    );

    if (duplicate.length > 0) {
      return res.status(409).json({ error: "A Folder with this name already exists in this folder." });
    }

    // Update the document entry in the DB
    await imisDB.query(
      `UPDATE projectdocuments SET name = ?, parentId = ? WHERE id = ?`,
      [name, parentId ?? document.parentId, id]
    );

    logSystem({
      projectId: document.projectId,
      details: `Updated a Document - ${document.name}`,
      actor: actor.id,
      version: "client",
      type: "syslog",
    })

    res.json({ message: "Document updated successfully" });
  } catch (err) {
    console.error("Error updating document:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all descendants of a folder
const getAllDescendants = async (parentId) => {
  const query = `
    WITH RECURSIVE descendants AS (
      SELECT * FROM projectdocuments WHERE id = ?
      UNION ALL
      SELECT pd.* FROM projectdocuments pd
      INNER JOIN descendants d ON pd.parentId = d.id
    ) SELECT * FROM descendants;
  `;
  const [result] = await imisDB.query(query, [parentId]);
  return result;
};

// Delete folder and contents
export const deleteProjectFolder = async (req, res) => {
  const { folder } = req.body;
  const actor = req.user;

  try {
    const documents = await getAllDescendants(folder.id);

    for (const doc of documents) {
      if (doc.type === "file") {
        const filePath = path.join(
          PROJECT_UPLOADS_DIR,
          folder.projectId,
          doc.name
        );
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    }

    const ids = documents.map((doc) => doc.id);
    await imisDB.query(`DELETE FROM projectdocuments WHERE id IN (?)`, [
      ids,
    ]);

    logSystem({
      projectId: folder.projectId,
      details: `Deleted Folder '${folder.name}' and its contents.`,
      actor: actor.id,
      version: "client",
      type: "syslog",
    });

    res.json({ message: "Folder and its contents deleted successfully." });
  } catch (err) {
    console.error("Error deleting folder:", err);
    res.status(500).json({ error: defError });
  }
};

// Delete a project file
export const deleteProjectFile = async (req, res) => {
  const { file } = req.body;
  const actor = req.user;
  const filePath = path.join(PROJECT_UPLOADS_DIR, file.projectId, file.name);

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    await imisDB.query(
      `DELETE FROM projectdocuments WHERE projectId = ? AND id = ? AND type = 'File'`,
      [file.projectId, file.id]
    );

    logSystem({
      projectId: file.projectId,
      details: `Deleted a File - ${file.name}.`,
      actor: actor.id,
      version: "client",
      type: "syslog",
    });

    res.json({ message: "File deleted successfully!" });
  } catch (err) {
    console.error("Error deleting file:", err);
    res.status(500).json({ error: defError });
  }
};
