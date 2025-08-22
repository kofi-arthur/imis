import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../contexts/authContext';
import { LoadingScreenComponent } from '../components/loading';

function ProtectedRoute({ allowedRoles = [], redirectTo = '/login' }) {

     const { user, loading, isAuthenticated } = useAuth();
    const location = useLocation();

    if (loading) return <LoadingScreenComponent />; // Show loading screen while checking auth status

    if (!isAuthenticated) {
        return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
        return <Navigate to="/login" replace />; // Redirect unauthorized users
    }

    // If all checks pass, render the child routes (Outlet)
    return <Outlet />;
}

export default ProtectedRoute