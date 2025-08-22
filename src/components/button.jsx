import styles from '../styles/components/button.module.css'

import { useNavigate } from 'react-router'

export const ViewAllBtn = ({ link }) => {
    const navigate = useNavigate()

    return (
        <button className={styles.viewAllbtn} onClick={() => navigate(link)}>
            <p>View All</p>
            <i className="fal fa-arrow-up-right-from-square"></i>
        </button>
    )
}