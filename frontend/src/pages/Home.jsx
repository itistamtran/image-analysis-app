import { useNavigate } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

export default function Home() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("user");

  const handleUploadClick = () => {
    navigate("/upload");
  };

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      {/* Background image with blur */}
      <div
        className="absolute inset-0 scale-110 bg-center bg-cover blur-lg"
        style={{ backgroundImage: "url('/bg-gradient.jpg')" }}
      ></div>

      {/* Semi-transparent Video Overlay */}
      <video
        className="absolute inset-0 object-cover w-full h-full opacity-80"
        autoPlay
        muted
        loop
        playsInline
        onEnded={(e) => e.target.play()}
      >
        <source src="/bg-video-1.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20"></div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-end min-h-screen px-6 sm:px-12 md:px-20 lg:px-40 xl:px-52">
        <div className="flex justify-center w-full sm:w-4/5 md:w-3/5 lg:w-1/2 md:justify-end">
          <div className="flex flex-col items-center w-full max-w-xl md:items-start">
            {/* MedScanAI Logo */}
            <img
              src="/logo-MedScanAI.png"
              alt="MedScanAI Logo"
              className="object-cover w-20 h-10 mb-5 -mt-20 rounded-sm"
            />

            {/* Title */}
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: '3.5rem', sm: '3.5rem', md: '4rem', lg: '5rem', xl: '6rem', },
                fontWeight: 800,
                fontFamily: '"Neue Machina", sans-serif',
                mb: 2,
                letterSpacing: '0.15em',
                textAlign: { xs: 'center', md: 'left' },
              }}
            >
              MedScanAI
            </Typography>

            {/* Subtitle */}
            <Typography
              sx={{
                fontSize: '1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: '#cbd5e1',
                fontFamily: '"Neue Machina", sans-serif',
                mt: '-1.5rem',
                mb: '5rem',
                lineHeight: 1.6,
                textAlign: { xs: 'center', md: 'left' },
              }}
            >
              AI-powered MRI brain scan analysis<br />
              for early tumor detection
            </Typography>

            {/* Buttons Row */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 2,
                flexWrap: { xs: 'wrap', sm: 'nowrap' },
                mb: 2,
              }}
            >
              {[
                { label: 'About →', path: '/about' },
                { label: 'Contact →', path: '/contact' },
                { label: 'Sign Up →', path: '/signup' },
                { label: 'Log In →', path: '/login' },
              ].map((btn) => (
                <Box
                  key={btn.path}
                  sx={{
                    p: '1px',
                    borderRadius: 2,
                    background: 'linear-gradient(to right, #5de0e6, #004aad)',
                    width: { xs: '43%', sm: '100px', md: '120px' },
                    minWidth: '90px',
                  }}
                >
                  <Button
                    fullWidth
                    onClick={() => navigate(btn.path)}
                    sx={{
                      backgroundColor: '#0a0a12',
                      color: '#38b6ff',
                      fontWeight: 600,
                      fontFamily: '"Neue Machina", sans-serif',
                      textTransform: 'uppercase',
                      letterSpacing: '0.15em',
                      px: 4,
                      py: 1,
                      borderRadius: 1,
                      whiteSpace: 'nowrap',
                      '&:hover': {
                        background: 'linear-gradient(90deg, #5de0e6, #004aad)',
                        color: '#fff',
                      },
                    }}
                  >
                    {btn.label}
                  </Button>
                </Box>
              ))}
            </Box>

            {/* Upload MRI Image */}
            <Box
              sx={{
                width: {
                  xs: `calc((43% * 2) + 16px)`,
                  sm: `calc((100px * 2) + 16px)`,
                  md: `calc((120px * 4) + (16px * 3))`,
                },
                mx: 'auto',
                p: '1px',
                borderRadius: 2,
                background: 'linear-gradient(to right, #5de0e6, #004aad)',
              }}
            >
              <Button
                fullWidth
                onClick={handleUploadClick}
                sx={{
                  backgroundColor: '#0a0a12',
                  color: '#38b6ff',
                  fontWeight: 600,
                  fontFamily: '"Neue Machina", sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  px: 4,
                  py: 1,
                  borderRadius: 1,
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    background: 'linear-gradient(90deg, #5de0e6, #004aad)',
                    color: '#fff',
                  },
                }}
              >
                Upload MRI Image →
              </Button>
            </Box>

            {/* Footer */}
            <Typography
              component="a"
              href="https://tamtran.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                fontFamily: '"Neue Machina", sans-serif',
                letterSpacing: '0.15em',
                fontSize: '1rem',
                color: '#38b6ff',
                mt: 10,
                textAlign: { xs: 'center', md: 'left' },
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'nounderline',
                  color: '#5de0e6',
                },
              }}
            >
              🌐 tamtran
            </Typography>

          </div>
        </div>
      </div>
    </div>
  );
}
