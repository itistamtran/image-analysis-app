import { useState } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [prediction, setPrediction] = useState('');
  const [confidence, setConfidence] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
  };

  const handleUpload = async () => {
    if (!file) {
      setError('No file chosen');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setLoading(true);
    try {
      const response = await axios.post('lask-api-production-f9b2.up.railway.app/predict', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
    });

      const result = response.data.prediction;
      const conf = response.data.confidence;

      setPrediction(result);
      setConfidence(conf);

      if (result === 'Unknown') {
        return; // Stay on Upload page to show the warning
      }
      // Navigate to Result page with prediction data      
      navigate('/result', {
        state: {
          prediction: result,
          confidence: conf,
          imageFile: file
        }
      });
    
    } catch (err) {
        console.error(err);
        let msg = 'Unknown error';

        if (err.response?.data) {
          msg = JSON.stringify(err.response.data, null, 2); // Pretty-print response
        } else if (err.message) {
          msg = err.message;
        } else {
          msg = JSON.stringify(err, null, 2);
        }

        setError('Server error:\n' + msg);
      }
        finally {
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
      <main className="relative flex flex-col items-center justify-center flex-grow px-4 py-20 z-15">
        <Typography
          variant="h3"
          component="h1"
          sx={{
            fontWeight: 'bold',
            fontFamily: 'Neue Machina, sans-serif',
            mb: 10,
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
        <label className="relative inline-block w-full max-w-md mb-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="sr-only"
          />
          <div className="flex items-center justify-center w-full h-12 px-4 font-bold text-white border-2 rounded-lg cursor-pointer bg-black/50 border-cyan-500">
            {file ? file.name : 'Choose File'}
          </div>
        </label>

        <button
          onClick={handleUpload}
          className="w-full max-w-md px-6 py-3 font-bold text-white rounded-lg bg-gradient-to-r from-cyan-400 to-blue-700 hover:opacity-90"
        >
          {loading ? 'Analyzing...' : 'Predict'}
        </button>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        {prediction === 'Unknown' && (
          <p className="mt-6 text-sm text-red-400">
            ⚠️ The confidence score is {confidence ? (confidence * 100).toFixed(2) : 'N/A'}%, which is lower than the required threshold (70%).<br />
            This image is not recognized as a valid brain MRI scan.
          </p>
        )}

        {prediction && prediction !== 'Unknown' && (
          <p className="mt-6 text-lg font-medium text-cyan-300">
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
