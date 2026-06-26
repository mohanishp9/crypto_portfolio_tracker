import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../app/store";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const { isAuthenticated, isInitialized } = useSelector((state: RootState) => state.auth);

    // AuthLoader hasn't finished the silent refresh yet — render nothing
    // to prevent an incorrect redirect to the landing page.
    if (!isInitialized) {
        return null;
    }

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;