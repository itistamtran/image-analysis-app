import { useState } from 'react';
import emailjs from '@emailjs/browser';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { FaGithub, FaLinkedin, FaGlobe } from 'react-icons/fa';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);
  const [emailError, setEmailError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'email') setEmailError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
      formData,
      import.meta.env.VITE_EMAILJS_PUBLIC_KEY
    )

      .then(
        () => {
          setSubmitted(true);
          setError(false);
          setFormData({ name: '', email: '', message: '' });
        },
        () => {
          console.error("EmailJS Error:", err);
          setError(true);
          setSubmitted(false);
        }
      );
  };

  return (
    <div className="relative flex flex-col min-h-screen text-white">
      <div className="fixed inset-0 bg-center bg-cover -z-20" style={{ backgroundImage: "url('/bg-gradient.jpg')" }} />
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

      <Header />

      <main className="relative z-10 flex-grow w-full max-w-6xl px-6 py-16 mx-auto">
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
            Contact
          </Box>{' '}
          Us
        </Typography>

        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          {/* Left Text Section */}
          <div className="md:w-1/2">
            <Typography variant="h5" sx={{ fontFamily: 'Neue Machina, sans-serif', mb: 4 }}>
              Get in <Box component="span" sx={{ color: '#5de0e6', fontWeight: 'bold' }}>Touch</Box>
            </Typography>
            <p className="mb-4 text-sm text-white md:text-base">
              Whether you have a question, feedback, or just want to say hello — I’d love to hear from you. MedScanAI is built for real people, and your voice matters as we grow and improve. Feel free to use the form or, if you’d like to discuss a project, collaboration, or work opportunity, you can also email me directly:
            </p>
            <p className="mb-4 font-semibold text-cyan-400">
              <a href="mailto:itistamtran@gmail.com"     
                 className="transition-all duration-300 bg-clip-text text-cyan-400 hover:text-transparent hover:bg-gradient-to-r hover:from-cyan-300 hover:to-blue-700"
              > itistamtran@gmail.com</a>
            </p>           
            <p className="mb-2">You can also connect with me here:</p>
            <div className="flex gap-4 text-xl text-cyan-300">
              <a href="https://github.com/itistamtran" target="_blank" rel="noopener noreferrer"><FaGithub /></a>
              <a href="https://www.linkedin.com/in/tamtran-/" target="_blank" rel="noopener noreferrer"><FaLinkedin /></a>
              <a href="https://tamtran.vercel.app/" target="_blank" rel="noopener noreferrer"><FaGlobe /></a>
            </div>
          </div>

          {/* Contact Form */}
          <div className="md:w-[45%] bg-gradient-to-br from-cyan-500/30 to-blue-700/30 backdrop-blur-md p-6 rounded-xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block mb-1 text-sm font-semibold text-white">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 text-white bg-transparent border rounded-md border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-semibold text-white">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 text-white bg-transparent border rounded-md border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
                {emailError && <p className="mt-1 text-sm font-medium text-red-400">{emailError}</p>}
              </div>
              <div>
                <label className="block mb-1 text-sm font-semibold text-white">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="5"
                  className="w-full px-4 py-2 text-white bg-transparent border rounded-md border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>
              <div className="pt-2">
                <div className="g-recaptcha" data-sitekey="YOUR_SITE_KEY_HERE"></div>
              </div>
              <button
                type="submit"
                className="px-6 py-2 text-sm font-bold text-white transition duration-200 rounded-md bg-transparent hover:shadow-[0_0_12px_rgba(0,255,255,0.4)]"
                style={{
                  border: '2px solid transparent',
                  backgroundImage: 'linear-gradient(#0f172a, #0f172a), linear-gradient(to right, #5de0e6, #004aad)',
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'padding-box, border-box',
                }}
              >
                Send Message
              </button>
              {submitted && <p className="mt-4 text-sm font-semibold text-cyan-300">Your message has been sent!</p>}
              {error && <p className="mt-4 text-sm font-semibold text-red-400">Something went wrong. Please try again.</p>}
            </form>
          </div>
        </div>

        {/* Location and Timezone - moved here */}
        <div className="mt-16">
          <h4 className="mb-2 text-lg font-bold">📍 Orange County, California, USA</h4>
          <iframe
            title="Orange County, California Map"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d423286.27407637436!2d-118.69193024700598!3d33.7174708!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80dc925c54d5f7cf%3A0xdea6c3618ff0d607!2sOrange%20County%2C%20CA!5e0!3m2!1sen!2sus!4v1716760031873!5m2!1sen!2sus"
            width="100%"
            height="300"
            allowFullScreen=""
            loading="lazy"
            className="border rounded-lg border-cyan-500"
          ></iframe>
          <p className="mt-2 text-sm">🕒 Time Zone: Pacific Time (UTC -08:00)</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
