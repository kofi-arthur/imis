import styles from "../../styles/app/client/allProjects.module.css";

import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";

import { ErrorComponent } from "../../components/error";
import { StatusComponent } from "../../components/status";
import { LoadingComponent } from "../../components/loading";
import { successToast, warnToast } from "../../components/toast";
import AvatarStack, { Avatar } from "../../components/avatarStack";
import { NotificationPane } from "../../components/notificationPane";

import { useAuth } from "../../contexts/authContext";
import { useProject } from "../../contexts/projectContext";

import { formatDate, formatDateLong } from "../../utils/conversions";

import { addCategory, addClient, addProject, fetchCategories, fetchClients, fetchprojectMembers, fetchProjects, } from "../../services/api";

import Icon from "../../assets/appicons/icon.svg";
import UserIcon from "../../assets/user.svg";

const ProjectRow = ({ isSelected, project, onSelect, viewProject }) => {
  if (project) return (
    <div className={styles.projectRow}>
      <button
        className={styles.selectBtn}
        onClick={() => onSelect(project.projectId)}
      >
        <i
          className={isSelected ? "fas fa-square-check" : "fal fa-square"}
          style={{ color: isSelected ? "var(--primary)" : "" }}
        ></i>
      </button>

      <div
        className={styles.projectName}
        onClick={() => viewProject(project)}
      >
        {project.projectName}
      </div>

      <div className={styles.client}>
        <Avatar type={'client'} user={project.client} />
        <div className={styles.clientInfo}>
          <h4>{project.client.displayName}</h4>
          {project.client.website ?
            <a target="_blank" href={project.client.website}>{project.client.website}</a> :
            <a href={`mailto:${project.client.primaryContactMail}`}>
              {project.client.primaryContactMail}
            </a>
          }
        </div>
      </div>

      <div className={styles.members}>
        {project?.members && <AvatarStack users={project.members} maxVisible={7} />}
      </div>

      <div className={styles.projectStatus}>
        <StatusComponent item={project} />
      </div>

      <div className={styles.dueDate}>
        <i className="fal fa-calendar"></i>
        <p>{formatDate(project.dueDate)}</p>
      </div>
    </div>
  );
};

const ProjectGrid = ({ isSelected, project, onSelect, viewProject }) => {
  if (project) return (
    <div className={`${styles.projectGrid} ${isSelected && styles.active}`}>
      <div className={styles.title}>
        <div className={styles.selectTitle}>
          <button onClick={() => onSelect(project.projectId)}>
            <i
              style={{ color: isSelected ? "var(--primary)" : "var(--color)" }}
              className={isSelected ? "fas fa-square-check" : "fal fa-square"}></i>
          </button>
          <h3 onClick={() => viewProject(project)}>{project.projectName}</h3>
        </div>
        <Avatar type={"client"} user={project.client} />
      </div>

      {project.projectDescription ? <p className={styles.description}>
        {project.projectDescription}
      </p> : <p className={styles.emptyDescription}>No description</p>}

      <div className={styles.client}>
        <div className={styles.clientInfo}>
          <h4>{project.client.displayName}</h4>
          {project.client.website ?
            <a target="_blank" href={project.client.website}>{project.client.website}</a> :
            <a href={`mailto:${project.client.primaryContactMail}`}>
              {project.client.primaryContactMail}
            </a>
          }
        </div>
      </div>

      <div className={styles.extraInfo}>
        <AvatarStack users={project?.members} maxVisible={7} />
        <StatusComponent item={project} />
      </div>
    </div>
  );
}

const NewProject = ({ onCancel }) => {
  const initialProjectInfo = {
    projectId: uuidv4(),
    workOrderNo: "",
    projectName: "",
    projectCategory: "",
    projectDescription: "",
    client: "",
    workOrderReceivedDate: "",
    productionJobNo: "",
    startDate: "",
    dueDate: "",
    createdBy: "",
    projectOwner: "",
  };

  const [projectInfo, setProjectInfo] = useState(initialProjectInfo);
  const [clients, setClients] = useState([]);
  const [categories, setCategories] = useState([]);

  async function getClients() {
    const clientsData = await fetchClients();
    setClients(clientsData);
  }
  async function getCategories() {
    const categoryData = await fetchCategories();
    setCategories(categoryData);
  }

  useEffect(() => {
    getCategories();
    getClients();
  }, []);

  async function handleCreateProject() {
    try {
      const res = await addProject(projectInfo);
      if (res.error) {
        warnToast(res.error);
      } else {
        successToast(res.message);
      }
    } catch (error) {
      console.log(error);
    } finally {
      onCancel();
    }
  }

  function handleCancel() {
    setProjectInfo({
      ...initialProjectInfo,
      projectId: uuidv4(), // generate a new ID on reset
    });
    onCancel();
  }

  const [isAddingProjectCategory, setIsAddingProjectCategory] = useState(false);
  const [isAddingProjectClient, setIsAddingProjectClient] = useState(false);

  return (
    <section className={styles.newProjectLayout}>
      <div className={styles.newProjectContainer}>
        <div className={styles.header}>
          <h4>Create New Project</h4>
          <button className={styles.closeNewProjectBtn} onClick={handleCancel}>
            <i className="fal fa-times"></i>
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.multiField}>
            <div className={styles.field}>
              <label htmlFor="workOrderNo">Work Order Number</label>
              <input
                id="workOrderNo"
                type="text"
                placeholder="Enter Work Order Number"
                value={projectInfo.workOrderNo}
                onChange={(e) =>
                  setProjectInfo({
                    ...projectInfo,
                    workOrderNo: e.target.value,
                  })
                }
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="workOrderReceivedDate">Work Order Receive Date</label>
              <input
                type="date"
                id="workOrderReceivedDate"
                value={projectInfo.workOrderReceivedDate}
                onChange={(e) =>
                  setProjectInfo({ ...projectInfo, workOrderReceivedDate: e.target.value })
                }
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="productionJobNo">Production Job Number</label>
            <input
              id="productionJobNo"
              type="text"
              placeholder="Enter Production Job Number"
              value={projectInfo.productionJobNo}
              onChange={(e) =>
                setProjectInfo({
                  ...projectInfo,
                  productionJobNo: e.target.value,
                })
              }
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="projectName">Project Name</label>
            <input
              id="projectName"
              type="text"
              placeholder="Enter Project Name"
              value={projectInfo.projectName}
              onChange={(e) =>
                setProjectInfo({ ...projectInfo, projectName: e.target.value })
              }
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="projectDescription">Project Description</label>
            <textarea
              id="projectDescription"
              name="projectDescription"
              placeholder="Enter Project Description"
              value={projectInfo.projectDescription}
              onChange={(e) =>
                setProjectInfo({
                  ...projectInfo,
                  projectDescription: e.target.value,
                })
              }
            ></textarea>
          </div>

          <div className={styles.field}>
            <div className={styles.labelContainer}>
              <label htmlFor="projectCategory">Project Category</label>
              <button
                className={styles.addBtn}
                onClick={() => setIsAddingProjectCategory(true)}
                disabled={isAddingProjectCategory}
                onMouseDown={(e) => e.preventDefault()}
              >
                <i className="fas fa-plus"></i> Add Category
              </button>
            </div>
            <select
              name="projectCategory"
              id="projectCategory"
              value={projectInfo.projectCategory}
              onChange={(e) =>
                setProjectInfo({
                  ...projectInfo,
                  projectCategory: e.target.value,
                })
              }
            >
              <option default hidden>
                Select the project category
              </option>
              {categories.map((category, idx) => (
                <option key={idx} value={category.categoryName}>
                  {category.categoryName}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <div className={styles.labelContainer}>
              <label htmlFor="projectCategory">Project Client</label>
              <button
                className={styles.addBtn}
                onClick={() => setIsAddingProjectClient(true)}
                disabled={isAddingProjectClient}
                onMouseDown={(e) => e.preventDefault()}
              >
                <i className="fas fa-plus"></i> Add Client
              </button>
            </div>
            <select
              name="projectCategory"
              id="projectCategory"
              value={projectInfo.client}
              onChange={(e) =>
                setProjectInfo({ ...projectInfo, client: e.target.value })
              }
            >
              <option default hidden>
                Select a Client
              </option>
              {clients.map((client, idx) => (
                <option key={idx} value={client.id}>
                  {client.displayName}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.multiField}>
            <div className={styles.field}>
              <label htmlFor="projectStartDate">Project Start Date</label>
              <input
                type="date"
                id="projectStartDate"
                value={projectInfo.startDate}
                onChange={(e) =>
                  setProjectInfo({ ...projectInfo, startDate: e.target.value })
                }
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="projectDueDate">Project End Date</label>
              <input
                type="date"
                id="projectDueDate"
                value={projectInfo.dueDate}
                onChange={(e) =>
                  setProjectInfo({ ...projectInfo, dueDate: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={handleCancel}>
            Cancel
          </button>
          <button className={styles.saveBtn} onClick={handleCreateProject}>
            Save
          </button>
        </div>
      </div>

      {isAddingProjectCategory && (
        <NewProjectCategory
          onCancel={() => {
            setIsAddingProjectCategory(false);
            getCategories();
          }}
        />
      )}
      {isAddingProjectClient && (
        <NewClient
          onCancel={() => {
            setIsAddingProjectClient(false);
            getClients();
          }}
        />
      )}
    </section>
  );
};

const ViewProject = ({ project, onClose }) => {
  const { setProject } = useProject();
  const navigate = useNavigate();

  function handleOpenProject(project) {
    setProject(project);
    navigate(`/${project.projectId}/dashboard`);
  }
  return (
    <section className={styles.viewProjectLayout}>
      <div className={styles.projectContainer}>
        <div className={styles.header}>
          <p className={styles.workOrderNo}>{project?.workOrderNo}</p>

          <button className={styles.closeBtn} onClick={onClose}>
            <i className="fal fa-times"></i>
          </button>
        </div>

        <section className={styles.content}>
          <div className={styles.titleSection}>
            <StatusComponent item={project} />
            <h2 className={styles.title}>{project?.projectName}</h2>
          </div>

          <div className={styles.description}>
            <p>{project?.projectDescription || "No description"}</p>
          </div>

          <hr className={styles.divider} />

          <div className={styles.infoSection}>
            <div className={styles.info}>
              <span className={styles.label}>Project Category</span>
              <span className={styles.value}>{project?.projectCategory}</span>
            </div>

            <div className={styles.info}>
              <span className={styles.label}>Production Job No</span>
              <span className={styles.value}>{project?.productionJobNo}</span>
            </div>

            <div className={styles.info}>
              <span className={styles.label}>Work Order Received Date</span>
              <span className={styles.value}>{project?.workOrderReceivedDate ? formatDateLong(new Date(project?.workOrderReceivedDate).toISOString()) : "Not Received"}</span>
            </div>

            <div className={styles.info}>
              <span className={styles.label}>Start Date</span>
              <span className={styles.value}>{formatDateLong(new Date(project?.startDate).toISOString())}</span>
            </div>

            <div className={styles.info}>
              <span className={styles.label}>Actual Start Date</span>
              <span className={styles.value}>{project?.actualStartDate ? formatDateLong(new Date(project?.actualStartDate).toISOString()) : "Not Started"}</span>
            </div>

            <div className={styles.info}>
              <span className={styles.label}>Due Date</span>
              <span className={styles.value}>{formatDateLong(new Date(project?.dueDate).toISOString())}</span>
            </div>

            <div className={styles.info}>
              <span className={styles.label}>End Date</span>
              <span className={styles.value}>{project?.endDate ? formatDateLong(new Date(project?.endDate).toISOString()) : "Not Ended"}</span>
            </div>

            <div className={styles.info}>
              <span className={styles.label}>Project Owner: </span>
              <h4>{project?.projectOwner?.displayName}</h4>
            </div>
          </div>

          <hr className={styles.divider} />

          <span className={styles.miniTitle}>Client Information</span>

          <div className={styles.clientInfo}>
            <div className={styles.client}>
              <div className={styles.info}>
                <Avatar
                  type={'client'}
                  user={project.client}
                  width={50}
                  height={50}
                />
                <div className={styles.clientInfo}>
                  <h4>{project.client.displayName}</h4>
                  {project.client.website ? (
                    <a target="_blank" href={project.client.website}>
                      {project.client.website}
                    </a>
                  ) : (
                    <a href={`mailto:${project.client.primaryContactMail}`}>
                      {project.client.primaryContactMail}
                    </a>
                  )}
                </div>
              </div>

              <hr />

              <div className={styles.contact}>
                <div className={styles.contactInfo}>
                  <h4>{project.client.primaryContactName}</h4>
                  <a className={styles.email} href={`mailto:${project.client.primaryContactMail}`}>{project.client.primaryContactMail}</a>
                  <a className={styles.phone} href={`tel:${project.client.primaryContactPhone}`}>{project.client.primaryContactPhone}</a>
                </div>

                {project.client.backupContactName &&
                  <div className={styles.contactInfo}>
                    <h4>{project.client.backupContactName}</h4>
                    <a className={styles.email} href={`mailto:${project.client.backupContactMail}`}>{project.client.backupContactMail}</a>
                    <a className={styles.phone} href={`tel:${project.client.backupContactPhone}`}>{project.client.backupContactPhone}</a>
                  </div>
                }

                {project.client.notes &&
                  <div className={styles.notes}>
                    <p>{project.client.notes}</p>
                  </div>
                }
              </div>
            </div>
          </div>
        </section>

        <button className={styles.openBtn} onClick={() => handleOpenProject(project)}>
          Open Project
        </button>

      </div>
    </section>
  );
}

const NewProjectCategory = ({ onCancel }) => {
  const [projectCategory, setProjectCategory] = useState("");

  async function handleCreateProjectCategory() {
    await addCategory(projectCategory);
    onCancel();
  }

  return (
    <section className={styles.newProjectCategoryLayout}>
      <div className={styles.newProjectCategoryContainer}>
        <div className={styles.header}>
          <h4>Create New Project Category</h4>
          <button
            className={styles.closeNewProjectCategoryBtn}
            onClick={onCancel}
          >
            <i className="fal fa-times"></i>
          </button>
        </div>

        <div className={styles.field}>
          <label htmlFor="projectCategory">Project Category</label>
          <input
            type="text"
            id="projectCategory"
            placeholder="Enter Project Category"
            value={projectCategory}
            onChange={(e) => setProjectCategory(e.target.value)}
          />
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={() => onCancel()}>
            Cancel
          </button>
          <button
            className={styles.saveBtn}
            onClick={() => handleCreateProjectCategory()}
          >
            Save
          </button>
        </div>
      </div>
    </section>
  );
};

const NewClient = ({ onCancel }) => {
  const [clientAvatar, setClientAvatar] = useState(null);

  const initialClientInfo = {
    id: uuidv4(),
    displayName: "",
    website: "",
    primaryContactName: "",
    primaryContactMail: "",
    primaryContactPhone: "",
    backupContactName: "",
    backupContactMail: "",
    backupContactPhone: "",
    notes: "",
  };

  const [clientInfo, setClientInfo] = useState(initialClientInfo);

  const handleClientAvatar = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 2 * 1024 * 1024) {
      // 2MB limit
      setClientAvatar(file);
    } else {
      warnToast("File too large. Max size allowed is 2MB.");
    }
  };

  async function handleSubmitClientInfo() {
    await addClient(clientAvatar, clientInfo);
    onCancel();
  }

  return (
    <section className={styles.newClientLayout}>
      <div className={styles.newClientContainer}>
        <div className={styles.header}>
          <h4>Create New Client</h4>

          <button className={styles.closeNewClientBtn} onClick={onCancel}>
            <i className="fal fa-times"></i>
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.clientAvatar}>
            <input
              id="clientImage"
              onChange={handleClientAvatar}
              type="file"
              accept=".png, .jpg, .jpeg"
              hidden
              style={{ display: "none" }}
            />

            <div className={styles.clientImage}>
              {clientAvatar && (
                <img src={URL.createObjectURL(clientAvatar)} width={100} />
              )}
              <label htmlFor="clientImage">
                <i className="fal fa-camera"></i>
              </label>
            </div>

            <label>Upload Client Logo | Avatar</label>
          </div>

          <div className={styles.field}>
            <label htmlFor="clientName">Client | Organization Name</label>
            <input
              id="clientName"
              type="text"
              placeholder="Enter Client | Organization Name"
              value={clientInfo.displayName}
              onChange={(e) =>
                setClientInfo({ ...clientInfo, displayName: e.target.value })
              }
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="clientWebsite">Client's Website</label>
            <input
              id="clientWebsite"
              type="text"
              placeholder="eg. www.examplecompany.com"
              value={clientInfo.website}
              onChange={(e) =>
                setClientInfo({ ...clientInfo, website: e.target.value })
              }
            />
          </div>

          <hr />

          <span>Primary Contact Details</span>

          <div className={styles.field}>
            <label htmlFor="clientName">Name</label>
            <input
              type="text"
              id="clientName"
              placeholder="eg. John Doe"
              value={clientInfo.primaryContactName}
              onChange={(e) =>
                setClientInfo({
                  ...clientInfo,
                  primaryContactName: e.target.value,
                })
              }
            />
          </div>

          <div className={styles.multiField}>
            <div className={styles.field}>
              <label htmlFor="clientName">Email Address</label>
              <input
                id="clientName"
                type="text"
                placeholder="eg. 6V0rH@example.com"
                value={clientInfo.primaryContactMail}
                onChange={(e) =>
                  setClientInfo({
                    ...clientInfo,
                    primaryContactMail: e.target.value,
                  })
                }
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="clientName">Phone Number</label>
              <input
                type="text"
                id="clientName"
                placeholder="eg. +233 24 123 4567"
                value={clientInfo.primaryContactPhone}
                onChange={(e) =>
                  setClientInfo({
                    ...clientInfo,
                    primaryContactPhone: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <hr />

          <span>Backup Contact Details [Optional]</span>

          <div className={styles.field}>
            <label htmlFor="clientName">Name</label>
            <input
              type="text"
              id="clientName"
              placeholder="eg. John Doe"
              value={clientInfo.backupContactName}
              onChange={(e) =>
                setClientInfo({
                  ...clientInfo,
                  backupContactName: e.target.value,
                })
              }
            />
          </div>

          <div className={styles.multiField}>
            <div className={styles.field}>
              <label htmlFor="clientName">Email Address</label>
              <input
                type="text"
                id="clientName"
                placeholder="eg. 6V0rH@example.com"
                value={clientInfo.backupContactMail}
                onChange={(e) =>
                  setClientInfo({
                    ...clientInfo,
                    backupContactMail: e.target.value,
                  })
                }
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="clientName">Phone Number</label>
              <input
                type="text"
                id="clientName"
                placeholder="eg. +233 24 123 4567"
                value={clientInfo.backupContactPhone}
                onChange={(e) =>
                  setClientInfo({
                    ...clientInfo,
                    backupContactPhone: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="notes">Instructions | Notes</label>
            <textarea
              id="notes"
              placeholder="Enter Instructions | Notes"
              value={clientInfo.notes}
              onChange={(e) =>
                setClientInfo({ ...clientInfo, notes: e.target.value })
              }
            ></textarea>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel}>
            Cancel
          </button>
          <button
            className={styles.saveBtn}
            onClick={() => handleSubmitClientInfo()}
          >
            Save
          </button>
        </div>
      </div>
    </section>
  );
};

export default function AllProjects() {
  const { user } = useAuth();

  const [userProjects, setUserProjects] = useState([]);
  const [isProjectLoading, setIsProjectLoading] = useState(true);

  const loadUserProjects = async () => {
    try {
      const projectData = await fetchProjects(user?.id);
      setUserProjects(projectData);
    } catch (error) {
      console.error("Failed to load projects:", error);
      setUserProjects([]);
    } finally {
      setIsProjectLoading(false);
    }
  };

  useEffect(() => {
    loadUserProjects();
  }, []);

  const [isNotificationActive, setIsNotificationActive] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  // view functionality
  const [projectView, setProjectView] = useState("list");

  // search functionality
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  useEffect(() => {
    const delay = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim().toLowerCase());
    }, 300);

    return () => clearTimeout(delay);
  }, [searchTerm]);

  useEffect(() => {
    let results = userProjects;

    if (debouncedSearchTerm.length > 0) {
      results = results.filter(project => {
        const name = project.projectName?.toLowerCase() || "";
        const workOrder = project.workOrderNo?.toLowerCase() || "";
        return name.includes(debouncedSearchTerm) || workOrder.includes(debouncedSearchTerm);
      });
    }

    setSearchResults(results);
  }, [debouncedSearchTerm])

  // selection functionality 
  const [selectedProjects, setSelectedProjects] = useState([]);

  function handleSelectAllProjects() {
    if (
      selectedProjects.length === 0 ||
      selectedProjects.length !== userProjects.length
    ) {
      setSelectedProjects(userProjects.map((project) => project.projectId));
    } else {
      setSelectedProjects([]);
    }
  }

  const displayProjects = searchResults?.length
    ? searchResults
    : userProjects || [];

  const [selectedProject, setSelectedProject] = useState(userProjects[0]);
  const [isViewingProject, setIsViewingProject] = useState(false);

  return (
    <main className={styles.projectLayout}>
      <header>
        <div className={styles.logo}>
          <img src={Icon} alt="logo" width={70} />
        </div>
        <div className={styles.actionBtnContainer}>
          <button
            className={styles.actionBtn}
            onClick={() => setIsNotificationActive(!isNotificationActive)}
          >
            <i
              className={isNotificationActive ? "fas fa-bell" : "fal fa-bell"}
              style={{ color: isNotificationActive ? "var(--primary)" : "" }}
            ></i>
          </button>
          <button className={styles.actionBtn}>
            <i className="fal fa-brightness"></i>
          </button>
          <div className={styles.user}>
            <img src={UserIcon} alt="user image" width={50} />
            {user ? <h4>{user.displayName}</h4> : <h4>Guest</h4>}
          </div>
        </div>
      </header>

      <section className={styles.content}>
        <div className={styles.titleSpace}>
          <h2>All Projects</h2>

          <button
            className={styles.createBtn}
            onClick={() => setIsCreatingProject(!isCreatingProject)}
          >
            <i className="fal fa-plus"></i>
            <p>Create Project</p>
          </button>
        </div>

        <div className={styles.actionSpace}>
          <div className={styles.searchContainer}>
            <i className="fal fa-search"></i>
            <input
              type="text"
              placeholder="Search for a project"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className={styles.actions}>
            <div className={styles.groups}></div>

            {/* <hr className={styles.separator} /> */}

            <div className={styles.groups}>
              <button onClick={() => setProjectView('grid')} className={`${styles.actionBtn} ${projectView === 'grid' && styles.active}`}>
                <i className="fal fa-grid-2"></i>
              </button>

              <button onClick={() => setProjectView('list')} className={`${styles.actionBtn} ${projectView === 'list' && styles.active}`}>
                <i className="fal fa-list"></i>
              </button>
            </div>

            {/* <hr className={styles.separator} />

                        <div className={styles.groups}>
                            <button className={`${styles.actionBtn} ${styles.delete}`} disabled={selectedProjects.length === 0}>
                                <i className="fal fa-trash"></i>
                            </button>
                        </div> */}
          </div>
        </div>

        {projectView === 'list' &&
          <section className={styles.projects}>
            <div className={styles.headerSection}>
              <button
                className={styles.selectBtn}
                onClick={() => handleSelectAllProjects()}
              >
                <i
                  className={
                    userProjects?.length > 0 && selectedProjects?.length === userProjects?.length
                      ? "fas fa-square-check"
                      : selectedProjects.length > 0
                        ? "fas fa-square-minus"
                        : "fal fa-square"
                  }
                  style={{ color: selectedProjects.length > 0 ? "var(--primary)" : "" }}
                ></i>
              </button>
              <h4>Project Name</h4>
              <h4>Client</h4>
              <h4>Members</h4>
              <h4>Project Status</h4>
              <h4>Due Date</h4>
            </div>

            <section className={styles.projectList}>
              {isProjectLoading ? (
                <LoadingComponent width={30} height={30} />
              ) : (searchTerm.length > 0 && searchResults.length === 0) ?
                <ErrorComponent message={"We couldn't find any projects"} title={"No Projects Found"} /> :
                userProjects.length === 0 ? (
                  <ErrorComponent message={"You don't have any projects"} title={"No Projects Found"} />
                ) : (
                  displayProjects.map((project, idx) => (
                    <ProjectRow
                      key={idx}
                      project={project}
                      viewProject={(e) => { setIsViewingProject(true); setSelectedProject(e) }}
                      isSelected={selectedProjects.includes(project.projectId)}
                      onSelect={(e) =>
                        setSelectedProjects((prev) =>
                          prev.includes(e)
                            ? prev.filter((id) => id !== e)
                            : [...prev, e]
                        )
                      }
                    />
                  ))
                )}
            </section>
          </section>
        }

        {projectView === 'grid' &&
          <section className={styles.projectGridContainer}>
            {isProjectLoading ? (
              <LoadingComponent width={30} height={30} />
            ) : (searchTerm.length > 0 && searchResults.length === 0) ?
              <ErrorComponent message={"We couldn't find any projects"} title={"No Projects Found"} /> :
              userProjects.length === 0 ? (
                <ErrorComponent message={"You don't have any projects"} title={"No Projects Found"} />
              ) : (
                displayProjects.map((project, idx) => (
                  <ProjectGrid
                    key={idx}
                    project={project}
                    viewProject={(e) => { setIsViewingProject(true); setSelectedProject(e) }}
                    isSelected={selectedProjects.includes(project.projectId)}
                    onSelect={(e) =>
                      setSelectedProjects((prev) =>
                        prev.includes(e)
                          ? prev.filter((id) => id !== e)
                          : [...prev, e]
                      )
                    }
                  />
                ))
              )}
          </section>
        }
      </section>

      <NotificationPane
        isActive={isNotificationActive}
        onClose={() => setIsNotificationActive(false)}
      />

      {isCreatingProject && (
        <NewProject
          onCancel={() => {
            setIsCreatingProject(false);
            loadUserProjects();
          }}
        />
      )}

      {(isViewingProject && selectedProject) &&
        <ViewProject
          onClose={() => setIsViewingProject(false)}
          project={selectedProject} />
      }
    </main>
  );
}
