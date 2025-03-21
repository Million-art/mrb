import { useState, useEffect } from "react";
import { ArrowLeft, X, UploadCloud, Send, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { app } from "@/libs/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/libs/firebase";
import { getFunctions, httpsCallable } from "firebase/functions";
import { Ambassador } from "@/interface/Ambassador";
import { Country } from "@/interface/country";
import { telegramId } from "@/libs/telegram";
import { AnimatePresence, motion } from "framer-motion";
import HourglassAnimation from "./AnimateLoader"; 

interface ReceiveModalProps {
  onClose: () => void;
  country: Country | null;
}

const ReceiveModal: React.FC<ReceiveModalProps> = ({ onClose, country }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [selectedAmbassador, setSelectedAmbassador] = useState<Ambassador | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false); // State for redirecting animation

  const storage = getStorage(app);
  const functions = getFunctions(app);

  // Fetch ambassadors from Firestore
  useEffect(() => {
    const fetchAmbassadors = async () => {
      try {
        if (!country) {
          console.log("No country selected.");
          return;
        }

        const q = query(
          collection(db, "staffs"),
          where("role", "==", "ambassador"),
          where("kyc", "==", "approved"),
          where("country", "==", country.name)
        );
        const querySnapshot = await getDocs(q);

        const fetchedAmbassadors: Ambassador[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedAmbassadors.push({
            id: doc.id,
            firstName: data.firstName || "Unknown",
            lastName: data.lastName || "Unknown",
            tgUsername: data.tgUsername || "Unknown",
            phone: data.phone || "Unknown",
            country: data.country || "Unknown",
            role: data.role || "ambassador",
            email: data.email || "",
            address: data.address || "",
            idFront: data.idFront || "",
            idBack: data.idBack || "",
            photoUrl: data.photoUrl || "",
            paymentMethods: data.paymentMethods || [],
            createdAt: data.createdAt || new Date(),
            kyc: data.kyc || "",
          });
        });

        setAmbassadors(fetchedAmbassadors);
      } catch (error) {
        console.error("Error fetching ambassadors:", error);
        setError("Failed to fetch ambassadors. Please try again.");
      }
    };

    fetchAmbassadors();
  }, [country]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const allowedTypes = ["image/png", "image/jpeg", "application/pdf"];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError("Invalid file type. Please upload PNG, JPG, or PDF.");
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("File size too large. Max 5MB allowed.");
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }
    if (!selectedAmbassador) {
      setError("Please select an ambassador first.");
      return;
    }
    if (!amount) {
      setError("Please enter the amount.");
      return;
    }

    setUploading(true);
    setRedirecting(true); // Show the redirecting animation
    setError(null);
    setSuccess(null);

    try {
      // Upload the file to Firebase Storage
      const storageRef = ref(storage, `receipts/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Upload failed:", error);
          setUploading(false);
          setRedirecting(false); // Hide the redirecting animation
          setError("Upload failed. Please try again.");
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          // Prepare the payload
          const payload = {
            ambassadorId: selectedAmbassador.id,
            amount: amount,
            senderTgId: String(telegramId),
            documents: [downloadURL],
            createdAt: new Date().toISOString(),
          };

          // Call the Firebase Cloud Function
          const createReceiptFunction = httpsCallable(functions, "createReceipt");
          await createReceiptFunction(payload);

          setUploading(false);
          setRedirecting(false); // Hide the redirecting animation
          setSuccess("Receipt created successfully!");

          // Close the modal after 2 seconds
          setTimeout(() => {
            onClose();
          }, 2000);
        }
      );
    } catch (error: any) {
      console.error("Error:", error);
      setUploading(false);
      setRedirecting(false); // Hide the redirecting animation
      setError(error.message || "An error occurred. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
      <div className="bg-[#1E1E1E] text-white w-full max-w-md rounded-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <button onClick={onClose} className="hover:text-gray-300">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Fiat Deposit</h1>
          <button onClick={onClose} className="hover:text-gray-300">
            <X size={24} />
          </button>
        </div>

        {/* Country Display */}
        {country && (
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center justify-center gap-4">
              <img
                src={country.flag}
                alt={`${country.name} flag`}
                className="w-5 h-5 rounded-full object-cover"
              />
              <div className="text-center">
                <p className="font-semibold text-lg">{country.name}</p>
              </div>
            </div>

            {/* Display Ambassadors */}
            {ambassadors.length > 0 ? (
              <div className="mt-4">
                <h2 className="text-lg font-semibold mb-2">Ambassadors</h2>
                <ul className="space-y-2">
                  {ambassadors.map((ambassador) => (
                    <li
                      key={ambassador.id}
                      className={`flex items-center justify-between p-3 rounded-lg bg-gray-800`}
                    >
                      <div className="flex flex-col text-gray-300">
                        <span className="font-medium">
                          {ambassador.firstName} {ambassador.lastName}
                        </span>
                        <a
                          href={`https://t.me/${ambassador.tgUsername}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue text-sm"
                        >
                          <Send className="text-blue" />
                          Go to chat
                        </a>
                      </div>
                      <button
                        onClick={() => setSelectedAmbassador(ambassador)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          selectedAmbassador?.id === ambassador.id
                            ? "bg-blue text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        {selectedAmbassador?.id === ambassador.id ? "Selected" : "Select"}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="mt-4 text-center text-gray-400">No ambassadors available for this country.</div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6 flex flex-col items-center">
          {/* Amount Input */}
          <div className="w-full mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount ({country?.currency})
            </label>
            <input
              type="number"
              placeholder="Enter amount"
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full bg-gray-800 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {country?.currency === "USD" && (
              <p className="text-sm text-gray-400 mt-2">
                Note: The amount is in USD. Please convert it to {country?.currency} if necessary.
              </p>
            )}
          </div>

          {/* File Upload */}
          <label className="w-full bg-gray-800 rounded-lg p-6 border-2 border-dashed border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-blue transition-colors">
            <UploadCloud size={40} className="text-gray-400 mb-2" />
            <span className="text-gray-300">
              {file ? file.name : "Click to upload receipt"}
            </span>
            <input
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept="image/*,application/pdf"
            />
          </label>

          {/* Upload Progress */}
          {uploading && (
            <div className="w-full mt-4 bg-gray-700 rounded-lg overflow-hidden">
              <div
                className="bg-blue-500 h-2 rounded-lg"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}

          {/* Upload Button */}
          {file && (
            <button
              onClick={handleUpload}
              disabled={uploading || !selectedAmbassador || !amount}
              className="w-full mt-6 bg-blue text-white py-3 rounded-lg disabled:opacity-50 transition-colors flex items-center justify-center"
            >
              {uploading ? (
                <>
                  <Loader2 className="animate-spin w-4 h-4 mr-2" />
                  Uploading {Math.round(uploadProgress)}%
                </>
              ) : (
                "Confirm Upload"
              )}
            </button>
          )}

          {/* Success and Error Messages */}
          {success && (
            <div className="mt-6 text-center text-green-400 flex items-center gap-2">
              <CheckCircle size={16} />
              {success}
            </div>
          )}
          {error && (
            <div className="mt-6 text-center text-red-400 flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Redirecting Overlay */}
      <AnimatePresence>
        {redirecting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#1A2331] flex flex-col items-center justify-center z-50"
          >
            <div className="flex flex-col items-center justify-center">
              <HourglassAnimation size={120} />
              <h2 className="text-2xl font-bold text-white mt-6">Redirecting...</h2>
              <p className="text-gray-300 mt-2 text-center max-w-xs">
                Your purchase will proceed with a trusted Wallet partner.
              </p>
            </div>
            <div className="absolute bottom-8 flex items-center gap-2">
              <div className="bg-green-500 p-1 rounded">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <span className="text-gray-400">Secure payments</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReceiveModal;