import styles from "../../styles/app/client/dashboard.module.css";

import { Fragment, useEffect, useRef, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { UserAvatarWithStatus } from "../../components/avatarStack";
import { ViewAllBtn } from "../../components/button";
import { Priority } from "../../components/priority";
import { StatusComponent } from "../../components/status";
import { UserCard } from "../../components/userCard";

import {
  formatDate,
  formatDateTime,
  formatFileSize,
} from "../../utils/conversions";
import { getFileIcon, getFileType } from "../../utils/fileManagement";

import { useNavigate, useParams } from "react-router";
import { useAuth } from "../../contexts/authContext";
import {
  fetchMilestones,
  fetchProject,
  fetchProjectActivies,
  fetchprojectMembers,
  fetchProjectTasks,
  fetchRecentFiles,
  fetchRecentMessages,
} from "../../services/api";
import { LoadingComponent } from "../../components/loading";
import { EmptyComponent, ErrorComponent } from "../../components/error";

const TeamMember = ({ user }) => {
  return (
    <div className={styles.teamMember}>
      <div className={styles.topRow}>
        <UserAvatarWithStatus user={user} />
        <div className={styles.info}>
          <h4>{user.displayName}</h4>
          <p className={styles.designation}>{user.jobTitle}</p>
          <span className={styles.department}>{user.department}</span>
        </div>
      </div>
      <div className={styles.actions}>
        <a href={`mailto:${user.mail}`} className={styles.message}>
          <i className="fal fa-envelope"></i>Email
        </a>
        <button className={styles.invite}>
          <i className="fal fa-comment"></i> Chat
        </button>
      </div>
    </div>
  );
};

const AttachedFile = ({ name, size, createdBy, dateCreated }) => {
  return (
    <div className={styles.attachedFile}>
      <i className={styles.fileIcon + " " + getFileIcon(name)}></i>
      <div className={styles.fileInfo}>
        <h4>{name}</h4>
        <p>
          {getFileType(name)} <i className="fas fa-circle"></i>{" "}
          {formatFileSize(size)}
        </p>
        <span>
          Uploaded by {createdBy?.displayName} on {formatDateTime(dateCreated)}
        </span>
      </div>
      <button className={styles.downloadBtn} title="Download">
        <i className="fal fa-arrow-down-to-line"></i>
      </button>
    </div>
  );
};

const RecentMessage = ({ item }) => {
  return (
    <div className={styles.recentMessage}>
      <UserAvatarWithStatus user={item.sender} />
      <div className={styles.messageInfo}>
        <div className={styles.top}>
          <h4>{item.sender?.displayName}</h4>
          <span>{formatDateTime(item.timeSent)}</span>
        </div>
        <p>{item.message}</p>
      </div>
    </div>
  );
};

const RecentActivity = ({ date, actor, details }) => {
  const [showCard, setShowCard] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef(null);

  function handleMouseEnter(e) {
    const { clientX, clientY } = e;

    timeoutRef.current = setTimeout(() => {
      setMousePos({ x: clientX, y: clientY });
      setShowCard(true);
    }, 1500); // 2 seconds
  }

  function handleMouseLeave(e) {
    clearTimeout(timeoutRef.current);
    setShowCard(false);
  }

  return (
    <div className={styles.activity}>
      <div className={styles.timeline}>
        <i className="fas fa-circle"></i>
        <span>{formatDateTime(date)}</span>
      </div>
      <div className={styles.content}>
        {showCard && <UserCard mousePos={mousePos} user={actor} />}
        <p>
          <span
            onMouseEnter={handleMouseEnter}
            onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
            onMouseLeave={handleMouseLeave}
          >
            {actor.displayName}
          </span>{" "}
          {details}
        </p>
      </div>
    </div>
  );
};

const Milestone = ({ milestone, statusData }) => {
  const status = statusData.toLowerCase();
  return (
    <div className={styles.milestone}>
      <i
        className={
          status === "completed"
            ? "fal fa-circle-check"
            : status === "in progress"
              ? "fal fa-clock"
              : status === "upcoming"
                ? "far fa-circle-dot"
                : status === "delayed"
                  ? "fal fa-calendar-clock"
                  : "fal fa-circle"
        }
        style={{
          color:
            status === "completed"
              ? "var(--completed)"
              : status === "in progress"
                ? "var(--in-progress)"
                : status === "upcoming"
                  ? "var(--upcoming)"
                  : status === "delayed"
                    ? "var(--delayed)"
                    : "var(--todo)",
        }}
      ></i>
      <div className={styles.info}>
        <h4>{milestone.title}</h4>
        <div className={styles.dueDate}>
          <i className="fal fa-calendar"></i>
          <span>{formatDate(milestone.dueDate)}</span>
        </div>
      </div>
      <div className={styles.milestoneStatus}>
        <StatusComponent item={milestone} />
      </div>
    </div>
  );
};

const MilestoneDetail = ({ milestone, statusData }) => {
  const status = statusData.toLowerCase();
  return (
    <div className={styles.milestoneDetail}>
      <i
        className={
          status === "completed"
            ? "fal fa-circle-check"
            : status === "in progress"
              ? "fal fa-clock"
              : status === "upcoming"
                ? "far fa-circle-dot"
                : status === "delayed"
                  ? "fal fa-calendar-clock"
                  : "fal fa-circle"
        }
        style={{
          color:
            status === "completed"
              ? "var(--completed)"
              : status === "in progress"
                ? "var(--in-progress)"
                : status === "upcoming"
                  ? "var(--upcoming)"
                  : status === "delayed"
                    ? "var(--delayed)"
                    : "var(--todo)",
        }}
      ></i>
      <div className={styles.info}>
        <div className={styles.top}>
          <h4>{milestone.title}</h4>
          <StatusComponent item={milestone} />
        </div>

        <div className={styles.description}>
          <p>{milestone.details}</p>
        </div>

        <div className={styles.dueDate}>
          <i className="fal fa-calendar"></i>
          <span>{formatDate(milestone.dueDate)}</span>
        </div>
      </div>
    </div>
  );
};

const MileStoneViewer = ({ data, onClose }) => {
  return (
    <section className={styles.milestoneViewerLayout}>
      <div className={styles.milestoneViewer}>
        <div className={styles.top}>
          <h3>Milestones</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <i className="fal fa-times"></i>
          </button>
        </div>

        <div className={styles.content}>
          {data.length ? data.map((milestone) => (
            <MilestoneDetail key={milestone.id} milestone={milestone} statusData={milestone.status} />
          )) : <EmptyComponent title={"No milestones found"} message={"No milestones found or created yet"} />}
        </div>
      </div>
    </section>
  )
}

const generatePieChartData = (tasks) => {
  const statusCounts = {
    completed: 0,
    "in progress": 0,
    todo: 0,
    delayed: 0,
  };

  const now = new Date();

  tasks.forEach((task) => {
    const status = task.status.toLowerCase();
    const due = new Date(task.dueDate);

    const isCompleted = status === "completed";
    const isDelayed = due < now && !isCompleted;

    if (isCompleted) {
      statusCounts.completed += 1;
    } else if (isDelayed) {
      statusCounts.delayed += 1;
    } else if (statusCounts.hasOwnProperty(status)) {
      statusCounts[status] += 1;
    }
  });

  return [
    { name: "Completed", value: statusCounts.completed },
    { name: "In Progress", value: statusCounts["in progress"] },
    { name: "To-do", value: statusCounts.todo },
    { name: "Delayed", value: statusCounts.delayed },
  ];
};

const Task = ({ task }) => {
  return (
    <div className={styles.task}>
      <div className={styles.leftCol}>
        <h4>{task.title}</h4>
        <StatusComponent item={task} />
      </div>
      <div className={styles.rightCol}>
        <Priority priorityData={task.priority} />
        <div className={styles.duedate}>
          <i className="fal fa-calendar"></i>
          <span>{formatDate(task.dueDate)}</span>
        </div>
      </div>
    </div>
  );
};

export default function ProjectDashboard() {
  const { user } = useAuth();
  const projectId = useParams().projectId;

  const [projectLoading, setProjectLoading] = useState(true);
  const [milestoneLoading, setMilestoneLoading] = useState(true);
  const [taskLoading, setTaskLoading] = useState(true);
  const [teamMembersLoading, setTeamMembersLoading] = useState(true);
  const [filesLoading, setFilesLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);

  const [projectData, setprojectData] = useState({});
  const [tasksData, settasksData] = useState([]);
  const [milestonesData, setmilestonesData] = useState([]);
  const [membersData, setmembersData] = useState([]);
  const [documentsData, setdocumentsData] = useState([]);
  const [messagesData, setMessagesData] = useState([]);
  const [recentActivityData, setrecentActivityData] = useState([]);

  async function fetchProjectData() {
    const projectRes = await fetchProject(projectId);
    setprojectData(projectRes);
    setProjectLoading(false);
    const tasksRes = await fetchProjectTasks(projectId);
    settasksData(tasksRes);
    setTaskLoading(false);
    const milestonesRes = await fetchMilestones(projectId);
    setmilestonesData(milestonesRes);
    setMilestoneLoading(false);
    const membersRes = await fetchprojectMembers(projectId);
    setmembersData(membersRes);
    setTeamMembersLoading(false);
    const documentsRes = await fetchRecentFiles(projectId);
    setdocumentsData(documentsRes);
    setFilesLoading(false);
    const messagesRes = await fetchRecentMessages(projectId, user.id);
    setMessagesData(messagesRes);
    setMessagesLoading(false);
    const recentActivityRes = await fetchProjectActivies(projectId);
    setrecentActivityData(recentActivityRes);
    setActivityLoading(false);
  }

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const COLORS = ["#0087c8", "#c5ecff", "#BABDCC", "#999EB2"];

  const pieData = generatePieChartData(tasksData);
  const emptyPieData = [
    {
      name: "Empty",
      value: 1,
    },
  ];

  function CustomPieToolTip({ payload, active }) {
    if (active && tasksData.length > 0) {
      return (
        <div className={styles.tooltip}>
          <h4 className="label" color={"var(--color)"}>
            Tasks {payload[0]?.name}
          </h4>
          <p className="label">{`${payload[0]?.value}`}</p>
        </div>
      );
    } else {
      return (
        <div className={styles.tooltip}>
          <h4 className="label" color={"var(--color)"}>
            Empty
          </h4>
        </div>
      );
    }

    return null;
  }

  const [isViewingMilestones, setIsViewingMilestones] = useState(false);

  // Calculate % complete
  const totalMilestones = milestonesData.length;
  const completedMilestones = milestonesData.filter(
    (m) => m.status.toLowerCase() === "completed" || m.isCompleted === 1
  ).length;

  const progressPercent =
    totalMilestones > 0
      ? Math.round((completedMilestones / totalMilestones) * 100)
      : 0;
  return (
    <section className={styles.dashboardLayout}>
      <section className={styles.overview}>
        <div className={styles.projectOverview}>
          <div className={styles.cardTitle}>
            <i className="fal fa-memo-circle-info"></i>
            <h3>Project Overview</h3>
          </div>
          {projectLoading && <LoadingComponent width={30} height={30} />}
          {!projectLoading && projectData.projectName && (
            <Fragment>
              <div className={styles.content}>
                <h4>{projectData.projectName}</h4>
                <p className={styles.projectDescription}>
                  {projectData.projectDescription}
                </p>
              </div>
              <div className={styles.metaData}>
                <div className={styles.data}>
                  <h4 className={styles.title}>Category: </h4>
                  <p>{projectData.projectCategory}</p>
                </div>

                <div className={styles.data}>
                  {projectData?.status && (
                    <StatusComponent item={projectData} />
                  )}
                </div>
              </div>
            </Fragment>
          )}
        </div>

        <div className={styles.projectCard}>
          <div className={styles.cardTitle}>
            <i className="fal fa-calendar"></i>
            <h3>Timeline</h3>
          </div>
          {projectLoading && <LoadingComponent width={30} height={30} />}
          {!projectLoading && (
            <div className={styles.content}>
              <div className={styles.info}>
                <h4>Start Date:</h4>
                <span>{projectData.startDate}</span>
              </div>

              <div className={styles.info}>
                <h4>Actual Start Date:</h4>
                <span>
                  {projectData.actualStartDate
                    ? projectData.actualStartDate
                    : "Not Started"}
                </span>
              </div>

              <div className={styles.info}>
                <h4>Due Date:</h4>
                <span>{projectData.dueDate}</span>
              </div>

              <div className={styles.info}>
                <h4>End Date:</h4>
                <span>
                  {projectData.endDate ? projectData.endDate : "Not Ended"}
                </span>
              </div>
              <div className={styles.info}>
                <h4>Progress:</h4>
                <span>65%</span>
              </div>
            </div>
          )}

          {!projectLoading && (
            <div className={styles.progressBar}>
              <div className={styles.progress} style={{ width: "65%" }}></div>
            </div>
          )}
        </div>

        <div className={styles.projectCard}>
          <div className={styles.cardTitle}>
            <i className="fal fa-user"></i>
            <h3>Client Information</h3>
          </div>
          <div className={styles.content}>
            <div className={styles.info}>
              <h4>Name</h4>
              <span>{projectData.client?.displayName}</span>
            </div>

            {projectData.client?.website && (
              <div className={styles.info}>
                <h4>Website</h4>
                <span>{projectData.client?.website}</span>
              </div>
            )}

            <div className={styles.info}>
              <h4>Primary Contact Name</h4>
              <span>
                {projectData.client?.primaryContactPhone
                  ? projectData.client?.primaryContactName
                  : "Not Available"}
              </span>
            </div>

            {projectData.client?.website && (
              <div className={styles.info}>
                <h4>Primary Email</h4>
                <span>
                  {projectData.client?.primaryContactMail
                    ? projectData.client?.primaryContactMail
                    : "Not Available"}
                </span>
              </div>
            )}

            <div className={styles.info}>
              <h4>Primary Phone</h4>
              <span>
                {projectData.client?.primaryContactPhone
                  ? projectData.client?.primaryContactPhone
                  : "Not Available"}
              </span>
            </div>
          </div>
          {/* <div className={styles.progressBar}>
                        <div className={styles.bar}>
                            <div className={styles.progress}></div>
                        </div>
                    </div> */}
        </div>
      </section>

      <section className={styles.tasksOverview}>
        <div className={styles.milestoneCard}>
          <div className={styles.top}>
            <div className={styles.title}>
              <i className="fal fa-bullseye-arrow"></i>
              <h3>Milestone</h3>
            </div>
            <button className={styles.viewAllbtn} onClick={() => setIsViewingMilestones(true)}>
              <p>View All</p>
              <i className="fal fa-arrow-up-right-from-square"></i>
            </button>
          </div>

          {milestoneLoading && <LoadingComponent width={30} height={30} />}

          {!milestoneLoading && milestonesData.length !== 0 && (
            <div className={styles.milestoneOverview}>
              <div className={styles.progressBar}>
                <div className={styles.info}>
                  <p>Overall Progress</p>
                  <span>{progressPercent}%</span>
                </div>
                <div className={styles.progress}>
                  <div className={styles.bar} style={{ width: `${progressPercent}%` }}></div>
                </div>
              </div>
            </div>
          )}

          {!milestoneLoading && (
            <div className={styles.content}>
              {milestonesData.slice(0, 4).map((milestone, idx) => {
                const status = milestone.status.toLowerCase();
                const now = new Date();
                const due = new Date(milestone.dueDate);
                const start = new Date(milestone.startDate);
                const oneDayFromNow = new Date(
                  now.getTime() + 24 * 60 * 60 * 1000
                ); // 1 day ahead

                const isCompleted = status === "completed";
                const isUpcoming =
                  start > now && start <= oneDayFromNow && !isCompleted;

                const computedStatus =
                  due < now && !isCompleted
                    ? "delayed"
                    : isUpcoming
                      ? "upcoming"
                      : status;

                return (
                  <Milestone
                    key={idx}
                    idx={idx}
                    milestone={milestone}
                    statusData={computedStatus}
                  />
                );
              })}
            </div>
          )}

          {!milestoneLoading && milestonesData.length === 0 && (
            <div
              style={{
                width: "100%",
                height: 350,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ErrorComponent
                title={"No Milestones"}
                message={"No milestones found or created yet"}
              />
            </div>
          )}
        </div>

        <div className={styles.taskChartCard}>
          <div className={styles.top}>
            <div className={styles.title}>
              <i className="fal fa-chart-line"></i>
              <h3>Tasks Overview</h3>
            </div>
          </div>
          {taskLoading && <LoadingComponent width={30} height={30} />}
          {!taskLoading && (
            <div className={styles.content}>
              <div className={styles.chart}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={tasksData.length !== 0 ? pieData : emptyPieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      innerRadius={60}
                      fontSize={12}
                      fontWeight={500}
                      labelLine={true}
                      dataKey="value"
                      stroke="none"
                    >
                      {tasksData.length !== 0 &&
                        pieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      {tasksData.length === 0 && <Cell fill={"#cccccc"} />}
                    </Pie>
                    <Tooltip content={<CustomPieToolTip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className={styles.info}>
                <span className={styles.title}>Total Tasks</span>
                <h2>{tasksData.length}</h2>

                <div className={styles.legendContainer}>
                  {pieData.map((task, idx) => (
                    <div key={idx} className={styles.legend}>
                      <div
                        className={styles.color}
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <h4>{task.name}</h4>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.recentTaskPreview}>
          <div className={styles.top}>
            <div className={styles.title}>
              <i className="fal fa-tasks"></i>
              <h3>Recent Tasks</h3>
            </div>
            <ViewAllBtn link={`/${projectId}/tasks`} />
          </div>
          <div className={styles.content}>
            {taskLoading && <LoadingComponent width={30} height={30} />}
            {!taskLoading &&
              tasksData
                .slice(0, 4)
                .map((task, idx) => <Task key={idx} task={task} />)}
            {!taskLoading && tasksData.length === 0 && (
              <div
                style={{
                  width: "100%",
                  height: 300,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <ErrorComponent title={"No Tasks"} message={"No Tasks Found"} />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className={styles.dualLayout}>
        <section className={styles.leftCol}>
          <div className={styles.layoutCard}>
            <div className={styles.top}>
              <div className={styles.title}>
                <i className="fal fa-users"></i>
                <h3>Team Members</h3>
              </div>
              <ViewAllBtn link={`/${projectId}/team`} />
            </div>
            <div className={styles.content}>
              {teamMembersLoading && (
                <LoadingComponent width={30} height={30} />
              )}
              {!teamMembersLoading &&
                membersData
                  .slice(0, 4)
                  .map((user, idx) => <TeamMember key={idx} user={user} />)}
            </div>
          </div>

          <div className={styles.layoutCard}>
            <div className={styles.top}>
              <div className={styles.title}>
                <i className="fal fa-files"></i>
                <h3>File Attachments</h3>
              </div>
              {/* <ViewAllBtn link={`/${projectId}/documents`} /> */}
            </div>
            {/* <div className={styles.content}>
              {filesLoading && <LoadingComponent width={30} height={30} />}
              {!filesLoading &&
                documentsData
                  .slice(0, 5)
                  .map((file, idx) => <AttachedFile key={idx} {...file} />)}
              {!filesLoading && !documentsData.length && (
                <div
                  style={{
                    width: "100%",
                    height: 350,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <EmptyComponent
                    title="No recent files"
                    message="There are no files uploaded yet"
                  />
                </div>
              }
            </div> */}
            <div className={styles.content} style={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <h1 style={{ fontSize: '3rem', color: '#999999' }}>Coming Soon</h1>
            </div>
          </div>
        </section>

        <section className={styles.rightCol}>
          <div className={styles.layoutCard}>
            <div className={styles.top}>
              <div className={styles.title}>
                <i className="fal fa-comment"></i>
                <h3>Recent Messages</h3>
              </div>
              <ViewAllBtn link={`/${projectId}/discussions`} />
            </div>
            <div className={styles.content}>
              {messagesLoading && <LoadingComponent width={30} height={30} />}
              {!messagesLoading &&
                messagesData &&
                messagesData
                  .slice(0, 5)
                  .map((message, idx) => (
                    <RecentMessage key={idx} item={message} />
                  ))}
              {!messagesLoading && !messagesData.length && (
                <div
                  style={{
                    width: "100%",
                    height: 350,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <EmptyComponent
                    title="No recent messages"
                    message="You don't have messages yet"
                  />
                </div>
              )}
            </div>
          </div>

          <div className={styles.layoutCard}>
            <div className={styles.top}>
              <div className={styles.title}>
                <i className="fal fa-wave-pulse"></i>
                <h3>Recent Activities</h3>
              </div>
            </div>
            <div
              className={`${styles.content} ${styles.recentActivity}`}
              style={{ gap: 0 }}
            >
              {activityLoading && <LoadingComponent width={30} height={30} />}
              {!activityLoading &&
                recentActivityData
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .slice(0, 7)
                  .map((activities, idx) => (
                    <RecentActivity key={idx} {...activities} />
                  ))}
              {!activityLoading && !recentActivityData.length && (
                <div
                  style={{
                    width: "100%",
                    height: 350,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <ErrorComponent
                    title={"No Activity Found"}
                    message={"There has been no activity yet"}
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      </section>

      {isViewingMilestones &&
        <MileStoneViewer data={milestonesData} onClose={() => setIsViewingMilestones(false)} />
      }
    </section>
  );
}
