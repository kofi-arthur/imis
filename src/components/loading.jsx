import styles from '../styles/components/loadingScreen.module.css'

import Lottie from 'lottie-react'

import LoadingAnim from '../assets/lottie/loading.json'

export const LoadingScreenComponent = () => {
    return (
        <section className={styles.loadingSection}>
            <Lottie
                animationData={LoadingAnim}
                loop={true}
                autoPlay={true}
                className={styles.loadingAnim}
            />
        </section>
    )
}

export const LoadingComponent = ({ width, height }) => {
    return (
        <Lottie
            animationData={LoadingAnim}
            loop={true}
            autoPlay={true}
            className={styles.loadingAnim}
            style={{ width, height, margin: 'auto' }}
        />
    )
}