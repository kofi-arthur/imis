import styles from '../styles/components/userCard.module.css'

export const UserCard = ({ mousePos, user }) => {
    return (
        <div
            className={styles.userCard}
            style={{
                top: mousePos.y + 10,
                left: mousePos.x + 10,
            }}
        >
            <div className={styles.userInfo}>
                <div className={styles.avatar}>
                    <div className={styles.onlineStatus}></div>
                </div>
                <div className={styles.info}>
                    <h4>{user.displayName}</h4>
                    <p>{user.designation}</p>
                    <span>{user.department}</span>
                </div>
            </div>
            {/* <div className={styles.actions}>
                <button><i className="fal fa-envelope"></i> Email</button>
                <button><i className="fal fa-comment"></i> Chat</button>
            </div> */}
        </div>
    )
}
