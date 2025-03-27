import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { functions, storage } from '@/libs/firebase';
import { ArrowLeft, Loader2, CheckCircle, XCircle, UploadCloud, FileText } from 'lucide-react';
import { retrieveLaunchParams } from '@telegram-apps/sdk';
import { telegramId } from '@/libs/telegram';
import { httpsCallable } from 'firebase/functions';

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

const UploadReceipt: React.FC = () => {
  const navigate = useNavigate();
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const decodeBase64URL = useCallback((str: string) => {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
      str += '=';
    }
    return JSON.parse(atob(str));
  }, []);

  useEffect(() => {
    const { initData } = retrieveLaunchParams();
    const startParam = initData?.startParam;

    const loadData = async () => {
      try {
        setIsLoading(true);
        if (!startParam) {
          throw new Error('No receipt data found');
        }

        const decodedData = decodeBase64URL(startParam) as ReceiptData;

        if (Date.now() - decodedData.timestamp > 3600000) {
          throw new Error('This link has expired');
        }

        setReceiptData(decodedData);
      } catch (err: any) {
        console.error('Error loading receipt data:', err);
        setError(err.message || 'Failed to load receipt details');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [decodeBase64URL]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const allowedTypes = ["image/png", "image/jpeg", "application/pdf"];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Please upload only PNG, JPG, or PDF files.");
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit. Please choose a smaller file.");
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file || !receiptData) {
      setError("Please upload a receipt file");
      return;
    }
    
    if (!amount || isNaN(parseFloat(amount))) {
      setError("Please enter a valid amount");
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const storageRef = ref(storage, `receipts/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        },
        (error) => {
          console.error("Upload failed:", error);
          setError("Upload failed. Please check your connection and try again.");
          setUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          const createReceipt = httpsCallable(functions, 'createReceipt');

          await createReceipt({
            data: {
              ambassadorId: receiptData.ambassador.id,
              amount: parseFloat(amount),
              senderTgId: String(telegramId),
              documents: [{
                url: downloadURL,
                type: file.type.startsWith('image/') ? 'image' : 'pdf'
              }]
            }
          });

          setSuccess("Receipt uploaded successfully!");
          setTimeout(() => navigate('/fiat-deposit'), 3000);
          setUploading(false);
        }
      );
    } catch (error: any) {
      console.error("Upload failed:", error);
      setError(error.message || "An error occurred. Please try again.");
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="animate-spin h-12 w-12 text-blue-500" />
          <p className="text-lg font-medium text-gray-700">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-md overflow-hidden p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <XCircle className="h-12 w-12 text-red-500" />
            <h2 className="text-xl font-bold text-gray-800">Error</h2>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={() => navigate('/fiat-deposit')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Back to Deposit
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!receiptData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-md overflow-hidden p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <XCircle className="h-12 w-12 text-red-500" />
            <h2 className="text-xl font-bold text-gray-800">Invalid Receipt</h2>
            <p className="text-gray-600">Unable to load receipt details. The link may be invalid or expired.</p>
            <button
              onClick={() => navigate('/fiat-deposit')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Back to Deposit
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex flex-col items-center">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate('/fiat-deposit')}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          <span>Back</span>
        </button>

        <div className="bg-white rounded-xl shadow-md overflow-hidden p-6 mb-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Upload Receipt
          </h2>

          {success ? (
            <div className="flex flex-col items-center text-center space-y-4 py-6">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <h3 className="text-xl font-semibold text-gray-800">Success!</h3>
              <p className="text-gray-600">{success}</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '100%' }}></div>
              </div>
              <p className="text-sm text-gray-500">Redirecting to deposit page...</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-3">Payment Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bank:</span>
                      <span className="font-medium">{receiptData.payment.bank}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account:</span>
                      <span className="font-medium">{receiptData.payment.account}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ambassador:</span>
                      <span className="font-medium">{receiptData.ambassador.name}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">$</span>
                  </div>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    inputMode="decimal"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Receipt File
                </label>
                
                {file ? (
                  <div className="flex items-center justify-between p-4 border border-gray-300 rounded-md bg-gray-50">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-blue-500 mr-3" />
                      <span className="text-sm font-medium text-gray-700 truncate max-w-xs">{file.name}</span>
                    </div>
                    <button
                      onClick={handleRemoveFile}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-blue-500 transition-colors bg-gray-50">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                      <UploadCloud className="h-10 w-10 text-gray-400 mb-3" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-400">
                        PNG, JPG, or PDF (max 5MB)
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept="image/*,.pdf"
                    />
                  </label>
                )}
              </div>

              {error && (
                <div className="mb-4 flex items-center text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  <XCircle className="h-5 w-5 mr-2" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={uploading || !file || !amount}
                className={`w-full py-3 px-4 rounded-md font-medium text-white flex items-center justify-center ${
                  uploading || !file || !amount
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                }`}
              >
                {uploading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Uploading ({uploadProgress}%)
                  </>
                ) : (
                  'Submit Receipt'
                )}
              </button>

              {uploading && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    Uploading your receipt... {uploadProgress}% complete
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadReceipt;
