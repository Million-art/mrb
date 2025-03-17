import { useState, useEffect } from "react";
import { ArrowLeft, X, UploadCloud, Send } from "lucide-react";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { app } from "@/libs/firebase";
import { Country } from "./CountrySelector";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/libs/firebase";
import { Ambassador } from "@/interface/Ambassador";

interface ReceiveModalProps {
  onClose: () => void;
  country: Country | null;
}

const ReceiveModal: React.FC<ReceiveModalProps> = ({ onClose, country }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [receiptUrl, setReceiptUrl] = useState("");
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [selectedAmbassador, setSelectedAmbassador] = useState<Ambassador | null>(null);

  const storage = getStorage(app);

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
          where("country", "==", country.country) 
        );
        const querySnapshot = await getDocs(q);
        console.log("Query Snapshot:", querySnapshot.docs); 

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
            // Optional fields
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

        console.log("Fetched Ambassadors:", fetchedAmbassadors); 
        setAmbassadors(fetchedAmbassadors);
      } catch (error) {
        console.error("Error fetching ambassadors:", error);
      }
    };

    fetchAmbassadors();
  }, [country]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first.");
      return;
    }
    if (!selectedAmbassador) {
      alert("Please select an ambassador first.");
      return;
    }

    setUploading(true);
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
        alert("Upload failed. Please try again.");
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setReceiptUrl(downloadURL);
        setUploading(false);
      }
    );
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
        <div className="shadow-md flex flex-col justify-center items-center">
          <p className="text-center text-sm px-2 text-gray-300 mb-6">
            Deposit to your country's Ambassador's Bank Account and upload your receipt. 
            Chat with your Country Ambassador to get Detail Deposit information.
          </p>
          <hr className="w-[80%] mx-auto border-gray-600" />
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
            {ambassadors.length > 0 && (
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
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6 flex flex-col items-center">


          <label className="w-full bg-gray-800 rounded-lg p-6 border-2 border-dashed border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
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

          {file && (
            <button
              onClick={handleUpload}
              disabled={uploading || !selectedAmbassador}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg disabled:opacity-50 transition-colors"
            >
              {uploading
                ? `Uploading ${Math.round(uploadProgress)}%`
                : "Confirm Upload"}
            </button>
          )}

          {receiptUrl && (
            <div className="mt-6 text-center text-green-400">
              ✅ Upload successful!{" "}
              <a
                href={receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-green-300"
              >
                View receipt
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiveModal;