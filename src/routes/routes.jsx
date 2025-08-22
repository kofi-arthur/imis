import { Route, Routes } from "react-router";

// pages
import LandingPage from "../app/landingPage";

// layouts
import AuthLayout from "../layouts/authLayout";
import ProjectLayout from "../layouts/projectLayout";
import ProjectSettings from "../layouts/projectSetting";

// auth
import EmailSent from "../app/auth/emailSent";
import ForgotPassword from "../app/auth/forgotPassword";
import Login from "../app/auth/login";
import ResetPassword from "../app/auth/resetPassword";
import Signup from "../app/auth/signup";

// client~
import AllProjects from "../app/client/allProjects.jsx";
import ProjectDashboard from "../app/client/dashboard";
import ProjectDiscussions from "../app/client/discussions";
import Meetings from "../app/client/meetings.jsx";
import Team from "../app/client/team.jsx";
import Documents from "../app/client/documents.jsx";
import ProjectTasks from "../app/client/tasks";

// project settings
import General from "../app/client/projectSettings/general";
import TeamMembers from "../app/client/projectSettings/members";
import ActivityLogs from "../app/client/projectSettings/activityLogs.jsx";
import Backup from "../app/client/projectSettings/backup.jsx";

import ProtectedRoute from "./protectedRoute.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/email-sent" element={<EmailSent />} />
      </Route>

      <Route
        element={
          <ProtectedRoute
            allowedRoles={["user", "guest", "admin"]}
            redirectPath="/login"
          />
        }
      >
        <Route path="/:projectId" element={<ProjectLayout />}>
          <Route path="dashboard" element={<ProjectDashboard />} />
          <Route path="tasks" element={<ProjectTasks />} />
          <Route path="discussions" element={<ProjectDiscussions />} />
          <Route path="meetings" element={<Meetings />} />
          <Route path="team" element={<Team />} />
          <Route path="documents" element={<Documents />} />

          <Route path="project-settings" element={<ProjectSettings />}>
            <Route index element={<General />} />
            <Route path="project-members" element={<TeamMembers />} />
            <Route path="activity-logs" element={<ActivityLogs />} />
            <Route path="backup" element={<Backup />} />
          </Route>
        </Route>

        <Route path="/all-projects" element={<AllProjects />} />

        {/* admin protected routes */}
        {/* <Route
          element={
            <ProtectedRoute
              allowedRoles={["admin"]}
              redirectTo="/admin/login"
            />
          }
        >
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/manage-users" element={<ManageUsers />} />
          <Route path="/admin/system-settings" element={<SystemSettings />} />
        </Route> */}
      </Route>
    </Routes>
  );
}
