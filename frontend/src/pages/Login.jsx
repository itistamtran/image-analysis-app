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
        try {
            const res = await axios.post(`${API_BASE}/login`, {
                email,
                password,
            });

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
            const errorMsg = err.response?.data?.error || "Login failed";

            // handle verification error
            if (err.response?.status === 403) {
                setError("Please check your email inbox and verify your account before logging in.");
            } else {
                setError(errorMsg);
            }
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
                <div className="md:w-[35%] bg-gradient-to-br from-cyan-500/30 to-blue-700/30 backdrop-blur-md p-6 rounded-xl ">
                    <form
                        onSubmit={handleLogin}
                        className="space-y-6"
                    >
                        <h2 className="mb-6 text-2xl font-bold tracking-wider text-center text-white font-neue-machina-bold">Login</h2>

                        {/* Show redirect message if exists */}
                        {message && <p className="mt-4 mb-6 text-sm tracking-wider text-center cursor-pointer text-cyan-400 font-neue-machina">{message}</p>}

                        {error && <p className="mb-4 text-red-400">{error}</p>}

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
                        <div className="flex justify-center">
                            <button
                                type="submit"
                                className="flex px-6 py-2 text-sm font-bold tracking-wider text-white transition duration-200 rounded-md bg-transparent hover:shadow-[0_0_12px_rgba(0,255,255,0.4)]"
                                style={{
                                    border: '2px solid transparent',
                                    backgroundImage: 'linear-gradient(#0f172a, #0f172a), linear-gradient(to right, #5de0e6, #004aad)',
                                    backgroundOrigin: 'border-box',
                                    backgroundClip: 'padding-box, border-box',
                                    fontFamily: 'Neue Machina Bold, sans-serif',
                                    letterSpacing: '0.15em',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                Login
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
