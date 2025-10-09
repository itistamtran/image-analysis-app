import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function VerifiedPage() {
  const { token } = useParams();
  const [status, setStatus] = useState("Verifying your email...");
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      console.log("API:", import.meta.env.VITE_API_BASE_URL);
      console.log("Token:", token);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/verify/${token}`
        );
        if (response.ok) {
          setStatus("✅ Email verified successfully! Redirecting to login...");
          setTimeout(
            () =>
              navigate("/login", {
                state: { message: "✅ Email verified! You can now log in." },
              }),
            2000
          );
        } else {
          setStatus("⚠️ Invalid or expired verification link.");
          setTimeout(() => navigate("/login"), 3000);
        }
      } catch (err) {
        console.error("Verification error:", err);
        setStatus("❌ Server error during verification.");
        setTimeout(() => navigate("/login"), 3000);
      }
    };
    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen text-white">
      <div
        className="fixed inset-0 bg-center bg-cover -z-20"
        style={{ backgroundImage: "url('/bg-gradient.jpg')" }}
      />
      <div className="fixed inset-0 pointer-events-none -z-10">
        <video
          className="object-cover w-full h-full opacity-80 blur-md"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/bg-video-1.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <div className="p-6 text-center shadow-lg bg-gradient-to-br from-cyan-500/30 to-blue-700/30 backdrop-blur-md rounded-xl">
        <h1 className="mb-4 text-3xl font-bold font-neue-machina-bold">
          {status.startsWith("✅") ? "Email Verified!" : "Verifying..."}
        </h1>
        <p className="text-lg text-cyan-200 font-neue-machina">{status}</p>
      </div>
    </div>
  );
}
