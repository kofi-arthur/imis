import styles from '../styles/components/confirmationBox.module.css'

export default function DeleteConfirmationBox({ question, onCancel, onDelete }) {
    return (
        <section className={styles.confimationOverlay}>
            <div className={styles.deleteConfirmationBox}>
                <h3>Confirm Deletion</h3>
                <p>{question}</p>
                <div className={styles.actions}>
                    <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
                    <button className={styles.deleteBtn} onClick={onDelete}>Delete</button>
                </div>
            </div>
        </section>
    )
}

export function LogoutConfirmationBox({ onCancel, onLogout }) {
    return (
        <section className={styles.confimationOverlay}>
            <div className={styles.deleteConfirmationBox}>
                <h3>Confirm Logout</h3>
                <p>Are you sure you want to logout?</p>
                <div className={styles.actions}>
                    <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
                    <button className={styles.deleteBtn} onClick={onLogout}>Logout</button>
                </div>
            </div>
        </section>
    )
}
