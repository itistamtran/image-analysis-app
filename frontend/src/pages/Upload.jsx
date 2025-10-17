import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import Header from '../components/Header';
import Footer from '../components/Footer';
import API_BASE from "../utils/config";

console.log("Upload page using API_BASE:", API_BASE);

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [prediction, setPrediction] = useState('');
  const [confidence, setConfidence] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const VALID_CLASSES = ['glioma', 'meningioma', 'pituitary', 'no_tumor', 'unknown'];

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
    setPrediction('');
    setConfidence(null);
  };

  const handleUpload = async () => {
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (!file) {
      setError('No file chosen');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);
    if (user) formData.append("user_id", user.id);

    setLoading(true);
    try {
      console.log("Sending request to:", `${API_BASE}/predict`);
      const response = await axios.post(`${API_BASE}/predict`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: false,
      });


      const { id, result, confidence: conf, image_url, heatmap_url = null, created_at, probabilities } = response.data;

      setPrediction(result);
      setConfidence(conf);

      // Build absolute URLs
      const fullImageUrl = image_url?.startsWith('http')
        ? image_url
        : `${API_BASE}${image_url}`;

      const fullHeatmapUrl =
        heatmap_url && typeof heatmap_url === "string" && heatmap_url.trim() !== ""
          ? (heatmap_url.startsWith('http')
            ? heatmap_url
            : `${API_BASE}${heatmap_url}`)
          : null;

      if (user) {
        let storedScans = JSON.parse(localStorage.getItem("scans") || "[]");
        storedScans.unshift({
          id,
          result,
          confidence: conf,
          image_url,
          heatmap_url,
          created_at: new Date().toISOString()
        });
        localStorage.setItem("scans", JSON.stringify(storedScans));
        window.dispatchEvent(new Event("scansUpdated"));
      }

      if (result === 'LowConfidence') return;

      navigate('/result', {
        state: {
          id,
          prediction: result,
          confidence: conf,
          image_url: fullImageUrl,
          heatmap_url: fullHeatmapUrl,
          probabilities,
        },
      });

    } catch (err) {
      console.error(err);

     if (err.message === "Network Error" || !err.response) {
      setError("ᶻ𝗓𐰁 The server is just waking up — please reload the page and try again.");
      return;
      }
      
      let msg = err.response?.data
        ? JSON.stringify(err.response.data, null, 2)
        : err.message || JSON.stringify(err, null, 2);
      setError('Server error:\n' + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col min-h-screen text-white">
      {/* Background Image Layer */}
      <div
        className="fixed inset-0 bg-center bg-cover -z-20"
        style={{ backgroundImage: "url('/bg-gradient.jpg')" }}
      />

      {/* Background Video Layer */}
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

      <div className="relative z-10">
        <Header />
      </div>

      {/* Main Upload Content */}
      <main className="relative flex flex-col items-center justify-center flex-grow px-10 py-20 z-15">
        <Typography
          variant="h3"
          component="h1"
          sx={{
            fontWeight: 'bold',
            fontFamily: 'Neue Machina, sans-serif',
            mb: 8,
            textAlign: 'center',
            letterSpacing: '0.15em',
            fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
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
            }}
          >
            Upload
          </Box>{' '}
          MRI Image
        </Typography>

        {!localStorage.getItem("user") && (
          <p className="max-w-md mb-8 text-sm tracking-wider text-center text-cyan-300 font-neue-machina">
            💡 <span className="font-semibold tracking-wider text-cyan-300 font-neue-machina">Tip:</span> You can upload an MRI image as a guest,
            but if you <span className="font-semibold tracking-wider text-cyan-300 font-neue-machina">log in</span>,
            your scans will be saved in your dashboard and you’ll also see
            the <span className="font-semibold tracking-wider text-cyan-300 font-neue-machina">AI-generated Grad-CAM Heatmap</span> for each prediction.
          </p>
        )}

        <label className="relative inline-block w-full max-w-md mb-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="sr-only"
          />
          <div className="flex items-center justify-center w-full h-12 px-4 tracking-wider text-white border-2 rounded-lg cursor-pointer font-neue-machina bg-black/50 border-cyan-500">
            {file ? file.name : 'Choose File'}
          </div>
        </label>

        <button
          onClick={handleUpload}
          className="w-full max-w-md px-6 py-3 tracking-wider text-white rounded-lg font-neue-machina-bold bg-gradient-to-r from-cyan-400 to-blue-700 hover:opacity-90"
        >
          {loading ? 'Analyzing...' : 'Predict'}
        </button>

        {error && <p className="mt-4 text-sm tracking-wider text-red-400 font-neue-machina">{error}</p>}

        {prediction === 'LowConfidence' && (
          <p className="mt-6 text-sm tracking-wider text-red-400 font-neue-machina">
            ⚠️ The model is not confident enough to make a prediction.<br />
            Confidence: {confidence ? (confidence * 100).toFixed(2) : 'N/A'}%<br />
            Please try uploading a different or higher quality MRI image.
          </p>
        )}

        {VALID_CLASSES.includes(prediction?.toLowerCase()) && (
          <p className="mt-6 text-lg tracking-wider text-cyan-300 font-neue-machina">
            🧠 Result: {prediction}<br />
            Confidence: {(confidence * 100).toFixed(2)}%
          </p>
        )}

      </main>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
