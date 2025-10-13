import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { TextField, Button, Typography, Box } from "@mui/material";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const location = useLocation();

    // Extract ?success=true from the URL
    const params = new URLSearchParams(location.search);
    const success = params.get("success");

    useEffect(() => {
        if (success === "true") {
            setMessage("✅ Your password was successfully changed! You can now log in.");
        }
    }, [success]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/forgot-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage("📧 A password reset email has been sent. Please check your inbox.");
                setEmail("");
            } else {
                setError(data.message || "⚠️ Could not send reset email. Please check your email address.");
            }
        }   catch (err) {
                console.error(err);
                setError("⚠️ Server error. Please try again later.");
        }
    };


    return (
        <div className="relative flex flex-col min-h-screen text-white">
            <div className="fixed inset-0 bg-center bg-cover -z-20" style={{ backgroundImage: "url('/bg-gradient.jpg')" }} />
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
            <div className="flex items-center justify-center flex-1">
                <div className="w-[85%] md:w-[35%] bg-gradient-to-br from-cyan-500/30 to-blue-700/30 backdrop-blur-md p-6 rounded-xl ">
                    <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: 400 }}>
                        <Typography variant="h5" sx={{ mb: 3, fontFamily: 'Neue Machina Bold, sans-serif', letterSpacing: '0.15em', textAlign: 'center' }}>
                            Forgot Password
                        </Typography>

                        <Typography sx={{ mb: 2, fontFamily: 'Neue Machina, sans-serif', letterSpacing: '0.1em', textAlign: 'center' }}>
                            Enter your email to receive a password reset link.
                        </Typography>
                        <TextField
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            fullWidth
                            required
                            variant="outlined"
                            sx={{
                                mb: 2,
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                                        borderColor: '#00bfff', // initial border color
                                    },
                                    '&:hover fieldset': {
                                        borderColor: '#5de0e6', // hover border
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#5de0e6', // focus border
                                        boxShadow: '0 0 10px #5de0e6',
                                    },
                                },
                                '& .MuiInputLabel-root': {
                                    color: '#94a3b8',
                                    fontFamily: 'Neue Machina, sans-serif',
                                    letterSpacing: '0.1em',
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                    color: '#5de0e6',
                                },
                                input: { color: "white", fontFamily: 'Neue Machina, sans-serif', letterSpacing: '0.1em', },
                                label: { color: "#94a3b8", fontFamily: 'Neue Machina, sans-serif', letterSpacing: '0.1em', },
                            }}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            sx={{
                                background: "linear-gradient(to right, #5de0e6, #004aad)",
                                fontFamily: 'Neue Machina Bold, sans-serif',
                                letterSpacing: '0.1em',
                            }}
                        >
                            Send Reset Link
                        </Button>
                    </form>

                    {message && (
                        <Typography sx={{ mt: 3, color: "#5de0e6", textAlign: "center", fontFamily: 'Neue Machina, sans-serif', letterSpacing: '0.1em', }}>
                            {message}
                            {success === "true" && (
                                <>
                                    <br />
                                    <Button
                                        onClick={() => navigate("/login")}
                                        sx={{
                                            mt: 1,
                                            color: "#5de0e6",
                                            textDecoration: "underline",
                                            fontFamily: 'Neue Machina, sans-serif',
                                            letterSpacing: '0.1em',
                                        }}
                                    >
                                        Go to Login
                                    </Button>
                                </>
                            )}
                        </Typography>
                    )}
                    {error && <Typography sx={{ mt: 2, color: "red", fontFamily: 'Neue Machina, sans-serif', letterSpacing: '0.1em', }}>{error}</Typography>}

                </div>
            </div>

        </div>

    );
}