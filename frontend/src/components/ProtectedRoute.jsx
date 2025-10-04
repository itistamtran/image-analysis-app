import { Navigate, useLocation } from "react-router-dom";
import { normalizeUser } from "../utils/user";

function ProtectedRoute({ allowedRoles, children }) {
    const location = useLocation();

    let user = null;
    try {
        const raw = localStorage.getItem("user");
        if (raw) {
            user = JSON.parse(raw);
            user = normalizeUser(user);
        }
    } catch {
        user = null;
    }

    // not logged in
    if (!user) {
        return (
            <Navigate
                to="/login"
                state={{ from: location.pathname, message: "Please log in first" }}
                replace
            />
        );
    }


    // role not allowed
    if (!allowedRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" />;
    }

    // doctors must be verified
    if (user.role === "DOCTOR" && user.verification_status !== "VERIFIED") {
        return <Navigate to="/pending-verification" />;
    }

    // otherwise grant access
    return <>{children}</>;
}

export default ProtectedRoute;
