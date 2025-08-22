import styles from '../styles/components/avatarStack.module.css'

import { getRandomColor } from '../utils/randomColors'

export default function AvatarStack({ users = [], maxVisible = 4 }) {
    const visibleUsers = users.slice(0, maxVisible)
    const extraCount = users.length - maxVisible
    return (
        <div className={styles.avatarStack}>
            {visibleUsers?.map((user, idx) => {
                const hasImage = Boolean(user.avatar)
                const initial = user.displayName?.charAt(0).toUpperCase()
                const bgColor = getRandomColor(user.displayName)

                return hasImage ? (
                    <img
                        key={idx}
                        loading='lazy'
                        className={styles.avatar}
                        src={user.avatar}
                        alt={`${user.displayName}'s profile picture`}
                        title={user.displayName}
                    />
                ) : (
                    <div
                        key={idx}
                        className={styles.nameAvatar}
                        title={user.displayName}
                        style={{ backgroundColor: bgColor }}
                    >
                        <p>{initial}</p>
                    </div>
                )
            })}
            {extraCount > 0 && (
                <div className={styles.extraAvatar}>
                    <span>+{extraCount}</span>
                </div>
            )}
        </div>
    )
}

export function Avatar({ user, type, width, height }) {
    const initial = user.displayName?.charAt(0).toUpperCase()
    const bgColor = getRandomColor(user.displayName);

    return (
        <div className={styles.avatarContainer} style={{ width, height }}>
            {
                user?.avatar ?
                    <img className={styles.avatar} src={type === 'client' ?
                        `../../backend/clients/${user?.id}/avatar/${user?.avatar}` :
                        // `../../backend/users/${user?.id}/avatar/${user?.avatar}`
                        user?.avatar
                    }
                        alt={`${user.displayName}'s profile picture`}
                        title={user.displayName}
                        style={{ width, height }}
                    /> :
                    <div
                        className={styles.nameAvatar}
                        title={user.displayName}
                        style={{ backgroundColor: bgColor, width, height }}
                    >
                        <p>{initial}</p>
                    </div>
            }
        </div>
    )
}

export function UserAvatarWithStatus({ user }) {
    const hasImage = Boolean(user?.avatar)
    const initial = user?.displayName?.charAt(0).toUpperCase()
    const bgColor = getRandomColor(user?.displayName)

    return (
        <div className={styles.userAvatarContainer}>
            {hasImage ?
                <img src={user?.avatar} alt="user's avatar" /> :
                <div
                    className={styles.nameAvatar}
                    title={user?.displayName}
                    style={{ backgroundColor: bgColor }}
                >
                    <p>{initial}</p>
                </div>
            }
            <div className={styles.onlineStatus}></div>
        </div>
    )
}