import styles from '../styles/components/status.module.css'

export const StatusComponent = ({ item }) => {
    const data = item?.status.toLowerCase();

    const now = new Date();
    const start = new Date(item?.startDate);
    const due = new Date(item?.dueDate);
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day ahead    

    const isDelayed = due < now && (data !== "completed" && data !== "in progress");
    const isCompleted = data === "completed";
    const isUpcoming = (start > now && start <= oneDayFromNow) && !isCompleted;

    const computedStatus = isDelayed ? "delayed" :
        isUpcoming ? "upcoming" : data;

    return (
        <div
            className={styles.status}
            style={{
                backgroundColor: computedStatus === 'completed' ?
                    'var(--completed-bg)' : computedStatus === 'in progress' ?
                        'var(--in-progress-bg)' : computedStatus === 'upcoming' ?
                            'var(--upcoming-bg)' : computedStatus === 'delayed' ?
                                'var(--delayed-bg)' : 'var(--todo-bg)',
                color: computedStatus === 'completed' ?
                    'var(--completed)' : computedStatus === 'in progress' ?
                        'var(--in-progress)' : computedStatus === 'upcoming' ?
                            'var(--upcoming)' : computedStatus === 'delayed' ?
                                'var(--delayed)' : 'var(--todo)',
                border: computedStatus === 'upcoming' ? '1px solid var(--border)' : ''
            }}
        >
            <p>{isDelayed ? "delayed" : computedStatus}</p>
        </div>
    )
}

export const RoleComponent = ({ role }) => {
    const r = role.toLowerCase();
    return (
        <div className={styles.role}>
            <p style={{
                color: r === 'owner' ?
                    'var(--owner)' : r === 'planner' ?
                        'var(--planner)' : r === 'manager' ?
                            'var(--manager)' : (r === 'contributor' || r === 'user') ?
                                'var(--contributor)' : 'var(--viewer)'
            }}
            >
                {role}
            </p>
        </div>
    )
}