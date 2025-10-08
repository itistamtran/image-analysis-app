import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TextField, Button, Typography } from "@mui/material";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (password !== confirmPassword) {
      setError("⚠️ Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage("✅ Password reset successful! Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(data.error || "⚠️ Something went wrong. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("⚠️ Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col min-h-screen text-white">
      {/* Background layers */}
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
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Content */}
      <div className="flex items-center justify-center flex-1">
        <div className="md:w-[35%] bg-gradient-to-br from-cyan-500/30 to-blue-700/30 backdrop-blur-md p-6 rounded-xl">
          <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: 400 }}>
            <Typography
              variant="h5"
              sx={{
                mb: 3,
                fontFamily: "Neue Machina Bold, sans-serif",
                letterSpacing: "0.15em",
                textAlign: "center",
              }}
            >
              Reset Password
            </Typography>

            <Typography
              sx={{
                mb: 2,
                fontFamily: "Neue Machina, sans-serif",
                letterSpacing: "0.1em",
                textAlign: "center",
              }}
            >
              Enter your new password below.
            </Typography>

            <TextField
              label="New Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
              variant="outlined"
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#00bfff' },
                  '&:hover fieldset': { borderColor: '#5de0e6' },
                  '&.Mui-focused fieldset': {
                    borderColor: '#5de0e6',
                    boxShadow: '0 0 10px #5de0e6',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#94a3b8',
                  fontFamily: 'Neue Machina, sans-serif',
                  letterSpacing: '0.1em',
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#5de0e6' },
                input: {
                  color: 'white',
                  fontFamily: 'Neue Machina, sans-serif',
                  letterSpacing: '0.1em',
                },
              }}
            />

            <TextField
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
              required
              variant="outlined"
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#00bfff' },
                  '&:hover fieldset': { borderColor: '#5de0e6' },
                  '&.Mui-focused fieldset': {
                    borderColor: '#5de0e6',
                    boxShadow: '0 0 10px #5de0e6',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#94a3b8',
                  fontFamily: 'Neue Machina, sans-serif',
                  letterSpacing: '0.1em',
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#5de0e6' },
                input: {
                  color: 'white',
                  fontFamily: 'Neue Machina, sans-serif',
                  letterSpacing: '0.1em',
                },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{
                background: "linear-gradient(to right, #5de0e6, #004aad)",
                fontFamily: "Neue Machina Bold, sans-serif",
                letterSpacing: "0.1em",
              }}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>

          {message && (
            <Typography
              sx={{
                mt: 3,
                color: "#5de0e6",
                textAlign: "center",
                fontFamily: "Neue Machina, sans-serif",
                letterSpacing: "0.1em",
              }}
            >
              {message}
            </Typography>
          )}
          {error && (
            <Typography
              sx={{
                mt: 3,
                color: "red",
                textAlign: "center",
                fontFamily: "Neue Machina, sans-serif",
                letterSpacing: "0.1em",
              }}
            >
              {error}
            </Typography>
          )}
        </div>
      </div>
    </div>
  );
}
