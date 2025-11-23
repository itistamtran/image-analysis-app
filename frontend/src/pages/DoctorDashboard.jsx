import { useEffect, useState } from "react";
import { Typography, Card, CardContent, Button, Box } from "@mui/material";
import axios from "axios";
import ProfileOverview from "../components/ProfileOverview";
import PatientManagement from "../components/PatientManagement";
import PatientScanHistory from "../components/PatientScanHistory";
import Header from "../components/Header";
import Footer from "../components/Footer";
import API_BASE from "../utils/config";

export default function DoctorDashboard() {
  const [user, setUser] = useState(null);
  const [patients, setPatients] = useState([]);

  const fetchPatients = async () => {
    const res = await axios.get(`${API_BASE}/doctors/${user.id}/patients`);
    setPatients(res.data);
  };

  useEffect(() => {
    if (user?.id) fetchPatients();
  }, [user]);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) return;

    setUser(storedUser);

    if (storedUser.role === "DOCTOR") {
      axios
        .get(`${API_BASE}/doctors/${storedUser.id}`)
        .then((res) => {
          console.log("Doctor backend data:", res.data);
          setUser(res.data);
          localStorage.setItem("user", JSON.stringify(res.data));
        })
        .catch((err) => console.error("Failed to load doctor data", err));
    }
  }, []);

  // Don't render until user is loaded
  if (!user) {
    return (
      <div style={{ color: "white", padding: "20px" }}>
        Loading dashboard...
      </div>
    );
  }

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
          fontWeight: "bold",
          fontFamily: "Neue Machina, sans-serif",
          mb: 5,
          mt: 4,
          textAlign: "left",
          letterSpacing: "0.15em",
          fontSize: { xs: "1.5rem", sm: "1.5rem", md: "2rem" },
        }}
      >
        <Box
          component="span"
          sx={{
            background: "linear-gradient(to right, #5de0e6, #004aad)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            display: "inline",
            fontWeight: "bold",
            mr: 1, // clean spacing
          }}
        >
          Welcome,
        </Box>
        {user?.name || (user?.email ? user.email.split("@")[0] : "Doctor")}
      </Typography>

      <Box
        sx={{
          width: "100%",
          height: "1px",
          background: "linear-gradient(to right, #5de0e6, #004aad)",
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
              ? [
                  "name",
                  "email",
                  "specialization",
                  "npi_number",
                  "verification_status",
                ]
              : ["name", "email", "age", "gender", "medical_history"]
          }
        />
      </section>

      {/* Divider line */}
      <Box
        sx={{
          width: "100%",
          height: "1px",
          background: "linear-gradient(to right, #5de0e6, #004aad)",
          mb: 2,
          mt: 2,
        }}
      />

      {/* Patient Management Section */}
      <Typography
        variant="h5"
        sx={{
          mt: 2,
          mb: 4,
          fontFamily: "Neue Machina, sans-serif",
          letterSpacing: "0.1em",
          color: "#ffffff",
        }}
      >
        Patient Management Section
      </Typography>

      <section>
        {user?.id && user?.role === "DOCTOR" && (
          <PatientManagement
            doctorId={user.id}
            patients={patients}
            setPatients={setPatients}
          />
        )}
      </section>

      {/* Divider line */}
      <Box
        sx={{
          width: "100%",
          height: "1px",
          background: "linear-gradient(to right, #5de0e6, #004aad)",
          mb: 2,
          mt: 2,
        }}
      />

      <section>
        {user?.id && user?.role === "DOCTOR" && (
          <PatientScanHistory doctorId={user.id} patients={patients} />
        )}
      </section>

      {/* Divider line */}
      <Box
        sx={{
          width: "100%",
          height: "1px",
          background: "linear-gradient(to right, #5de0e6, #004aad)",
          mb: 2,
          mt: 2,
        }}
      />

      <Typography
        variant="h6"
        sx={{
          mb: 2,
          fontFamily: "Neue Machina, sans-serif",
          letterSpacing: "0.1em",
        }}
      >
        Doctor Notes / Annotations (Coming soon)
      </Typography>
      <Typography
        variant="body1"
        sx={{
          mb: 2,
          fontFamily: "Neue Machina, sans-serif",
          letterSpacing: "0.1em",
        }}
      >
        Doctor can add notes or comments on a patient’s scan. <br />
        Notes stored in database and visible to that patient (optional: require
        doctor approval).
      </Typography>

      {/* Divider line */}
      <Box
        sx={{
          width: "100%",
          height: "1px",
          background: "linear-gradient(to right, #5de0e6, #004aad)",
          mb: 2,
          mt: 2,
        }}
      />

      <Typography
        variant="h6"
        sx={{
          mb: 2,
          fontFamily: "Neue Machina, sans-serif",
          letterSpacing: "0.1em",
        }}
      >
        Notifications / Pending Verifications (Coming soon)
      </Typography>
      <Typography
        variant="body1"
        sx={{
          mb: 2,
          fontFamily: "Neue Machina, sans-serif",
          letterSpacing: "0.1em",
        }}
      >
        Show this in pending verification page <br />
        If doctor is still PENDING verification, show a banner with steps to
        verify their NPI. <br />
        If already VERIFIED, show updates like “3 new patient scans awaiting
        review.”
      </Typography>

      {/* Divider line */}
      <Box
        sx={{
          width: "100%",
          height: "1px",
          background: "linear-gradient(to right, #5de0e6, #004aad)",
          mb: 2,
          mt: 2,
        }}
      />

      <Typography
        variant="h6"
        sx={{
          mb: 2,
          fontFamily: "Neue Machina, sans-serif",
          letterSpacing: "0.1em",
        }}
      >
        Settings / Account Management (Coming soon)
      </Typography>
      <Typography
        variant="body1"
        sx={{
          mb: 2,
          fontFamily: "Neue Machina, sans-serif",
          letterSpacing: "0.1em",
        }}
      >
        Update profile info (specialization, hospital, contact). <br />
        If doctor is still PENDING verification, show a banner with steps to
        verify their NPI. <br />
        If already VERIFIED, show updates like “3 new patient scans awaiting
        review.”
      </Typography>

      <Footer />
    </div>
  );
}
