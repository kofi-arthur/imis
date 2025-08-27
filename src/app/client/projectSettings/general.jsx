import styles from "../../../styles/app/client/projectSettings/general.module.css";

import { useNavigate } from "react-router";
import { useEffect, useState } from "react";

import { warnToast } from "../../../components/toast";
import { useProject } from "../../../contexts/projectContext";
import { LoadingComponent } from "../../../../../iticket-new/src/components/loadingComponents";

import {
  changeProjectOwner,
  deleteProject,
  fetchCategories,
  fetchprojectMembers,
  updateProject,
} from "../../../services/api";

const InputComponent = ({ type, placeholder, value, onChange }) => {
  return (
    <input
      className={styles.inputField}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  );
};

const SelectComponent = ({ placeholder, value, onChange, options }) => {
  return (
    <select className={styles.inputField} value={value} onChange={onChange}>
      {options.map((option, idx) => (
        <option key={idx} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
};

export default function General() {
  const { project, setProject } = useProject();
  const navigate = useNavigate();

  async function getCategories() {
    const categoryData = await fetchCategories();
    const categories = categoryData.map((category) => category.categoryName);
    setCategories(categories);
  }

  useEffect(() => {
    getCategories();
  }, []);

  const [categories, setCategories] = useState([]);

  const [projectInfo, setProjectInfo] = useState({
    projectId: project.projectId,
    projectName: project.projectName,
    projectDescription: project.projectDescription,
    projectCategory: project.projectCategory,
  });

  const [projectMembers, setProjectMembers] = useState([]);

  const [isTransferringProject, setIsTransferringProject] = useState(false);
  const [acknowledgement, setAcknowledgement] = useState(false);
  const [isTransferLoading, setIsTransferLoading] = useState(false);
  const [newOwnerId, setNewOwnerId] = useState(null);

  useEffect(() => {
    async function getProjectMembers() {
      const members = await fetchprojectMembers(project.projectId);
      setProjectMembers(members);
    }
    if (isTransferringProject) {
      getProjectMembers();
    }
  }, [isTransferringProject]);

  async function handleProjectUpdate() {
    const res = await updateProject(projectInfo);
    if (res === true) {
      setProject({ ...project, ...projectInfo });
      return;
    } else {
      return;
    }
  }

  async function handleTransferProject(newOwnerId) {
    if (!acknowledgement) {
      warnToast("Please acknowledge the transfer");
      return;
    }

    setIsTransferLoading(true);
    const res = await changeProjectOwner(project.projectId, project.projectOwner?.id, newOwnerId);
    setIsTransferLoading(false);
    if (res.success === true) {
      console.log("Project ownership changed successfully", res.newOwner);
      setProject((prev) => ({
        ...prev,
        projectOwner: res.newOwner,
      }));
      setIsTransferringProject(false);
    } else {
      setIsTransferringProject(false);
    }
  }

  const [isDeletingProject, setIsDeletingProject] = useState(false);

  async function handleDeleteProject() {
    setIsDeletingProject(true);
    const res = await deleteProject(project.projectId);
    if (res === true) {
      setIsDeletingProject(false);
      navigate("/all-projects");
    }
  }

  return (
    <section className={styles.generalLayout}>
      <div className={styles.title}>General</div>

      <section className={styles.pageSection}>
        <span className={styles.sectionTitle}>Basic Project Information</span>

        <div className={styles.field}>
          <label htmlFor="projectName">Project Name</label>
          <InputComponent
            type={"text"}
            placeholder="Enter Project Name"
            value={projectInfo.projectName}
            onChange={(e) =>
              setProjectInfo({ ...projectInfo, projectName: e.target.value })
            }
          />
        </div>

        <div className={styles.field}>
          <label>Project Description</label>
          <textarea
            name="description"
            id="description"
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
          <label htmlFor="projectCategory">Project Category</label>
          <SelectComponent
            value={projectInfo.projectCategory}
            options={categories}
            onChange={(e) =>
              setProjectInfo({
                ...projectInfo,
                projectCategory: e.target.value,
              })
            }
          />
        </div>

        <button className={styles.saveBtn} onClick={handleProjectUpdate}>
          Save
        </button>
      </section>

      <hr />

      <section className={styles.pageSection}>
        <span className={styles.sectionTitle}>Danger Zone</span>

        <div className={styles.dangerField}>
          <label>Transfer Project Ownership</label>
          {/* explain the danger of transferring the project ownership */}
          <p>
            Transfer project ownership to another user. The new owner will have
            full control over the project and its settings.
          </p>
          <button
            className={styles.transferBtn}
            onClick={() => setIsTransferringProject(true)}
          >
            Transfer
          </button>
        </div>

        <div className={styles.dangerField}>
          <label>Project Deletion</label>
          {/* explain the danger of deleting the project */}
          <p>Delete the project. This action cannot be undone.</p>
          <button
            className={styles.deleteBtn}
            onClick={() => setIsDeletingProject(true)}
          >
            Delete
          </button>
        </div>
      </section>

      {isTransferringProject && (
        <section className={styles.transferProjectLayout}>
          <div className={styles.trasferProject}>
            <div className={styles.title}>
              <h1>Transfer Project Ownership</h1>
              <button
                className={styles.closeBtn}
                onClick={() => setIsTransferringProject(false)}
              >
                <i className="fal fa-times"></i>
              </button>
            </div>

            <p>Transfer project ownership to another project member.</p>

            <select
              name="members"
              id=""
              onChange={(e) => setNewOwnerId(e.target.value)}
            >
              {/* <option selected disabled>Select a project member</option> */}
              {projectMembers.map((member, idx) => (
                <option key={idx} value={member.id}>{member.displayName}</option>
              ))}
            </select>

            <div className={styles.acknowledgement}>
              <input
                type="checkbox"
                name="agree"
                id="agree"
                checked={acknowledgement}
                onChange={(e) => setAcknowledgement(e.target.checked)}
              />
              <label htmlFor="agree">
                {" "}
                I understand that this action cannot be undone.
              </label>
            </div>

            <button
              className={styles.delteBtn}
              onClick={() => handleTransferProject(newOwnerId)}
            >
              {isTransferLoading ? (
                <LoadingComponent width={20} height={20} />
              ) : (
                "Transfer Project Ownership"
              )}
            </button>
          </div>
        </section>
      )}

      {isDeletingProject && (
        <section className={styles.transferProjectLayout}>
          <div className={styles.trasferProject}>
            <div className={styles.title}>
              <h1>Delete Project</h1>
              <button
                onClick={() => setIsDeletingProject(false)}
                className={styles.closeBtn}
              >
                <i className="fal fa-times"></i>
              </button>
            </div>

            <p>
              By clicking the <b>Delete Project</b> button, you will be deleting
              the project. This action is irreversible.
            </p>

            <div className={styles.acknowledgement}>
              <input
                type="checkbox"
                name="agree"
                id="agree"
                checked={acknowledgement}
                onChange={(e) => setAcknowledgement(e.target.checked)}
              />
              <label htmlFor="agree">
                {" "}
                I understand that this action cannot be undone.
              </label>
            </div>

            <button className={styles.delteBtn} onClick={handleDeleteProject}>
              {isTransferLoading ? (
                <LoadingComponent width={20} height={20} />
              ) : (
                "Delete Project"
              )}
            </button>
          </div>
        </section>
      )}
    </section>

    // <div className={styles.comingSoonLayout}>
    //     <h1>Coming Soon</h1>
    // </div>
  );
}
