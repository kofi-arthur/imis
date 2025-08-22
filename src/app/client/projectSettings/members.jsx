import styles from "../../../styles/app/client/projectSettings/members.module.css";

import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import { Avatar } from "../../../components/avatarStack";
import DeleteConfirmationBox from "../../../components/confirmationBox";
import { EmptyComponent } from "../../../components/error";
import { RoleComponent } from "../../../components/status";
import { warnToast } from "../../../components/toast";
import { useProject } from "../../../contexts/projectContext";

import { LoadingComponent } from "../../../../../iticket-new/src/components/loadingComponents";
import {
  addUserToProject,
  deleteUserFromProject,
  editUserAccess,
  fetchPermissions,
  fetchprojectMembers,
  fetchRoles,
  fetchSystemUsers,
} from "../../../services/api";

const Members = ({
  user,
  isSelected,
  onUserSelect,
  onEditUser,
  onDeleteUser,
}) => {
  return (
    <div className={styles.member}>
      <div className={styles.select}>
        <button onClick={() => onUserSelect(user.id)}>
          <i
            style={{ color: isSelected ? "var(--primary)" : "" }}
            className={isSelected ? "fas fa-check-square" : "fal fa-square"}
          ></i>
        </button>
      </div>

      <div className={styles.userInfo}>
        <Avatar user={user} />
        <div className={styles.username}>
          <h4>{user.displayName}</h4>
          <a href={`mailto:${user.mail}`}>{user.mail}</a>
        </div>
      </div>

      <div className={styles.status}>
        <div className={`${styles.state} ${styles.online}`}>
          <i className="fas fa-circle"></i>
          Online
        </div>
      </div>

      <div className={styles.designation}>{user.jobTitle}</div>

      <div className={styles.role}>
        <RoleComponent role={user.permission} />
      </div>

      <div className={styles.role}>
        <RoleComponent role={user.projectRole} />
      </div>

      <div className={styles.actions}>
        <button
          className={styles.action}
          title="Edit User"
          onClick={() => onEditUser(user)}
        >
          <i className="fal fa-pen"></i>
        </button>

        {/* <button className={styles.action} title='Report User'>
                    <i className="fal fa-flag"></i>
                </button> */}

        <button
          className={styles.action}
          title="Delete User"
          onClick={() => onDeleteUser(user)}
        >
          <i className="fal fa-trash"></i>
        </button>
      </div>
    </div>
  );
};

const AddNewMember = ({ project, projectmembers, onClose }) => {
  const [members, setMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [SystemUsers, setSystemUsers] = useState([]);

  useEffect(() => {
    getSystemUsers();
  }, []);

  async function getSystemUsers() {
    const res = await fetchSystemUsers();
    setSystemUsers(res);
  }

  // load data
  useEffect(() => {
    if (SystemUsers.length > 0) {
      const filteredMembers = SystemUsers.filter(
        (user) => !projectmembers.some((member) => member.id === user.id)
      );
      setMembers(filteredMembers);
      setIsLoading(false);
    }
  }, [SystemUsers, projectmembers]);

  // search functionality
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Debounce searchTerm input
  useEffect(() => {
    const delay = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim().toLowerCase());
    }, 300);

    return () => clearTimeout(delay);
  }, [searchTerm]);

  useEffect(() => {
    setSearchResults(
      members.filter((user) =>
        user.displayName.toLowerCase().includes(debouncedSearchTerm)
      )
    );
  }, [debouncedSearchTerm, members]);

  // select user functionality
  function handleSelectUser(id) {
    const isSelected = selectedMembers.some((member) => member === id);

    if (isSelected) {
      setSelectedMembers((prev) => prev.filter((member) => member !== id));
    } else {
      setSelectedMembers((prev) => [...prev, id]);
    }
  }

  // add members functionality
  async function handleAddMembers() {
    if (selectedMembers.length === 0) {
      warnToast("Please select at least one member");
      return;
    }
    const membersToAdd = selectedMembers.map((id) =>
      members.find((user) => user.id === id)
    );
    const newMembers = await addUserToProject(project.projectId, membersToAdd);
    if (newMembers.length > 0) {
      projectmembers.push(...newMembers);
    }
    onClose();
  }

  // close functionality
  function handleClose() {
    setSelectedMembers([]);
    onClose();
  }

  return (
    <section className={styles.addMemberLayout}>
      <div className={styles.addMemberContainer}>
        <div className={styles.titleBar}>
          <h4>Add New Member</h4>
          <button className={styles.closeBtn} onClick={handleClose}>
            <i className="fal fa-times"></i>
          </button>
        </div>

        <div className={styles.searchBar}>
          <i className="fal fa-search"></i>
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <section className={styles.contentContainer}>
          {isLoading && (
            <div
              className={styles.loaderContainer}
              style={{
                height: "100%",
                display: "grid",
                placeContent: "center",
              }}
            >
              <LoadingComponent width={30} height={30} />
            </div>
          )}
          {!isLoading &&
            (searchResults ?? members.length > 0)
              .sort((a, b) => a.displayName.localeCompare(b.displayName))
              .map((user) => {
                return (
                  <div
                    className={styles.member}
                    key={user.id}
                    onClick={() => handleSelectUser(user.id)}
                  >
                    <button className={styles.select}>
                      <i
                        style={{
                          color: selectedMembers?.includes(user.id)
                            ? "var(--primary)"
                            : "",
                        }}
                        className={
                          selectedMembers?.includes(user.id)
                            ? "fas fa-check-square"
                            : "fal fa-square"
                        }
                      ></i>
                    </button>
                    <Avatar user={user} />
                    <div className={styles.userInfo}>
                      <h4>{user.displayName}</h4>
                      <p>{user.jobTitle}</p>
                    </div>
                  </div>
                );
              })}
        </section>

        <div className={styles.actions}>
          <button onClick={handleAddMembers} className={styles.addBtn}>
            Add {selectedMembers?.length > 0 && `(${selectedMembers?.length})`}
          </button>
          <button onClick={handleClose} className={styles.cancelBtn}>
            Cancel
          </button>
        </div>
      </div>
    </section>
  );
};

const InviteMember = ({ projectId, onClose }) => {
  const [permissions, setPermissions] = useState([]);

  async function getPermissions() {
    const permisisonsData = await fetchPermissions(projectId);
    setPermissions(permisisonsData);
  }

  useEffect(() => {
    getPermissions();
  }, []);

  const [invitedGuests, setInvitedGuests] = useState([
    {
      id: uuidv4(),
      email: "",
      permission: "",
    },
  ]);

  function handleAddGuestField() {
    if (invitedGuests.length >= 5) {
      return;
    }

    setInvitedGuests([
      ...invitedGuests,
      {
        id: uuidv4(),
        email: "",
        permission: "",
      },
    ]);
  }

  const [isInviting, setIsInviting] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);

  async function handleInviteGuests() {
    for (const guest of invitedGuests) {
      if (!guest.email || !guest.permission) {
        warnToast("Please fill out all fields");
        return;
      }
    }

    setIsDisabled(true);
    setIsInviting(true);
    try {
    } catch (error) {
    } finally {
      setIsDisabled(false);
      setIsInviting(false);
      onClose();
    }
  }

  return (
    <section className={styles.inviteMemberLayout}>
      <div className={styles.inviteMemberContainer}>
        <button className={styles.closeBtn} onClick={onClose}>
          <i className="fal fa-times"></i>
        </button>

        <div className={styles.titleBar}>
          <i className="fad fa-users"></i>
          <h4>Invite Guests</h4>
          <span>Send invitation links to guests</span>
        </div>

        <div className={styles.content}>
          {invitedGuests.map((guest) => (
            <div key={guest.id} className={styles.invitationBar}>
              <input
                type="email"
                placeholder="Email"
                value={guest.email}
                onChange={(e) =>
                  setInvitedGuests(
                    invitedGuests.map((g) =>
                      g.id === guest.id ? { ...g, email: e.target.value } : g
                    )
                  )
                }
                className={styles.emailInput}
              />
              <select
                name="role"
                id="role"
                value={guest.permission}
                onChange={(e) =>
                  setInvitedGuests(
                    invitedGuests.map((g) =>
                      g.id === guest.id
                        ? { ...g, permission: e.target.value }
                        : g
                    )
                  )
                }
              >
                {permissions &&
                  permissions.map((permission) => (
                    <option value={permission.id}>{permission.name}</option>
                  ))}
              </select>
              {invitedGuests.length > 1 && (
                <button
                  className={styles.deleteBtn}
                  onClick={() =>
                    setInvitedGuests(
                      invitedGuests.filter((g) => g.id !== guest.id)
                    )
                  }
                >
                  <i className="far fa-times"></i>
                </button>
              )}
            </div>
          ))}
        </div>

        <div className={styles.actions}>
          <button className={styles.addBtn} onClick={handleAddGuestField}>
            <p>Add Field</p>
            <i className="fal fa-plus"></i>
          </button>

          <button className={styles.inviteBtn} onClick={handleInviteGuests}>
            <p>Invite</p>
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </section>
  );
};

const EditUser = ({ project, user, onClose }) => {
  const [isDisabled, setIsDisabled] = useState(false);
  const [isChangingRole, setIsChangingRole] = useState(false);

  const [selectedPermission, setSelectedPermission] = useState(user.permission);
  const [selectedRole, setSelectedRole] = useState(user.projectRole);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    async function fetchRolesAndPermissions() {
      const res1 = await fetchRoles(project.projectId);
      const res2 = await fetchPermissions();
      setRoles(res1);
      setPermissions(res2);
    }

    fetchRolesAndPermissions();
  }, [project.projectId, user]);

  async function handleSaveEdit() {
    const res = await editUserAccess(
      project.projectId,
      user.id,
      selectedPermission,
      selectedRole
    );
    if (res.success === true) {
      user.permission = res.permission;
      user.projectRole = res.role;
      onClose();
    } else {
      return;
    }
  }

  return (
    <section className={styles.editLayout}>
      <div className={styles.editContainer}>
        <div className={styles.top}>
          <h3>Edit User</h3>

          <button onClick={onClose}>
            <i className="fal fa-times"></i>
          </button>
        </div>

        <div className={styles.userInfo}>
          <Avatar user={user} width={50} height={50} />
          <div className={styles.info}>
            <h4>{user.displayName}</h4>
            <p>{user.mail}</p>
          </div>
        </div>

        <hr />

        <div className={styles.field}>
          <span>Access Level | Permission</span>
          <select name="permision" id="permision" value={selectedPermission} onChange={(e) => setSelectedPermission(e.target.value)}>
            {!permissions.length ?
              <option default hidden>
                Select Permission
              </option> :
              permissions.map((role, index) => (
                <option key={index} value={role.id}>
                  {role.name}
                </option>
              ))
            }
          </select>
        </div>

        <div className={styles.field}>
          <span>Role</span>
          <select name="role" id="role" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
            {!roles.length ?
              <option default hidden>
                Select Role
              </option> :
              roles.map((perm, index) => (
                <option key={index} value={perm.id}>
                  {perm.name}
                </option>
              ))
            }
          </select>
        </div>

        <button className={styles.saveBtn} onClick={() => handleSaveEdit()}>
          Save
        </button>
      </div>
    </section>
  );
};

export default function TeamMembers() {
  const { project } = useProject();
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [projectMembers, setprojectMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function getMembers(projectId) {
      const res = await fetchprojectMembers(projectId);
      setprojectMembers(res);
      setIsLoading(false);
    }

    getMembers(project.projectId);
  }, [project]);

  function handleSelectAll() {
    if (selectedMembers.length > 0) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(projectMembers.map((user) => user.id));
    }
  }

  function handleSelectUser(userId) {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter((id) => id !== userId));
    } else {
      setSelectedMembers([...selectedMembers, userId]);
    }
  }

  const [isDeletingMember, setIsDeletingMember] = useState(false);

  const [isAddingMember, setIsAddingMember] = useState(false);

  function handleAddMember() {
    setIsAddingMember(true);
  }

  // edit functionality
  const [isEditingUser, setIsEditingRole] = useState(false);

  function handleEditRole(user) {
    setSelectedMember(user);
    setIsEditingRole(true);
  }

  // delete functionality
  async function handleDeleteMember(e) {
    const user = projectMembers.find((user) => user.id === e.id);
    const res = await deleteUserFromProject(project.projectId, [user.id]);
    if (res === true) projectMembers.splice(projectMembers.indexOf(user), 1);
    setIsDeletingMember(false);
    setSelectedMember(null);
  }

  async function handleDeleteBulkMembers() {
    const res = await deleteUserFromProject(project.projectId, selectedMembers);
    if (res === true) {
      const updatedMembers = projectMembers.filter(
        (user) => !selectedMembers.includes(user.id)
      );
      setprojectMembers(updatedMembers);
    }
    setIsDeletingMember(false);
    setSelectedMembers([]);
  }

  // invite functionality
  const [isInvitingMember, setIsInvitingMember] = useState(false);
  return (
    <section className={styles.content}>
      <div className={styles.titleContainer}>
        <h3 className={styles.title}>
          Project Members
          <span>{projectMembers.length} users</span>
          {selectedMembers.length > 0 && (
            <span className={styles.selectedMembers}>
              {`${selectedMembers.length} selected`}
            </span>
          )}
        </h3>

        <div className={styles.actions}>
          <button
            className={styles.deleteBtn}
            disabled={selectedMembers.length === 0}
            onClick={() => setIsDeletingMember(true)}
          >
            <i className="fal fa-trash"></i>
          </button>

          <hr className={styles.separator} />

          <button className={styles.downloadBtn}>
            <i className="fal fa-arrow-down-to-line"></i>
            <p>Download</p>
          </button>

          <button
            className={styles.inviteBtn}
            onClick={() => setIsInvitingMember(true)}
          >
            <i className="fal fa-plus"></i>
            <p>Invite</p>
          </button>

          <button className={styles.addUserBtn} onClick={handleAddMember}>
            <i className="fal fa-user-plus"></i>
            <p>Add Member</p>
          </button>
        </div>
      </div>

      <section className={styles.membersContainer}>
        <div className={styles.titles}>
          <button className={styles.select} onClick={handleSelectAll}>
            <i
              style={{
                color: selectedMembers.length > 0 ? "var(--primary)" : "",
              }}
              className={
                selectedMembers.length > 0 &&
                  selectedMembers.length < projectMembers.length
                  ? "fas fa-square-minus"
                  : selectedMembers.length === projectMembers.length
                    ? "fas fa-check-square"
                    : "fal fa-square"
              }
            ></i>
          </button>
          <span className={styles.title}>Name</span>
          <span className={styles.status}>Status</span>
          <span className={styles.designation}>Designation</span>
          <span className={styles.role}>Access Level</span>
          <span className={styles.role}>Role</span>
          <span className={styles.actions}>Actions</span>
        </div>

        <div className={styles.membersList}>
          {isLoading && <LoadingComponent width={35} height={35} />}
          {!isLoading &&
            projectMembers.length !== 0 &&
            projectMembers
              .sort((a, b) => a.displayName.localeCompare(b.displayName))
              .map((user, index) => (
                <Members
                  key={index}
                  user={user}
                  isSelected={selectedMembers.includes(user.id)}
                  onUserSelect={(e) => handleSelectUser(e)}
                  onEditUser={(e) => handleEditRole(e)}
                  onDeleteUser={(e) => {
                    setIsDeletingMember(true);
                    setSelectedMember(e);
                  }}
                />
              ))}
          {!isLoading && projectMembers.length === 0 && (
            <EmptyComponent
              title={"No Members Found"}
              message={"Add or invite memebers to the team"}
            />
          )}
        </div>
      </section>

      {isAddingMember && (
        <AddNewMember
          project={project}
          projectmembers={projectMembers}
          onClose={() => setIsAddingMember(false)}
        />
      )}

      {isDeletingMember && (
        <DeleteConfirmationBox
          question={
            selectedMember
              ? `Are you sure you want to remove ${selectedMember.displayName} from the team?`
              : `Are you sure you want to remove ${selectedMembers.length} members from the team?`
          }
          onCancel={() => setIsDeletingMember(false)}
          onDelete={() => {
            selectedMember
              ? handleDeleteMember(selectedMember)
              : handleDeleteBulkMembers();
          }}
        />
      )}

      {isInvitingMember && (
        <InviteMember
          projectId={project.projectId}
          onClose={() => setIsInvitingMember(false)}
        />
      )}

      {isEditingUser && (
        <EditUser
          project={project}
          user={selectedMember}
          onClose={() => setIsEditingRole(false)}
        />
      )}
    </section>
  );
}
