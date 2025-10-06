let API_BASE = "https://flask-api-production-f9b2.up.railway.app";

if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    API_BASE = "http://127.0.0.1:5001";
}

console.log("API_BASE =", API_BASE);
export default API_BASE;
