import styles from '../styles/components/error.module.css'

import ErrorImg from '../assets/appicons/icon-gray.svg'
import EmptyIcon from '../assets/states/emptyBox.svg'

export function ErrorComponent({ title, message }) {
    return (
        <section className={styles.errorContainer}>
            <img src={ErrorImg} alt='gray scale app icon' width={80} />
            <h4>{title}</h4>
            <p>{message}</p>
        </section>
    )
}

export function ErrorComponentMini({ title, message }) {
    return (
        <section className={styles.errorContainerMini}>
            <img src={ErrorImg} alt='gray scale app icon' width={80} />
            <h4>{title}</h4>
            <p>{message}</p>
        </section>
    )
}

export function EmptyComponent({ title, message }) {
    return (
        <section className={styles.emptyContainer}>
            <img src={ErrorImg} alt='gray scale app icon' width={80} />
            <h4>{title}</h4>
            <p>{message}</p>
        </section>
    )
}
