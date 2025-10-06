let API_BASE = "https://flask-api-production-f9b2.up.railway.app";
try {
    if (import.meta && import.meta.env && import.meta.env.VITE_API_BASE_URL) {
        API_BASE = import.meta.env.VITE_API_BASE_URL;
    }
} catch (e) {
    console.warn("import.meta.env not accessible, using fallback URL");
}

if (!API_BASE && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    API_BASE = "http://127.0.0.1:5001";
}

console.log("Resolved API_BASE:", API_BASE);

export default API_BASE;
