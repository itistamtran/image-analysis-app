const API_BASE =
    process.env.NODE_ENV === "development"
        ? "http://localhost:5001"
        : "https://flask-api-production-f9b2.up.railway.app";

export default API_BASE;
