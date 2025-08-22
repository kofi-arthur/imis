import styles from '../styles/components/priority.module.css'

export const Priority = ({ priorityData }) => {
    const priority = priorityData.toLowerCase()
    return (
        <div className={styles.priority}>
            <i
                className="fas fa-circle"
                style={{
                    color: priority === 'low' ?
                        'var(--low)' : priority === 'medium' ?
                            'var(--medium-priority)' : 'var(--high)'
                }}
            ></i>
            <p>{priority}</p>
        </div>
    )
}
