import Lottie from 'lottie-react';
import { Navigate, useLocation } from 'react-router';

import { useAuth } from '../contexts/authContext';

import AppIcon from '../assets/appicons/icon.svg';
import LoadingAmin from '../assets/lottie/loading.json';

export default function LandingPage() {

    const location = useLocation();
    const from = location?.state?.from?.pathname || '/all-projects';

    const { loading, isAuthenticated } = useAuth();

    if (loading) return (
        <main style={{ width: '100vw', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <img
                    loading='lazy'
                    src={AppIcon}
                    alt="App Icon"
                    width={150}
                />
            </div>

            <Lottie
                autoPlay
                loop
                animationData={LoadingAmin}
                style={{ width: 40 }}
            />
        </main>
    )

    if (isAuthenticated) {
        return <Navigate to={from} replace />
    } else {
        return <Navigate to='/login' state={{ from: location }} replace />
    }
}
