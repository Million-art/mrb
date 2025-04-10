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

// Helper function to format crypto and fiat currencies
const formatCurrencyValue = (value: number, currency: string) => {
  if (['USDC', 'USDT', 'BTC', 'ETH'].includes(currency)) {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(value);
  }
  
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
};

const SendRemittance = () => {
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
        message: err.response?.data?.error || "Failed to fetch exchange rate",
        color: "red"
      }));
      console.error("Exchange rate error:", err);
    } finally {
      setIsLoading(false);
    }
  }, 500), []); // 500ms debounce

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
      } else {
        dispatch(setShowMessage({
          message: "Please create a customer account first.",
          color: "red",
        }));
        navigate("/create-customer");
      }
    };
  
    fetchCustomerId();
  }, [dispatch, navigate]);

  // Fetch exchange rate when amount or currencies change
  useEffect(() => {
    if (amount > 0 && fromCurrency && toCurrency) {
      fetchExchangeRate(fromCurrency, toCurrency, amount);
    } else {
      setExchangeRate(null);
    }
  }, [amount, fromCurrency, toCurrency, fetchExchangeRate]);

  const createTransferQuote = async () => {
    if (!amount || !fromCurrency || !toCurrency || !customerId || !destinationAccountId.trim()) {
      dispatch(setShowMessage({
        message: "Please fill all required fields",
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
        message: "Quote created successfully!",
        color: "green"
      }));
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || "Failed to create transfer quote";
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
    if (!quote?.id || !customerId || !amount) return; 
    console.log('aaaaaaaaaa',amount) 
    setIsPayingQuote(true);
    console.log(quote.id)
    try {
      const response = await axios.post(getQuotePayUrl(customerId, quote.id,amount));
 
      dispatch(setShowMessage({
        message: "Transfer payment initiated successfully!",
        color: "green"
      }));
      setQuote(response.data); 
            // Show success dialog when payment is completed
            if (response.data.status === "completed") {
              setShowSuccessDialog(true);
            }

    } catch (err: any) {
      dispatch(setShowMessage({
        message: err.response?.data?.error || "Failed to pay transfer quote",
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
        message: "Transfer confirmed successfully!",
        color: "green"
      }));
    } catch (err: any) {
      dispatch(setShowMessage({
        message: err.response?.data?.error || "Failed to confirm transfer",
        color: "red"
      }));
    } finally {
      setIsConfirmingQuote(false);
    }
  };
 
  return (
    <div className="flex flex-col items-center min-h-screen pt-4 mb-10">
      <div className="w-full max-w-md rounded-lg shadow-md overflow-hidden p-2">
        <h2 className="text-2xl font-bold mb-6 text-center">Send Remittance</h2>

        <div className="grid grid-cols-1 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Destination Account ID</label>
            <input
              type="text"
              value={destinationAccountId}
              onChange={(e) => setDestinationAccountId(e.target.value)}
              className="w-full px-4 py-2 border bg-transparent border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue"
              placeholder="ba_destination456"
            />
          </div>
        </div>

        {/* Currency Inputs */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">From Currency</label>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="w-full px-4 py-2 border bg-transparent border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue"
            >
              <option value="USDC">USDC</option>

            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">To Currency</label>
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
          <label className="block text-sm font-medium mb-2">Amount to Send(USDC)</label>
          <input
            type="number"
            value={amount || ''}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full px-4 py-2 border bg-transparent border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue"
            placeholder="0.00"
            min="0"
            step="0.01"
          />
        </div>

        {/* Exchange Rate Display */}
        {isLoading && (
          <div className="mb-6 p-4 bg-gray-dark rounded-lg flex items-center justify-center">
            <Loader2 className="animate-spin mr-2" />
            <span>Fetching exchange rate...</span>
          </div>
        )}

        {exchangeRate && !isLoading && (
          <div className="mb-6 p-4 bg-gray-dark rounded-lg">
            <div className="flex flex-col justify-between items-center">
              <span className="font-medium">Exchange Rate:</span>
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
            <h3 className="font-semibold text-lg mb-2">Transfer Quote</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Amount to Send:</span>
                <span>{quote.source_amount + ' '+ quote.source.currency}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Fees:</span>
                <span className="text-gray-400">{quote.total_fees +' '+ quote.source.currency}</span>
              </div>
              
              <div className="pt-2 border-t border-gray-700">
                <div className="flex justify-between font-medium">
                  <span>Total Cost:</span>
                  <span>
                    {
                      quote.source_amount +  quote.total_fees + ' ' + quote.source.currency
                    }
                  </span>
                </div>
              </div>
              
              <div className="pt-2 border-t border-gray-700">
                <div className="flex justify-between text-green-400">
                  <span>Recipient Gets:</span>
                  <span>
                    {quote.quoted_amount + ' ' + quote.destination.currency}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Exchange Rate:</span>
                  <span className="text-gray-400">
                    1 {quote.source.currency} = {quote.exchange_rate.toFixed(2)} {quote.destination.currency}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="pt-2 border-t border-gray-700 text-xs text-gray-400 space-y-1">
               <div>Expires: {new Date(quote.expires_at).toLocaleString()}</div>
             </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {!quote && (
            <button
              onClick={createTransferQuote}
              disabled={!exchangeRate || !amount || isCreatingQuote || !customerId || !destinationAccountId.trim()}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors
                ${!exchangeRate || !amount || isCreatingQuote || !customerId || !destinationAccountId.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue hover:bg-blue-light'
                }`}
            >
              {isCreatingQuote ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="animate-spin mr-2" />
                  Creating Quote...
                </div>
              ) : (
                'Create Transfer Quote'
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
                  Paying Transfer...
                </div>
              ) : (
                'Pay Transfer Quote'
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
                  Confirming...
                </div>
              ) : (
                'Confirm Transfer'
              )}
            </button>
          )}
        </div>
      </div>
      {showSuccessDialog && quote && (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50 p-4">
          <div className="  rounded-lg shadow-xl max-w-md w-full p-6 relative">
            <button 
              onClick={() => setShowSuccessDialog(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <X size={24} />
            </button>
            
            <h3 className="text-xl font-bold mb-4">Transfer Completed</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Transfer ID:</span>
                <span className="font-medium">{quote.id}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Amount Sent:</span>
                <span>{quote.source_amount + ' ' + quote.source.currency}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Recipient Received:</span>
                <span>{quote.quoted_amount + ' ' + quote.destination.currency}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Fees:</span>
                <span>{quote.total_fees + ' '+  quote.source.currency}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Status:</span>
                <span className="capitalize">{quote.status}</span>
              </div>
              
              {quote.destination && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Recipient ID:</span>
                  <span>{quote.destination.account_id}</span>
                </div>
              )}
              
              <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowSuccessDialog(false)}
                  className="w-full py-2 px-4 bg-blue hover:bg-blue-light text-white rounded-lg transition-colors"
                >
                  Close
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