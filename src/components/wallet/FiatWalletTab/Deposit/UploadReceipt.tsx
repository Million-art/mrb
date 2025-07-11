import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { telegramId } from '@/libs/telegram';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { clearReceipt } from '@/store/slice/depositReceiptSlice';
import { setShowMessage } from '@/store/slice/messageSlice';
import { API_CONFIG } from '@/config/api';

interface UploadState {
  loading: boolean;
  step: 'idle' | 'uploading' | 'creating' | 'success' | 'error';
  progress: number;
}

const UploadReceipt: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const receiptData = useSelector((state: RootState) => state.depositReceipt.data);
  const [file, setFile] = useState<File | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [uploadState, setUploadState] = useState<UploadState>({
    loading: false,
    step: 'idle',
    progress: 0
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Reset state
    setUploadState({
      loading: false,
      step: 'idle',
      progress: 0
    });

    // Validate file
    const allowedTypes = ["image/png", "image/jpeg", "application/pdf"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(selectedFile.type)) {
      dispatch(setShowMessage({
        message: t('uploadReceipt.invalidFileType'),
        color: "red"
      }));
      return;
    }

    if (selectedFile.size > maxSize) {
      dispatch(setShowMessage({
        message: t('uploadReceipt.fileTooLarge'),
        color: "red"
      }));
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!receiptData) {
      dispatch(setShowMessage({
        message: t('uploadReceipt.missingReceiptData'),
        color: "red"
      }));
      return;
    }
  
    // Get ambassador uid from the data
    const { ambassador } = receiptData;
    const ambassadorId = ambassador.uid || ambassador.id;
  
    // Enhanced validation
    if (!file) {
      dispatch(setShowMessage({
        message: t('uploadReceipt.selectReceiptFile'),
        color: "red"
      }));
      return;
    }

    if (!amount) {
      dispatch(setShowMessage({
        message: t('uploadReceipt.enterRechargeAmount'),
        color: "red"
      }));
      return;
    }

    if (!ambassadorId) {
      dispatch(setShowMessage({
        message: t('uploadReceipt.invalidAmbassadorData'),
        color: "red"
      }));
      return;
    }

    if (!telegramId) {
      dispatch(setShowMessage({
        message: t('uploadReceipt.unableToIdentifyAccount'),
        color: "red"
      }));
      return;
    }
  
    const parsedAmount = Math.floor(Number(amount));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      dispatch(setShowMessage({
        message: t('uploadReceipt.amountMustBePositive'),
        color: "red"
      }));
      return;
    }
  
    setUploadState({
      loading: true,
      step: 'uploading',
      progress: 0
    });
  
    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('receipt', file);
      formData.append('ambassadorId', String(ambassadorId).trim());
      formData.append('amount', String(parsedAmount));
      formData.append('senderTgId', String(telegramId).trim());
      formData.append('createdAt', new Date().toISOString());
      
      // Track upload progress with XMLHttpRequest
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadState(prev => ({ ...prev, progress }));
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadState({
            loading: false,
            step: 'success',
            progress: 100
          });
          
          dispatch(setShowMessage({
            message: t('uploadReceipt.uploadSuccess'),
            color: "green"
          }));
          
          // Cleanup and redirect
          setTimeout(() => {
            dispatch(clearReceipt());
            navigate('/fiat-deposit');
          }, 3000);
        } else {
          const errorResponse = JSON.parse(xhr.responseText || '{}');
          setUploadState({
            loading: false,
            step: 'error',
            progress: 0
          });
          throw new Error(errorResponse.message || 'Upload failed');
        }
      });
      
      xhr.addEventListener('error', () => {
        setUploadState({
          loading: false,
          step: 'error',
          progress: 0
        });
        throw new Error(t('uploadReceipt.networkErrorUpload'));
      });
      
      xhr.open('POST', `${API_CONFIG.BASE_URL2}/api/receipts/upload`);
      xhr.send(formData);
      
      // Set state to creating when upload is complete
      xhr.addEventListener('loadend', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadState(prev => ({
            ...prev,
            step: 'creating',
            progress: 100
          }));
        } else {
          const errorResponse = JSON.parse(xhr.responseText || '{}');
          setUploadState({
            loading: false,
            step: 'error',
            progress: 0
          });
          throw new Error(errorResponse.message || 'Upload failed');
        }
      });
      
    } catch (error: any) {
      console.error("Upload Error:", error);
      setUploadState({
        loading: false,
        step: 'error',
        progress: 0
      });
      
      // Enhanced error handling with more specific messages
      let errorMessage = t('uploadReceipt.unexpectedError');
      if (error.message) {
        if (error.message.includes('Network Error')) {
          errorMessage = t('uploadReceipt.networkErrorCheck');
        } else if (error.message.includes('413')) {
          errorMessage = t('uploadReceipt.fileSizeTooLarge');
        } else if (error.message.includes('415')) {
          errorMessage = t('uploadReceipt.invalidFileTypeError');
        } else if (error.message.includes('Ambassador not found')) {
          errorMessage = t('uploadReceipt.ambassadorNotFound');
        } else {
          errorMessage = error.message;
        }
      }
      
      dispatch(setShowMessage({
        message: errorMessage,
        color: "red"
      }));
    }
  };
  
  if (!receiptData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4" size={48} />
          <p className="text-lg">{t('uploadReceipt.loadingDetails')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-4">
      <div className="w-full max-w-md rounded-lg shadow-md overflow-hidden p-6">
        <h2 className="text-2xl font-bold mb-6 text-center">{t('uploadReceipt.title')}</h2>

        {/* Payment Details */}
        <div className="mb-6 p-4 rounded-lg">
          <h3 className="font-semibold mb-3">{t('uploadReceipt.depositDetails')}</h3>
          <div className="space-y-2">
            <p><span className="font-medium">{t('uploadReceipt.bank')}</span> {receiptData.payment.bank}</p>
            <p><span className="font-medium">{t('uploadReceipt.account')}</span> {receiptData.payment.account}</p>
            <p><span className="font-medium">{t('uploadReceipt.ambassador')}</span> {receiptData.ambassador.name}</p>
          </div>
        </div>

        {/* Amount Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            {t('uploadReceipt.amount')}
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={t('uploadReceipt.amountPlaceholder')}
            className="w-full px-4 py-2 border bg-transparent border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue"
            disabled={uploadState.loading}
          />
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            {t('uploadReceipt.receiptFile')}
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
                <p className="text-gray-500">{t('uploadReceipt.clickToUpload')}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {t('uploadReceipt.fileTypes')}
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
                {uploadState.step === 'uploading' && t('uploadReceipt.uploading')}
                {uploadState.step === 'creating' && t('uploadReceipt.processing')}
                {uploadState.step === 'success' && t('uploadReceipt.completed')}
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
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors
            ${uploadState.loading || !file || !amount
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue hover:bg-blue'
            }`}
        >
          {uploadState.loading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="animate-spin mr-2" />
              {uploadState.step === 'uploading' && t('uploadReceipt.uploading')}
              {uploadState.step === 'creating' && t('uploadReceipt.processingButton')}
            </div>
          ) : (
            t('uploadReceipt.submitReceipt')
          )}
        </button>
      </div>
    </div>
  );
};

export default UploadReceipt;