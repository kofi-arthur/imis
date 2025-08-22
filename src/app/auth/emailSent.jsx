import styles from '../../styles/app/auth/auth.module.css'

import React from 'react'

import CheckAnimation from '../../assets/lottie/check.json'
import Lottie from 'lottie-react'

export default function EmailSent() {
    return (
        <div className={styles.emailSendContainer}>
            <Lottie
                animationData={CheckAnimation}
                loop={false}
                autoPlay={true}
            />
            <h1>Email Sent</h1>
            <p>Check the email you provided for a link to reset your password</p>
        </div>
    )
}
