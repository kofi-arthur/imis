import styles from '../styles/layouts/authLayout.module.css'

import { Outlet } from 'react-router'

import AppIcon from '/favicon.svg'

export default function AuthLayout() {

    return (
        <main className={styles.authLayout}>
            <img
                src={AppIcon}
                alt="imis Icon"
                className={styles.icon}
                loading='lazy'
            />
            <Outlet />
            <footer>
                <p>&copy; {new Date().getFullYear()} imis. Built for Wayoe Engineering & Construction Ltd.</p>
            </footer>
        </main>
    )
}
