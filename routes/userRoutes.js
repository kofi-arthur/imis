import express from "express";

import {
  addCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
} from "../controllers/categoryController.js";
import {
  addClient,
  deleteClient,
  fetchClients,
  updateClient,
} from "../controllers/clientController.js";
import {
  exportPTEXCEL,
  exportPTPDF,
  fetchReportData,
} from "../controllers/dataAnalysisController.js";
import {
  createChat,
  deleteChat,
  fetchMessages,
  fetchPrivateChats,
  fetchRecentMessages,
} from "../controllers/discussionsController.js";
import {
  createProjectFolder,
  deleteProjectFile,
  deleteProjectFolder,
  downloadProjectFile,
  getNestedDocuments,
  getProjectFilesDetails,
  getRecentFiles,
  getRootDocuments,
  getTaskFiles,
  updateFolder,
  uploadDocument,
} from "../controllers/documentController.js";
import {
  fetchLogsByType
} from "../controllers/logsController.js";
import {
  addMeeting,
  deleteMeeting,
  fetchMeetings,
  updateMeeting,
} from "../controllers/meetingController.js";
import {
  addMilestone,
  deleteMilestone,
  fetchMilestones,
  updateMilestone,
} from "../controllers/milestoneController.js";
import {
  getNotifications,
  removeAllNotifications,
  removeNotifications,
} from "../controllers/notifsController.js";
import {
  addProject,
  deleteProject,
  fetchProjectAll,
  fetchProjectInfo,
  fetchUserProjects,
  recoverProject,
  updateProject,
} from "../controllers/projectController.js";
import {
  createRole,
  deleteRole,
  fetchPermissions,
  fetchRoles,
  updateRole
} from "../controllers/roleController.js";
import {
  addStatus,
  deleteStatus,
  fetchStatuses,
  updateStatus,
} from "../controllers/statusController.js";
import {
  addTag,
  deleteTag,
  fetchTags,
  updateTag,
} from "../controllers/tagController.js";
import {
  addProjectTask,
  deleteProjectTask,
  fetchProjectTasks,
  fetchTaskAll,
  fetchTaskComments,
  recoverTask,
  updateProjectTask
} from "../controllers/taskController.js";
import {
  addUserToProject,
  changeProjectOwner,
  changeUserAccess,
  deleteUserFromProject,
  fetchAllUsers,
  fetchProjectMembers,
  fetchProjectMembership,
  fetchSystemUsers,
  uploadProfile,
} from "../controllers/userController.js";
import {
  uploadClientAvatar,
  uploadDocuments,
  uploadProfilePicture,
} from "../services/fileUploadService.js";

const app = express.Router();
// Fetch Endpoints
app.get("/fetchProjects/:userId", fetchUserProjects);
app.get("/fetchProject/:projectId", fetchProjectInfo);
app.get("/fetchProjectAll/:projectId", fetchProjectAll);
app.get("/fetchTasks/:projectId", fetchProjectTasks);
app.get("/fetchTask/:id", fetchTaskAll);
app.get("/fetchComments/:taskId", fetchTaskComments);
app.get("/fetchAllUsers", fetchAllUsers);
app.get("/fetchSystemUsers", fetchSystemUsers);
// app.get("/fetchUser/:mail", fetchUserByMail);
app.get("/getMeetings/:projectId/:mail", fetchMeetings);
app.get("/fetchMilestones/:projectId", fetchMilestones);
app.get("/fetchRoles/:projectId", fetchRoles);
app.get("/fetchClients", fetchClients);
app.get("/fetchCategories", fetchCategories);
app.get("/fetchStatuses", fetchStatuses);
app.get("/fetchTags", fetchTags);
app.get("/recentMessages/:projectId/:userId",fetchRecentMessages);
app.get("/getProjectMessages/:roomId", fetchMessages);
app.get("/getPrivateChats/:projectId/:userId", fetchPrivateChats);
app.get("/fetchprojectMembership/:projectId/:mail", fetchProjectMembership);
app.get("/fetchprojectMembers/:projectId", fetchProjectMembers);
app.get("/getNotifications/:mail", getNotifications);
app.get("/fetchPermissions", fetchPermissions);

// -------------------------------------------------------------------
app.get("/system-logs/:projectId/:type", fetchLogsByType);
app.get("/project-activities/:projectId/:type", fetchLogsByType);
// --------------------------------------------
app.get("/getRecentFiles/:projectId", getRecentFiles);
app.get("/getRootDocuments/:projectId", getRootDocuments);
app.get("/getProjectDocuments/:projectId/:folderId", getNestedDocuments);
app.get("/getFiles/:projectId", getProjectFilesDetails);
app.get("/download/:filePath/:fileName", downloadProjectFile);
app.get("/getTaskFiles/:projectId/:taskId", getTaskFiles);
// ---------------------------------------------------------
app.get("/exportPTPDF/:projectId", exportPTPDF);
app.get("/exportPTEXCEL/:projectId", exportPTEXCEL);
app.get("/fetchReportData/:projectId", fetchReportData);

// Post Endpoints
app.post("/addProject", addProject);
app.post("/addProjectTask", addProjectTask);
app.post("/recoverProject", recoverProject);
app.post("/recoverTask", recoverTask);
app.post("/addMeeting", addMeeting);
app.post("/addMilestone", addMilestone);
app.post("/addRole", createRole);
app.post("/addClient", uploadClientAvatar.single("avatar"), addClient);
app.post("/addCategory", addCategory);
app.post("/addStatus", addStatus);
app.post("/addTag", addTag);
app.post("/addUserToProject", addUserToProject);
app.post("/createPrivateChat", createChat);
// ---------------------------------------------------------
app.post("/createProjectFolder", createProjectFolder);
app.post("/uploadDocument", uploadDocuments.array("files"), uploadDocument);
// ---------------------------------------------------------
app.post(
  "/uploadProfilePicture",
  uploadProfilePicture.single("avatar"),
  uploadProfile
);

// Put Endpoints
app.put("/updateProject", updateProject);
app.put("/updateProjectOwner", changeProjectOwner);
app.put("/updateUserAccess", changeUserAccess);
app.put("/updateProjectTask", updateProjectTask);
app.put("/updateMeeting", updateMeeting);
app.put("/updateMilestone", updateMilestone);
app.put("/updateRole", updateRole);
app.put("/updateClient", updateClient);
app.put("/updateCategory", updateCategory);
app.put("/updateStatus", updateStatus);
app.put("/updateTag", updateTag);
app.put("/updateFolder", updateFolder);
app.put("/removeNotification", removeNotifications);
app.put("/removeAllNotifications", removeAllNotifications);

// Delete Endpoints
app.delete("/deleteProject/:projectId", deleteProject);
app.delete("/deleteProjectTask/:taskId", deleteProjectTask);
app.delete("/deleteMeeting", deleteMeeting);
app.delete("/deleteMilestone", deleteMilestone);
app.delete("/deleteRole/:id", deleteRole);
app.delete("/deleteClient", deleteClient);
app.delete("/deleteCategory", deleteCategory);
app.delete("/deleteStatus", deleteStatus);
app.delete("/deleteTag/:id", deleteTag);
app.delete("/deleteUserFromProject", deleteUserFromProject);
// ---------------------------------------------------------
app.delete("/deleteProjectFolder", deleteProjectFolder);
app.delete("/deleteProjectFile", deleteProjectFile);
// ---------------------------------------------------------
app.delete("/deleteChat/:chatId", deleteChat);

export default app;
