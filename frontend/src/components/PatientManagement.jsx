import { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  MenuItem,
  Alert,
  Snackbar,
  Collapse,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import API_BASE from "../utils/config";
import EditIcon from "@mui/icons-material/Edit";

export default function PatientManagement({ doctorId, patients, setPatients }) {
  const [filteredPatients, setFilteredPatients] = useState(patients);
  const [editMode, setEditMode] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Form state
  const [formData, setFormData] = useState({
    patient_name: "",
    email: "",
    age: "",
    gender: "",
    medical_history: "",
  });

  // Sync filtered list when parent updates
  useEffect(() => {
    setFilteredPatients(patients);
  }, [patients]);

  // Apply search filtering
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredPatients(patients);
      return;
    }

    const filtered = patients.filter((p) =>
      `${p.patient_name || p.name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );

    setFilteredPatients(filtered);
  }, [searchTerm, patients]);

  // Add patient
  const handleAddPatient = async () => {
    if (!formData.patient_name || !formData.email) {
      return setSnackbar({
        open: true,
        message: "Patient name and email are required",
        severity: "error",
      });
    }

    try {
      const payload = {
        doctor_id: doctorId,
        patient_name: formData.patient_name,
        email: formData.email,
        age: formData.age ? parseInt(formData.age, 10) : null,
        gender: formData.gender || null,
        medical_history: formData.medical_history || null,
      };

      const res = await axios.post(
        `${API_BASE}/doctors/${doctorId}/patients`,
        payload
      );

      // update parent state
      setPatients((prev) => [...prev, res.data]);

      setSnackbar({
        open: true,
        message: "Patient added successfully",
        severity: "success",
      });

      setFormData({
        patient_name: "",
        email: "",
        age: "",
        gender: "",
        medical_history: "",
      });

      setOpenDialog(false);
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to add patient",
        severity: "error",
      });
    }
  };

  // Delete patient
  const handleDeletePatient = async (patientId) => {
    if (!window.confirm("Are you sure you want to remove this patient?"))
      return;

    try {
      await axios.delete(
        `${API_BASE}/doctors/${doctorId}/patients/${patientId}`
      );

      // update parent state
      setPatients((prev) =>
        prev.filter(
          (p) => p.patient_record_id !== patientId && p.id !== patientId
        )
      );

      setSnackbar({
        open: true,
        message: "Patient removed",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to remove patient",
        severity: "error",
      });
    }
  };

  const handleOpenEdit = (patient) => {
    setSelectedPatientId(patient.patient_record_id || patient.id);

    setFormData({
      patient_name: patient.patient_name || patient.name || "",
      email: patient.email,
      age: patient.age,
      gender: patient.gender,
      medical_history: patient.medical_history,
    });

    setEditMode(true);
    setOpenDialog(true);
  };

  const handleUpdatePatient = async () => {
    try {
      const payload = {
        patient_name: formData.patient_name,
        email: formData.email,
        age: formData.age ? parseInt(formData.age, 10) : null,
        gender: formData.gender || null,
        medical_history: formData.medical_history || null,
      };

      await axios.put(
        `${API_BASE}/doctors/${doctorId}/patients/${selectedPatientId}`,
        payload
      );

      // update parent list instead of refetching
      setPatients((prev) =>
        prev.map((p) =>
          (p.patient_record_id || p.id) === selectedPatientId
            ? { ...p, ...payload }
            : p
        )
      );

      setSnackbar({
        open: true,
        message: "Patient updated successfully",
        severity: "success",
      });

      setOpenDialog(false);
      setEditMode(false);
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Update failed",
        severity: "error",
      });
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const textFieldStyle = {
    "& .MuiInputLabel-root": {
      color: "white",
      fontFamily: "Neue Machina, sans-serif",
      letterSpacing: "0.1em",
    },
    "& .MuiInputLabel-root.Mui-focused": { color: "white" },

    "& .MuiOutlinedInput-root": {
      "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
      "&:hover fieldset": { borderColor: "white" },
      "&.Mui-focused fieldset": { borderColor: "#5de0e6" },
    },

    "& .MuiInputBase-input": {
      color: "white",
      fontFamily: "Neue Machina, sans-serif",
      letterSpacing: "0.1em",
    },
  };

  return (
    <Box sx={{ position: "relative", color: "white" }}>
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

      {/* Header */}
      <Typography
        variant="h5"
        sx={{
          mt: 2,
          mb: 4,
          fontFamily: "Neue Machina, sans-serif",
          letterSpacing: "0.1em",
          color: "#ffffff !important",
        }}
      >
        Patient Management Section
      </Typography>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 3,
          color: "white !important",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontFamily: "Neue Machina, sans-serif",
            letterSpacing: "0.1em",
            color: "#ffffff !important",
          }}
        >
          Patient Cases
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          sx={{
            background: "linear-gradient(to right, #5de0e6, #004aad)",
            fontFamily: "Neue Machina bold, sans-serif",
            letterSpacing: "0.1em",
          }}
        >
          Add Patient
        </Button>
      </Box>

      {/* Search/Filter */}
      <TextField
        fullWidth
        placeholder="Search / Filter Patients (by name, email, or medical history)"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3, ...textFieldStyle }}
      />

      {/* Patient Table */}
      {filteredPatients.length === 0 ? (
        <Typography
          sx={{
            fontFamily: "Neue Machina, sans-serif",
            letterSpacing: "0.1em",
            color: "white",
          }}
        >
          No patient cases assigned yet.
        </Typography>
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            backgroundColor: "rgba(255,255,255,0.05)",
            "& .MuiTableCell-root": {
              fontFamily: "Neue Machina, sans-serif",
              letterSpacing: "0.1em",
              color: "#ffffff !important",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
            },
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Patient Name</TableCell>
                <TableCell>Email / ID</TableCell>
                <TableCell>Age, Gender</TableCell>
                <TableCell>Medical History</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPatients.map((patient) => (
                <>
                  <TableRow key={patient.patient_record_id}>
                    <TableCell>
                      {patient.name || patient.patient_name}
                    </TableCell>
                    <TableCell>{patient.email}</TableCell>
                    <TableCell>
                      {patient.age && `${patient.age} years`}
                      {patient.age && patient.gender && ", "}
                      {patient.gender && (
                        <Chip
                          label={patient.gender}
                          size="small"
                          sx={{
                            backgroundColor: "rgba(93, 224, 230, 0.2)",
                            color: "#ffffff",
                            fontFamily: "Neue Machina, sans-serif",
                          }}
                        />
                      )}
                      {!patient.age && !patient.gender && "N/A"}
                    </TableCell>
                    <TableCell>
                      {patient.medical_history ? (
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Typography
                            sx={{
                              color: "white",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace:
                                expandedRow === patient.id
                                  ? "normal"
                                  : "nowrap",
                              maxWidth: "300px",
                            }}
                          >
                            {patient.medical_history}
                          </Typography>
                          {patient.medical_history.length > 50 && (
                            <IconButton
                              size="small"
                              onClick={() =>
                                setExpandedRow(
                                  expandedRow === patient.id ? null : patient.id
                                )
                              }
                              sx={{ color: "#5de0e6", ml: 1 }}
                            >
                              {expandedRow === patient.id ? (
                                <ExpandLessIcon />
                              ) : (
                                <ExpandMoreIcon />
                              )}
                            </IconButton>
                          )}
                        </Box>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={() => handleOpenEdit(patient)}
                        sx={{ color: "#5de0e6", mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>

                      <IconButton
                        onClick={() =>
                          handleDeletePatient(
                            patient.patient_record_id || patient.id
                          )
                        }
                        sx={{ color: "#ff4444" }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                </>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add Patient Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: "#1a1a1a",
            color: "white",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontFamily: "Neue Machina, sans-serif",
            letterSpacing: "0.1em",
          }}
        >
          Add New Patient
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Patient Name *"
            value={formData.patient_name}
            onChange={(e) => handleChange("patient_name", e.target.value)}
            margin="normal"
            sx={textFieldStyle}
          />
          <TextField
            fullWidth
            label="Email *"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            margin="normal"
            sx={textFieldStyle}
          />
          <TextField
            fullWidth
            label="Age"
            type="number"
            value={formData.age}
            onChange={(e) => handleChange("age", e.target.value)}
            margin="normal"
            sx={textFieldStyle}
          />
          <TextField
            fullWidth
            select
            label="Gender"
            value={formData.gender}
            onChange={(e) => handleChange("gender", e.target.value)}
            margin="normal"
            sx={textFieldStyle}
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
                    },
                  },
                },
              },
            }}
          >
            <MenuItem value="">Select Gender</MenuItem>
            <MenuItem value="MALE">Male</MenuItem>
            <MenuItem value="FEMALE">Female</MenuItem>
            <MenuItem value="OTHER">Other</MenuItem>
            <MenuItem value="UNKNOWN">Prefer not to say</MenuItem>
          </TextField>
          <TextField
            fullWidth
            label="Medical History"
            multiline
            rows={4}
            value={formData.medical_history}
            onChange={(e) => handleChange("medical_history", e.target.value)}
            margin="normal"
            sx={{
              ...textFieldStyle,
              "& textarea": {
                color: "white",
                fontFamily: "Neue Machina, sans-serif",
                letterSpacing: "0.1em",
              },
              "& .MuiInputBase-input::placeholder": {
                color: "gray",
                opacity: 1,
              },
            }}
            placeholder="Enter patient's medical history, conditions, medications, etc."
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setOpenDialog(false)}
            sx={{
              color: "white",
              fontFamily: "Neue Machina, sans-serif",
              letterSpacing: "0.1em",
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={editMode ? handleUpdatePatient : handleAddPatient}
            variant="contained"
            sx={{
              background: "linear-gradient(to right, #5de0e6, #004aad)",
            }}
          >
            {editMode ? "Save Changes" : "Add Patient"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
