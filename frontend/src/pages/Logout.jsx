import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Home from "./Home";

export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    // clear auth data
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    // redirect after short delay to show UI
    const timeout = setTimeout(() => {
      navigate("/", { replace: true });
    }, 800); // small delay creates smooth UX

    return () => clearTimeout(timeout);
  }, [navigate]);

  // render homepage during logout
  return <Home />;
}
