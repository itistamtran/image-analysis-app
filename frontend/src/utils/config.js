const API_BASE =
    import.meta.env.VITE_API_BASE_URL ||
    (window.location.hostname === "localhost"
        ? "http://192.168.1.24:5001"
        : "https://flask-api-production-f9b2.up.railway.app");

export default API_BASE;
