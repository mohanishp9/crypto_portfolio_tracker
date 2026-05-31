import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../app/store";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);

    // If not authenticated, redirect to landing page
    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    // If authenticated, render the protected content
    return <>{children}</>;
};

export default ProtectedRoute;