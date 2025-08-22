import express from 'express';
import { deleteUserMis, fetchProjects, ModifyUserSystemRole } from '../controllers/adminController.js';
import { deleteCategory, updateCategory } from '../controllers/categoryController.js';
import { deleteClient, updateClient } from '../controllers/clientController.js';
import { deleteChat } from '../controllers/discussionsController.js';
import { deleteProjectFile, deleteProjectFolder } from '../controllers/documentController.js';
import { deleteMeeting, updateMeeting } from '../controllers/meetingController.js';
import { deleteMilestone, updateMilestone } from '../controllers/milestoneController.js';
import { removeAllNotifications, removeNotifications } from '../controllers/notifsController.js';
import { deleteProject, updateProject } from '../controllers/projectController.js';
import { createPermission, deletePermission, deleteRole, fetchPermissions, fetchRoles, updatePermission, updateRole } from '../controllers/roleController.js';
import { deleteStatus, updateStatus } from '../controllers/statusController.js';
import { deleteTag, updateTag } from '../controllers/tagController.js';
import { deleteProjectTask, updateProjectTask } from '../controllers/taskController.js';
import { changeProjectOwner, changeUserAccess, deleteUserFromProject } from '../controllers/userController.js';

const app = express.Router();   

// Fetch Endpoints
app.get("/fetchProjects", fetchProjects);
app.get("/fetchRoles/:projectId", fetchRoles);
app.get("/fetchPermissions", fetchPermissions);


// Post Endpoints
app.post("/addPermission", createPermission);



// Put Endpoints
app.put("/modifyRole",ModifyUserSystemRole);
app.put("/updatePermission", updatePermission);
app.put("/updateProject", updateProject);
app.put("/updateProjectOwner", changeProjectOwner);
app.put("/updateUserRole", changeUserAccess);
app.put("/updateProjectTask", updateProjectTask);
app.put("/updateMeeting", updateMeeting);
app.put("/updateMilestone", updateMilestone);
app.put("/updateRole", updateRole);
app.put("/updateClient", updateClient);
app.put("/updateCategory", updateCategory);
app.put("/updateStatus", updateStatus);
app.put("/updateTag", updateTag);
app.put("/removeNotification", removeNotifications);
app.put("/removeAllNotifications", removeAllNotifications);


//  Delete Endpoints
app.delete("/deleteUserMis",deleteUserMis)
app.delete("/deletePermission", deletePermission);

app.delete("/deleteProject", deleteProject);
app.delete("/deleteProjectTask", deleteProjectTask);
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