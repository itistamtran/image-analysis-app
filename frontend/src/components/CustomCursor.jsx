import { useEffect, useState } from 'react';
import cursorSVG from '../assets/custom-cursor.svg'; 

export default function CustomCursor() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const move = (e) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', move);

    const handleHover = (e) => {
      const isHoverTarget = e.target.closest('a, button, [role="button"]');
      setHovering(!!isHoverTarget);
    };

    document.addEventListener('mouseover', handleHover);
    return () => {
      window.removeEventListener('mousemove', move);
      document.removeEventListener('mouseover', handleHover);
    };
  }, []);

  return (
    <div
      className="fixed z-[9999] pointer-events-none transition-transform duration-150 ease-out"
      style={{
        left: pos.x,
        top: pos.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <img
        src={cursorSVG}
        alt="Custom Cursor"
        className={`transition-transform duration-150 ease-out ${
          hovering ? 'scale-150' : 'scale-100'
        }`}
        style={{
          width: '24px',
          height: '24px',
          filter:
            'drop-shadow(0 0 6px rgba(93, 224, 230, 0.6)) drop-shadow(0 0 12px rgba(0, 74, 173, 0.6))',
        }}
      />
    </div>
  );
}
