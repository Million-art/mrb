import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import { db, storage } from '@/libs/firebase';
import { ArrowLeft } from 'lucide-react';

interface ReceiptData {
  ambassador: {
    id: string;
    name: string;
    username: string;
  };
  payment: {
    bank: string;
    account: string;
    type: string;
  };
  timestamp: number;
}

const UploadReceipt = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const encodedData = params.get('data');
        
        if (!encodedData) {
          throw new Error('No receipt data found');
        }

        const decodedData = JSON.parse(decodeURIComponent(encodedData)) as ReceiptData;
        
        // Validate data isn't too old (1 hour expiration)
        if (Date.now() - decodedData.timestamp > 3600000) {
          throw new Error('This link has expired');
        }

        setReceiptData(decodedData);
      } catch (err: any) {
        setError(err.message || 'Failed to load receipt details');
      }
    };

    fetchData();
  }, [location.search]);

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

  const handleUpload = async () => {
    if (!file || !receiptData || !amount) {
      setError("Please fill all required fields");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // 1. Upload file to Firebase Storage
      const storageRef = ref(storage, `receipts/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      // 2. Wait for upload to complete
      const snapshot = await uploadTask;
      const downloadURL = await getDownloadURL(snapshot.ref);

      // 3. Create receipt document in Firestore
      const receiptDoc = {
        ambassadorId: receiptData.ambassador.id,
        ambassadorName: receiptData.ambassador.name,
        bankName: receiptData.payment.bank,
        accountNumber: receiptData.payment.account,
        amount: parseFloat(amount),
        receiptUrl: downloadURL,
        status: 'pending',
        createdAt: new Date(),
        paymentType: receiptData.payment.type
      };

      await addDoc(collection(db, 'receipts'), receiptDoc);

      // 4. Show success and redirect
      setSuccess("Receipt uploaded successfully!");
      setTimeout(() => navigate('/fiat-deposit'), 2000);
    } catch (error: any) {
      console.error("Upload failed:", error);
      setError(error.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-red-500 mb-4">Error</h2>
          <p className="mb-4">{error}</p>
          <button
            onClick={() => navigate('/fiat-deposit')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Deposit
          </button>
        </div>
      </div>
    );
  }

  if (!receiptData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg">Loading receipt details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Upload Receipt
          </h2>

          {success ? (
            <div className="text-center py-8">
              <div className="text-green-500 text-lg font-semibold mb-4">
                {success}
              </div>
              <p>Redirecting to deposit page...</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">Payment Details</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="mb-1"><strong>Bank:</strong> {receiptData.payment.bank}</p>
                  <p className="mb-1"><strong>Account:</strong> {receiptData.payment.account}</p>
                  <p><strong>Ambassador:</strong> {receiptData.ambassador.name}</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Receipt File
                </label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-blue-500 transition-colors">
                  {file ? (
                    <span className="text-gray-700">{file.name}</span>
                  ) : (
                    <>
                      <ArrowLeft className="text-gray-400 mb-2" size={24} />
                      <span className="text-gray-500">Click to upload receipt</span>
                      <span className="text-xs text-gray-400 mt-1">PNG, JPG, or PDF (max 5MB)</span>
                    </>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                  />
                </label>
              </div>

              <button
                onClick={handleUpload}
                disabled={uploading || !file || !amount}
                className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                  uploading || !file || !amount
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {uploading ? 'Uploading...' : 'Submit Receipt'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadReceipt;