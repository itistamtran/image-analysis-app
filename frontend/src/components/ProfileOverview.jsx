import { useEffect, useState } from "react";
import axios from "axios";
import {
  Typography,
  IconButton,
  Button,
  Box,
  TextField,
  InputAdornment,
  MenuItem,
  Alert,
  Snackbar,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import { Visibility, VisibilityOff } from "@mui/icons-material";

import { normalizeUser } from "../utils/user";
import API_BASE from "../utils/config";

export default function ProfileOverview({ user, setUser, fields }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(user || {});

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  // Feedback state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // fields by role
  const getFieldsForRole = (role) => {
    if (role === "DOCTOR") {
      return [
        "name",
        "email",
        "specialization",
        "npi_number",
        "verification_status",
      ];
    } else {
      return ["name", "email", "age", "gender", "medical_history"];
    }
  };

  const displayFields = fields || getFieldsForRole(user?.role);

  const handleSave = async () => {
    console.log("Save button clicked"); // Debug log
    console.log("Form data:", formData); // Debug log

    if (formData.age && !Number.isInteger(Number(formData.age))) {
      setSnackbar({
        open: true,
        message: "Please enter a valid integer for Age",
        severity: "error",
      });
      return;
    }

    try {
      // Clean up the payload - remove empty strings and convert age to int
      const payload = {
        ...formData,
        id: user.id,
        role: user.role,
        verification_status: user.verification_status,
      };

      // Convert age to integer or remove if empty
      if (payload.age) {
        payload.age = parseInt(payload.age, 10);
      } else {
        delete payload.age; // Remove age field if empty
      }

      // Remove other empty string fields that might cause issues
      Object.keys(payload).forEach((key) => {
        if (payload[key] === "") {
          delete payload[key];
        }
      });

      console.log("Sending payload:", payload); // Debug log

      const res = await axios.put(`${API_BASE}/users/${user.id}`, payload);

      console.log("Response:", res.data); // Debug log

      const normalized = normalizeUser({ ...res.data, role: user.role });
      setUser(normalized);
      setFormData(normalized);

      localStorage.setItem("user", JSON.stringify(normalized));
      setIsEditing(false);
      setSnackbar({
        open: true,
        message: "Profile updated successfully!",
        severity: "success",
      });
    } catch (err) {
      console.error("Failed to update user:", err);
      const errorMsg =
        err.response?.data?.error || err.message || "Failed to update profile";
      setSnackbar({ open: true, message: errorMsg, severity: "error" });
    }
  };

  const handlePasswordUpdate = async () => {
    if (newPassword !== confirmPassword) {
      setSnackbar({
        open: true,
        message: "New password and confirmation do not match",
        severity: "error",
      });
      return;
    }
    try {
      await axios.put(`${API_BASE}/users/${user.id}/password`, {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setSnackbar({
        open: true,
        message: "Password updated successfully!",
        severity: "success",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to update password";
      setSnackbar({ open: true, message: errorMsg, severity: "error" });
    }
  };

  const passwordFieldStyle = {
    input: {
      color: "white",
      fontFamily: "Neue Machina, sans-serif",
      letterSpacing: "0.1em",
    },
    "& .MuiInputLabel-root": {
      color: "gray",
      fontFamily: "Neue Machina, sans-serif",
      letterSpacing: "0.1em",
    },
    "& .MuiInputLabel-root.Mui-focused": { color: "white" },
    "& .MuiOutlinedInput-root": {
      "& fieldset": { borderColor: "gray" },
      "&:hover fieldset": { borderColor: "white" },
      "&.Mui-focused fieldset": { borderColor: "primary.main" },
    },
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        let storedUser = localStorage.getItem("user");
        if (storedUser) {
          storedUser = JSON.parse(storedUser);
          storedUser = normalizeUser(storedUser);
        }
        const userId = user?.id || storedUser?.id;
        if (userId) {
          try {
            const res = await axios.get(`${API_BASE}/users/${userId}`);
            console.log("Backend user data:", res.data);
            const normalized = normalizeUser(res.data);
            setUser(normalized);
            setFormData(normalized);
            localStorage.setItem("user", JSON.stringify(normalized));
          } catch (err) {
            console.error("Backend fetch failed:", err);
            if (storedUser) {
              setUser(storedUser);
              setFormData(storedUser);
            }
          }
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [user?.id]); // Added dependency

  return (
    <Box sx={{ position: "relative" }}>
      <svg
        width="0"
        height="0"
        style={{ position: "absolute", pointerEvents: "none" }}
      >
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#5de0e6" />
            <stop offset="100%" stopColor="#004aad" />
          </linearGradient>
        </defs>
      </svg>

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Title + edit button */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Typography
          variant="h5"
          sx={{
            mt: 2,
            mb: 2,
            fontFamily: "Neue Machina, sans-serif",
            letterSpacing: "0.1em",
            flexGrow: 1,
          }}
        >
          Profile Overview
        </Typography>
        {!isEditing ? (
          <IconButton
            onClick={() => setIsEditing(true)}
            size="small"
            sx={{ color: "white" }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        ) : (
          <>
            <IconButton onClick={handleSave} sx={{ mr: 1 }} aria-label="save">
              <SaveIcon sx={{ fill: "url(#gradient)" }} />
            </IconButton>
            <IconButton
              onClick={() => {
                setFormData(user);
                setIsEditing(false);
              }}
              color="error"
              aria-label="cancel"
            >
              <CancelIcon />
            </IconButton>
          </>
        )}
      </Box>

      {/* Profile fields */}
      {displayFields.map((field) => (
        <Box
          key={field}
          sx={{ display: "flex", alignItems: "center", mb: 2, gap: 2 }}
        >
          <Typography
            variant="body1"
            sx={{
              fontFamily: "Neue Machina, sans-serif",
              letterSpacing: "0.1em",
              width: 180,
            }}
          >
            {field.charAt(0).toUpperCase() + field.slice(1).replace("_", " ")}:
          </Typography>

          {isEditing && field !== "verification_status" ? (
            field === "gender" ? (
              <TextField
                select
                size="small"
                variant="outlined"
                value={formData?.gender || ""}
                onChange={(e) => handleChange("gender", e.target.value)}
                sx={{
                  flex: 1,
                  maxWidth: 300,
                  pr: 2,
                  "& .MuiSelect-select": {
                    fontFamily: "Neue Machina, sans-serif",
                    letterSpacing: "0.1em",
                    color: "white",
                  },
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "gray" },
                    "&:hover fieldset": { borderColor: "white" },
                    "&.Mui-focused fieldset": { borderColor: "primary.main" },
                  },
                }}
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      sx: {
                        backgroundColor: "#121212",
                        "& .MuiMenuItem-root": {
                          color: "white",
                          fontFamily: "Neue Machina, sans-serif",
                          letterSpacing: "0.1em",
                          "&:hover": {
                            backgroundColor: "rgba(255,255,255,0.1)",
                          },
                          "&.Mui-selected": {
                            backgroundColor: "rgba(255,255,255,0.2)",
                          },
                        },
                      },
                    },
                  },
                }}
              >
                {["MALE", "FEMALE", "OTHER", "UNKNOWN"].map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            ) : (
              <TextField
                size="small"
                variant="outlined"
                value={formData?.[field] || ""}
                onChange={(e) => handleChange(field, e.target.value)}
                sx={{
                  flex: 1,
                  maxWidth: 300,
                  pr: 2,
                  textAlign: "right",
                  input: {
                    fontFamily: "Neue Machina, sans-serif",
                    letterSpacing: "0.1em",
                    color: "white",
                  },
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "gray" },
                    "&:hover fieldset": { borderColor: "white" },
                    "&.Mui-focused fieldset": {
                      borderColor: "primary.main",
                    },
                  },
                }}
              />
            )
          ) : (
            <Typography
              sx={{
                fontFamily: "Neue Machina, sans-serif",
                letterSpacing: "0.1em",
              }}
            >
              {user?.[field] || "N/A"}
            </Typography>
          )}
        </Box>
      ))}

      {/* Change Password Section */}
      {isEditing && (
        <Box sx={{ mt: 4 }}>
          <Typography
            variant="body1"
            sx={{
              mb: 2,
              fontFamily: "Neue Machina, sans-serif",
              letterSpacing: "0.1em",
              color: "white",
            }}
          >
            Change Password
          </Typography>

          <TextField
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            fullWidth
            margin="normal"
            sx={passwordFieldStyle}
          />
          <TextField
            type={showPassword ? "text" : "password"}
            label="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            fullWidth
            margin="normal"
            sx={passwordFieldStyle}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    sx={{ color: "gray" }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            type={showPassword ? "text" : "password"}
            label="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            fullWidth
            margin="normal"
            sx={passwordFieldStyle}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handlePasswordUpdate}
            sx={{
              mt: 2,
              mb: 4,
              background: "linear-gradient(to right, #5de0e6, #004aad)",
            }}
          >
            Update Password
          </Button>
        </Box>
      )}
    </Box>
  );
}
