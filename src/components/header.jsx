import styles from '../styles/components/header.module.css';

import UserIcon from "../assets/user.svg";

export default function Header({ isNotificationActive, toggleNotification, user }) {
    return (
        <header className={styles.header}>
            <div className={styles.actionBtnContainer}>
                <button
                    className={styles.actionBtn}
                    onClick={() => toggleNotification()}
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
    )
}
