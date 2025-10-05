const API_BASE =
    import.meta.env.MODE === "development"
        ? "http://localhost:5001"
        : "https://flask-api-production-f9b2.up.railway.app";

export default API_BASE;
