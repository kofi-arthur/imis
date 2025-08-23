import Axios from "axios";
import { errorToast, successToast } from "../components/toast.jsx";

// export const api = "http://localhost:3300";
export const api = "https://imis.wecltd.io:3021";
// export const api = "http://192.168.203.54:3300";

export const axios = Axios.create({
  baseURL: api,
  withCredentials: true,
});

// Basic API functions---------------------------------------------------------

// User account management
export async function checkSession() {
  try {
    const response = await axios.get(`/auth/session`, {
      withCredentials: true,
    });

    if (response.data.error) {
      if (response.data.error === "Session not found") {
        return null;
      } else {
        return { error: response.data.error };
      }
    }

    return { data: response.data.user };
  } catch (e) {
    console.log("error checking session", e);
    return null;
  }
}

export const signup = async (mail, password) => {
  try {
    const submitSignup = await axios.post(`/auth/signup`, {
      mail,
      password,
    });
    const response = await submitSignup.data;
    if (response.error) {
      return { error: response.error };
    }

    return { data: response.success };
  } catch (e) {
    console.log("error signing up", e);
    return errorToast("An error occured. Please try again later");
  }
};

export const loginUser = async (mail, password) => {
  try {
    const response = (await axios.post(`/auth/login`, { mail, password })).data;
    if (response.error) {
      return { error: response.error };
    }
    return { data: response.user };
  } catch (e) {
    console.log("error logging in", e);
    return errorToast("An error occured. Please try again later");
  }
};

export async function logoutUser() {
  try {
    const response = (
      await axios.post(`/auth/logout`, {
        withCredentials: true,
      })
    ).data;

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, data: response.success };
  } catch (e) {
    console.log("error logging out", e);
    return {
      success: false,
      error: "An error occured while logging out. Please try again later",
    };
  }
}

export async function forgotPassword(mail) {
  try {
    const response = (await axios.post(`/auth/forgot-password`, { mail })).data;

    if (response.error) {
      return { success: false, error: response.error };
    }
    return { success: true };
  } catch (err) {
    console.log("error sending email", err);
    return {
      success: false,
      error: "An error occured while sending email. Please try again later",
    };
  }
}

export async function resetPassword(token, newPassword) {
  try {
    const response = (
      await axios.post(`/auth/reset-password`, {
        token,
        newPassword,
      })
    ).data;

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, data: response.success };
  } catch (err) {
    console.log("error resetting password", err);
    return {
      success: false,
      error:
        "An error occured while resetting password. Please try again later",
    };
  }
}

export async function uploadProfilePicture(file) {
  try {
    const fromData = new FormData();
    fromData.append("avatar", file);
    const response = (
      await axios.post(`/user-access/uploadProfilePicture`, fromData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
    ).data;
    if (response.error) {
      return { error: response.error };
    }
    return { data: response.success };
  } catch (error) {
    console.error("error uploading profile picture", error);
  }
}

// Membership And User Roles Functions
export const addUserToProject = async (projectId, users) => {
  try {
    const addUserToProject = await axios.post(`/user-access/addUserToProject`, {
      projectId,
      users,
    });
    const response = await addUserToProject.data;
    if (response.error) {
      return errorToast(response.error);
    }
    successToast(response.message);
    return response.members;
  } catch (e) {
    console.log("error adding user to project", e);
    return errorToast("An error occured. Please try again later");
  }
};

export const deleteUserFromProject = async (projectId, userIds) => {
  try {
    const deleteUserFromProject = await axios.delete(
      `/user-access/deleteUserFromProject`,
      {
        data: { projectId, userIds },
      }
    );
    const response = await deleteUserFromProject.data;
    if (response.error) {
      errorToast(response.error);
      return false;
    }
    successToast(response.message);
    return true;
  } catch (e) {
    console.log("error removing user from project", e);
    errorToast("An error occured. Please try again later");
    return false;
  }
};

export const changeProjectOwner = async (projectId, oldOwnerId, newOwnerId) => {
  try {
    const response = (
      await axios.put(`/user-access/updateProjectOwner`, {
        projectId,
        oldOwnerId,
        newOwnerId,
      })
    ).data;
    if (response.error) {
      errorToast(response.error);
      return { success: false };
    }
    successToast(response.message);
    return { success: true, newOwner: response.newOwner };
  } catch (error) {
    console.log("error changing project manager", error);
    return errorToast("An error occured. Please try again later");
  }
};

export const editUserAccess = async (projectId, userId, permId, roleId) => {
  try {
    const response = (
      await axios.put(`/user-access/updateUserAccess`, {
        projectId,
        userId,
        permId,
        roleId,
      })
    ).data;
    if (response.error) {
      errorToast(response.error);
      return { success: false };
    }
    successToast(response.message);
    return {
      success: true,
      role: response.role,
      permission: response.permission,
    };
  } catch (error) {
    console.log("error changing user role", error);
    return errorToast("An error occured. Please try again later");
  }
};

export const fetchprojectMembers = async (projectId) => {
  try {
    const fetchProjectMembers = await axios.get(
      `/user-access/fetchprojectMembers/${projectId}`
    );
    const response = await fetchProjectMembers.data;
    if (response.error) {
      return errorToast(response.error);
    }
    return response.members;
  } catch (err) {
    console.log("An error occured ,", err);
    return errorToast("An error occured, please try again later");
  }
};
// Fetch all system users.
export const fetchSystemUsers = async () => {
  try {
    const response = await axios.get(`/user-access/fetchSystemUsers`);
    const users = await response.data.users;
    return users;
  } catch (error) {
    console.log("error fetching users", error);
    return errorToast("An error occured. Please try again later");
  }
};

// ------ Fetch user projects ---------
export const fetchProjects = async (id) => {
  try {
    const response = await axios.get(`/user-access/fetchProjects/${id}`);
    const result = await response.data;
    if (result.error) return errorToast(result.error);
    if (result.projects) return result.projects;
  } catch (error) {
    console.log("error fetching projects", error);
    return errorToast("An error occured. Please try again later");
  }
};

//Dashboard API Calls

export const fetchRecentMessages = async (projectId, userId) => {
  try {
    const fetchRecentMessages = await axios.get(
      `/user-access/recentMessages/${projectId}/${userId}`
    );
    const recentMessages = await fetchRecentMessages.data;
    if (recentMessages.error) return errorToast(recentMessages.error);
    return recentMessages.messages;
  } catch (error) {
    console.log("error fetching recent messages", error);
    return errorToast("An error occured. Please try again later");
  }
};

//fetch specific project information ------
export const fetchProject = async (projectId) => {
  try {
    const fetchProject = await axios.get(
      `/user-access/fetchProject/${projectId}`
    );
    const project = await fetchProject.data.project;
    return project;
  } catch (error) {
    console.log("error fetching project", error);
    return errorToast("An error occured. Please try again later");
  }
};

// ------ Fetch all projects with (Extra - User Limit)---------
export const fetchUserProjectsAll = async (mail) => {
  try {
    const response = await axios.get(`/fetchUserProjectsAll/${mail}`);
    const result = await response.data;
    if (result.error) return errorToast(result.error);
    if (result.projects) return result.projects;
    return projects;
  } catch (error) {
    console.log("error fetching projects", error);
    return errorToast("An error occured. Please try again later");
  }
};

export const addProject = async (project) => {
  if (
    !project.startDate ||
    !project.dueDate ||
    !project.projectName ||
    !project.projectCategory ||
    !project.productionJobNo ||
    !project.workOrderNo
    // !project.workOrderReceivedDate
  ) {
    return errorToast("Please provide all required fields");
  }

  try {
    const response = (await axios.post(`/user-access/addProject`, project))
      .data;
    return response;
  } catch (error) {
    console.log("error adding project", error);
    return errorToast("An error occured. Please try again later");
  }
};

export const updateProject = async (project) => {
  try {
    const updateProject = await axios.put(
      `/user-access/updateProject`,
      project
    );
    const response = await updateProject.data;
    if (response.error) {
      errorToast(response.error);
      return false;
    } else {
      successToast(response.message);
      return true;
    }
  } catch (error) {
    console.log("error adding project", error);
    return errorToast("An error occured. Please try again later");
  }
};

export const deleteProject = async (projectId) => {
  try {
    const deleteProject = await axios.delete(`/user-access/deleteProject/${projectId}`, {
    });
    const response = await deleteProject.data;
    if (response.error) {
      errorToast(response.error);
      return false;
    } else {
      successToast(response.message);
      return true;
    }
  } catch (error) {
    console.log("error deleting project", error);
    return errorToast("An error occured. Please try again later");
  }
};

export const fetchProjectAccessLevel = async (projectId, mail) => {
  try {
    const projectAccessLevel = await axios.get(
      `/user-access/fetchprojectMembership/${projectId}/${mail}`
    );
    const response = await projectAccessLevel.data;
    if (response.error) {
      return errorToast(response.error);
    }
    return response.membership;
  } catch (err) {
    console.log("An error occured ,", err);
    return errorToast("An error occured, please try again later");
  }
};

// Task API Calls

export const fetchProjectTasks = async (projectId) => {
  try {
    const fetchTasks = await axios.get(`/user-access/fetchTasks/${projectId}`);
    const response = await fetchTasks.data;
    response.error && errorToast(response.error);
    return !response.error && response.tasks;
  } catch (err) {
    console.log("An error ocurred, ", err);
    return errorToast("An error occured, please try again.");
  }
};

export const createTask = async (task) => {
  if (!task.title || !task.projectId || !task.createdBy || !task.dueDate) {
    errorToast("Please provide all required fields");
    return false;
  }
  try {
    const createTask = await axios.post(`/user-access/addProjectTask`, task);
    const response = await createTask.data;
    if (response.error) {
      console.log("error creating task", response.error);
      errorToast(response.error);
      return false;
    }
    if (!response.error) {
      successToast(response.message);
      return true;
    }
    // !response.error && successToast(response.message);
  } catch (e) {
    console.log("error creating task", e);
    errorToast("An error occured. Please try again later");
    return false;
  }
};

export const updateTaskDetails = async (task) => {
  try {
    const updateTask = await axios.put(`/user-access/updateProjectTask`, task);
    const response = await updateTask.data;
    if (response.error) {
      console.log("error updating task", response.error);
      errorToast(response.error);
      return false;
    }
    if (!response.error) {
      successToast(response.message);
      return true;
    }
  } catch (e) {
    console.log("error updating task", e);
    return errorToast("An error occured. Please try again later");
  }
};

export const deleteTask = async (taskId) => {
  try {
    const deleteTask = await axios.delete(
      `/user-access/deleteProjectTask/${taskId}`
    );
    const response = await deleteTask.data;
    if (response.error) {
      errorToast(response.error);
      return false;
    }
    if (!response.error) {
      successToast(response.message);
      return true;
    }
  } catch (e) {
    console.log("error deleting task", e);
    return errorToast("An error occured. Please try again later");
  }
};

export const fetchComments = async (taskId) => {
  try {
    const fetchComments = await axios.get(
      `/user-access/fetchComments/${taskId}`
    );
    const response = await fetchComments.data;
    response.error && errorToast(response.error);
    return !response.error && response.comments;
  } catch (e) {
    console.log("error fetching comments", e);
    return errorToast("An error occured. Please try again later");
  }
};

// Client API Calls

export const fetchClients = async () => {
  try {
    const fetchClients = await axios.get(`/user-access/fetchClients`);
    const response = await fetchClients.data;
    if (response.error) {
      console.log("error fetching clients", response.error);
      return;
    }
    return response.clients;
  } catch (e) {
    console.log("error fetching clients", e);
    return errorToast("An error occured. Please try again later");
  }
};

export const addClient = async (avatar, clientData) => {
  try {
    const formData = new FormData();
    formData.append("avatar", avatar);
    formData.append("clientData", JSON.stringify(clientData));
    const addClient = await axios.post(`/user-access/addClient`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        clientid: clientData.id,
      },
    });
    const response = await addClient.data;
    response.error && errorToast(response.error);
    !response.error && successToast(response.message);
  } catch (e) {
    console.log("error adding client", e);
    return errorToast("An error occured. Please try again later");
  }
};

export const updateClient = async (client) => {
  try {
    const updateClient = await axios.put(`/user-access/updateClient`, {
      client,
    });
    const response = await updateClient.data;
    response.error && errorToast(response.error);
    !response.error && successToast(response.message);
  } catch (e) {
    console.log("error updating client ", e);
    return errorToast("An error occured. Please try again later");
  }
};

export const deleteClient = async (id) => {
  try {
    const deleteClient = await axios.delete(`/user-access/deleteClient/${id}`);
    const response = await deleteClient.data;
    response.error && errorToast(response.error);
    !response.error && successToast(response.message);
  } catch (e) {
    console.log("error deleting client ", e);
    return errorToast("An error occured. Please try again later");
  }
};

// Category API Calls

export const fetchCategories = async () => {
  try {
    const fetchCategories = await axios.get(`/user-access/fetchCategories`);
    const response = await fetchCategories.data;
    if (response.error) {
      console.log("error fetching categories", response.error);
      return;
    }
    return response.categories;
  } catch (e) {
    console.log("error fetching categories", e);
    return errorToast("An error occured. Please try again later");
  }
};

export const addCategory = async (category) => {
  try {
    const addCategory = await axios.post(`/user-access/addCategory`, {
      category,
    });
    const response = await addCategory.data;
    response.error && errorToast(response.error);
    !response.error && successToast(response.message);
  } catch (e) {
    console.log("error adding category", e);
    return errorToast("An error occured. Please try again later");
  }
};

export const updateCategory = async (category) => {
  try {
    const updateCategory = await axios.put(`/user-access/updateCategory`, {
      category,
    });
    const response = await updateCategory.data;
    response.error && errorToast(response.error);
    !response.error && successToast(response.message);
  } catch (e) {
    console.log("error updating category ", e);
    return errorToast("An error occured. Please try again later");
  }
};

export const deleteCategory = async (id) => {
  try {
    const deleteCategory = await axios.delete(`/user-access/deleteCategory`, {
      data: { id },
    });
    const response = await deleteCategory.data;
    response.error && errorToast(response.error);
    !response.error && successToast(response.message);
  } catch (e) {
    console.log("error deleting category ", e);
    return errorToast("An error occured. Please try again later");
  }
};

// Notif API Calls

export const getNotifications = async (mail) => {
  try {
    const fetchNotifications = await axios.get(
      `/user-access/getNotifications/${mail}`
    );
    const response = await fetchNotifications.data;
    response.error && errorToast(response.error);
    if (response.message) {
      return response.message;
    }
    return response.notifications;
  } catch (err) {
    console.log("An error occured, ", err);
    return errorToast("An error occured, please try again later");
  }
};

export const removeNotification = async (id, projectId, mail) => {
  try {
    const removeNotification = await axios.put(
      `/user-access/removeNotification`,
      {
        id,
        projectId,
        mail,
      }
    );
    const response = await removeNotification.data;
    response.error && errorToast(response.error);
  } catch (e) {
    console.log("error marking as read ", e);
    return errorToast("An error occured. Please try again later");
  }
};

export const removeAllNotifications = async (mail) => {
  try {
    const markAllAsRead = await axios.put(
      `/user-access/removeAllNotifications`,
      { mail }
    );
    const response = await markAllAsRead.data;
    response.error && errorToast(response.error);
  } catch (e) {
    console.log("error marking all as read ", e);
    return errorToast("An error occured. Please try again later");
  }
};

// System Logs
export const fetchSystemLogs = async (projectId) => {
  try {
    const fetchActivities = await axios.get(
      `/user-access/system-logs/${projectId}/syslog`
    );
    const response = await fetchActivities.data;
    response.error && errorToast(response.error);
    return !response.error && response.recentActivities;
  } catch (err) {
    console.log("An error occured, ", err);
    return errorToast("An error occured, please try again later");
  }
};

export const fetchProjectActivies = async (projectId) => {
  try {
    const fetchActivities = await axios.get(
      `/user-access/project-activities/${projectId}/activity`
    );
    const response = await fetchActivities.data;
    response.error && errorToast(response.error);
    return !response.error && response.recentActivities;
  } catch (err) {
    console.log("An error occured, ", err);
    return errorToast("An error occured, please try again later");
  }
};

//Document API Calls

export const fetchRootDocuments = async (projectId) => {
  try {
    const fetchProjectFolders = await axios.get(
      `/user-access/getRootDocuments/${projectId}`
    );
    const response = await fetchProjectFolders.data;
    if (response.error) {
      return errorToast(response.error);
    }
    return response.documents;
  } catch (err) {
    console.log("An error occured ,", err);
    return errorToast("An error occured, please try again later");
  }
};

export const fetchProjectFolders = async (projectId, folderId) => {
  try {
    const fetchProjectFolders = await axios.get(
      `/user-access/getProjectFolders/${projectId}/${folderId}`
    );
    const response = await fetchProjectFolders.data;
    if (response.error) {
      return errorToast(response.error);
    }
    return response.folders;
  } catch (err) {
    console.log("An error occured ,", err);
    return errorToast("An error occured, please try again later");
  }
};

export const fetchRecentFiles = async (projectId) => {
  try {
    const recentFiles = await axios.get(
      `/user-access/getRecentFiles/${projectId}`
    );
    const response = await recentFiles.data;
    response.error && errorToast(response.error);
    return !response.error && response.recentFiles;
  } catch (err) {
    console.log("An error occured ,", err);
    return errorToast("An error occured, please try again later");
  }
};

export const fetchProjectFiles = async (projectId, folderId) => {
  try {
    const fetchProjectFolders = await axios.get(
      `/user-access/getProjectFiles/${projectId}/${folderId}`
    );
    const response = await fetchProjectFolders.data;
    if (response.error) {
      return errorToast(response.error);
    }
    return response.files;
  } catch (err) {
    console.log("An error occured ,", err);
    return errorToast("An error occured, please try again later");
  }
};

export const fetchTaskFiles = async (projectId, taskId) => {
  try {
    const taskFiles = await axios.get(
      `/user-access/getTaskFiles/${projectId}/${taskId}`
    );
    const response = await taskFiles.data;
    if (response.error) {
      return errorToast(response.error);
    }
    return response.files;
  } catch (err) {
    console.log("An error occured ,", err);
    return errorToast("An error occured, please try again later");
  }
};

export const createProjectFolder = async (folder) => {
  try {
    const createFolder = await axios.post(
      `/user-access/createProjectFolder`,
      folder
    );
    const response = createFolder.data;
    response.error && errorToast(response.error);
    response.message && successToast(response.message);
  } catch (err) {
    console.log("An error occured ,", err);
    return errorToast("An error occured, please try again later");
  }
};

export const uploadDocument = async (document) => {
  try {
    const formData = new FormData();
    formData.append("file", document);
    const response = (
      await axios.postForm("/user-access/uploadDocument", formData)
    ).data;
    if (response.error) {
      errorToast(response.error);
      return false;
    }
    if (response.message) {
      successToast(response.message);
      return true;
    }
  } catch (error) {
    console.error("An error occured ,", error);
    return errorToast("An error occured, please try again later");
  }
};

export const updateFolder = async (id, name, parentId) => {
  try {
    const response = (
      await axios.put(`/user-access/updateFolder`, { id, name, parentId })
    ).data;
    if (response.error) {
      errorToast(response.error);
      return false;
    }
    if (response.message) {
      successToast(response.message);
      return true;
    }
  } catch (error) {
    console.log("An error occured ,", error);
    return errorToast("An error occured, please try again later");
  }
};

export const deleteProjectFolder = async (folder) => {
  try {
    const deleteFolder = await axios.delete(
      `/user-access/deleteProjectFolder`,
      {
        data: { folder },
      }
    );
    const response = deleteFolder.data;
    if (response.error) {
      errorToast(response.error);
      return false;
    }
    if (response.message) {
      successToast(response.message);
      return true;
    }
  } catch (err) {
    console.log("An error occured ,", err);
    return errorToast("An error occured, please try again later");
  }
};

export const deleteProjectFile = async (file) => {
  try {
    const deleteFile = await axios.delete(`/user-access/deleteProjectFile`, {
      data: { file },
    });
    const response = deleteFile.data;
    if (response.error) {
      errorToast(response.error);
      return false;
    }
    if (response.message) {
      successToast(response.message);
      return true;
    }
  } catch (err) {
    console.log("An error occured ,", err);
    return errorToast("An error occured, please try again later");
  }
};

//Report Services
export const exportProjectTimeline = async (projectId, workOrderNo, type) => {
  try {
    if (type === "excel") {
      const response = await axios.get(
        `/user-access/exportPTEXCEL/${projectId}`,
        {
          responseType: "blob", // Ensures the response is treated as a binary blob
        }
      );
      // Create a URL for the file blob
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );

      // Create a temporary anchor element to trigger the download
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `project-timeline - ${workOrderNo} - ${new Date().toUTCString()}.xlsx`
      );

      // Append the anchor to the body, trigger the click, and remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const response = await axios.get(`/exportPTPDF/${projectId}`, {
        responseType: "blob", // Ensures the response is treated as a binary blob
      });

      // Create a URL for the file blob
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );

      // Create a temporary anchor element to trigger the download
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `project-timeline-${workOrderNo}.pdf`);

      // Append the anchor to the body, trigger the click, and remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (err) {
    console.error("An error occurred while exporting the timeline:", err);
    return errorToast("An error occurred while exporting the timeline.");
  }
};

export const updateProgress = async (task, type) => {
  try {
    const response = await axios.put(`/user-access/updateTaskProgress`, {
      task,
      type,
    });
    const result = response.data;
    result.error && errorToast(result.error);
    return;
  } catch (err) {
    console.log("An error occured ,", err);
    return errorToast("An error occured, please try again later");
  }
};

export const fetchReportData = async (projectId) => {
  try {
    const fetchReportData = await axios.get(
      `/user-access/fetchReportData/${projectId}`
    );
    const response = await fetchReportData.data;
    if (response.error) {
      return errorToast(response.error);
    }
    return response.reportData;
  } catch (err) {
    console.log("An error occured ,", err);
    return errorToast("An error occured, please try again later");
  }
};

// Milestone API Calls

export const fetchMilestones = async (projectId) => {
  try {
    const fetchMilestones = await axios.get(
      `/user-access/fetchMilestones/${projectId}`
    );
    const response = await fetchMilestones.data;
    if (response.error) {
      return errorToast(response.error);
    }

    return response.milestones;
  } catch (err) {
    console.log("An error occured ,", err);
    return errorToast("An error occured, please try again later");
  }
};
export const addMilestone = async (milestone) => {
  try {
    const addMilestone = await axios.post(
      `/user-access/addMilestone`,
      milestone
    );
    const response = addMilestone.data;
    response.error && errorToast(response.error);
    !response.error && successToast(response.message);
    return;
  } catch (err) {
    console.log("An error occured ,", err);
    return errorToast("An error occured, please try again later");
  }
};
export const updateMilestone = async (milestone) => {
  try {
    const updateMilestone = await axios.put(`/user-access/updateMilestone`, {
      milestone,
    });
    const response = updateMilestone.data;
    response.error && errorToast(response.error);
    !response.error && successToast(response.message);
    return;
  } catch (err) {
    console.log("An error occured ,", err);
    return errorToast("An error occured, please try again later");
  }
};
export const deleteMilestone = async (milestone) => {
  try {
    const deleteMilestone = await axios.delete(`/user-access/deleteMilestone`, {
      data: { milestone },
    });
    const response = deleteMilestone.data;
    response.error && errorToast(response.error);
    !response.error && successToast(response.message);
    return;
  } catch (err) {
    console.log("An error occured ,", err);
    return errorToast("An error occured, please try again later");
  }
};

//Statuses API Calls
export const fetchStatuses = async () => {
  try {
    const fetchStatuses = await axios.get(`/user-access/fetchStatuses`);
    const response = await fetchStatuses.data;
    if (response.error) {
      return errorToast(response.error);
    }
    return response.statuses;
  } catch (e) {
    console.log("error fetching Statuses", e);
    return errorToast("An error occured. Please try again later");
  }
};

export const addStatus = async (status) => {
  try {
    const addStatus = await axios.post(`/user-access/addStatus`, {
      status,
    });
    const response = await addStatus.data;
    response.error && errorToast(response.error);
    !response.error && successToast(response.message);
  } catch (e) {
    console.log("error adding status", e);
    return errorToast("An error occured. Please try again later");
  }
};

export const updateStatus = async (status) => {
  try {
    const updateStatus = await axios.put(`/user-access/updateStatus`, {
      status,
    });
    const response = await updateStatus.data;
    response.error && errorToast(response.error);
    !response.error && successToast(response.message);
  } catch (e) {
    console.log("error updating status ", e);
    return errorToast("An error occured. Please try again later");
  }
};

export const deleteStatus = async (id) => {
  try {
    const deleteStatus = await axios.delete(`/user-access/deleteStatus`, {
      data: { id },
    });
    const response = await deleteStatus.data;
    response.error && errorToast(response.error);
    !response.error && successToast(response.message);
  } catch (e) {
    console.log("error deleting status ", e);
    return errorToast("An error occured. Please try again later");
  }
};

// Meetings API Calls

export const fetchMeetings = async (projectId, mail) => {
  try {
    const fetchMeetingCall = await axios.get(
      `/user-access/fetchMeetings/${projectId}/${mail}`
    );
    const response = await fetchMeetingCall.data;
    if (response.error) {
      return errorToast(response.error);
    }
    return response.meetings;
  } catch (err) {
    console.log("error fetching Meetings", e);
    return errorToast("An error occured. Please try again later");
  }
};

export const addMeeting = async (meeting) => {
  try {
    const addMeetingCall = await axios.post(`/user-access/addMeeting`, meeting);
    const response = await addMeetingCall.data;
    if (response.error) {
      return errorToast(response.error);
    }
    return response.message;
  } catch (err) {
    console.log("error creating meeting", e);
    return errorToast("An error occured. Please try again later");
  }
};

export const updateMeeting = async (meeting) => {
  try {
    const updateMeetingCall = await axios.put(
      `/user-access/updateMeeting`,
      meeting
    );
    const response = await updateMeetingCall.data;
    if (response.error) {
      return errorToast(response.error);
    }
    return response.message;
  } catch (err) {
    console.log("error modifying meeting", e);
    return errorToast("An error occured. Please try again later");
  }
};

//Delete Meetings
export const deleteMeeting = async (meeting) => {
  try {
    const deleteMeetingCall = await axios.delete(`/user-access/deleteMeeting`, {
      data: { meeting },
    });
    const response = await deleteMeetingCall.data;
    if (response.error) {
      return errorToast(response.error);
    }
    return response.message;
  } catch (err) {
    console.log("error deleting meeting", e);
    return errorToast("An error occured. Please try again later");
  }
};

//Chat API Calls

export const fetchUserChatList = async (projectId, userId) => {
  try {
    const response = await axios.get(
      `/user-access/getPrivateChats/${projectId}/${userId}`
    );
    const result = await response.data;
    if (result.error) return errorToast(result.error);
    return result.chats;
  } catch (error) {
    console.log("error fetching user chat list", error);
    return errorToast("An error occured. Please try again later");
  }
};

export const fetchMessages = async (roomId) => {
  try {
    const fetchMessages = await axios.get(
      `/user-access/getProjectMessages/${roomId}`
    );
    const result = await fetchMessages.data;
    if (result.error) return errorToast(result.error);
    return result.messages;
  } catch (e) {
    return console.log("error fetching messages", e);
  }
};
export const createChat = async (chat) => {
  try {
    const createChatCall = await axios.post(
      `/user-access/createPrivateChat`,
      chat
    );
    const response = await createChatCall.data;
    if (response.error) {
      return errorToast(response.error);
    }
    // console.log(response)
    return response;
  } catch (err) {
    console.log("error creating chat", e);
    return errorToast("An error occured. Please try again later");
  }
};

export const deleteChat = async (chatId) => {
  try {
    const deleteChatCall = await axios.delete(
      `/user-access/deletePrivateChat/${chatId}`
    );
    const response = await deleteChatCall.data;
    if (response.error) {
      return errorToast(response.error);
    }
    return response.message;
  } catch (err) {
    console.log("error deleting chat", e);
    return errorToast("An error occured. Please try again later");
  }
};

//Tag API Calls
export const fetchTags = async () => {
  try {
    const response = (await axios.get(`/user-access/fetchTags`)).data;
    if (response.error) {
      return errorToast(response.error);
    }
    return response.tags;
  } catch (error) {
    console.log("error fetching tags", error);
    return errorToast("An error occured. Please try again later");
  }
};

export const addTag = async (tag) => {
  try {
    const response = (await axios.post(`/user-access/addTag`, tag)).data;
    if (response.error) {
      errorToast(response.error);
      return false;
    }
    successToast(response.message);
    return true;
  } catch (error) {
    console.log("error adding tag", error);
    return errorToast("An error occured. Please try again later");
  }
};

export const updateTag = async (tag) => {
  try {
    const response = (await axios.put(`/user-access/updateTag`, tag)).data;
    if (response.error) {
      return errorToast(response.error);
    }
    return successToast(response.message);
  } catch (error) {
    console.log("error updating tag", error);
    return errorToast("An error occured. Please try again later");
  }
};

export const deleteTag = async (id) => {
  try {
    const response = (await axios.delete(`/user-access/deleteTag/${id}`)).data;
    if (response.error) {
      errorToast(response.error);
      return false;
    }
    successToast(response.message);
    return true;
  } catch (error) {
    console.log("error deleting tag", error);
    return errorToast("An error occured. Please try again later");
  }
};

// Roles API Calls
export const fetchRoles = async (projectId) => {
  try {
    const response = (await axios.get(`/user-access/fetchRoles/${projectId}`))
      .data;
    if (response.error) {
      return errorToast(response.error);
    }
    return response.roles;
  } catch (error) {
    console.log("error fetching roles", error);
    return errorToast("An error occured. Please try again later");
  }
};

export const addRole = async (role) => {
  try {
    const response = (await axios.post(`/user-access/addRole`, role)).data;
    if (response.error) {
      errorToast(response.error);
      return false;
    }
    successToast(response.message);
    return true;
  } catch (error) {
    console.log("error adding role", error);
    return errorToast("An error occured. Please try again later");
  }
};

export const updateRole = async (role) => {
  try {
    const response = (await axios.put(`/user-access/updateRole`, role)).data;
    if (response.error) {
      return errorToast(response.error);
    }
    return successToast(response.message);
  } catch (error) {
    console.log("error updating role", error);
    return errorToast("An error occured. Please try again later");
  }
};

export const deleteRole = async (id) => {
  try {
    const response = (await axios.delete(`/user-access/deleteRole/${id}`)).data;
    if (response.error) {
      errorToast(response.error);
      return false;
    }
    successToast(response.message);
    return true;
  } catch (error) {
    console.log("error deleting Role", error);
    return errorToast("An error occured. Please try again later");
  }
};

// Permissions API Calls
export const fetchPermissions = async () => {
  try {
    const response = (await axios.get(`/user-access/fetchPermissions`)).data;
    if (response.error) {
      return errorToast(response.error);
    }
    return response.permissions;
  } catch (error) {
    console.log("error fetching permissions", error);
    return errorToast("An error occured. Please try again later");
  }
};

export const addPermission = async (permission) => {
  try {
    const response = (
      await axios.post(`/user-access/addPermission`, permission)
    ).data;
    if (response.error) {
      errorToast(response.error);
      return false;
    }
    successToast(response.message);
    return true;
  } catch (error) {
    console.log("error adding permission", error);
    return errorToast("An error occured. Please try again later");
  }
};

export const updatePermission = async (permission) => {
  try {
    const response = (
      await axios.put(`/user-access/updatePermission`, permission)
    ).data;
    if (response.error) {
      return errorToast(response.error);
    }
    return successToast(response.message);
  } catch (error) {
    console.log("error updating permission", error);
    return errorToast("An error occured. Please try again later");
  }
};

export const deletePermission = async (id) => {
  try {
    const response = (await axios.delete(`/user-access/deletePermission/${id}`))
      .data;
    if (response.error) {
      errorToast(response.error);
      return false;
    }
    successToast(response.message);
    return true;
  } catch (error) {
    console.log("error deleting permission", error);
    return errorToast("An error occured. Please try again later");
  }
};
