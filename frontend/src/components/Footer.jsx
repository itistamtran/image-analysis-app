import { Box } from '@mui/material';
import { FaGithub, FaLinkedin, FaGlobe } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="py-6 text-sm text-white bg-transparent">
      {/* Top gradient line */}
      <div className="w-full h-0.5 mb-5 bg-gradient-to-r from-cyan-300 to-blue-700"></div>

      <Box
        sx={{
          px: 4,
          fontFamily: 'Neue Machina, sans-serif',
          display: 'flex',
          justifyContent: { xs: 'center', md: 'space-between' },
          flexDirection: { xs: 'column', md: 'row' },
          textAlign: { xs: 'center', md: 'left' },
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: { xs: 1.5, md: 0 },
        }}
      >
        {/* Left side: Copyright */}
        <p className="text-sm text-white">© 2025 Tam Tran. All rights reserved.</p>

        {/* Right side: Social icons */}
        <div className="flex gap-6 text-xl text-cyan-300">
          <a href="https://github.com/itistamtran" target="_blank" rel="noopener noreferrer"><FaGithub /></a>
          <a href="https://www.linkedin.com/in/tamtran-/" target="_blank" rel="noopener noreferrer"><FaLinkedin /></a>
          <a href="https://tamtran.vercel.app/" target="_blank" rel="noopener noreferrer"><FaGlobe /></a>
        </div>
      </Box>
    </footer>
  );
}
