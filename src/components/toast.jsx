import styles from '../styles/components/toast.module.css'

import { toast } from "sonner";

export const successToast = (message) => {
    toast.success(message, {
        unstyled: true,
        classNames: {
            toast: styles.toast,
            icon: styles.iconSuccess,
            title: styles.title,
        }
    })
}

export const addedSuccessToast = (message, onclick) => {
    toast.success(message, {
        unstyled: true,
        classNames: {
            toast: styles.toast,
            icon: styles.iconSuccess,
            title: styles.title,
        },
        action: {
            label: 'View All',
            onClick: onclick,
        },
        actionButtonStyle: {
            borderWidth: 0,
            background: 'none',
            padding: 0,
            color: 'var(--main)',
            fontWeight: '500',
            cursor: 'pointer',
        }
    })
}

export const errorToast = (message) => {
    toast.error(message, {
        unstyled: true,
        classNames: {
            toast: styles.toast,
            icon: styles.iconError,
            title: styles.title,
        },
    })
}

export const errorToastPersist = (message, duration) => {
    toast.error(message, {
        unstyled: true,
        duration: duration,
        dismissible: false,
        classNames: {
            toast: styles.toast,
            icon: styles.iconError,
            title: styles.title,
        },
    })
}

export const warnToast = (message) => {
    toast.warning(message, {
        unstyled: true,
        classNames: {
            toast: styles.toast,
            icon: styles.iconWarn,
            title: styles.title,
        },
    })
}

