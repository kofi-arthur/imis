import styles from "../../styles/app/client/tasks.module.css";

import { useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import AvatarStack, { Avatar } from "../../components/avatarStack";
import { Dropdown } from "../../components/dropdown";
import { ErrorComponent } from "../../components/error";
import { Priority } from "../../components/priority";
import { StatusComponent } from "../../components/status";

import {
  formatDate,
  formatDateTime,
  readISODate,
} from "../../utils/conversions";

import { LoadingComponent } from "../../components/loading";
import { useAuth } from "../../contexts/authContext";
import { useProject } from "../../contexts/projectContext";
import { useSocket } from "../../contexts/socketContext";
import {
  createTask,
  deleteTask,
  fetchComments,
  fetchprojectMembers,
  fetchProjectTasks,
  updateTaskDetails,
} from "../../services/api";

let selectedTask;

function useTaskManager() {
  const { project } = useProject();
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [selectedMode, setSelectedMode] = useState(null);

  // Fetch tasks internally
  useEffect(() => {
    async function fetchTasks() {
      try {
        const data = await fetchProjectTasks(project.projectId);
        setTasks(data.filter((task) => task.parentId === null));
        setSubtasks(data.filter((task) => task.parentId !== null));
      } catch (err) {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTasks();
  }, []);

  const updateTask = async (updatedTask) => {
    const res = await updateTaskDetails(updatedTask);
    if (res === false) {
      return;
    }
    setTasks((prev) =>
      prev.map((task) =>
        task.taskId === updatedTask.taskId ? { ...task, ...updatedTask } : task
      )
    );
  };

  const addTask = async (newTask) => {
    const res = await createTask(newTask);
    if (res === false) {
      return;
    } else {
      setTasks((prev) => [...prev, newTask]);
    }
  };

  const addSubtask = async (newSubtask) => {
    const res = await createTask(newSubtask);
    if (res === false) {
      return;
    } else {
      setSubtasks((prev) => [...prev, newSubtask]);
    }
  };

  const updateSubtask = async (updatedSubtask) => {
    const res = await updateTaskDetails(updatedSubtask);
    if (res === false) {
      return;
    } else {
      setSubtasks((prev) =>
        prev.map((subtask) =>
          subtask.taskId === updatedSubtask.taskId
            ? { ...subtask, ...updatedSubtask }
            : subtask
        )
      );
    }
  };

  const removeTask = async (e) => {
    const res = await deleteTask(e);
    if (res === false) {
      return;
    } else {
      setTasks((prev) => prev.filter((task) => task.taskId !== e));
      return;
    }
  };

  const removeSubtask = async (e) => {
    const res = await deleteTask(e);
    if (res === false) {
      return;
    } else {
      setSubtasks((prev) => prev.filter((subtask) => subtask.taskId !== e));
    }
  };

  return {
    user,
    tasks,
    subtasks,
    isLoading,
    error,
    isCreatingTask,
    setIsCreatingTask,
    selectedMode,
    setSelectedMode,
    updateTask,
    addTask,
    removeTask,
    addSubtask,
    updateSubtask,
    removeSubtask,
  };
}

const DropDownComponent = ({
  ref,
  isSelectingStatusFilter,
  selectedOption,
  onDropdownClick,
  onSelect,
  options,
}) => {
  function handleSelect(option) {
    onSelect(option);
  }
  return (
    <div ref={ref} className={styles.dropdownContainer}>
      <div className={styles.selectedOption} onClick={onDropdownClick}>
        <p>{selectedOption}</p>
        <i
          className={"fal fa-chevron-down"}
          style={{
            transform: isSelectingStatusFilter
              ? "rotate(180deg)"
              : "rotate(0deg)",
          }}
        ></i>
      </div>
      <div
        className={`${styles.dropdown} ${isSelectingStatusFilter && styles.active
          }`}
      >
        {options.map((option, idx) => (
          <div
            key={idx}
            className={styles.option}
            onClick={() => handleSelect(option)}
          >
            {selectedOption === option && <i className="fal fa-check"></i>}
            <p style={{ fontWeight: selectedOption === option ? "600" : "" }}>
              {option}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const TaskContextMenu = ({
  isSubTask,
  user,
  ref,
  menuPosition,
  closeContextMenu,
  editTask,
  duplicateTask,
  duplicateSubtask,
  newSubTask,
  updateStatus,
  updatePriority,
  updateSubtaskStatus,
  updateSubtaskPriority,
  deleteTask,
  deleteSubtask,
}) => {
  const item = isSubTask ? "Subtask" : "Task";

  // modify these so that subtasks are taken into account
  // task owners and assignees can modify parent tasks
  // task owners and subtask-assignees can modify subtasks
  // parent-taks assignees cannot modify subtasks
  const isMember = selectedTask.assignedTo.some(member => member.id === user.id);
  const isOwner = selectedTask.createdBy.id === user.id;

  function handleUpdateStatus(e) {
    selectedTask?.parentId !== null
      ? updateSubtaskStatus(e)
      : updateStatus(e);
    closeContextMenu();
  }

  return (
    <div
      ref={ref}
      className={styles.contextMenu}
      style={{ left: menuPosition?.x, top: menuPosition?.y }}
    >
      <section className={styles.contextMenuItems}>
        <div
          className={styles.item}
          onClick={() => {
            editTask();
            closeContextMenu();
          }}
        >
          <i className="fal fa-edit"></i>
          <p>Edit {item}</p>
        </div>
        <div
          className={styles.item}
          onClick={() => {
            selectedTask?.parentId === null
              ? duplicateTask()
              : duplicateSubtask();
            closeContextMenu();
          }}
        >
          <i className="fal fa-copy"></i>
          <p>Duplicate {item}</p>
        </div>
        <div
          className={styles.item}
          onClick={() => {
            newSubTask(), closeContextMenu();
          }}
        >
          <i className="fal fa-plus"></i>
          <p>Add Subtask</p>
        </div>
      </section>

      <section className={styles.contextMenuItems}>
        <span className={styles.title}>Status</span>
        <div
          className={`${styles.item} ${(!isMember && !isOwner) && styles.disabled}`}
          onClick={() => handleUpdateStatus("Completed")}
        >
          <i
            className="fal fa-check-circle"
            style={{ color: "var(--completed)" }}
          ></i>
          <p>Completed</p>
        </div>
        <div
          className={`${styles.item} ${(!isMember && !isOwner) && styles.disabled}`}
          onClick={() => handleUpdateStatus("In Progress")}
        >
          <i
            className="fal fa-clock"
            style={{ color: "var(--in-progress)" }}
          ></i>
          <p>In Progress</p>
        </div>
        <div
          className={`${styles.item} ${(!isMember && !isOwner) && styles.disabled}`}
          onClick={() => handleUpdateStatus("Todo")}
        >
          <i className="fal fa-circle" style={{ color: "var(--todo)" }}></i>
          <p>Todo</p>
        </div>
      </section>

      <section className={styles.contextMenuItems}>
        <span className={styles.title}>Priority</span>
        <div
          className={styles.item}
          onClick={() => {
            selectedTask?.parentId === null
              ? updatePriority("High")
              : updateSubtaskPriority("High");
            closeContextMenu();
          }}
        >
          <i className="fas fa-circle" style={{ color: "var(--high)" }}></i>
          <p>High</p>
        </div>
        <div
          className={styles.item}
          onClick={() => {
            selectedTask?.parentId === null
              ? updatePriority("Medium")
              : updateSubtaskPriority("Medium");
            closeContextMenu();
          }}
        >
          <i
            className="fas fa-circle"
            style={{ color: "var(--medium-priority)" }}
          ></i>
          <p>Medium</p>
        </div>
        <div
          className={styles.item}
          onClick={() => {
            selectedTask?.parentId === null
              ? updatePriority("Low")
              : updateSubtaskPriority("Low");
            closeContextMenu();
          }}
        >
          <i className="fas fa-circle" style={{ color: "var(--low)" }}></i>
          <p>Low</p>
        </div>
      </section>

      <section className={styles.contextMenuItems}>
        <div
          className={styles.item}
          onClick={() => {
            selectedTask?.parentId === null
              ? deleteTask(selectedTask?.taskId)
              : deleteSubtask(selectedTask?.taskId);
            closeContextMenu();
          }}
        >
          <i className="fal fa-trash-can" style={{ color: "crimson" }}></i>
          <p>Delete {item}</p>
        </div>
      </section>
    </div>
  );
};

const Task = ({
  task,
  allSubtasks,
  onTaskClick,
  onSubtaskClick,
  onRightClick,
  onSubtaskRightClick,
}) => {
  // fetch subtasks
  const subtasks = allSubtasks.filter((st) => st.parentId === task.taskId);
  const hasSubtasks = subtasks.length > 0;

  // task expansion
  const [isExpanded, setIsExpanded] = useState(false);

  // task progress
  const [completedSubtasks, setCompletedSubtasks] = useState(0);
  const [progress, setProgress] = useState(0);

  function getTaskProgress() {
    if (task.status === "Completed") return 100;
    if (task.status === "In Progress") return 50;
    return 0;
  }

  function getSubtaskCompletionPercentage(subtasks) {
    if (!Array.isArray(subtasks) || subtasks.length === 0) return 0;

    const completedCount = subtasks.filter(
      (subtask) => subtask.status === "Completed"
    ).length;
    return Math.round((completedCount / subtasks.length) * 100);
  }

  function getTotalCompletedSubtasks(subtasks) {
    const completedSubtasks = subtasks.filter(
      (subtask) => subtask.status === "Completed"
    );
    return completedSubtasks.length;
  }

  useEffect(() => {
    if (hasSubtasks) {
      const percentage = getSubtaskCompletionPercentage(subtasks);
      setProgress(percentage);
    } else {
      setProgress(getTaskProgress());
    }

    const completedSubtasksCount = getTotalCompletedSubtasks(subtasks);
    setCompletedSubtasks(completedSubtasksCount);
  }, [subtasks]);

  return (
    <div className={styles.task}>
      <div className={styles.taskData} onContextMenu={onRightClick}>
        {subtasks.length > 0 && (
          <button
            className={styles.expandBtn}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <i
              className="fal fa-chevron-right"
              style={{
                transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
              }}
            ></i>
          </button>
        )}
        <div className={styles.taskInfo}>
          <h4 onClick={() => onTaskClick(task)}>{task.title}</h4>
          <span>{task.description ? task.description : "No description"}</span>
        </div>
        <div className={styles.assignees}>
          <AvatarStack users={task?.assignedTo} maxVisible={5} />
        </div>
        <div className={styles.status}>
          <StatusComponent item={task} />
        </div>
        <div className={styles.priority}>
          <Priority priorityData={task?.priority} />
        </div>
        <div className={styles.dueDate}>
          <i className="fal fa-calendar"></i>
          <p>{formatDateTime(task.dueDate)}</p>
        </div>
        <div className={styles.progressContainer}>
          <div className={styles.progressInfo}>
            {hasSubtasks && (
              <p>
                {completedSubtasks}/{subtasks.length}
              </p>
            )}
            <span>{progress}%</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.bar} style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>

      {isExpanded && subtasks.length > 0 && (
        <div className={styles.subtasksContainer}>
          {subtasks.map((subtask) => {
            return (
              <SubTask
                key={subtask.taskId}
                task={subtask}
                allSubtasks={allSubtasks}
                onSubtaskClick={(sub) => onSubtaskClick(sub)}
                onRightClick={(e, sub) => onSubtaskRightClick(e, sub)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

const SubTask = ({ task, allSubtasks, onSubtaskClick, onRightClick }) => {
  // fetch subtasks
  const subtasks = allSubtasks.filter((st) => st.parentId === task.taskId);
  const hasSubtasks = subtasks.length > 0;

  // subtask expansion
  const [isExpanded, setIsExpanded] = useState(false);

  // subtask progress
  const [completedSubtasks, setCompletedSubtasks] = useState(0);
  const [progress, setProgress] = useState(0);

  function getTaskProgress() {
    if (task.status === "Completed") return 100;
    if (task.status === "In Progress") return 50;
    return 0;
  }

  function getSubtaskCompletionPercentage(subtasks) {
    if (!Array.isArray(subtasks) || subtasks.length === 0) return 0;

    const completedCount = subtasks.filter(
      (subtask) => subtask.status === "Completed"
    ).length;
    return Math.round((completedCount / subtasks.length) * 100);
  }

  function getTotalCompletedSubtasks(subtasks) {
    const completedSubtasks = subtasks.filter(
      (subtask) => subtask.status === "Completed"
    );
    return completedSubtasks.length;
  }

  useEffect(() => {
    if (hasSubtasks) {
      const percentage = getSubtaskCompletionPercentage(subtasks);
      setProgress(percentage);
    } else {
      setProgress(getTaskProgress());
    }

    const completedSubtasksCount = getTotalCompletedSubtasks(subtasks);
    setCompletedSubtasks(completedSubtasksCount);
  }, [subtasks]);

  return (
    <div className={styles.subtask}>
      <div
        className={styles.taskData}
        onContextMenu={(e) => onRightClick(e, task)}
      >
        {subtasks.length > 0 && (
          <button
            className={styles.expandBtn}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <i
              className="fal fa-chevron-right"
              style={{
                transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
              }}
            ></i>
          </button>
        )}
        <div className={styles.taskInfo}>
          <h4 onClick={() => onSubtaskClick(task)}>{task.title}</h4>
          <span>{task.description ? task.description : "No description"}</span>
        </div>
        <div className={styles.assignees}>
          <AvatarStack users={task.assignedTo} maxVisible={5} />
        </div>
        <div className={styles.status}>
          <StatusComponent item={task} />
        </div>
        <div className={styles.priority}>
          <Priority priorityData={task?.priority} />
        </div>
        <div className={styles.dueDate}>
          <i className="fal fa-calendar"></i>
          <p>{formatDateTime(task.dueDate)}</p>
        </div>
        <div className={styles.progressContainer}>
          <div className={styles.progressInfo}>
            {hasSubtasks && (
              <p>
                {completedSubtasks}/{subtasks.length}
              </p>
            )}
            <span>{progress}%</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.bar} style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>

      {isExpanded && subtasks.length > 0 && (
        <div className={styles.subtasksContainer}>
          {subtasks.map((subtask, idx) => {
            return (
              <SubTask
                task={subtask}
                allSubtasks={allSubtasks}
                key={idx}
                onSubtaskClick={(sub) => onSubtaskClick(sub)}
                onRightClick={(e, sub) => onRightClick(e, sub)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

const FilteredTask = ({ tasks, task }) => {
  // subtask context menu
  const menuRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState(null);

  const handleContextMenu = (e) => {
    e.preventDefault();
    setMenuPosition({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    if (menuPosition) {
      const handleClickOutside = (e) => {
        if (menuRef.current && !menuRef.current.contains(e.target)) {
          setMenuPosition(null);
        }
      };

      const handleScroll = () => {
        setMenuPosition(null);
      };

      document.addEventListener("click", handleClickOutside);
      window.addEventListener("contextmenu", handleClickOutside, true); // 'true' captures scroll on any element
      window.addEventListener("scroll", handleScroll, true); // 'true' captures scroll on any element

      return () => {
        document.removeEventListener("click", handleClickOutside);
        window.removeEventListener("contextmenu", handleClickOutside, true);
        window.removeEventListener("scroll", handleScroll, true);
      };
    }
  }, [menuPosition]);

  // fetch subtasks
  const [subtasks, setSubtasks] = useState([]);

  const hasSubtasks = subtasks.length > 0;

  useEffect(() => {
    //Changed filter from SampleTasks to task
    const data = tasks.filter((t) => t.parentId === task.taskId);
    setSubtasks(data);
  }, [task]);

  // task progress
  const [completedSubtasks, setCompletedSubtasks] = useState(0);
  const [progress, setProgress] = useState(0);

  function getTaskProgress() {
    if (task.status === "Completed") return 100;
    if (task.status === "In Progress") return 50;
    return 0;
  }

  function getSubtaskCompletionPercentage(subtasks) {
    if (!Array.isArray(subtasks) || subtasks.length === 0) return 0;

    const completedCount = subtasks.filter(
      (subtask) => subtask.status === "Completed"
    ).length;
    return Math.round((completedCount / subtasks.length) * 100);
  }

  function getTotalCompletedSubtasks(subtasks) {
    const completedSubtasks = subtasks.filter(
      (subtask) => subtask.status === "Completed"
    );
    return completedSubtasks.length;
  }

  useEffect(() => {
    if (hasSubtasks) {
      const percentage = getSubtaskCompletionPercentage(subtasks);
      setProgress(percentage);
    } else {
      setProgress(getTaskProgress());
    }

    const completedSubtasksCount = getTotalCompletedSubtasks(subtasks);
    setCompletedSubtasks(completedSubtasksCount);
  }, [subtasks]);

  return (
    <div className={styles.task}>
      <div className={styles.taskData} onContextMenu={handleContextMenu}>
        <div className={styles.taskInfo}>
          <h4>{task.title}</h4>
          <span>{task.description}</span>
        </div>
        <div className={styles.assignees}></div>
        <div className={styles.status}>
          <StatusComponent item={task} />
        </div>
        <div className={styles.priority}>
          <Priority priorityData={task?.priority} />
        </div>
        <div className={styles.dueDate}>
          <i className="fal fa-calendar"></i>
          <p>{formatDateTime(task.dueDate)}</p>
        </div>
        <div className={styles.progressContainer}>
          <div className={styles.progressInfo}>
            {hasSubtasks && (
              <p>
                {completedSubtasks}/{subtasks.length}
              </p>
            )}
            <span>{progress}%</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.bar} style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>
      {menuPosition && (
        <TaskContextMenu
          isSubTask={task.parentId !== null}
          ref={menuRef}
          menuPosition={menuPosition}
          closeContextMenu={() => setMenuPosition(null)}
        />
      )}
    </div>
  );
};

const NewTask = ({
  user,
  mode,
  onClose,
  createTask,
  editTask,
  editSubtask,
  createSubtask,
}) => {
  const textareaRef = useRef();
  const descriptionRef = useRef();
  const assigneesRef = useRef();
  const { project } = useProject();

  const initialTaskData = {
    title: "",
    status: "Todo",
    priority: "Low",
    dueDate: "",
    description: "",
    assignees: [],
  };
  const [taskData, setTaskData] = useState({
    title: "",
    status: "Todo",
    priority: "Low",
    dueDate: "",
    description: "",
    assignedTo: [],
  });

  useEffect(() => {
    if (mode === "edit")
      setTaskData({
        ...selectedTask,
        dueDate: readISODate(selectedTask?.dueDate),
      });
  }, [selectedTask]);

  const [filteredAssignees, setFilteredAssignees] = useState([]);
  const [assigneeSearchTerm, setAssigneeSearchTerm] = useState("");
  const [isSelectingAssignees, setIsSelectingAssignees] = useState(false);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    async function fetchMembers() {
      try {
        const data = await fetchprojectMembers(project.projectId);
        setMembers(data);
      } catch (err) {
        console.log(err);
      }
    }
    fetchMembers();
  }, []);

  useEffect(() => {
    textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
  }, [taskData?.title]);

  // auto resize description textarea
  useEffect(() => {
    const textarea = descriptionRef.current;
    const handleInput = () => {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    };
    textarea.addEventListener("input", handleInput);
    return () => textarea.removeEventListener("input", handleInput);
  }, []);

  // initialize users and filteredAssignees
  useEffect(() => {
    const availableUsers = members.filter(
      (user) => !taskData.assignedTo.some((a) => a.mail === user.mail)
    );
    setFilteredAssignees(availableUsers);
  }, [members]);

  // filter assignees with search term
  const visibleAssignees = useMemo(() => {
    if (!assigneeSearchTerm.trim()) return filteredAssignees;
    return filteredAssignees.filter((user) =>
      user.displayName.toLowerCase().includes(assigneeSearchTerm.toLowerCase())
    );
  }, [filteredAssignees, assigneeSearchTerm]);

  function handleToggleAssigneePicker(e) {
    setIsSelectingAssignees((prev) => !prev);
  }

  // handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (assigneesRef.current && !assigneesRef.current.contains(e.target)) {
        setIsSelectingAssignees(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const isAssigneeSelected = (user) => {
    return taskData.assignedTo.some((a) => a.mail === user.mail);
  };

  const handleSelectAssignee = (user) => {
    setTimeout(() => {
      if (!isAssigneeSelected(user)) {
        setTaskData((prev) => ({
          ...prev,
          assignedTo: [...prev.assignedTo, user],
        }));
        setFilteredAssignees((prev) =>
          prev.filter((a) => a.mail !== user.mail)
        );
      }
    }, 0);
  };

  function handleRemoveAssignee(user) {
    setTimeout(() => {
      // setAssignees(prev => prev.filter(a => a.mail !== user.mail));
      setTaskData((prev) => ({
        ...prev,
        assignedTo: prev.assignedTo.filter((a) => a.mail !== user.mail),
      }));
      setFilteredAssignees((prev) => {
        const alreadyIn = prev.some((a) => a.mail === user.mail);
        return alreadyIn ? prev : [...prev, user];
      });
    }, 0);
  }

  function handleCancel() {
    setTaskData(initialTaskData);
    setIsSelectingAssignees(false);
    onClose();
  }

  function handleSubmit() {
    const oldCreatedBy = selectedTask?.createdBy;

    const payload = {
      ...selectedTask,
      taskId:
        mode === "create" || mode === "subtask"
          ? uuidv4()
          : selectedTask.taskId,
      title: taskData.title,
      status: taskData.status,
      priority: taskData.priority,
      dateCreated: new Date().toISOString(),
      dueDate: taskData.dueDate,
      assignedTo: taskData.assignedTo,
      description: taskData.description,
      projectId: project.projectId,
      createdBy: {
        id: user?.id,
        displayName: user?.displayName,
        mail: user?.mail,
        avatar: user?.avatar,
      },
      parentId:
        mode === "subtask"
          ? selectedTask?.taskId
          : mode === "edit"
            ? selectedTask?.parentId
            : null,
    };
    mode === "create"
      ? createTask(payload)
      : mode === "edit"
        ? selectedTask?.parentId
          ? (payload.createdBy = oldCreatedBy, editSubtask(payload))
          : (payload.createdBy = oldCreatedBy, editTask(payload))
        : createSubtask(payload);
    onClose();
  }

  return (
    <section className={styles.newTaskContainer}>
      <div className={styles.newTask}>
        <div className={styles.top}>
          <h3>
            {mode === "create"
              ? "Create New Task"
              : mode === "edit"
                ? selectedTask?.parentId
                  ? "Edit Subtask"
                  : "Edit Task"
                : "Create New Subtask"}
          </h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <i className="fal fa-times"></i>
          </button>
        </div>

        <div className={styles.titleField}>
          <textarea
            autoFocus
            ref={textareaRef}
            rows={1}
            placeholder="Enter a title"
            value={taskData?.title}
            onChange={(e) =>
              setTaskData((prev) => ({ ...prev, title: e.target.value }))
            }
          />
        </div>

        <div className={styles.metaData}>
          <div className={styles.field}>
            <div className={styles.title}>
              <i className="far fa-circle-dot"></i>
              <p>Status</p>
            </div>
            <Dropdown
              onSelect={(e) => setTaskData((prev) => ({ ...prev, status: e }))}
              selected={taskData?.status}
              options={["Todo", "In Progress", "Completed", "Delayed"]}
              placeholder="Select a status"
            />
          </div>

          <div className={styles.field}>
            <div className={styles.title}>
              <i className="fal fa-flag"></i>
              <p>Priority</p>
            </div>
            <Dropdown
              onSelect={(e) =>
                setTaskData((prev) => ({ ...prev, priority: e }))
              }
              selected={taskData?.priority}
              options={["Low", "Medium", "High"]}
              placeholder="Select a priority"
            />
          </div>

          <div className={styles.field}>
            <div className={styles.title}>
              <i className="fal fa-calendar"></i>
              <p>Due Date</p>
            </div>
            <input
              type="date"
              value={taskData?.dueDate}
              onChange={(e) =>
                setTaskData((prev) => ({ ...prev, dueDate: e.target.value }))
              }
              className={styles.dateInput}
            />
          </div>

          <div className={styles.field} ref={assigneesRef}>
            <div className={styles.title}>
              <i className="fal fa-user"></i>
              <p>Assignees</p>
            </div>

            <div className={styles.dropdown}>
              {taskData.assignedTo?.length > 0 && (
                <AvatarStack maxVisible={7} users={taskData?.assignedTo} />
              )}
              <button
                className={styles.addBtn}
                onClick={(e) => handleToggleAssigneePicker(e)}
              >
                <i className="fal fa-plus"></i>
              </button>
            </div>

            {isSelectingAssignees && (
              <menu className={styles.assigneePicker}>
                <div className={styles.searchField}>
                  <i className="fal fa-search"></i>
                  <input
                    type="search"
                    placeholder="Search for Members"
                    value={assigneeSearchTerm}
                    onChange={(e) => setAssigneeSearchTerm(e.target.value)}
                  />
                </div>

                <div className={styles.assigneeList}>
                  {taskData?.assignedTo.length > 0 && !assigneeSearchTerm && (
                    <div className={styles.container}>
                      {taskData?.assignedTo
                        .sort((a, b) =>
                          a.displayName.localeCompare(b.displayName)
                        )
                        .map((user, idx) => (
                          <div
                            key={idx}
                            className={styles.assignee}
                            onClick={() => handleRemoveAssignee(user)}
                          >
                            <Avatar user={user} />
                            <div className={styles.info}>
                              <p>{user.displayName}</p>
                              <span>{user.jobTitle}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  <div className={styles.container}>
                    {visibleAssignees
                      .sort((a, b) =>
                        a.displayName.localeCompare(b.displayName)
                      )
                      .map((user, idx) => (
                        <div
                          key={idx}
                          className={styles.assignee}
                          onClick={() => handleSelectAssignee(user)}
                        >
                          <Avatar user={user} />
                          <div className={styles.info}>
                            <p>{user.displayName}</p>
                            <span>{user.jobTitle}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </menu>
            )}
          </div>
        </div>

        <div className={styles.description}>
          <span className={styles.title}>Description</span>
          <textarea
            ref={descriptionRef}
            rows={3}
            value={taskData?.description}
            onChange={(e) =>
              setTaskData((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Add a description"
          ></textarea>
        </div>

        <div className={styles.buttons}>
          <button onClick={handleCancel} className={styles.cancel}>
            Cancel
          </button>
          <button
            className={styles.create}
            disabled={
              taskData?.title === "" ||
              taskData?.dueDate === "" ||
              taskData?.status === "" ||
              taskData?.priority === ""
            }
            onClick={handleSubmit}
          >
            {mode === "create"
              ? "Create Task"
              : mode === "edit"
                ? selectedTask?.parentId
                  ? "Update Subtask"
                  : "Update Task"
                : "Create Subtask"}
          </button>
        </div>
      </div>
    </section>
  );
};

const ViewTask = ({ user, task, onClose, socket }) => {
  const titleRef = useRef(null);
  const commentBoxRef = useRef(null);

  useEffect(() => {
    titleRef.current.style.height = titleRef.current.scrollHeight + "px";
  }, [selectedTask?.title]);

  // auto resize comment textarea
  useEffect(() => {
    const commentBox = commentBoxRef.current;
    const handleInput = () => {
      commentBox.style.height = "auto";
      commentBox.style.height = `${commentBox.scrollHeight}px`;
    };
    commentBox.addEventListener("input", handleInput);
    return () => commentBox.removeEventListener("input", handleInput);
  }, []);

  // comment functionality
  const [comment, setComment] = useState("");
  const [commentsData, setCommentsData] = useState([]);

  useEffect(() => {
    async function fetchCommentsData(taskId) {
      const res = await fetchComments(taskId);
      setCommentsData(res);
    }
    fetchCommentsData(task?.taskId);
  }, []);

  // listen for comments
  useEffect(() => {
    if (socket && user?.mail) {
      socket.on("receive-comment", (data) => {
        if (data.taskId === task.taskId) {
          setCommentsData((prevComments) => {
            if (!prevComments.includes(data.comment)) {
              return [...prevComments, data.comment];
            }
            return prevComments;
          });
        }
      });

      socket.on("comment-liked", ({ commentId, likedBy }) => {
        setCommentsData((prevData) =>
          prevData.map((comment) =>
            comment.commentId === commentId
              ? { ...comment, likedBy } // update the likedBy array
              : comment
          )
        );
      });

      return () => {
        socket.off("receive-comment");
        socket.off("comment-liked");
      };
    }
  }, [socket]);

  // handle liking and disliking a comment
  function handleLikeComment(id) {
    const selectedComment = commentsData.filter(
      (comm) => comm.commentId === id
    )[0];
    const isLiked =
      selectedComment.likedBy === null
        ? false
        : selectedComment.likedBy.some((actor) => actor?.mail === user?.mail);

    if (isLiked) {
      selectedComment.likedBy = selectedComment.likedBy.filter(
        (actor) => actor?.mail !== user?.mail
      );
    } else {
      selectedComment.likedBy.push({
        displayName: user?.displayName,
        mail: user?.mail,
      });
    }
    setCommentsData([...commentsData]);
    socket.emit("like-comment", {
      comment: commentsData.filter((comm) => comm.commentId === id)[0],
      actor: { displayName: user?.displayName, mail: user?.mail },
    });
  }

  // const handleAddComment = async () => {
  //   if (comment.trim() === "") return;
  //   const res = await addComment(task?.taskId, comment);
  //   setCommentsData((prev) => [...prev, res]);
  //   setComment("");
  // };

  function sendComment() {
    if (comment.trim() === "") return;
    const data = {
      projectId: task.projectId,
      item: task,
      comment: comment,
    };
    socket.emit("add-comment", data);
    setComment("");
  }



  return (
    <section className={styles.viewTaskLayout}>
      <div className={styles.viewTaskContainer}>
        <section className={styles.leftCol}>
          <div className={styles.top}>
            <span className={styles.dateCreated}>
              Created at: {formatDateTime(task?.dateCreated)}
            </span>
            <button className={styles.closeBtn} onClick={onClose}>
              <i className="fal fa-times"></i>
            </button>
          </div>

          <div className={styles.taskDetails}>
            <textarea
              ref={titleRef}
              rows={1}
              className={styles.title}
              readOnly={true}
              value={task?.title}
            ></textarea>

            <div className={styles.metaData}>
              <div className={styles.field}>
                <div className={styles.fieldTitle}>
                  <p>Status</p>
                  <i className="far fa-circle-dot"></i>
                </div>
                <StatusComponent item={task} />
              </div>

              <div className={styles.field}>
                <div className={styles.fieldTitle}>
                  <p>Priority</p>
                  <i className="fal fa-flag"></i>
                </div>
                <Priority priorityData={task?.priority} />
              </div>

              <div className={styles.field}>
                <div className={styles.fieldTitle}>
                  <p>Due Date</p>
                  <i className="fal fa-calendar"></i>
                </div>
                <span>{formatDate(task?.dueDate)}</span>
              </div>

              <div className={styles.field}>
                <div className={styles.fieldTitle}>
                  <p>Assignees</p>
                  <i className="fal fa-users"></i>
                </div>
                <div className={styles.assignees}>
                  <AvatarStack users={task?.assignedTo} maxVisible={7} />
                </div>
              </div>

              <div className={styles.field}>
                <div className={styles.fieldTitle}>
                  <p>Created by</p>
                  <i className="fal fa-user"></i>
                </div>
                <div className={styles.createdBy}>
                  <Avatar user={task?.createdBy} />
                  <span>{task?.createdBy.displayName}</span>
                </div>
              </div>
            </div>

            <div className={styles.descriptionField}>
              <span>Description</span>
              <textarea
                className={styles.description}
                readOnly={true}
                value={task?.description}
              ></textarea>
            </div>
          </div>
        </section>

        <section className={styles.rightCol}>
          <div className={styles.top}>
            <h4>Comments</h4>
          </div>

          <section className={styles.commentContent}>
            <div className={styles.commentsContainer}>
              {commentsData.map((comment, idx) => (
                <div key={idx} className={styles.comment}>
                  <div className={styles.commentHeader}>
                    <Avatar user={comment?.createdBy} />
                    <span className={styles.username}>
                      {comment?.createdBy.displayName}
                    </span>
                    <i className="fas fa-circle"></i>
                    <span className={styles.commentDate}>
                      {formatDateTime(comment?.dateCreated)}
                    </span>
                  </div>
                  <p className={styles.contentBody}>{comment?.details}</p>
                </div>
              ))}
            </div>
            <div className={styles.messageBox}>
              <textarea
                ref={commentBoxRef}
                rows={1}
                placeholder="Add a comment..."
                className={styles.commentInput}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              ></textarea>

              <button
                className={styles.sendBtn}
                onClick={() => sendComment()}
              >
                <i className="far fa-arrow-up"></i>
              </button>
            </div>
          </section>
        </section>
      </div>
    </section>
  );
};

export default function ProjectTasks() {
  // error management
  const [isError, setIsError] = useState(null);

  // task fetching
  const {
    user,
    tasks,
    isLoading,
    subtasks,
    addTask,
    addSubtask,
    updateTask,
    updateSubtask,
    removeTask,
    removeSubtask,
    selectedMode,
    setSelectedMode,
    isCreatingTask,
    setIsCreatingTask,
  } = useTaskManager();

  // search functionality
  const [filteredTasks, setFilteredTasks] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const statusFilterRef = useRef(null);
  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState("All Status");
  const [isSelectingStatusFilter, setIsSelectingStatusFilter] = useState(false);
  const statuses = [
    "All Status",
    "Todo",
    "In Progress",
    "Completed",
    "Delayed",
  ];

  // Debounce searchTerm input
  useEffect(() => {
    const delay = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim().toLowerCase());
    }, 300);

    return () => clearTimeout(delay);
  }, [searchTerm]);

  // Unified filtering: by status and debounced search
  useEffect(() => {
    let filtered = [tasks, subtasks].flat();

    if (selectedStatusFilter !== "All Status") {
      if (selectedStatusFilter === "Delayed") {
        filtered = filtered.filter((task) => {
          const isPastDue = new Date(task.dueDate) < new Date();
          const isNotDone =
            task.status.toLowerCase() !== "completed" &&
            task.status.toLowerCase() !== "in progress";
          return isPastDue && isNotDone;
        });
      } else {
        filtered = filtered.filter(
          (task) =>
            task.status.toLowerCase() === selectedStatusFilter.toLowerCase()
        );
      }
    }

    if (debouncedSearchTerm) {
      filtered = filtered.filter((task) =>
        task.title.toLowerCase().includes(debouncedSearchTerm)
      );
    }

    if (filtered.length === 0) {
      setIsError({
        title: "No Task Found",
        message:
          selectedStatusFilter !== "All Status"
            ? "There are no tasks with this status"
            : "Check your search term and try again",
      });
    } else {
      setIsError(null);
    }

    setFilteredTasks(
      debouncedSearchTerm || selectedStatusFilter !== "All Status"
        ? filtered
        : null
    );
  }, [debouncedSearchTerm, selectedStatusFilter, tasks]);

  // Handle search input change
  function handleSearchInputChange(e) {
    setSearchTerm(e.target.value);
  }

  // Handle status filter selection
  function handleSelectStatusFilter(status) {
    setSelectedStatusFilter(status);
    setIsSelectingStatusFilter(false);
  }

  // Click outside status filter
  useEffect(() => {
    if (!isSelectingStatusFilter) return;

    const handleClickOutside = (e) => {
      if (
        statusFilterRef.current &&
        !statusFilterRef.current.contains(e.target)
      ) {
        setIsSelectingStatusFilter(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isSelectingStatusFilter]);

  // task context menu
  const menuRef = useRef(null);
  const [rawClickPosition, setRawClickPosition] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);

  const handleContextMenu = (e, task) => {
    e.preventDefault();
    selectedTask = task;
    setRawClickPosition({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    if (rawClickPosition && menuRef.current) {
      const { x, y } = rawClickPosition;
      const { offsetWidth: menuWidth, offsetHeight: menuHeight } =
        menuRef.current;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const adjustedX =
        x + menuWidth > viewportWidth ? viewportWidth - menuWidth - 10 : x;
      const adjustedY =
        y + menuHeight > viewportHeight ? viewportHeight - menuHeight - 10 : y;

      setMenuPosition({ x: adjustedX, y: adjustedY });
    }
  }, [rawClickPosition]);

  useEffect(() => {
    if (menuPosition) {
      const handleClickOutside = (e) => {
        if (menuRef.current && !menuRef.current.contains(e.target)) {
          setMenuPosition(null);
          setRawClickPosition(null);
        }
      };

      const handleScroll = () => {
        setMenuPosition(null);
      };

      document.addEventListener("click", handleClickOutside);
      window.addEventListener("contextmenu", handleClickOutside, true);
      window.addEventListener("scroll", handleScroll, true); // 'true' captures scroll on any element

      return () => {
        document.removeEventListener("click", handleClickOutside);
        window.removeEventListener("contextmenu", handleClickOutside, true);
        window.removeEventListener("scroll", handleScroll, true);
      };
    }
  }, [menuPosition]);

  function closeContextMenu() {
    setRawClickPosition(null);
    setMenuPosition(null);
  }

  function handleDuplicateTask() {
    const oldTask = selectedTask;
    const newTask = { ...oldTask };

    newTask.taskId = uuidv4();
    newTask.title = `${oldTask.title} - Copy`;
    newTask.status = "Todo";
    newTask.priority = "Low";
    newTask.assignedTo = [];
    newTask.createdBy = {
      id: user?.id,
      displayName: user?.displayName,
      mail: user?.mail,
      avatar: user?.avatar,
    };
    addTask(newTask);
  }

  function handleDuplicateSubtask() {
    const oldTask = selectedTask;
    const newTask = { ...oldTask };

    newTask.taskId = uuidv4();
    newTask.title = `${oldTask.title} - Copy`;
    newTask.status = "Todo";
    newTask.priority = "Low";
    newTask.assignedTo = [];
    newTask.createdBy = {
      id: user?.id,
      displayName: user?.displayName,
      mail: user?.mail,
      avatar: user?.avatar,
    };
    addSubtask(newTask);
  }

  function updateStatus(status) {
    const updatedTask = { ...selectedTask, status };
    updateTask(updatedTask);
  }

  function updatePriority(priority) {
    const updatedTask = { ...selectedTask, priority };
    updateTask(updatedTask);
  }

  function updateSubtaskStatus(status) {
    const updatedTask = { ...selectedTask, status };
    updateSubtask(updatedTask);
  }

  function updateSubtaskPriority(priority) {
    const updatedTask = { ...selectedTask, priority };
    updateSubtask(updatedTask);
  }

  // task viewing
  const [isViewingTask, setIsViewingTask] = useState(false);
  const { socket } = useSocket();

  return (
    <section className={styles.tasksLayout}>
      <section className={styles.topSection}>
        <section className={styles.titleContainer}>
          <div className={styles.title}>
            <h3>Tasks</h3>
            <span>Manage and track all tasks related to this project</span>
          </div>

          <div className={styles.action}>
            {/* <div className={styles.viewContainer}>
                            <div className={styles.indicator} style={{ transform: `translateX(${viewType === 'list' ? '0' : '100%'}` }}></div>
                            <button onClick={() => setViewType('list')}>
                                <i className={'fal fa-list'} style={{ color: `${viewType === 'list' ? 'white ' : ''}` }}></i>
                            </button>
                            <button onClick={() => setViewType('grid')}>
                                <i className={'fal fa-grid-2'} style={{ color: `${viewType === 'grid' ? 'white ' : ''}` }} ></i>
                            </button>
                        </div> */}
            <button
              className={styles.addTaskBtn}
              onClick={() => {
                setSelectedMode("create");
                setIsCreatingTask(true);
              }}
            >
              <i className="fal fa-plus"></i>Add Task
            </button>
          </div>
        </section>

        <section className={styles.searchContainer}>
          <div className={styles.searchBar}>
            <i className="fal fa-search"></i>
            <input
              onChange={handleSearchInputChange}
              type="text"
              placeholder="Search tasks and subtasks"
            />
          </div>

          <DropDownComponent
            ref={statusFilterRef}
            onDropdownClick={() =>
              setIsSelectingStatusFilter(!isSelectingStatusFilter)
            }
            isSelectingStatusFilter={isSelectingStatusFilter}
            selectedOption={selectedStatusFilter}
            options={statuses}
            onSelect={(e) => handleSelectStatusFilter(e)}
          />
        </section>
      </section>

      <section className={styles.content}>
        {!isError ? (
          <section className={styles.listViewContainer}>
            {isLoading && <LoadingComponent width={40} height={40} />}
            {!isLoading &&
              (filteredTasks ?? tasks).map((task, idx) => {
                return !filteredTasks ? (
                  <Task
                    key={idx}
                    task={task}
                    allSubtasks={subtasks}
                    onTaskClick={(task) => {
                      selectedTask = task;
                      setIsViewingTask(true);
                    }}
                    onSubtaskClick={(subtask) => {
                      selectedTask = subtask;
                      setIsViewingTask(true);
                    }}
                    onRightClick={(e) => handleContextMenu(e, task)}
                    onSubtaskRightClick={(e, subtask) =>
                      handleContextMenu(e, subtask)
                    }
                  />
                ) : (
                  <FilteredTask
                    key={idx}
                    tasks={tasks}
                    task={task}
                    onRightClick={handleContextMenu}
                  />
                );
              })}
            {rawClickPosition && (
              <TaskContextMenu
                ref={menuRef}
                user={user}
                isSubTask={selectedTask?.parentId !== null ? true : false}
                menuPosition={menuPosition}
                closeContextMenu={() => {
                  closeContextMenu();
                }}
                editTask={() => {
                  setSelectedMode("edit"), setIsCreatingTask(true);
                }}
                duplicateTask={() => handleDuplicateTask()}
                duplicateSubtask={() => handleDuplicateSubtask()}
                newSubTask={() => {
                  setSelectedMode("subtask"), setIsCreatingTask(true);
                }}
                updateStatus={(status) => {
                  updateStatus(status),
                    socket.emit("changeStatus", {
                      projectroom: selectedTask.projectId,
                      item: selectedTask,
                      type: "tasks",
                      status,
                    });
                }}
                updatePriority={(priority) => {
                  updatePriority(priority),
                    socket.emit("changePriority", {
                      projectroom: selectedTask.projectId,
                      item: selectedTask,
                      priority,
                    });
                }}
                updateSubtaskStatus={(status) => {
                  updateSubtaskStatus(status),
                    socket.emit("changeStatus", {
                      projectroom: selectedTask.projectId,
                      item: selectedTask,
                      type: "tasks",
                      status,
                    });
                }}
                updateSubtaskPriority={(priority) => {
                  updateSubtaskPriority(priority),
                    socket.emit("changePriority", {
                      projectroom: selectedTask.projectId,
                      item: selectedTask,
                      priority,
                    });
                }}
                deleteTask={(e) => removeTask(e)}
                deleteSubtask={(e) => removeSubtask(e)}
              />
            )}
          </section>
        ) : isLoading ? (
          <div
            style={{
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <LoadingComponent width={40} height={40} />
          </div>
        ) : (
          <ErrorComponent title={isError.title} message={isError.message} />
        )}
      </section>

      {isCreatingTask && (
        <NewTask
          user={user}
          mode={selectedMode}
          createTask={(e) => addTask(e)}
          editTask={(e) => updateTask(e)}
          createSubtask={(e) => addSubtask(e)}
          editSubtask={(e) => updateSubtask(e)}
          onClose={() => {
            setIsCreatingTask(false);
          }}
        />
      )}

      {isViewingTask && (
        <ViewTask
          task={selectedTask}
          user={user}
          socket={socket}
          onClose={() => {
            setIsViewingTask(false);
            selectedTask = null;
          }}
        />
      )}
    </section>
  );
}
