let API_BASE;

if (typeof window !== "undefined") {
  const host = window.location.hostname;

  if (host === "localhost" || host === "127.0.0.1") {
    // Local backend
    API_BASE = "http://127.0.0.1:5001";
  } else {
    // Production backend
    API_BASE = "https://medscanai.up.railway.app";
  }
}

export default API_BASE;
