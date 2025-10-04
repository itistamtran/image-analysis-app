import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function Unauthorized() {
    const navigate = useNavigate();

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#121212",
                color: "white",
                textAlign: "center",
                p: 3,
            }}
        >
            <Typography variant="h4" gutterBottom>
                Unauthorized
            </Typography>
            <Typography variant="body1" gutterBottom>
                You don’t have permission to view this page.
            </Typography>
            <Button
                variant="contained"
                color="primary"
                onClick={() => navigate("/")}
                sx={{ mt: 2 }}
            >
                Go Home
            </Button>
        </Box>
    );
}
