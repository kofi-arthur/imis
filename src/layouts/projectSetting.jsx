import styles from '../styles/layouts/projectSetting.module.css'

import { NavLink, Outlet } from 'react-router'

const NavigationTab = ({ name, link }) => {
    return (
        <NavLink to={link} end>
            {({ isActive }) => (
                <div className={`${styles.navigationTabItem} ${isActive ? styles.active : ''}`} >
                    <p>{name}</p>
                </div>
            )}
        </NavLink>
    )
}

export default function ProjectSettings() {

    const links = [
        {
            name: 'General',
            link: ''
        }, {
            name: 'Project Members',
            link: 'project-members'
        }, {
            name: 'Activity Logs',
            link: 'activity-logs'
        }, {
            name: 'Backup/Restore',
            link: 'backup'
        }
    ]

    return (
        <section className={styles.projectSettingsLayout}>
            <h1 className={styles.title}>Project Settings</h1>

            <section className={styles.navigationTab}>
                {links.map((link, idx) => <NavigationTab key={idx} name={link.name} link={link.link} />)}
            </section>

            <Outlet />
        </section>
    )
}
