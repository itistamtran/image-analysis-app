import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import API_BASE from "../utils/config";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from || null;
    const message = location.state?.message || null;
    const [hover, setHover] = useState(false);

    const normalizeUser = (data) => {
        const userData = data.profile ? data.profile : data;

        return {
            ...userData,
            verification_status: userData.verification_status || userData.verificationStatus,
        };
    };


    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");
        
        try {
            const res = await axios.post(`${API_BASE}/login`, {
                email,
                password,
            });

            // clear any previous user and scan data before saving new login
            localStorage.clear();

            const raw = res.data.profile ? res.data.profile : res.data;

            const normalized = {
                ...raw,
                verification_status: raw.verification_status || raw.verificationStatus,
            };

            const role = normalized.role || "PATIENT";

            localStorage.setItem("user", JSON.stringify({ ...normalized, role }));

            if (from && typeof from === "string") {
                navigate(from, { replace: true });
            } else {
                if (role === "PATIENT") {
                    navigate("/patient-dashboard");
                } else if (role === "DOCTOR") {
                    navigate("/doctor-dashboard");
                }
            }
        } catch (err) {
            const status = err.response?.status;
            const errorMsg = err.response?.data?.error || "Login failed";

            if (status === 403) {
                setError(
                    "Your account is not verified yet. Please check your inbox or spam folder for the verification email."
                );
            } else if (status === 401) {
                setError("Invalid email or password. Please try again.");
            } else {
                setError(errorMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    // Resend verification email
    const handleResendVerification = async () => {
        try {
            await axios.post(`${API_BASE}/resend-verification`, { email });
            setError(""); // clear the error message
            setSuccess("A new verification email has been sent. Please check your inbox or spam folder.");
        } catch (err) {
            console.error("Failed to resend verification email:", err);
            setError("Failed to resend verification email. Please try again later.");
            setSuccess(""); // clear success in case of failure
        }
    };

    // Google login
    const handleGoogleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            const token = await user.getIdToken();

            const res = await axios.post(`${API_BASE}/login/google`, { token });

            const raw = res.data.profile ? res.data.profile : res.data;

            const normalized = {
                ...raw,
                role: "PATIENT", // always PATIENT for Google
                verification_status: raw.verification_status || raw.verificationStatus,
            };

            localStorage.setItem("user", JSON.stringify(normalized));

            if (from && typeof from === "string") {
                navigate(from, { replace: true });
            } else {
                navigate("/patient-dashboard");
            }
        } catch (err) {
            console.error("Google login failed:", err);
            setError("Google login failed");
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
                    <form
                        onSubmit={handleLogin}
                        className="space-y-6"
                    >
                        <h2 className="mb-6 text-2xl font-bold tracking-wider text-center text-white font-neue-machina-bold">Login</h2>

                        {/* Show redirect message if exists */}
                        {message && <p className="mt-4 mb-6 text-sm tracking-wider text-center cursor-pointer text-cyan-400 font-neue-machina">{message}</p>}

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 mb-4 text-sm text-center text-red-200 border rounded-lg border-red-500/40 bg-red-900/40 font-neue-machina">
                                {error}
                                {(error.toLowerCase().includes("verify") || error.toLowerCase().includes("verified")) && (
                                    <p
                                        onClick={handleResendVerification}
                                        className="mt-2 text-sm text-center cursor-pointer text-cyan-400 hover:underline hover:text-cyan-300 font-neue-machina"
                                    >
                                        Resend verification email
                                    </p>
                                )}

                            </div>
                        )}

                        {/* Success Message */}
                        {success && (
                            <div className="p-3 mb-4 text-sm text-center text-green-200 border rounded-lg border-green-500/40 bg-green-900/40 font-neue-machina">
                                {success}
                            </div>
                        )}

                        {/* Google Login Button */}
                        <div className="flex justify-center">
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                onMouseEnter={() => setHover(true)}
                                onMouseLeave={() => setHover(false)}
                                className="flex w-full px-6 py-2 text-sm font-bold text-white transition duration-200 rounded-md bg-transparent hover:shadow-[0_0_12px_rgba(0,255,255,0.4)]"
                                style={{
                                    border: '2px solid transparent',
                                    backgroundImage: `linear-gradient(rgba(15, 23, 42, ${hover ? 1 : 0.6}), rgba(15, 23, 42, ${hover ? 1 : 0.6
                                        })), linear-gradient(to right, #5de0e6, #004aad)`,
                                    backgroundOrigin: 'border-box',
                                    backgroundClip: 'padding-box, border-box',
                                    fontFamily: 'Neue Machina Bold, sans-serif',
                                    letterSpacing: '0.15em',
                                    alignItems: 'center',
                                    justifyContent: 'center',

                                }}
                            >
                                <span>Log in with </span>
                                <img src="/Google_2015_logo.webp" alt="Google" className="h-5 ml-2 w-18" />
                            </button>
                        </div>

                        {/* OR Divider */}
                        <div className="flex items-center my-4">
                            <hr className="flex-grow border-cyan-600" />
                            <span className="mx-2 text-sm text-gray-400 font-neue-machina">OR</span>
                            <hr className="flex-grow border-cyan-600" />
                        </div>

                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 text-white bg-transparent border rounded-md border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-neue-machina"
                        />

                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 text-white bg-transparent border rounded-md border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-neue-machina"
                        />
                        <p
                            className="mt-2 text-sm text-right cursor-pointer text-cyan-400 hover:text-cyan-300 hover:underline font-neue-machina"
                            onClick={() => navigate("/forgot-password")}
                        >
                            Forgot your password?
                        </p>

                        <div className="flex justify-center">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`flex items-center justify-center gap-2 px-6 py-2 text-sm font-bold tracking-wider text-white transition duration-200 rounded-md bg-transparent 
                                    ${loading ? "opacity-60 cursor-not-allowed" : "hover:shadow-[0_0_12px_rgba(0,255,255,0.4)]"}`}
                                style={{
                                    border: "2px solid transparent",
                                    backgroundImage: "linear-gradient(#0f172a, #0f172a), linear-gradient(to right, #5de0e6, #004aad)",
                                    backgroundOrigin: "border-box",
                                    backgroundClip: "padding-box, border-box",
                                    fontFamily: "Neue Machina Bold, sans-serif",
                                    letterSpacing: "0.15em",
                                }}
                            >
                                {loading ? (
                                    <>
                                        <svg
                                            className="w-4 h-4 mr-2 text-cyan-300 animate-spin"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                        </svg>
                                            Logging in...
                                    </>
                                ) : (
                                    "Login"
                                )}
                            </button>

                        </div>

                        <p className="mt-4 mb-6 text-sm tracking-wider text-center text-cyan-400 font-neue-machina">
                            Don’t have an account?{" "}
                            <span
                                onClick={() => navigate("/signup")}
                                className="cursor-pointer hover:underline hover:text-cyan-300 "
                            >
                                Sign up
                            </span>
                        </p>

                    </form>
                </div>
            </div>
        </div>
    );
}