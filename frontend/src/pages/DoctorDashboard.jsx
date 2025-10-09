import { useEffect, useState } from "react";
import { Typography, Card, CardContent, Button, Box } from "@mui/material";
import axios from "axios";
import ProfileOverview from "../components/ProfileOverview";
import Header from "../components/Header";
import Footer from "../components/Footer";
import API_BASE from "../utils/config";


export default function DoctorDashboard() {
    const [user, setUser] = useState(null);
    const [patients, setPatients] = useState([]);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        setUser(storedUser);

        if (storedUser?.role === "DOCTOR") {
            axios.get(`${API_BASE}/doctors/${storedUser.id}`)
                .then(res => {
                    console.log("Doctor backend data:", res.data);
                    setUser(prev => ({ ...prev, ...res.data }));
                    localStorage.setItem("user", JSON.stringify({ ...storedUser, ...res.data }));
                });
        }
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
                {user?.name || (user?.email ? user.email.split('@')[0] : 'Doctor')}

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
                        user?.role === "DOCTOR"
                            ? ["name", "email", "specialization", "npi_number", "verification_status"]
                            : ["name", "email", "age", "gender", "medical_history"]
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
                Patient Management Section
            </Typography>

            <Typography variant="h6" sx={{ mb: 2, fontFamily: 'Neue Machina, sans-serif', letterSpacing: '0.1em', }}>
                Patient Cases
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, fontFamily: 'Neue Machina, sans-serif', letterSpacing: '0.1em', }}>
                Patient name <br />
                Email / ID <br />
                Age, Gender <br />
                Medical history (short preview, click to expand)
            </Typography>
            <Typography variant="h6" sx={{ mb: 2, fontFamily: 'Neue Machina, sans-serif', letterSpacing: '0.1em', }}>
                Search / Filter Patients (by name, email, date of scan, or result type like “tumor detected”).
            </Typography>

            <div className="grid gap-4 md:grid-cols-2">
                {patients.length > 0 ? (
                    patients.map((patient, idx) => (
                        <Card key={idx} sx={{ background: "rgba(0,0,0,0.4)" }}>
                            <CardContent sx={{ mb: 2, fontFamily: 'Neue Machina, sans-serif', letterSpacing: '0.1em', }}>
                                <Typography variant="body1">
                                    <b>Patient:</b> {patient.name}
                                </Typography>
                                <Typography variant="body1">
                                    <b>Scan Date:</b> {patient.scanDate}
                                </Typography>
                                <Typography variant="body1">
                                    <b>AI Result:</b> {patient.prediction}
                                </Typography>
                                <Button
                                    variant="outlined"
                                    sx={{ mt: 2, borderColor: "#5de0e6", color: "#5de0e6", fontFamily: 'Neue Machina, sans-serif', letterSpacing: '0.1em', }}
                                >
                                    Review Scan
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Typography sx={{ mb: 2, fontFamily: 'Neue Machina, sans-serif', letterSpacing: '0.1em', }}>No patient cases assigned yet.</Typography>
                )}
            </div>

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

            <Typography variant="h6" sx={{ mb: 2, fontFamily: 'Neue Machina, sans-serif', letterSpacing: '0.1em', }}>
                Patient Scan History Viewer
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, fontFamily: 'Neue Machina, sans-serif', letterSpacing: '0.1em', }}>
                For each patient: <br />
                List of MRI uploads with: <br />
                Date of scan <br />
                Result (e.g., glioma, no tumor) <br />
                Confidence score <br />
                Thumbnail of MRI image <br />
                Option: “View Full Report” → opens details (heatmap, analysis, notes).
            </Typography>

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

            <Typography variant="h6" sx={{ mb: 2, fontFamily: 'Neue Machina, sans-serif', letterSpacing: '0.1em', }}>
                Doctor Notes / Annotations
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, fontFamily: 'Neue Machina, sans-serif', letterSpacing: '0.1em', }}>
                Doctor can add notes or comments on a patient’s scan. <br />
                Notes stored in database and visible to that patient (optional: require doctor approval).
            </Typography>

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

            <Typography variant="h6" sx={{ mb: 2, fontFamily: 'Neue Machina, sans-serif', letterSpacing: '0.1em', }}>
                Notifications / Pending Verifications
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, fontFamily: 'Neue Machina, sans-serif', letterSpacing: '0.1em', }}>
                Show this in pending verification page <br />
                If doctor is still PENDING verification, show a banner with steps to verify their NPI. <br />
                If already VERIFIED, show updates like “3 new patient scans awaiting review.”
            </Typography>

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

            <Typography variant="h6" sx={{ mb: 2, fontFamily: 'Neue Machina, sans-serif', letterSpacing: '0.1em', }}>
                Settings / Account Management
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, fontFamily: 'Neue Machina, sans-serif', letterSpacing: '0.1em', }}>
                Update profile info (specialization, hospital, contact). <br />
                If doctor is still PENDING verification, show a banner with steps to verify their NPI. <br />
                If already VERIFIED, show updates like “3 new patient scans awaiting review.”
            </Typography>

            <Footer />

        </div>
    );
}
