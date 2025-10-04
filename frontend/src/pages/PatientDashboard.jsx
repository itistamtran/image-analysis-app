import { useEffect, useState } from "react";
import axios from "axios";
import { Typography, Card, CardContent, Button, Box } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";
import ProfileOverview from "../components/ProfileOverview";
import Header from "../components/Header";
import Footer from "../components/Footer";
import API_BASE from "../utils/config";
import tumorDetails from "../utils/tumorDetails";

export default function PatientDashboard() {
    const [user, setUser] = useState(null);
    const [scans, setScans] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const latestScan = scans.length > 0 ? scans[0] : null;

    // Map API values to tumorDetails keys
    const resultMap = {
        glioma: "Glioma",
        meningioma: "Meningioma",
        pituitary: "Pituitary",
        no_tumor: "No Tumor",
        unknown: "Unknown",
        unclear: "Unclear",
    };

    const resultKey = latestScan?.result
        ? resultMap[latestScan.result.toLowerCase()] || "Unknown"
        : "Unknown";

    const tumorInfo = tumorDetails[resultKey];

    const handleDelete = async (id) => {
        try {
            const res = await fetch(`${API_BASE}/predictions/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete");

            setScans((prev) => prev.filter((item) => item.id !== id));

            // also update localStorage
            localStorage.setItem("scans", JSON.stringify(
                scans.filter((item) => item.id !== id)
            ));
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    const fetchScans = async () => {
        try {
            const storedUser = JSON.parse(localStorage.getItem("user"));
            if (!storedUser) return;

            setUser(storedUser);

            // show cached scans immediately
            const localScans = JSON.parse(localStorage.getItem("scans") || "[]");
            if (localScans.length > 0) {
                setScans(localScans);
            }

            // Fetch from backend
            const res = await axios.get(
                `${API_BASE}/predictions/${storedUser.id}`
            );

            if (res.data?.predictions && res.data.predictions.length > 0) {
                setScans(res.data.predictions);
                localStorage.setItem("scans", JSON.stringify(res.data.predictions));
            }
        } catch (err) {
            console.error("Failed to fetch scans:", err);
        }
    };
    useEffect(() => {
        fetchScans();

        const handleScansUpdated = () => {
            fetchScans();
        };

        window.addEventListener("scansUpdated", handleScansUpdated);
        return () => window.removeEventListener("scansUpdated", handleScansUpdated);
    }, []);


    return (
        <div
            className="relative flex flex-col min-h-screen px-16 mx-auto text-white bg-center bg-cover"
            style={{ backgroundImage: "url('/bg-gradient.jpg')" }}
        >
            <div className="absolute inset-0 z-0 pointer-events-none bg-black/30" />
            <Header />
            <Typography
                variant="h4"
                component="h1"
                sx={{
                    fontWeight: 'bold',
                    fontFamily: 'Neue Machina, sans-serif',
                    mb: 5,
                    mt: 4,
                    textAlign: 'left',
                    letterSpacing: '0.15em',
                    fontSize: { xs: '1.5rem', sm: '1.5rem', md: '2rem' },
                }}
            >
                <Box
                    component="span"
                    sx={{
                        background: 'linear-gradient(to right, #5de0e6, #004aad)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        display: 'inline',
                        fontWeight: 'bold',
                        mr: 1, // clean spacing
                    }}
                >
                    Welcome,
                </Box>
                {user?.name || (user?.email ? user.email.split('@')[0] : 'User')}
            </Typography>

            <Box
                sx={{
                    width: '100%',
                    height: '1px',
                    background: 'linear-gradient(to right, #5de0e6, #004aad)',
                    mb: 2,
                }}
            />

            {/* Section: Profile */}
            <section>
                <ProfileOverview
                    user={user}
                    setUser={setUser}
                    fields={
                        user?.role === "PATIENT"
                            ? ["name", "email", "age", "gender", "medical_history"]
                            : ["name", "email", "specialization", "npi_number", "verification_status"]
                    }
                />
            </section>

            {/* Divider line */}
            <Box
                sx={{
                    width: '100%',
                    height: '1px',
                    background: 'linear-gradient(to right, #5de0e6, #004aad)',
                    mb: 2,
                    mt: 2,
                }}
            />

            <Typography variant="h5" sx={{ mt: 2, mb: 4, fontFamily: 'Neue Machina, sans-serif', letterSpacing: '0.1em', }}>
                MRI Upload & Prediction Section
            </Typography>

            <Button
                variant="contained"
                sx={{
                    mb: 4,
                    background: "linear-gradient(to right, #5de0e6, #004aad)",
                    fontFamily: "Neue Machina Bold, sans-serif",
                    letterSpacing: "0.1em",
                    width: "250px",
                    height: "40px",
                }}
                href="/upload"
            >
                Upload New MRI
            </Button>

            <Typography variant="h6" sx={{ mb: 2, fontFamily: "Neue Machina, sans-serif", letterSpacing: "0.1em", }}>
                Your Scan History
            </Typography>

            {/* Toggle Button */}
            <Button
                sx={{
                    mb: 1,
                    color: "rgba(255,255,255,0.75)",
                    justifyContent: "flex-start",
                    textAlign: "left",
                    fontFamily: "Neue Machina, sans-serif",
                    letterSpacing: "0.1em",
                    textTransform: "none",
                    "&:hover": {
                        background: "linear-gradient(to right, #5de0e6, #004aad)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                    },
                }}

                onClick={() => setShowHistory(!showHistory)}
            >
                {showHistory ? "Hide History" : "Show History"}
            </Button>

            {/* Scan History (hidden until showHistory = true) */}
            {showHistory && (
                <div className="grid gap-4 text-white md:grid-cols-2">
                    {scans.length > 0 ? (
                        scans.map((scan) => (

                            <Card
                                key={scan.id}
                                sx={{ background: "rgba(255, 255, 255, 0.1)" }}
                            >
                                <CardContent
                                    sx={{
                                        fontFamily: "Neue Machina, sans-serif",
                                        color: "white",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    {/* Left Side (Text Info) */}
                                    <div>
                                        <Typography variant="body1" sx={{ fontFamily: "inherit" }}>
                                            <b>Date:</b>{" "}
                                            {scan.created_at
                                                ? new Date(scan.created_at).toLocaleString()
                                                : "N/A"}
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontFamily: "inherit" }}>
                                            <b>Result:</b>{" "}
                                            {scan.result !== null && scan.result !== undefined
                                                ? scan.result
                                                : "N/A"}
                                        </Typography>
                                        {scan.confidence !== null && (
                                            <Typography variant="body1" sx={{ fontFamily: "inherit" }}>
                                                <b>Confidence:</b>{" "}
                                                {(scan.confidence * 100).toFixed(2)}%
                                            </Typography>
                                        )}
                                    </div>

                                    {/* Right Side (Image with Trash Icon) */}
                                    {scan.image_url && (
                                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", ml: 2 }}>
                                            {/* Trash Icon */}
                                            <IconButton
                                                size="small"
                                                sx={{ mb: 0.5 }}
                                                onClick={() => handleDelete(scan.id)}
                                            >
                                                <DeleteIcon
                                                    fontSize="small"
                                                    sx={{
                                                        "& path": {
                                                            fill: "url(#trashGradient)",
                                                        },
                                                    }}
                                                />
                                                {/* Define gradient inside SVG defs */}
                                                <svg width="0" height="0">
                                                    <defs>
                                                        <linearGradient id="trashGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                            <stop offset="0%" stopColor="#5de0e6" />
                                                            <stop offset="100%" stopColor="#004aad" />
                                                        </linearGradient>
                                                    </defs>
                                                </svg>
                                            </IconButton>

                                            {/* Image */}
                                            <img
                                                src={`${API_BASE}${scan.image_url}`}
                                                alt="MRI Scan"
                                                style={{
                                                    objectFit: "cover",
                                                    width: "96px",
                                                    height: "96px",
                                                    borderRadius: "4px",
                                                    boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
                                                }}
                                            />
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>

                        ))
                    ) : (
                        <Typography variant="body1"
                            sx={{ mb: 2, fontFamily: "Neue Machina, sans-serif", letterSpacing: "0.1em" }}>
                            No scans yet. Upload one to get started.
                        </Typography>
                    )}
                </div>
            )}

            {/* Divider line */}
            <Box
                sx={{
                    width: '100%',
                    height: '1px',
                    background: 'linear-gradient(to right, #5de0e6, #004aad)',
                    mb: 4,
                    mt: 3,
                }}
            />

            <Typography
                variant="h5"
                sx={{ mt: 2, mb: 2, fontFamily: "Neue Machina, sans-serif", letterSpacing: "0.1em" }}
            >
                Result Details
            </Typography>
            <Typography
                variant="h6"
                sx={{ mb: 4, fontFamily: "Neue Machina, sans-serif", letterSpacing: "0.1em" }}
            >
                Summary report of your latest MRI scan
            </Typography>

            {latestScan ? (
                <>
                    {/* Images Row */}
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: { xs: "column", md: "row" },
                            justifyContent: "left",
                            alignItems: "left",
                            gap: 1,
                            mb: 4,
                        }}
                    >
                        {/* MRI Image */}
                        {latestScan.image_url && (
                            <Box sx={{ flex: 1, maxWidth: "400px", textAlign: "center" }}>
                                <Typography
                                    variant="h6"
                                    sx={{ mb: 1, fontFamily: "Neue Machina, sans-serif", letterSpacing: "0.1em", }}
                                >
                                    MRI Image
                                </Typography>
                                <img
                                    src={`${API_BASE}${latestScan.image_url}`}
                                    alt="MRI Scan"
                                    style={{
                                        height: "350px",
                                        width: "auto",
                                        objectFit: "cover",
                                        borderRadius: "8px",
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                                    }}
                                />
                            </Box>
                        )}

                        {/* Heatmap */}
                        {latestScan.heatmap_url && (
                            <Box sx={{ flex: 1, maxWidth: "400px", textAlign: "center" }}>
                                <Typography
                                    variant="h6"
                                    sx={{ mb: 1, fontFamily: "Neue Machina, sans-serif", letterSpacing: "0.1em" }}
                                >
                                    Heatmap
                                </Typography>
                                <img
                                    src={`${API_BASE}${latestScan.heatmap_url}`}
                                    alt="Heatmap"
                                    style={{
                                        height: "350px",
                                        width: "auto",
                                        objectFit: "cover",
                                        borderRadius: "8px",
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                                    }}
                                />
                            </Box>
                        )}
                    </Box>

                    {/* Detail Summary */}
                    <Box sx={{ mt: 2, mb: 4 }}>
                        <Typography variant="body1" sx={{ mb: 1, fontFamily: "Neue Machina, sans-serif" }}>
                            <b>Date:</b> {latestScan.created_at ? new Date(latestScan.created_at).toLocaleString() : "N/A"}
                        </Typography>

                        <Typography variant="body1" sx={{ mb: 1, fontFamily: "Neue Machina, sans-serif" }}>
                            <b>Final Prediction:</b> {latestScan.result || "N/A"}
                        </Typography>

                        <Typography variant="body1" sx={{ mb: 2, fontFamily: "Neue Machina, sans-serif" }}>
                            <b>Confidence Score:</b>{" "}
                            {latestScan.confidence !== null ? (latestScan.confidence * 100).toFixed(2) + "%" : "N/A"}
                        </Typography>

                        <Typography
                            variant="h6"
                            sx={{ mb: 2, fontFamily: "Neue Machina Bold, sans-serif", letterSpacing: "0.1em" }}
                        >
                            Detail:
                        </Typography>

                        <Typography variant="body1" sx={{ mb: 2, fontFamily: "Neue Machina, sans-serif" }}>
                            <strong>{tumorInfo.title}</strong>
                            <br />
                            <br />
                            {tumorInfo.description}
                            <br />
                            <br />
                            {tumorInfo.bullets?.map((point, idx) => (
                                <div key={idx}>• {point}</div>
                            ))}
                        </Typography>

                        <Typography
                            variant="h7"
                            sx={{ mb: 2, fontFamily: "Neue Machina Bold, sans-serif", letterSpacing: "0.1em" }}
                        >
                            What the Heatmap Shows
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{ mb: 2, fontFamily: "Neue Machina, sans-serif", letterSpacing: "0.1em" }}
                        >
                            The heatmap highlights areas of the MRI scan that the AI model considered most important in making its prediction. Warmer colors (red, orange, yellow) indicate regions of higher attention, while cooler colors (blue, green) indicate less importance. This does not necessarily mean a tumor is present, but rather shows what influenced the model’s decision.
                        </Typography>
                    </Box>

                    {/* Download Button */}
                    <Button
                        variant="contained"
                        sx={{
                            mb: 4,
                            background: "linear-gradient(to right, #5de0e6, #004aad)",
                            fontFamily: "Neue Machina Bold, sans-serif",
                            letterSpacing: "0.1em",
                            width: "250px",
                            height: "40px",
                        }}
                        onClick={async () => {
                            try {
                                const res = await axios.get(`${API_BASE}/report/${latestScan.id}`, {
                                    responseType: "blob",
                                });
                                const url = window.URL.createObjectURL(new Blob([res.data]));
                                const link = document.createElement("a");
                                link.href = url;
                                link.setAttribute("download", `MRI_Report_${latestScan.id}.pdf`);
                                document.body.appendChild(link);
                                link.click();
                                link.remove();
                            } catch (err) {
                                console.error("Failed to download report:", err);
                            }
                        }}
                    >
                        Download Full Report
                    </Button>
                </>
            ) : (
                <Typography variant="body1"
                    sx={{ mb: 2, fontFamily: "Neue Machina, sans-serif", letterSpacing: "0.1em" }}>
                    No scans available yet. Upload one to see the results here.</Typography>
            )}

            <Typography
                variant="body2"
                sx={{ mt: 4, mb: 2, fontFamily: "Neue Machina Bold, sans-serif", letterSpacing: "0.1em", color: "yellow" }}
            >
                ⚠️ Disclaimer
            </Typography>
            <Typography
                variant="body2"
                sx={{ mb: 2, fontFamily: "Neue Machina, sans-serif", letterSpacing: "0.1em" }}
            >
                MedScanAI is not a clinical diagnostic tool. The results generated by this platform are intended for informational and educational purposes only and should not be used as a substitute for professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider before making any medical decisions based on scan interpretations.
            </Typography>

            <Footer />
        </div>

    );
}