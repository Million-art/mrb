import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { functions, storage } from '@/libs/firebase';
import { ArrowLeft, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { telegramId } from '@/libs/telegram';
import { httpsCallable } from 'firebase/functions';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { clearReceipt } from '@/store/slice/depositReceiptSlice';

interface UploadState {
  loading: boolean;
  step: 'idle' | 'uploading' | 'creating' | 'success' | 'error';
  progress: number;
  error: string | null;
  success: string | null;
}

const UploadReceipt: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const receiptData = useSelector((state: RootState) => state.depositReceipt.data);
  const [file, setFile] = useState<File | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [uploadState, setUploadState] = useState<UploadState>({
    loading: false,
    step: 'idle',
    progress: 0,
    error: null,
    success: null
  });
  console.log('recccccc',receiptData)
  useEffect(() => {
    if (!receiptData) {
      setUploadState(prev => ({
        ...prev,
        error: 'No receipt data found. Redirecting...'
      }));
      setTimeout(() => navigate('/fiat-deposit'), 2000);
    }
  }, [receiptData, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Reset state
    setUploadState({
      loading: false,
      step: 'idle',
      progress: 0,
      error: null,
      success: null
    });

    // Validate file
    const allowedTypes = ["image/png", "image/jpeg", "application/pdf"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(selectedFile.type)) {
      setUploadState(prev => ({
        ...prev,
        error: "Invalid file type. Please upload PNG, JPG, or PDF."
      }));
      return;
    }

    if (selectedFile.size > maxSize) {
      setUploadState(prev => ({
        ...prev,
        error: "File size too large. Max 5MB allowed."
      }));
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!receiptData) {
      setUploadState(prev => ({
        ...prev,
        error: "Missing receipt data"
      }));
      return;
    }

    const { 
      ambassador: { id: ambassadorId }, 
      payment: { bank, account, type },
      timestamp
    } = receiptData;

    // 2. Validate all required fields
    if (!file || !amount || !ambassadorId) {
      setUploadState(prev => ({
        ...prev,
        error: "Please fill all required fields"
      }));
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) {
      setUploadState(prev => ({
        ...prev,
        error: "Please enter a valid number for amount"
      }));
      return;
    }

    setUploadState({
      loading: true,
      step: 'uploading',
      progress: 0,
      error: null,
      success: null
    });

    try {
      // 3. Upload file to storage
      const storageRef = ref(storage, `receipts/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadState(prev => ({
            ...prev,
            progress
          }));
        },
        (error) => {
          console.error("Upload failed:", error);
          setUploadState({
            loading: false,
            step: 'error',
            progress: 0,
            error: "File upload failed. Please try again.",
            success: null
          });
        },
        async () => {
          try {
            // 4. Get download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            setUploadState(prev => ({
              ...prev,
              step: 'creating',
              progress: 100
            }));

            // 5. Prepare data for cloud function
            const requestData = {
              data: {
                ambassadorId,  // Must be included
                amount: parsedAmount,
                senderTgId: String(telegramId),
                documents: [{
                  url: downloadURL,
                  type: file.type.startsWith('image/') ? 'image' : 'pdf',
                  name: file.name
                }],
                // Optional: Include payment details if needed
                paymentDetails: {
                  bank,
                  accountNumber: account,
                  type
                },
                // Convert timestamp to ISO string if needed
                createdAt: new Date(timestamp).toISOString()
              }
            };

            // 6. Call cloud function
            const createReceipt = httpsCallable(functions, 'createReceipt');
            const result = await createReceipt(requestData);

            console.log("Receipt created:", result.data);

            setUploadState({
              loading: false,
              step: 'success',
              progress: 100,
              error: null,
              success: "Receipt uploaded successfully!"
            });

            setTimeout(() => {
              dispatch(clearReceipt());
              navigate('/fiat-deposit');
            }, 3000);

          } catch (error: any) {
            console.error("Error creating receipt:", error);
            let errorMessage = "Failed to create receipt";
            if (error.details) {
              errorMessage = error.details.message || errorMessage;
            }
            setUploadState({
              loading: false,
              step: 'error',
              progress: 0,
              error: errorMessage,
              success: null
            });
          }
        }
      );
    } catch (error: any) {
      console.error("Error:", error);
      setUploadState({
        loading: false,
        step: 'error',
        progress: 0,
        error: error.message || "An unexpected error occurred",
        success: null
      });
    }
  };
  if (!receiptData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4" size={48} />
          <p className="text-lg">Loading receipt details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center bg-gray-dark min-h-screen p-4">
      <div className="w-full max-w-md rounded-lg shadow-md overflow-hidden p-6">
        <h2 className="text-2xl font-bold mb-6 text-center">Upload Receipt</h2>

        {/* Error Display */}
        {uploadState.error && (
          <div className="mb-6 p-4 border border-red-200 rounded-lg">
            <div className="flex items-center text-red-600 mb-2">
              <XCircle className="mr-2" />
              <span className="font-medium">Error</span>
            </div>
            <p>{uploadState.error}</p>
          </div>
        )}

        {/* Success Display */}
        {uploadState.success && (
          <div className="mb-6 p-4 border border-green-200 rounded-lg">
            <div className="flex items-center text-green-600 mb-2">
              <CheckCircle className="mr-2" />
              <span className="font-medium">Success</span>
            </div>
            <p>{uploadState.success}</p>
            <p className="mt-2 text-sm">Redirecting...</p>
          </div>
        )}

        {/* Payment Details */}
        <div className="mb-6 p-4  rounded-lg">
          <h3 className="font-semibold mb-3">Payment Details</h3>
          <div className="space-y-2">
            <p><span className="font-medium">Bank:</span> {receiptData.payment.bank}</p>
            <p><span className="font-medium">Account:</span> {receiptData.payment.account}</p>
            <p><span className="font-medium">Ambassador:</span> {receiptData.ambassador.name}</p>
          </div>
        </div>

        {/* Amount Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Amount
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue"
            disabled={uploadState.loading}
          />
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Receipt File
          </label>
          <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors
            ${uploadState.loading ? 'border-gray-300' : 'border-gray-300 hover:border-blue'}`}>
            {file ? (
              <div className="text-center p-4">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {Math.round(file.size / 1024)} KB
                </p>
              </div>
            ) : (
              <div className="text-center p-4">
                <ArrowLeft className="mx-auto text-gray-400 mb-2" size={24} />
                <p className="text-gray-500">Click to upload receipt</p>
                <p className="text-xs text-gray-400 mt-1">
                  PNG, JPG, or PDF (max 5MB)
                </p>
              </div>
            )}
            <input
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept="image/*,.pdf"
              disabled={uploadState.loading}
            />
          </label>
        </div>

        {/* Progress Bar */}
        {uploadState.step !== 'idle' && (
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-1">
              <span>
                {uploadState.step === 'uploading' && 'Uploading...'}
                {uploadState.step === 'creating' && 'Creating receipt...'}
                {uploadState.step === 'success' && 'Completed!'}
              </span>
              <span>{Math.round(uploadState.progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue h-2.5 rounded-full"
                style={{ width: `${uploadState.progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleUpload}
          disabled={uploadState.loading || !file || !amount}
          className={`w-full py-3 px-4 rounded-lg font-medium  transition-colors
            ${uploadState.loading || !file || !amount
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue hover:bg-blue'
            }`}
        >
          {uploadState.loading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="animate-spin mr-2" />
              {uploadState.step === 'uploading' && 'Uploading...'}
              {uploadState.step === 'creating' && 'Processing...'}
            </div>
          ) : (
            'Submit Receipt'
          )}
        </button>
      </div>
    </div>
  );
};

export default UploadReceipt;