import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

const tumorDetails = {
  "Glioma": {
    title: "🧠 Tumor Type: Glioma",
    description:
      "A glioma is a type of brain tumor that originates in the glial cells, which are the supportive cells of the brain and spinal cord. These tumors are typically cancerous and can be either slow-growing (low-grade) or fast-growing (high-grade). Common types of gliomas include astrocytomas, oligodendrogliomas, and ependymomas",
    bullets: [
      "Grades:\n\n Gliomas are graded based on how aggressive they are, ranging from Grade 1 (least aggressive) to Grade 4 (most aggressive).",
      "Symptoms: \n\n Symptoms can vary depending on the size, location, and grade of the glioma but may include headaches, seizures, nausea, vomiting, and neurological deficits like weakness or numbness.",
      "Treatment: \n\n Treatment options may include surgery, radiation therapy, and chemotherapy, depending on the tumor's type, grade, and location."
    ]
  },
  "Meningioma": {
    title: "🧠 Tumor Type: Meningioma",
    description:
      "A meningioma is a tumor that develops from the meninges, the membranes that surround the brain and spinal cord. These tumors are usually benign and slow-growing, but they can cause problems if they grow large enough to put pressure on the brain, spinal cord, or surrounding tissues. Meningiomas are classified into three grades (I, II, and III), with higher grades indicating more aggressive growth",
    bullets: [
      "Grades:\n\n Meningiomas are graded on a scale of 1 to 3, with Grade 1 being benign, Grade 2 being atypical, and Grade 3 being malignant.",
      "Symptoms: \n\n Meningiomas can cause a range of symptoms depending on their size and location, including headaches, vision problems, seizures, and neurological deficits.",
      "Treatment: \n\n Treatment options include surgery, radiation therapy, and other therapies, depending on the tumor's grade, location, and size."
    ]
  },
  "Pituitary": {
    title: "🧠 Tumor Type: Pituitary",
    description:
      "A pituitary tumor is an abnormal growth in the pituitary gland, a small gland located at the base of the brain. Most pituitary tumors are benign (non-cancerous) and do not spread to other parts of the body. However, they can disrupt normal pituitary function, leading to hormonal imbalances and various symptoms.",
    bullets: [
      "Benign vs. Malignant: \n\n Most pituitary tumors are benign, meaning they don't spread to other parts of the body.",
      "Hormonal Imbalances: \n\n Pituitary tumors can cause the pituitary gland to produce too many or too few hormones, leading to a variety of symptoms.",
      "Symptoms: \n\n Symptoms can vary depending on the tumor's size and the hormone imbalances it causes. Common symptoms include headaches; Eye problems due to pressure on the optic nerve, especially loss of side vision, also called peripheral vision, and double vision; Pain in the face, sometimes including sinus pain or ear pain; Drooping eyelid; Seizures; Nausea and vomiting; Fatigue; and changes in hormone-related functions (e.g., menstrual cycle, sexual function, growth)."
    ]
  },
  "No Tumor": {
    title: "Scan Result: No Tumor Detected",
    description:
      "The scan did not detect any tumors. The brain appears normal based on the AI model's analysis.",
    bullets: [
      "This result suggests no signs of glioma, meningioma, or pituitary tumors.",
      "Continue regular check-ups if symptoms persist.",
      "Consult a healthcare provider for further evaluation if needed."
    ]
  }
};

export default function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { prediction, confidence, imageFile } = location.state || {};
  const imageUrl = imageFile ? URL.createObjectURL(imageFile) : null;

  const info = tumorDetails[prediction];

  if (!prediction || !info) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-red-500 bg-black">
        <p className="text-lg">No result found. Please upload an image.</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 mt-6 text-white rounded bg-cyan-600 hover:bg-cyan-500"
        >
          Back to Upload
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col min-h-screen text-white">
      <div
        className="fixed inset-0 bg-center bg-cover -z-20"
        style={{ backgroundImage: "url('/bg-gradient.jpg')" }}
      />
      <div className="fixed inset-0 pointer-events-none -z-10">
        <video
          className="object-cover w-full h-full opacity-80 blur-md"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/bg-video-1.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <div className="relative z-10">
        <Header />
      </div>

      <main className="relative z-10 flex flex-col items-center justify-center flex-grow px-4 py-16 text-left">
        <Typography
          variant="h3"
          component="h1"
          sx={{
            fontWeight: 'bold',
            fontFamily: 'Neue Machina, sans-serif',
            mb: 6,
            textAlign: 'center',
            letterSpacing: '0.15em',
            fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' }
          }}
        >
          <Box
            component="span"
            sx={{
              background: 'linear-gradient(to right, #5de0e6, #004aad)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline',
              fontWeight: 'bold'
            }}
          >
            Scan
          </Box>{' '}Result
        </Typography>

        <div className="flex flex-col items-start max-w-4xl gap-8 mb-10 md:flex-row">
          <div className="flex-1">
            <h2 className="mb-2 text-lg tracking-wider text-cyan-300 font-neue-machina-bold">
              {info.title}
            </h2>
            {confidence && (
              <p className="mb-4 text-base tracking-wider text-cyan-500 font-neue-machina">
                Confidence: {(confidence * 100).toFixed(2)}%
              </p>
            )}

            <p className="mb-4 text-base tracking-wider text-gray-300 font-neue-machina">
              {info.description}
            </p>
          </div>

          <div className="flex-shrink-0">
            <img
              src={imageUrl || '/sample-mri.png'}
              alt="User MRI Scan"
              className="max-w-[240px] max-h-[240px] w-auto h-auto  rounded shadow-lg"
            />
          </div>
        </div>

        {/* Description */}
        <div className="max-w-4xl space-y-6 tracking-wider font-neue-machina">
          {info.bullets.map((point, idx) => {
            const [label, ...contentParts] = point.split(':');
            const content = contentParts.join(':');

            return (
              <div key={idx} className="mb-6">
                <p className="font-semibold text-cyan-400 font-neue-machina">{label.trim()}:</p>
                <p className="mt-2 leading-relaxed text-gray-200 font-neue-machina">{content.trim()}</p>
              </div>
            );
          })}
        </div>

        {/* Button Upload Another Image */}
        <button
          onClick={() => navigate('/Upload')}
          className="px-6 py-2 mt-10 tracking-wider text-white rounded-lg font-neue-machina-bold bg-gradient-to-r from-cyan-400 to-blue-700 hover:opacity-90"
        >
          Upload Another Image
        </button>

        <p className="max-w-4xl mt-10 tracking-wider text-white text-re font-neue-machina">
          <span className=" text-cyan-300">Important:</span> MedScanAI provides AI-generated predictions and may not always be accurate. Results should not be considered medical advice. Please consult with a qualified healthcare provider for an official diagnosis and treatment plan.
        </p>
      </main>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
