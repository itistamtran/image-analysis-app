import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import API_BASE from "../utils/config";
import Header from "../components/Header";
import Footer from "../components/Footer";

const tumorDetails = {
  Glioma: {
    title: "🧠 Tumor Type: Glioma",
    description:
      "A glioma is a type of brain tumor that originates in the glial cells, which are the supportive cells of the brain and spinal cord. These tumors are typically cancerous and can be either slow-growing (low-grade) or fast-growing (high-grade). Common types of gliomas include astrocytomas, oligodendrogliomas, and ependymomas",
    bullets: [
      "Grades:\n\n Gliomas are graded based on how aggressive they are, ranging from Grade 1 (least aggressive) to Grade 4 (most aggressive).",
      "Symptoms: \n\n Symptoms can vary depending on the size, location, and grade of the glioma but may include headaches, seizures, nausea, vomiting, and neurological deficits like weakness or numbness.",
      "Treatment: \n\n Treatment options may include surgery, radiation therapy, and chemotherapy, depending on the tumor's type, grade, and location.",
    ],
  },
  Meningioma: {
    title: "🧠 Tumor Type: Meningioma",
    description:
      "A meningioma is a tumor that develops from the meninges, the membranes that surround the brain and spinal cord. These tumors are usually benign and slow-growing, but they can cause problems if they grow large enough to put pressure on the brain, spinal cord, or surrounding tissues. Meningiomas are classified into three grades (I, II, and III), with higher grades indicating more aggressive growth",
    bullets: [
      "Grades:\n\n Meningiomas are graded on a scale of 1 to 3, with Grade 1 being benign, Grade 2 being atypical, and Grade 3 being malignant.",
      "Symptoms: \n\n Meningiomas can cause a range of symptoms depending on their size and location, including headaches, vision problems, seizures, and neurological deficits.",
      "Treatment: \n\n Treatment options include surgery, radiation therapy, and other therapies, depending on the tumor's grade, location, and size.",
    ],
  },
  Pituitary: {
    title: "🧠 Tumor Type: Pituitary",
    description:
      "A pituitary tumor is an abnormal growth in the pituitary gland, a small gland located at the base of the brain. Most pituitary tumors are benign (non-cancerous) and do not spread to other parts of the body. However, they can disrupt normal pituitary function, leading to hormonal imbalances and various symptoms.",
    bullets: [
      "Benign vs. Malignant: \n\n Most pituitary tumors are benign, meaning they don't spread to other parts of the body.",
      "Hormonal Imbalances: \n\n Pituitary tumors can cause the pituitary gland to produce too many or too few hormones, leading to a variety of symptoms.",
      "Symptoms: \n\n Symptoms can vary depending on the tumor's size and the hormone imbalances it causes. Common symptoms include headaches; Eye problems due to pressure on the optic nerve, especially loss of side vision, also called peripheral vision, and double vision; Pain in the face, sometimes including sinus pain or ear pain; Drooping eyelid; Seizures; Nausea and vomiting; Fatigue; and changes in hormone-related functions (e.g., menstrual cycle, sexual function, growth).",
    ],
  },
  "No Tumor": {
    title: "Scan Result: No Tumor Detected",
    description:
      "The scan did not detect any tumors. The brain appears normal based on the AI model's analysis.",
    bullets: [
      "This result suggests no signs of glioma, meningioma, or pituitary tumors.",
      "Continue regular check-ups if symptoms persist.",
      "Consult a healthcare provider for further evaluation if needed.",
    ],
  },
  Unknown: {
    title: "Unable to Analyze Image",
    description:
      "The uploaded image could not be classified as a brain tumor type. This may happen if the image format is incorrect, the image quality is too low, or if a non-MRI image was uploaded.",
    bullets: [
      "Make sure you are uploading a valid MRI brain scan image.",
      "Check image resolution and ensure brain structures are visible.",
      "For medical concerns, always consult a healthcare provider.",
    ],
  },
  Unclear: {
    title: "Unable to confidently predict",
    description: "The image was unclear or uncertain for prediction.",
    bullets: [
      "Please check the uploaded MRI image quality.",
      "Consider uploading a higher resolution MRI scan.",
      "Consult a healthcare provider for further evaluation.",
    ],
  },
};

export default function ScanDetailPage() {
  const { scanId } = useParams();
  const navigate = useNavigate();

  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    async function fetchScan() {
      try {
        const res = await axios.get(`${API_BASE}/patients/scan/${scanId}`);
        setScan(res.data);
        setLoading(false);

        console.log("🔥 Raw backend response:", res.data);
        console.log("🔥 Heatmap URL returned:", res.data.heatmap_url);
        console.log("🔥 Type of heatmap_url:", typeof res.data.heatmap_url);

        if (!res.data.heatmap_url || res.data.heatmap_url === "null") {
          pollHeatmap();
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }
    fetchScan();
  }, [scanId]);

  useEffect(() => {
    if (!scanId || scan?.heatmap_url) return;

    console.log("🌀 Polling for patient heatmap:", scanId);
    setPolling(true);

    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${API_BASE}/patients/scan/${scanId}`);
        const updated = res.data;

        if (
          updated &&
          typeof updated.heatmap_url === "string" &&
          updated.heatmap_url.trim() !== "" &&
          updated.heatmap_url !== "null"
        ) {
          const fullUrl = updated.heatmap_url.startsWith("http")
            ? updated.heatmap_url
            : `${API_BASE}${updated.heatmap_url}`;

          console.log("🔥 Heatmap found:", fullUrl);

          setScan(updated);
          clearInterval(interval);
          setPolling(false);
        } else {
          console.log("⏳ Still waiting for heatmap...");
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 4000);

    const timeout = setTimeout(() => {
      console.warn("⚠️ Giving up after 60s.");
      clearInterval(interval);
      setPolling(false);
    }, 60000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [scanId, scan]);

  if (loading)
    return <div className="mt-20 text-center text-white">Loading scan...</div>;

  const normalizedPrediction = scan.result
    ? scan.result.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
    : "";

  const info = tumorDetails[normalizedPrediction] || tumorDetails["Unknown"];

  const fullImageUrl = scan.image_url?.startsWith("http")
    ? scan.image_url
    : `${API_BASE}${scan.image_url}`;

  const fullHeatmapUrl =
    scan.heatmap_url && scan.heatmap_url !== "null"
      ? scan.heatmap_url.startsWith("http")
        ? scan.heatmap_url
        : `${API_BASE}${scan.heatmap_url}`
      : null;

  console.log("🔗 fullHeatmapUrl computed:", fullHeatmapUrl);

  const isTumorType = ["Glioma", "Meningioma", "Pituitary"].includes(
    normalizedPrediction
  );

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

      <Header />

      <main className="relative z-10 flex justify-center flex-grow px-10 py-20 mx-auto sm:px-20">
        <div className="flex flex-col w-full max-w-4xl">
          <h1
            className="mb-10 text-4xl font-bold tracking-widest text-center"
            style={{
              backgroundImage: "linear-gradient(to right, #5de0e6, #004aad)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Scan Result
          </h1>

          <div className="flex flex-col-reverse gap-8 mb-12 md:flex-row">
            <div className="flex-1">
              <h2 className="mb-2 text-lg font-bold tracking-wider text-cyan-300">
                {info.title}
              </h2>

              {scan.confidence && (
                <p className="mb-4 tracking-wider text-cyan-500">
                  Confidence: {(scan.confidence * 100).toFixed(2)}%
                </p>
              )}

              <p className="mb-4 tracking-wider text-white">
                {info.description}
              </p>

              {isTumorType ? (
                <div className="space-y-4 text-white">
                  {info.bullets.map((point, idx) => (
                    <div key={idx}>
                      <p className="text-cyan-400">{point.split(":")[0]}:</p>
                      <p>{point.split(":").slice(1).join(":")}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2 text-white">
                  {info.bullets.map((b, i) => (
                    <p key={i}>{b}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col items-center md:w-1/3">
              <img
                src={fullImageUrl}
                className="w-[200px] h-[200px] rounded shadow-lg mb-4"
              />
              <p className="text-sm text-cyan-300">MRI Scan</p>

              {fullHeatmapUrl ? (
                <img
                  src={fullHeatmapUrl}
                  className="w-[200px] h-[200px] rounded shadow-lg border border-cyan-300/40 mt-6"
                />
              ) : polling ? (
                <p className="mt-6 text-cyan-300">Generating heatmap...</p>
              ) : (
                <p className="mt-6 text-cyan-300">No heatmap available</p>
              )}
            </div>
          </div>

          <button
            onClick={() => navigate("/doctor-dashboard")}
            className="px-6 py-2 mx-auto mt-10 tracking-wider rounded-lg bg-gradient-to-r from-cyan-400 to-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
