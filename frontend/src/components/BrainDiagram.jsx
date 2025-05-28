'use client';

import * as React from 'react';
import {
  Box,
  CssBaseline,
  Grid,
  Paper,
  ThemeProvider,
  createTheme,
  Typography,
  Container,
  useMediaQuery,
  useTheme,
} from '@mui/material';

const descriptions = [
  "MedScanAI is an AI-powered web application designed to support early detection of brain tumors through MRI analysis. Our mission is to make advanced medical diagnostics more accessible — especially in communities where radiologists or specialized imaging tools may be limited.",
  "Users can securely upload their brain MRI images to the platform, where a deep learning model analyzes the scans and provides a preliminary classification — such as normal or possibly abnormal. While not a replacement for medical professionals, MedScanAI offers a starting point for individuals and caregivers to seek timely medical attention.",
  "What began as a focused brain tumor detection tool is part of a broader vision: a future where artificial intelligence helps scan and detect multiple types of conditions through medical imaging, offering faster insights and peace of mind.",
  "This project is driven by a passion for combining healthcare and technology — where every line of code is written with the goal of making a life-saving difference.",
];

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0f172a',
    },
    text: {
      primary: '#ffffff',
    },
  },
});

export default function BrainDiagram() {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(muiTheme.breakpoints.between('sm', 'md'));
  const columns = isMobile ? 1 : isTablet ? 2 : 4;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="xl" sx={{ py: -20, position: 'relative' }}>
        {/* Brain Icon (Video) */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <video
            src="/bg-video-2.webm"
            autoPlay
            loop
            muted
            playsInline
            style={{
              width: 300,
              height: 300,
              borderRadius: '50%',
              objectFit: 'cover',
              display: 'inline-block',
            }}
          />
        </Box>

        {/* Gradient Line */}
        <Box
          sx={{
            height: 10,
            width: '100%',
            background: 'linear-gradient(to right, #5de0e6, #004aad)',
            borderRadius: 9999,
            mb: 6,
            position: 'relative',
          }}
        >
          {/* Connector Lines */}
          <Box
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              width: '100%',
              display: 'grid',
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
              px: 3,
              mt: 0.5,
            }}
          >
            {Array.from({ length: columns }).map((_, i) => (
              <Box
                key={i}
                sx={{
                  justifySelf: 'center',
                  width: '2px',
                  height: '40px',
                  background: 'linear-gradient(to bottom, #5de0e6, #004aad)',
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Paragraph-style Cards in Columns */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)',
            },
            gap: '2rem',
            color: 'white',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            lineHeight: 1.75,
            px: 2,
          }}
        >
          {descriptions.map((desc, index) => (
            <Box
              key={index}
              sx={{
                fontFamily: '"Neue Machina", sans-serif',
                letterSpacing: '0.05em',
                fontSize: '1rem',
                background: 'linear-gradient(to bottom, #1e293b, #0f172a)',
                border: '1px solid #5de0e6',
                borderRadius: '20px',
                p: 3,
                height: '100%',
                display: 'flex',
                alignItems: 'flex-start',
                opacity: 0.7,
                transition: 'opacity 0.3s ease',
                '&:hover': {
                  opacity: 1,
                  background: 'linear-gradient(#5de0e6, #004aad)',
                  color: '#fff',
                },
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                '&:nth-of-type(odd)': {
                  background: 'linear-gradient(to bottom, #0f172a, #1e293b)',
                },
                '&:nth-of-type(even)': {
                  background: 'linear-gradient(to bottom, #1e293b, #0f172a)',
                },  
              }}
            >
              {desc}
            </Box>
          ))}
        </Box>
      </Container>
    </ThemeProvider>
  );
}
