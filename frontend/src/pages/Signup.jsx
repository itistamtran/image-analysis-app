import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import API_BASE from "../utils/config";

export default function SignupPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("PATIENT");
    const [npiNumber, setNpiNumber] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const [hover, setHover] = useState(false);
    const [loading, setLoading] = useState(false);


    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${API_BASE}/signup`, {
                name,
                email,
                password,
                role,
                ...(role === "DOCTOR" && { npiNumber }),
            });

            navigate("/login");
        } catch (err) {
            setError(err.response?.data?.error || "Signup failed");
        } finally {
            setLoading(false);
        }
    };
    // Google signup handler
    const handleGoogleSignup = async () => {
        setLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Save user to backend
            await axios.post(`${API_BASE}/signup`, {
                name: user.displayName,
                email: user.email,
                password: user.uid,
                role: "PATIENT",
            });

            navigate("/login");
        } catch (err) {
            console.error("Google signup failed:", err);
            setError(err.response?.data?.error || err.message || "Google signup failed");
        } finally {
            setLoading(false);
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
                        onSubmit={handleSignup}
                        className="space-y-6"
                    >
                        <h2 className="mb-6 text-2xl font-bold tracking-wider text-center text-white font-neue-machina-bold">Sign Up</h2>

                        {error && <p className="mb-4 text-red-400">{error}</p>}

                        {/* Google Signup Button */}
                        <div className="flex justify-center">
                            <button
                                type="button"
                                onClick={handleGoogleSignup}
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
                                <span>Sign up with </span>
                                <img src="/Google_2015_logo.webp" alt="Google" className="h-5 ml-2 w-18" />
                            </button>
                        </div>

                        {/* OR Divider */}
                        <div className="flex items-center my-4">
                            <hr className="flex-grow border-cyan-600" />
                            <span className="mx-2 text-sm text-gray-400">OR</span>
                            <hr className="flex-grow border-cyan-600" />
                        </div>

                        <input
                            type="text"
                            placeholder="Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 text-white bg-transparent border rounded-md border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-neue-machina"
                        />

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

                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full px-4 py-2 text-white bg-transparent border rounded-md border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-neue-machina"
                        >
                            <option value="PATIENT" className="text-white bg-transparent font-neue-machina" >Patient</option>
                            <option value="DOCTOR" className="text-white bg-transparent font-neue-machina" >Doctor</option>
                        </select>

                        {role === "DOCTOR" && (
                            <input
                                type="text"
                                placeholder="NPI Number"
                                value={npiNumber}
                                onChange={(e) => setNpiNumber(e.target.value)}
                                className="w-full px-4 py-2 text-white bg-transparent border rounded-md border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-neue-machina"
                            />
                        )}
                        <div className="flex justify-center">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex px-6 py-2 text-sm font-bold text-white transition duration-200 rounded-md bg-transparent hover:shadow-[0_0_12px_rgba(0,255,255,0.4)]"
                                style={{
                                    border: '2px solid transparent',
                                    backgroundImage: 'linear-gradient(#0f172a, #0f172a), linear-gradient(to right, #5de0e6, #004aad)',
                                    backgroundOrigin: 'border-box',
                                    backgroundClip: 'padding-box, border-box',
                                    fontFamily: 'Neue Machina Bold, sans-serif',
                                    letterSpacing: '0.05em',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: loading ? 0.7 : 1,
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <svg
                                            className="w-4 h-4 animate-spin text-cyan-400"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"></path>
                                        </svg>
                                        <span>Signing up...</span>
                                    </div>
                                ) : (
                                    "Sign Up"
                                )}

                            </button>

                        </div>

                        <p className="mt-4 mb-6 text-sm tracking-wider text-center text-cyan-400 font-neue-machina">
                            Don’t have an account?{" "}
                            <span
                                onClick={() => navigate("/login")}
                                className="cursor-pointer hover:underline hover:text-cyan-300 "
                            >
                                Log in
                            </span>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}