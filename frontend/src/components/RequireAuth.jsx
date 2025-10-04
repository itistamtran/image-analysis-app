import { Navigate, useLocation } from "react-router-dom";

export default function RequireAuth({ children }) {
    const token = localStorage.getItem("token");
    const location = useLocation();

    if (!token) {
        // redirect to login, but remember where user wanted to go
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    return children;
}
