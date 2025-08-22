import styles from "../../../styles/app/client/projectSettings/logs.module.css";

import { useEffect, useState } from "react";

import { EmptyComponent } from "../../../components/error";
import { useProject } from "../../../contexts/projectContext";

import { LoadingComponent } from "../../../../../iticket-new/src/components/loadingComponents";
import {
    fetchprojectMembers
} from "../../../services/api";

const Log = () => {
    return (
        <div className={styles.log}>
            <p>Samuel Barnes invited you to a project</p>
            <span>August 12, 2025</span>
        </div>
    );
};

export default function ActivityLogs() {
    const { project } = useProject();
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

    // invite functionality
    const [isInvitingMember, setIsInvitingMember] = useState(false);
    return (
        <section className={styles.content}>
            <div className={styles.titleContainer}>
                <h3 className={styles.title}>
                    Activity Logs
                </h3>

                <div className={styles.actions}>
                    <button className={styles.downloadBtn}>
                        <i className="fal fa-arrow-down-to-line"></i>
                        <p>Download</p>
                    </button>
                </div>
            </div>

            <section className={styles.membersContainer}>
                <div className={styles.titles}>
                    <span className={styles.title}>Logs</span>
                    <span className={styles.date}>Date Created</span>
                </div>

                <div className={styles.membersList}>
                    {isLoading && <LoadingComponent width={35} height={35} />}
                    {/* {!isLoading &&
                        projectMembers.length !== 0 &&
                        projectMembers
                            .sort((a, b) => a.displayName.localeCompare(b.displayName))
                            .map((user, index) => (
                                <Logs
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
                            ))} */}
                    <Log />
                    {!isLoading && projectMembers.length === 0 && (
                        <EmptyComponent
                            title={"No Logs Yet"}
                            message={"These will automatically be created when you start a project."}
                        />
                    )}
                </div>
            </section>
        </section>
    );
}
