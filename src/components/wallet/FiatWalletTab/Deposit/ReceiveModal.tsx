import type React from "react";
import { useState, useEffect } from "react";
import { ArrowLeft, X, UploadCloud, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Country } from "@/interface/country";
import { db, storage, functions } from "@/libs/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { httpsCallable } from "firebase/functions";

interface PaymentMethod {
  id: string;
  type: string;
  details: {
    accountHolderName: string;
    accountNumber: string;
    accountType: string;
    bankName: string;
  };
}

interface Ambassador {
  id: string;
  firstName: string;
  lastName: string;
  tgUsername: string;
  paymentMethods: PaymentMethod[];
  photoUrl?: string;
}

interface ReceiveModalProps {
  onClose: () => void;
  country: Country | null;
  telegramId?: string;
}

const ReceiveModal: React.FC<ReceiveModalProps> = ({ onClose, country, telegramId }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [amount, setAmount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loadingAmbassadors, setLoadingAmbassadors] = useState(false);
  
  // Track selected payment method and ambassador
  const [selectedPayment, setSelectedPayment] = useState<{
    ambassador: Ambassador;
    method: PaymentMethod;
  } | null>(null);

  // Fetch ambassadors from Firestore
  useEffect(() => {
    const fetchAmbassadors = async () => {
      try {
        if (!country) return;

        setLoadingAmbassadors(true);
        setError(null);

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
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            tgUsername: data.tgUsername || "",
            photoUrl: data.photoUrl || "",
            paymentMethods: (data.paymentMethods || []).map((method: any) => ({
              id: method.id || "",
              type: method.type || "bank",
              details: {
                accountHolderName: method.details?.accountHolderName || "",
                accountNumber: method.details?.accountNumber || "",
                accountType: method.details?.accountType || "savings",
                bankName: method.details?.bankName || "",
              }
            }))
          });
        });

        setAmbassadors(fetchedAmbassadors);
      } catch (error) {
        console.error("Error fetching ambassadors:", error);
        setError("Failed to fetch ambassadors. Please try again.");
      } finally {
        setLoadingAmbassadors(false);
      }
    };

    fetchAmbassadors();
  }, [country]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file
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
  };

  const handlePaymentMethodSelect = (method: PaymentMethod, ambassador: Ambassador) => {
    // Toggle selection if the same method is clicked
    if (selectedPayment?.method.id === method.id && selectedPayment?.ambassador.id === ambassador.id) {
      setSelectedPayment(null);
    } else {
      setSelectedPayment({ ambassador, method });
    }
  };

  const handleUpload = async () => {
    // Validate inputs
    if (!file) return setError("Please select a file first.");
    if (!selectedPayment) return setError("Please select a payment method first.");
    if (!amount || amount <= 0) return setError("Please enter a valid amount.");

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      // Upload file to storage
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
          setError("Upload failed. Please try again.");
        },
        async () => {
          try {
            // Get download URL and create receipt
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            const payload = {
              ambassadorId: selectedPayment.ambassador.id,
              amount: amount,
              senderTgId: String(telegramId),
              documents: [downloadURL],
              createdAt: new Date().toISOString(),
              paymentMethod: {
                id: selectedPayment.method.id,
                type: selectedPayment.method.type,
                details: {
                  accountHolderName: selectedPayment.method.details.accountHolderName,
                  accountNumber: selectedPayment.method.details.accountNumber,
                  bankName: selectedPayment.method.details.bankName,
                  accountType: selectedPayment.method.details.accountType,
                }
              }
            };

            const createReceiptFunction = httpsCallable(functions, "createReceipt");
            await createReceiptFunction(payload);

            setUploading(false);
            setSuccess("Receipt created successfully!");

            // Close modal after 2 seconds
            setTimeout(onClose, 2000);
          } catch (error: any) {
            console.error("Error creating receipt:", error);
            setUploading(false);
            setError(error.message || "Failed to create receipt. Please try again.");
          }
        }
      );
    } catch (error: any) {
      console.error("Error:", error);
      setUploading(false);
      setError(error.message || "An error occurred. Please try again.");
    }
  };

  const maskAccountNumber = (accountNumber?: string) => {
    if (!accountNumber) return "••••";
    const visibleDigits = 4;
    return accountNumber.slice(-visibleDigits).padStart(accountNumber.length, "•");
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center h-[100vh] bg-black bg-opacity-80 z-50">
      <div className="bg-[#1E1E1E] text-white w-full max-w-md flex flex-col max-h-[100vh] overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-800 sticky top-0 bg-[#1E1E1E] z-10">
          <button onClick={onClose} className="hover:text-gray-300">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Fiat Deposit</h1>
          <button onClick={onClose} className="hover:text-gray-300">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hidden">
          {country && (
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-center gap-4">
                <img
                  src={country.flag || "/placeholder.svg"}
                  alt={`${country.name} flag`}
                  className="w-5 h-5 rounded-full object-cover"
                />
                <div className="text-center">
                  <p className="font-semibold text-lg">{country.name}</p>
                  <p className="text-sm text-gray-400">{country.currency} ({country.code})</p>
                </div>
              </div>

              {/* Ambassadors List */}
              {loadingAmbassadors ? (
                <div className="mt-6 flex justify-center">
                  <Loader2 className="animate-spin w-6 h-6" />
                </div>
              ) : ambassadors.length > 0 ? (
                <div className="mt-4">
                  {ambassadors.map((ambassador) => (
                    <div key={ambassador.id} className="mb-6">
                      {/* <div className="flex items-center gap-3 mb-3">
                        {ambassador.photoUrl && (
                          <img
                            src={ambassador.photoUrl}
                            alt={`${ambassador.firstName} ${ambassador.lastName}`}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <h3 className="font-medium">{ambassador.firstName} {ambassador.lastName}</h3>
                          <p className="text-xs text-gray-400">@{ambassador.tgUsername}</p>
                        </div>
                      </div> */}
                      
                      {ambassador.paymentMethods.length > 0 ? (
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-gray-300">Payment Methods:</h4>
                          {ambassador.paymentMethods.map((method) => {
                            const isSelected = selectedPayment?.method.id === method.id && 
                                              selectedPayment?.ambassador.id === ambassador.id;
                            return (
                              <div 
                                key={method.id} 
                                className={`p-3 rounded-lg border ${
                                  isSelected ? 'border-blue bg-gray-700' : 'border-gray-700 bg-gray-800'
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium text-white">
                                        {method.details.bankName}
                                      </span>

                                    </div>
                                    <p className="text-sm text-gray-400">
                                      Account: {maskAccountNumber(method.details.accountNumber)}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => handlePaymentMethodSelect(method, ambassador)}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                      isSelected ? "bg-blue text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                    }`}
                                  >
                                    {isSelected ? "Selected" : "Select"}
                                  </button>
                                </div>

                                {isSelected && (
                                  <div className="mt-3 pt-3 border-t border-gray-700">
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <p className="text-xs text-gray-400">Account Number</p>
                                        <p className="text-sm font-medium">{method.details.accountNumber}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center text-gray-400 py-4 bg-gray-800 rounded-lg">
                          No payment methods available
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 text-center text-gray-400 py-6 bg-gray-800 rounded-lg">
                  No approved ambassadors available
                </div>
              )}
            </div>
          )}

          {/* Form Inputs */}
          <div className="p-6 flex flex-col items-center">
            <div className="w-full mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount ({country?.currency})
              </label>
              <input
                type="number"
                placeholder="Enter amount"
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-gray-800 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue"
                min="1"
              />
            </div>

            <div className="w-full mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Payment Receipt
              </label>
              <label className="w-full bg-gray-800 rounded-lg p-6 border-2 border-dashed border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-blue transition-colors">
                <UploadCloud size={40} className="text-gray-400 mb-2" />
                <span className="text-gray-300 text-center">
                  {file ? file.name : "Click to upload receipt"}
                  <br />
                  <span className="text-xs text-gray-500">(PNG, JPG, or PDF, max 5MB)</span>
                </span>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*,application/pdf"
                />
              </label>
            </div>

            {uploading && (
              <div className="w-full mt-4 bg-gray-700 rounded-lg overflow-hidden">
                <div
                  className="bg-blue h-2 rounded-lg transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}

            {file && (
              <button
                onClick={handleUpload}
                disabled={uploading || !selectedPayment || !amount}
                className={`w-full mt-4 py-3 rounded-lg transition-colors flex items-center justify-center ${
                  uploading || !selectedPayment || !amount
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {uploading ? (
                  <>
                    <Loader2 className="animate-spin w-4 h-4 mr-2" />
                    Uploading {Math.round(uploadProgress)}%
                  </>
                ) : (
                  "Confirm Deposit"
                )}
              </button>
            )}

            {/* Status Messages */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 text-center text-green-400 flex items-center gap-2"
                >
                  <CheckCircle size={16} />
                  {success}
                </motion.div>
              )}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 text-center text-red-400 flex items-center gap-2"
                >
                  <AlertCircle size={16} />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiveModal;