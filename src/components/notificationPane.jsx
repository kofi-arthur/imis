import styles from "../styles/components/notificationPane.module.css";
import { EmptyComponent } from "./error";

export const NotificationPane = ({ isActive, onClose }) => {
    return (
        <div
            className={`${styles.notificationPane} ${isActive ? styles.active : ""}`}
        >
            <div className={styles.titleContainer}>
                <h3 className={styles.title}>Notification</h3>
                <button className={styles.closeBtn} onClick={onClose}>
                    <i className="fal fa-times"></i>
                </button>
            </div>

            <section className={styles.content}>
                <EmptyComponent title={"No notifications"} message={"You don't have notifications yet"} />
            </section>
        </div>
    );
};