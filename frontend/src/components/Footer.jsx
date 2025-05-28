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
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        {/* Left side: Copyright */}
        <p className="text-xs opacity-80">© 2025 Tam Tran. All rights reserved.</p>

        {/* Right side: Social icons */}
        <div className="flex gap-5 text-lg text-cyan-300">
          <a
            href="https://github.com/itistamtran"
            target="_blank"
            rel="noopener noreferrer"
            className="transition duration-200 hover:text-white"
            aria-label="GitHub"
          >
            <FaGithub />
          </a>
          <a
            href="https://www.linkedin.com/in/tamtran-/"
            target="_blank"
            rel="noopener noreferrer"
            className="transition duration-200 hover:text-white"
            aria-label="LinkedIn"
          >
            <FaLinkedin />
          </a>
          <a
            href="https://tamtran.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="transition duration-200 hover:text-white"
            aria-label="Portfolio"
          >
            <FaGlobe />
          </a>
        </div>
      </Box>
    </footer>
  );
}
