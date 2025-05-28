import { useNavigate } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      {/* Background image with blur */}
      <div
        className="absolute inset-0 bg-cover bg-center blur-lg scale-110"
        style={{ backgroundImage: "url('/bg-gradient.jpg')" }}
      ></div>

      {/* Semi-transparent Video Overlay */}
      <video
        className="absolute inset-0 w-full h-full object-cover opacity-80"
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
        <div className="w-full sm:w-4/5 md:w-3/5 lg:w-1/2 flex justify-center md:justify-end">
          <div className="flex flex-col items-center md:items-start max-w-xl w-full">
            {/* MedScanAI Logo */}
            <img
                src="/logo-MedScanAI.png"
                alt="MedScanAI Logo"
                className="w-20 h-10 mb-5 -mt-20 rounded-sm object-cover"
            />

            {/* Title */}
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: '3.5rem', sm: '3.5rem', md: '4rem', lg: '5rem',xl: '6rem',  },
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
                mb: '4rem',
                lineHeight: 1.6,
                textAlign: { xs: 'center', md: 'left' },
              }}
            >
              AI-powered MRI brain scan analysis<br />
              for early tumor detection
            </Typography>

            {/* Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {/* About */}
                <Box
                    sx={{
                        p: '2px',
                        borderRadius: 2,
                        background: 'linear-gradient(to right, #5de0e6, #004aad)',
                    }}
                >
                    <Button
                        fullWidth
                        onClick={() => navigate('/about')}
                        sx={{
                            fontFamily: '"Neue Machina", sans-serif',
                            textTransform: 'uppercase',
                            backgroundColor: '#0a0a12',
                            letterSpacing: '0.15em',
                            color: '#38b6ff',
                            fontWeight: 600,
                            px: 3,
                            py: 1,
                            borderRadius: 1,
                            '&:hover': {
                                background: 'linear-gradient(90deg, #5de0e6, #004aad)',
                                color: '#fff',
                            },
                        }}
                    >
                        About →
                    </Button>
                </Box>

                {/* Contact */}
                <Box
                    sx={{
                        p: '1px',
                        borderRadius: 1,
                        background: 'linear-gradient(to right, #5de0e6, #004aad)',
                    }}
                >
                    <Button
                        fullWidth
                        onClick={() => navigate('/contact')}
                        sx={{
                            backgroundColor: '#0a0a12',
                            color: '#38b6ff',
                            fontWeight: 600,
                            fontFamily: '"Neue Machina", sans-serif',
                            textTransform: 'uppercase',
                            letterSpacing: '0.15em',
                            px: 3,
                            py: 1,
                            borderRadius: 1,
                            '&:hover': {
                                background: 'linear-gradient(90deg, #5de0e6, #004aad)',
                                color: '#fff',
                            },
                        }}
                    >   
                        Contact →
                    </Button>
                </Box>

                {/* Upload MRI Image */}
                <div className="sm:col-span-2">
                    <Box
                        sx={{
                            p: '2px',
                            borderRadius: 2,
                            background: 'linear-gradient(to right, #5de0e6, #004aad)',
                        }}
                    >
                        <Button
                            fullWidth
                            onClick={() => navigate('/upload')}
                            sx={{
                                backgroundColor: '#0a0a12',
                                color: '#38b6ff',
                                fontWeight: 600,
                                fontFamily: '"Neue Machina", sans-serif',
                                textTransform: 'uppercase',
                                letterSpacing: '0.15em',
                                px: 3,
                                py: 1,
                                borderRadius: 1,
                                '&:hover': {
                                    background: 'linear-gradient(90deg, #5de0e6, #004aad)',
                                    color: '#fff',
                                },
                            }}
                        >
                            Upload MRI Image →
                        </Button>
                    </Box>
                </div>
            </div>


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
