import styles from "../styles/layouts/projectLayout.module.css";

import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router";

import Header from "../components/header";
import { LoadingComponent } from "../components/loading";
import NavigationItem from "../components/navigationItem";

import { useAuth } from "../contexts/authContext";
import { useProject } from "../contexts/projectContext";

import { fetchProjects, logoutUser } from "../services/api";

import Icon from "../assets/appicons/icon.svg";
import { NotificationPane } from "../components/notificationPane";
import { LogoutConfirmationBox } from "../components/confirmationBox";

export default function ProjectLayout() {
  const { project, setProject } = useProject();
  const { user, logout } = useAuth();

  const navigate = useNavigate();

  const links = [
    {
      icon: "fal fa-grid-2",
      activeIcon: "fas fa-grid-2",
      link: "/dashboard",
      name: "Dashboard",
    },
    {
      icon: "fal fa-list-check",
      activeIcon: "fas fa-list-check",
      link: "/tasks",
      name: "Tasks",
    },
    {
      icon: "fal fa-messages",
      activeIcon: "fas fa-messages",
      link: "/discussions",
      name: "Discussions",
    },
    {
      icon: "fal fa-calendar",
      activeIcon: "fas fa-calendar",
      link: "/meetings",
      name: "Meetings",
    },
    {
      icon: "fal fa-users",
      activeIcon: "fas fa-users",
      link: "/team",
      name: "Team",
    },
    {
      icon: "fal fa-folder",
      activeIcon: "fas fa-folder-open",
      link: "/documents",
      name: "Documents",
    },
    {
      icon: "fal fa-gear",
      activeIcon: "fas fa-gear",
      link: "/project-settings",
      name: "Project Settings",
    },
  ];

  const [isNotificationActive, setIsNotificationActive] = useState(false);

  const [userProjects, setUserProjects] = useState([]);
  const [isProjectLoading, setIsProjectLoading] = useState(true);

  const loadUserProjects = async () => {
    try {
      const projectData = await fetchProjects(user?.id);
      setUserProjects(projectData);
    } catch (error) {
      console.error("Failed to load projects:", error);
      setUserProjects([]); // fallback to empty
    } finally {
      setIsProjectLoading(false);
    }
  };

  useEffect(() => {
    loadUserProjects();
  }, []);

  function handleSwitchProject(project) {
    setProject(project);
    navigate(`/${project.projectId}/dashboard`);
  }

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  return (
    <main className={styles.projectLayout}>
      <section className={styles.navigation}>
        <div className={styles.navigationLogo}>
          <img src={Icon} alt="logo" />
        </div>

        <nav>
          <p className={styles.title}>Navigation</p>
          {links.map((link, idx) => (
            <NavigationItem
              key={idx}
              icon={link.icon}
              activeIcon={link.activeIcon}
              name={link.name}
              link={`/${project?.projectId}${link.link}`}
              end={link.name === "Project Settings" ? false : true}
            />
          ))}
        </nav>

        <div className={styles.activeProjects}>
          <p className={styles.title}>Active Projects</p>

          <div className={styles.projects}>
            {isProjectLoading && <LoadingComponent width={30} height={30} />}

            {!isProjectLoading && (
              <div className={styles.project}>
                <h4 style={{ fontWeight: 600 }}>{project?.projectName}</h4>
              </div>
            )}

            <hr />

            {userProjects &&
              userProjects
                .slice(0, 6)
                .filter((p) => p.projectId !== project?.projectId)
                .map((p) => {
                  const isActive = p.projectId === project?.projectId;
                  return (
                    <div
                      key={p.projectId}
                      className={styles.project}
                      onClick={() => handleSwitchProject(p)}
                    >
                      <h4 style={{ fontWeight: isActive ? 600 : 400 }}>
                        {p.projectName}
                      </h4>
                    </div>
                  );
                })}
            <div
              className={styles.project}
              onClick={() => navigate("/all-projects")}
            >
              <h4 style={{ fontWeight: 400 }}>
                <i className="fal fa-arrow-left"></i> All Projects
              </h4>
            </div>
          </div>
        </div>

        <button className={styles.logoutBtn} onClick={() => setIsLoggingOut(true)}>
          <i className="fal fa-arrow-right-from-bracket"></i>
          <p>Logout</p>
        </button>
      </section>

      <section className={styles.mainLayout}>
        <Header
          user={user}
          isNotificationActive={isNotificationActive}
          toggleNotification={() =>
            setIsNotificationActive(!isNotificationActive)
          }
        />

        <section className={styles.content}>
          <Outlet />
        </section>

        <NotificationPane
          isActive={isNotificationActive}
          onClose={() => setIsNotificationActive(false)}
        />

        {isLoggingOut &&
          <LogoutConfirmationBox onCancel={() => setIsLoggingOut(false)} onLogout={logout} />
        }
      </section>
    </main>
  );
}
