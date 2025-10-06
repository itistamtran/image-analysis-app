const API_BASE =
    import.meta.env.VITE_API_BASE_URL ||
    ((window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
        ? "http://127.0.0.1:5001"
        : "https://flask-api-production-f9b2.up.railway.app");

export default API_BASE;
