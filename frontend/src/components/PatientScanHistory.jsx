import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Button,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  IconButton,
  CircularProgress,
} from "@mui/material";
import UploadIcon from "@mui/icons-material/CloudUpload";
import VisibilityIcon from "@mui/icons-material/Visibility";
import API_BASE from "../utils/config";
import { useNavigate } from "react-router-dom";

export default function PatientScanHistory({ doctorId, patients }) {
  const [selectedPatient, setSelectedPatient] = useState("");
  const [scans, setScans] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedPatient) {
      fetchScans();
    } else {
      setScans([]);
    }
  }, [selectedPatient]);

  const fetchScans = async () => {
    if (!selectedPatient) return;
    try {
      console.log(`✓ Fetching scans for patient: ${selectedPatient}`);
      const res = await axios.get(
        `${API_BASE}/patients/${selectedPatient}/scans`,
        {
          withCredentials: true,
        }
      );
      console.log("✓ Fetched scans:", res.data);
      setScans(res.data || []);
    } catch (err) {
      console.error("✗ Error loading scans:", err);
      console.error("Error response:", err.response?.data);
      setScans([]);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      console.log(
        "✓ Selected file:",
        selected.name,
        selected.type,
        (selected.size / 1024).toFixed(2) + " KB"
      );
      // Validate file type
      if (!selected.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }
      setFile(selected);
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedPatient) {
      alert("Please select a patient and file first");
      return;
    }

    console.log("=== Starting Upload ===");
    console.log("Patient ID:", selectedPatient);
    console.log("File:", file.name);

    const formData = new FormData();
    formData.append("image", file);

    setUploading(true);

    try {
      const res = await axios.post(
        `${API_BASE}/patients/${selectedPatient}/upload_scan`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      console.log("✓ Upload successful:", res.data);
      alert(
        `Scan uploaded successfully!\nResult: ${
          res.data.result
        }\nConfidence: ${(res.data.confidence * 100).toFixed(2)}%`
      );

      // Reset file input
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Refresh scans list
      fetchScans();
    } catch (err) {
      console.error("✗ Upload failed:", err);
      console.error("Error response:", err.response?.data);
      alert(`Upload failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ mt: 6, position: "relative", color: "white" }}>
      <Typography
        variant="h5"
        sx={{
          fontFamily: "Neue Machina, sans-serif",
          letterSpacing: "0.1em",
          mb: 3,
        }}
      >
        Patient Scan History Viewer
      </Typography>

      {/* Patient Selector */}
      <Select
        fullWidth
        value={selectedPatient}
        onChange={(e) => {
          console.log("Selected patient ID:", e.target.value);
          setSelectedPatient(e.target.value);
        }}
        displayEmpty
        sx={{
          mb: 3,
          color: "white",
          backgroundColor: "rgba(255,255,255,0.05)",
          fontFamily: "Neue Machina, sans-serif",
          letterSpacing: "0.1em",
          "& .MuiSelect-select": {
            color: selectedPatient ? "white" : "rgba(255,255,255,0.5)",
          },
        }}
      >
        <MenuItem value="" disabled>
          Select a Patient
        </MenuItem>
        {patients.map((p) => (
          <MenuItem key={p.patient_record_id} value={p.patient_record_id}>
            {(p.patient_name || p.name) + ` (${p.email})`}
          </MenuItem>
        ))}
      </Select>

      {/* Upload Section */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 4 }}>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Button
            variant="contained"
            component="label"
            startIcon={<UploadIcon />}
            disabled={!selectedPatient || uploading}
            sx={{
              background: "linear-gradient(to right, #5de0e6, #004aad)",
              opacity: !selectedPatient || uploading ? 0.3 : 1,
              cursor: !selectedPatient || uploading ? "not-allowed" : "pointer",
              fontFamily: "Neue Machina bold, sans-serif",
              letterSpacing: "0.1em",
            }}
          >
            Choose MRI
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleFileChange}
              disabled={!selectedPatient || uploading}
            />
          </Button>

          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!file || !selectedPatient || uploading}
            sx={{
              background: "linear-gradient(to right, #5de0e6, #004aad)",
              opacity: !file || !selectedPatient || uploading ? 0.3 : 1,
              pointerEvents:
                !file || !selectedPatient || uploading ? "none" : "auto",
              fontFamily: "Neue Machina bold, sans-serif",
              letterSpacing: "0.1em",
            }}
          >
            {uploading ? (
              <CircularProgress size={24} sx={{ color: "white" }} />
            ) : (
              "Upload & Analyze"
            )}
          </Button>
        </Box>

        {/* Display selected file name */}
        {file && (
          <Typography
            sx={{
              color: "#5de0e6",
              fontFamily: "Neue Machina, sans-serif",
              fontSize: "0.9rem",
            }}
          >
            Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
          </Typography>
        )}

        {!selectedPatient && (
          <Typography
            sx={{
              color: "orange",
              fontFamily: "Neue Machina, sans-serif",
              fontSize: "0.9rem",
            }}
          >
            ⚠ Please select a patient first
          </Typography>
        )}
      </Box>

      {/* Table */}
      {scans.length === 0 ? (
        <Typography
          sx={{ color: "white", fontFamily: "Neue Machina, sans-serif" }}
        >
          {selectedPatient
            ? "No scans uploaded yet for this patient"
            : "Select a patient to view their scans"}
        </Typography>
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            backgroundColor: "rgba(255,255,255,0.05)",
            "& .MuiTableCell-root": {
              color: "white",
              fontFamily: "Neue Machina, sans-serif",
              letterSpacing: "0.1em",
            },
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Result</TableCell>
                <TableCell>Confidence</TableCell>
                <TableCell>Thumbnail</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {scans.map((scan) => (
                <TableRow key={scan.scan_id}>
                  <TableCell>
                    {scan.created_at
                      ? new Date(scan.created_at).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                  <TableCell>{scan.result || "N/A"}</TableCell>
                  <TableCell>
                    {scan.confidence
                      ? `${(scan.confidence * 100).toFixed(2)}%`
                      : "N/A"}
                  </TableCell>

                  <TableCell>
                    {scan.image_url ? (
                      <img
                        src={`${API_BASE}${scan.image_url}`}
                        alt="MRI Thumbnail"
                        style={{ width: 80, borderRadius: 6 }}
                        onError={(e) => {
                          console.error(
                            "Image failed to load:",
                            scan.image_url
                          );
                          e.target.style.display = "none";
                        }}
                      />
                    ) : (
                      <Typography variant="caption">No image</Typography>
                    )}
                  </TableCell>

                  <TableCell align="right">
                    <IconButton
                      sx={{ color: "#5de0e6" }}
                      onClick={() => navigate(`/scan/${scan.scan_id}`)}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
