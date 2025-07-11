import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Loader2, ArrowRight, X } from "lucide-react";
import { QuoteResponse } from "@/interface/QuoteExchange";
import { useDispatch } from "react-redux";
import { setShowMessage } from "@/store/slice/messageSlice";
import { getQuoteCreateUrl, getQuotePayUrl, EXCHANGE_RATE_URL } from "@/config/api";
import { getCustomerIdByTelegramId } from "./helper";
import { telegramId } from "@/libs/telegram";
import { useNavigate } from "react-router-dom";
import { debounce } from "lodash";
import { useTranslation } from "react-i18next";
import PaymentProcessingModal from "./PaymentProcessingModal";

const MIN_AMOUNT = 1;

const SendRemittance = () => {
  const { t } = useTranslation();
  // Form state
  const [amount, setAmount] = useState(0);
  const [fromCurrency, setFromCurrency] = useState("USDC");
  const [toCurrency, setToCurrency] = useState("VES");
  const [destinationAccountId, setDestinationAccountId] = useState("");
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingQuote, setIsCreatingQuote] = useState(false);
  const [isPayingQuote, setIsPayingQuote] = useState(false);
  const [isConfirmingQuote, setIsConfirmingQuote] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'processing' | 'completed' | 'failed' | 'pending'>('pending');

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Debounced exchange rate fetch
  const fetchExchangeRate = useCallback(debounce(async (from: string, to: string, amt: number) => {
    if (!from || !to || amt <= 0) {
      setExchangeRate(null);
      return;
    }

    setIsLoading(true);
    setExchangeRate(null);
    setQuote(null);

    try {
      const response = await axios.get(EXCHANGE_RATE_URL(from, to));
      if (response.data?.rate) {
        setExchangeRate(response.data.rate);
      } else {
        throw new Error("Invalid exchange rate data");
      }
    } catch (err: any) {
      dispatch(setShowMessage({
        message: t('sendRemittance.failedToFetchExchangeRate'),
        color: "red"
      }));
      console.error("Exchange rate error:", err);
    } finally {
      setIsLoading(false);
    }
  }, 500), [t, dispatch]); // 500ms debounce

  useEffect(() => {
    // Cleanup debounce on unmount
    return () => {
      fetchExchangeRate.cancel();
    };
  }, [fetchExchangeRate]);

  useEffect(() => {
    const fetchCustomerId = async () => {
      const tgId = String(telegramId);
      const id = await getCustomerIdByTelegramId(tgId);
      if (id) {
        setCustomerId(id);
      }
    };
  
    fetchCustomerId();
  }, []);

  // Fetch exchange rate when amount or currencies change
  useEffect(() => {
    if (amount > 0 && fromCurrency && toCurrency) {
      fetchExchangeRate(fromCurrency, toCurrency, amount);
    } else {
      setExchangeRate(null);
    }
  }, [amount, fromCurrency, toCurrency, fetchExchangeRate]);

  const createTransferQuote = async () => {
    if (!amount || !fromCurrency || !toCurrency || !destinationAccountId.trim()) {
      dispatch(setShowMessage({
        message: t('sendRemittance.fillAllFields'),
        color: "red"
      }));
      return;
    }

    if (!customerId) {
      dispatch(setShowMessage({
        message: t('sendRemittance.createAccountFirst'),
        color: "red"
      }));
      return;
    }

    if (amount < MIN_AMOUNT) {
      dispatch(setShowMessage({
        message: t('sendRemittance.minimumAmount', { amount: MIN_AMOUNT }),
        color: "red"
      }));
      return;
    }

    setIsCreatingQuote(true);
    
    try {
      const response = await axios.post(getQuoteCreateUrl(customerId), {
        amount,
        destinationAccountId: destinationAccountId.trim(),
        sourceCurrency: fromCurrency,
        destinationCurrency: toCurrency,
      });
      
      setQuote(response.data);
      dispatch(setShowMessage({
        message: t('sendRemittance.quoteCreatedSuccess'),
        color: "green"
      }));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || t('sendRemittance.failedToCreateQuote');
      dispatch(setShowMessage({
        message: errorMessage,
        color: "red"
      }));
      console.error("Quote creation error:", err);
    } finally {
      setIsCreatingQuote(false);
    }
  };

  const payTransferQuote = async () => {
    if (!quote?.id || !customerId) return; 
    
    setShowPaymentModal(true);
    setPaymentStatus('processing');
    setIsPayingQuote(true);
    
    try {
      const response = await axios.post(getQuotePayUrl(customerId, quote.id));
 
      // Update quote with response data
      setQuote(response.data);
      
      // Check if payment is completed
      if (response.data.status === "completed") {
        setPaymentStatus('completed');
        dispatch(setShowMessage({
          message: t('sendRemittance.transferSuccess'),
          color: "green"
        }));
      } else if (response.data.status === "failed") {
        setPaymentStatus('failed');
        dispatch(setShowMessage({
          message: t('sendRemittance.transferFailed'),
          color: "red"
        }));
      } else {
        // If still processing, keep modal open for polling
        setPaymentStatus('processing');
      }

    } catch (err: any) {
      setPaymentStatus('failed');
      dispatch(setShowMessage({
        message: err.response?.data?.message || t('sendRemittance.failedToTransferQuote'),
        color: "red"
      }));
      console.error("Payment error:", err);
    } finally {
      setIsPayingQuote(false);
    }
  };

  const confirmTransferQuote = async () => {
    setIsConfirmingQuote(true);
    try {
      // Implement your confirmation logic here
      dispatch(setShowMessage({
        message: t('sendRemittance.transferConfirmedSuccess'),
        color: "green"
      }));
    } catch (err: any) {
      dispatch(setShowMessage({
        message: err.response?.data?.message || t('sendRemittance.failedToConfirmTransfer'),
        color: "red"
      }));
    } finally {
      setIsConfirmingQuote(false);
    }
  };
 
  return (
    <div className="flex flex-col items-center min-h-screen pt-4 mb-10">
      <div className="w-full max-w-md rounded-lg shadow-md overflow-hidden p-2">
        <h2 className="text-2xl font-bold mb-6 text-center">{t('sendRemittance.title')}</h2>

        <div className="grid grid-cols-1 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">{t('sendRemittance.destinationAccountId')}</label>
            <input
              type="text"
              value={destinationAccountId}
              onChange={(e) => setDestinationAccountId(e.target.value)}
              className="w-full px-4 py-2 border bg-transparent border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue"
              placeholder={t('sendRemittance.destinationAccountPlaceholder')}
            />
          </div>
        </div>

        {/* Currency Inputs */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">{t('sendRemittance.fromCurrency')}</label>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="w-full px-4 py-2 border bg-transparent border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue"
            >
              <option value="USDC">USDC</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{t('sendRemittance.toCurrency')}</label>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className="w-full px-4 py-2 border bg-transparent border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue"
            >
              <option value="VES">VES</option>
            </select>
          </div>
        </div>

        {/* Amount Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">{t('sendRemittance.amountToSend')}</label>
          <input
            type="text"
            value={amount || ''}
            onChange={(e) => setAmount(Number(e.target.value))}
            className={`w-full px-4 py-2 border bg-transparent rounded-lg focus:ring-2 focus:ring-blue focus:border-blue ${
              amount > 0 && amount < MIN_AMOUNT ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={t('sendRemittance.amountPlaceholder')}
            min={MIN_AMOUNT}
            step="0.01"
          />
          {amount > 0 && amount < MIN_AMOUNT && (
            <p className="mt-1 text-sm text-red-500">
              {t('sendRemittance.minimumAmount', { amount: MIN_AMOUNT })}
            </p>
          )}
        </div>

        {/* Exchange Rate Display */}
        {isLoading && (
          <div className="mb-6 p-4 bg-gray-dark rounded-lg flex items-center justify-center">
            <Loader2 className="animate-spin mr-2" />
            <span>{t('sendRemittance.fetchingExchangeRate')}</span>
          </div>
        )}

        {exchangeRate && !isLoading && (
          <div className="mb-6 p-4 bg-gray-dark rounded-lg">
            <div className="flex flex-col justify-between items-center">
              <span className="font-medium">{t('sendRemittance.exchangeRate')}</span>
              <div className="flex items-center">
                <span className="mr-2">1 {fromCurrency}</span>
                <ArrowRight size={16} className="mx-1" />
                <span className="ml-2 font-bold">{exchangeRate.toFixed(2)} {toCurrency}</span>
              </div>
            </div>
          </div>
        )}

        {/* Quote Details */}
        {quote && (
          <div className="mb-6 p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-lg mb-2">{t('sendRemittance.transferQuote')}</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">{t('sendRemittance.amountToSendLabel')}</span>
                <span>{quote.source_amount + ' USDC'}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{t('sendRemittance.fees')}</span>
                <span className="text-gray-400">{quote.total_fees + ' USDC'}</span>
              </div>
              
              <div className="pt-2 border-t border-gray-700">
                <div className="flex justify-between font-medium">
                  <span>{t('sendRemittance.totalCost')}</span>
                  <span>
                    {(quote.source_amount + quote.total_fees).toFixed(2) + ' USDC'}
                  </span>
                </div>
              </div>
              
              <div className="pt-2 border-t border-gray-700">
                <div className="flex justify-between text-green-400">
                  <span>{t('sendRemittance.recipientGets')}</span>
                  <span>
                    {quote.quoted_amount + ' VES'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{t('sendRemittance.exchangeRateLabel')}</span>
                  <span className="text-gray-400">
                    1 USDC = {(quote.quoted_amount / quote.source_amount).toFixed(2)} VES
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-700 text-xs text-gray-400 space-y-1">
                <div>{t('sendRemittance.expires')}: {new Date(quote.expires_at).toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {!customerId && (
            <div className="p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
              <p className="text-sm text-yellow-400">
                {t('sendRemittance.customerAccountRequired')} {" "}
                <button 
                  onClick={() => navigate("/create-customer")}
                  className="text-blue-light hover:text-blue-300 underline"
                >
                  {t('sendRemittance.createAccount')}
                </button>
              </p>
            </div>
          )}
          
          {!quote && (
            <button
              onClick={createTransferQuote}
              disabled={!exchangeRate || !amount || isCreatingQuote || !destinationAccountId.trim()}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors
                ${!exchangeRate || !amount || isCreatingQuote || !destinationAccountId.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue hover:bg-blue-light'
                }`}
            >
              {isCreatingQuote ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="animate-spin mr-2" />
                  {t('sendRemittance.creatingQuote')}
                </div>
              ) : !customerId ? (
                t('sendRemittance.customerAccountRequiredButton')
              ) : (
                t('sendRemittance.createTransferQuote')
              )}
            </button>
          )}

          {quote && quote.status === "pending" && (
            <button
              onClick={payTransferQuote}
              disabled={isPayingQuote || !customerId}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors
                ${isPayingQuote || !customerId
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue hover:bg-blue-light'
                }`}
            >
              {isPayingQuote ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="animate-spin mr-2" />
                  {t('sendRemittance.payingTransfer')}
                </div>
              ) : !customerId ? (
                t('sendRemittance.customerAccountRequiredButton')
              ) : (
                t('sendRemittance.payTransferQuote')
              )}
            </button>
          )}

          {quote && quote.status === "pending_confirmation" && (
            <button
              onClick={confirmTransferQuote}
              disabled={isConfirmingQuote || !customerId}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors
                ${isConfirmingQuote || !customerId
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-yellow-600 hover:bg-yellow-700'
                }`}
            >
              {isConfirmingQuote ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="animate-spin mr-2" />
                  {t('sendRemittance.confirming')}
                </div>
              ) : !customerId ? (
                t('sendRemittance.customerAccountRequiredButton')
              ) : (
                t('sendRemittance.confirmTransfer')
              )}
            </button>
          )}
        </div>
      </div>
      
      {/* Payment Processing Modal */}
      <PaymentProcessingModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setPaymentStatus('pending');
          if (paymentStatus === 'completed') {
            setShowSuccessDialog(true);
          }
        }}
        amount={amount}
        currency={fromCurrency}
        status={paymentStatus}
      />

      {/* Success Dialog */}
      {showSuccessDialog && quote && (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50 p-4">
          <div className="  rounded-lg shadow-xl max-w-md w-full p-6 relative">
            <button 
              onClick={() => setShowSuccessDialog(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <X size={24} />
            </button>
            
            <h3 className="text-xl font-bold mb-4">{t('sendRemittance.transferCompleted')}</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">{t('sendRemittance.transferId')}</span>
                <span className="font-medium">{quote.id}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">{t('sendRemittance.amountSent')}</span>
                <span>{quote.source_amount + ' USDC'}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">{t('sendRemittance.recipientReceived')}</span>
                <span>{quote.quoted_amount + ' VES'}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">{t('sendRemittance.fees')}</span>
                <span>{quote.total_fees + ' USDC'}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">{t('sendRemittance.status')}</span>
                <span className="capitalize">{quote.status}</span>
              </div>
              
              {quote.destination && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">{t('sendRemittance.recipientId')}</span>
                  <span>{quote.destination.account_id}</span>
                </div>
              )}
              
              <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowSuccessDialog(false)}
                  className="w-full py-2 px-4 bg-blue hover:bg-blue-light text-white rounded-lg transition-colors"
                >
                  {t('sendRemittance.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SendRemittance;