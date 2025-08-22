import styles from '../styles/components/navigationItem.module.css'

import { NavLink } from "react-router"

const NavigationItem = ({ link, icon, activeIcon, name, onClick, end }) => {
    return (
        <NavLink to={link} onClick={onClick} end={end}>
            {({ isActive }) => (
                <div className={`${styles.navigationItem} ${isActive ? styles.active : ''}`}>
                    <i className={isActive ? activeIcon : icon} style={{ color: isActive ? 'var(--primary)' : '' }}></i>
                    <p>{name}</p>
                </div>
            )}
        </NavLink>
    )
}

export default NavigationItem