import BottomNav from "@/components/BottomNav";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { telegramId } from "@/libs/telegram";
import axios from "axios";
import { API_CONFIG } from "@/config/api";
import { useTranslation } from "react-i18next";

const TransferBalance = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [recipientId, setRecipientId] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTransfer = async () => {
    setError("");
    
    // Input validation
    if (!recipientId.trim()) {
      setError(t('transferBalance.errorRecipient'));
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError(t('transferBalance.errorAmount'));
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post(`${API_CONFIG.BASE_URL}/api/transactions/transfer`, {
        senderId: String(telegramId),
        recipientId: recipientId.trim(),
        amount: parseFloat(amount)
      });

      if (response.data.success) {
        // Show success message
        alert(t('transferBalance.success'));
        navigate(-1); // Go back to previous page
      }
    } catch (error: any) {
      console.error('Transfer error:', error);
      const errorMessage = error.response?.data?.message || t('transferBalance.errorTransferFailed');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-black bg-opacity-80 z-50">
      <div className="text-white w-full max-w-md rounded-xl overflow-hidden flex flex-col p-6 relative">
        <div className="">
          <button 
            onClick={() => navigate(-1)} 
            className="text-gray-400 hover:text-white absolute top-6 left-6"
            disabled={isLoading}
          >
            <ArrowLeft size={24} />
          </button>
          
          <h2 className="text-xl font-semibold mb-4 text-white text-center">
            {t('transferBalance.title')}
          </h2>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-md mb-4">
            {error}
          </div>
        )}

        {/* Transfer Form */}
        <div className="space-y-5 mt-15">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('transferBalance.recipientLabel')}
            </label>
            <input
              type="text"
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              className="w-full bg-transparent border border-gray-700 rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              placeholder={t('transferBalance.recipientPlaceholder')}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('transferBalance.amountLabel')}
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-transparent border border-gray-700 rounded-md p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              placeholder={t('transferBalance.amountPlaceholder')}
              disabled={isLoading}
              min="0"
              step="0.01"
            />
          </div>

          <button 
            onClick={handleTransfer}
            disabled={isLoading}
            className="w-full bg-blue text-white py-3 rounded-md hover:bg-blue-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {t('transferBalance.processing')}
              </>
            ) : (
              t('transferBalance.transferButton')
            )}
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default TransferBalance;