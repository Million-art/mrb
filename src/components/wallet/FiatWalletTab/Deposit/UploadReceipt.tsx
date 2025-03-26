import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import { db, storage } from '@/libs/firebase';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { retrieveLaunchParams } from '@telegram-apps/sdk';
import HourglassAnimation from '../AnimateLoader';

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
  const navigate = useNavigate();
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const decodeBase64URL = (str: string) => {
      // Add padding if needed
      str = str.replace(/-/g, '+').replace(/_/g, '/');
      while (str.length % 4) {
        str += '=';
      }
      return JSON.parse(atob(str));
    };

    const { initData } = retrieveLaunchParams();
    const startParam = initData?.startParam;

    const loadData = async () => {
      try {
        if (!startParam) {
          throw new Error('No receipt data found');
        }

        const decodedData = decodeBase64URL(startParam) as ReceiptData;
        
        // Validate data isn't too old (1 hour expiration)
        if (Date.now() - decodedData.timestamp > 3600000) {
          throw new Error('This link has expired');
        }

        setReceiptData(decodedData);
      } catch (err: any) {
        console.error('Error loading receipt data:', err);
        setError(err.message || 'Failed to load receipt details');
      }
    };

    loadData();
  }, []);

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
        <div className=" p-6 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-red-500 mb-4">Error</h2>
          <p className="mb-4">{error}</p>
          <button
            onClick={() => navigate('/fiat-deposit')}
            className="px-4 py-2 bg-blue text-white rounded hover:bg-blue-light"
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
          <HourglassAnimation />
          <p className="text-lg">Loading receipt details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center bg-gray-dark justify-center min-h-screen p-4">
      <div className="w-full max-w-md rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold  mb-6 text-center">
            Upload Receipt
          </h2>

          {success ? (
            <div className="text-center py-8">
              <div className="text-green-500 text-lg font-semibold mb-4">
                {success}
              </div>
              <HourglassAnimation />
              <p>Redirecting to deposit page...</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Payment Details</h3>
                <div className=" p-4 rounded-md">
                  <p className="mb-1"><strong>Bank:</strong> {receiptData.payment.bank}</p>
                  <p className="mb-1"><strong>Account:</strong> {receiptData.payment.account}</p>
                  <p><strong>Ambassador:</strong> {receiptData.ambassador.name}</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium  mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-3 py-2 bg-transparent border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium  mb-1">
                  Receipt File
                </label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-blue-500 transition-colors">
                  {file ? (
                    <span className="">{file.name}</span>
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
                className={`w-full py-2 px-4 rounded-md  font-medium ${
                  uploading || !file || !amount
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue hover:bg-blue'
                }`}
              >
                {uploading ?  
                  <Loader2 className="animate-spin mr-2 inline-block" />
                 : 
                 'Submit Receipt'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadReceipt;