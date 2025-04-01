import { useState } from "react";
import axios from "axios";
import { Loader2, ArrowRight, XCircle, CheckCircle } from "lucide-react";
import { QuoteResponse } from "@/interface/QuoteExchange";

const SendRemittance = () => {
  // Form state
  const [amount, setAmount] = useState("");
  const [fromCurrency, setFromCurrency] = useState("USDC");
  const [toCurrency, setToCurrency] = useState("VES");
  const [destinationAccountId, setDestinationAccountId] = useState("ba_destination456");
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingQuote, setIsCreatingQuote] = useState(false);
  const [isPayingQuote, setIsPayingQuote] = useState(false);
  const [isConfirmingQuote, setIsConfirmingQuote] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  
  const fetchExchangeRate = async () => {
    if (!fromCurrency || !toCurrency) {
      setError("Please select both currencies");
      return;
    }

    setIsLoading(true);
    setError("");
    setExchangeRate(null);
    setQuote(null);

    try {
      const response = await axios.get(
        `https://getexchangerate-3bfnrbjopq-uc.a.run.app/?source_currency=${fromCurrency}&destination_currency=${toCurrency}`,
        { headers: { "Accept": "application/json" } }
      );

      if (response.data?.rate) {
        setExchangeRate(response.data.rate);
      } else {
        throw new Error("Invalid exchange rate data");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch exchange rate");
      console.error("Exchange rate error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const createTransferQuote = async () => {
    if (!amount || !fromCurrency || !toCurrency) {
      setError("Please fill all required fields");
      return;
    }
  
    setIsCreatingQuote(true);
    setError("");
    setSuccess("");
  
    try {
      const response = await axios.post(
        "https://your-cloud-function-url/createTransferQuote", 
        {
          amount,
          destinationAccountId,
        }
      );
  
      setQuote(response.data);
      setSuccess("Transfer quote created successfully!");
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || "Failed to create transfer quote";
      setError(errorMessage);
      console.error("Quote creation error:", err);
    } finally {
      setIsCreatingQuote(false);
    }
  };

  const payTransferQuote = async () => {
    if (!quote?.id) return;
  
    setIsPayingQuote(true);
    setError("");
    setSuccess("");
  
    try {
      const response = await axios.post(
        "https://your-cloud-function-url/payTransferQuote", 
        { quoteId: quote.id }
      );
  
      setSuccess("Transfer payment initiated successfully!");
      setQuote(response.data); 
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to pay transfer quote");
      console.error("Payment error:", err);
    } finally {
      setIsPayingQuote(false);
    }
  };

  const confirmTransferQuote = async () => {
    if (!quote?.id) return;
  
    setIsConfirmingQuote(true);
    setError("");
    setSuccess("");
  
    try {
      const response = await axios.post(
        "https://your-cloud-function-url/confirmTransferQuote", 
        { quoteId: quote.id }
      );
  
      setSuccess("Transfer confirmed successfully!");
      setQuote(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to confirm transfer");
      console.error("Confirmation error:", err);
    } finally {
      setIsConfirmingQuote(false);
    }
  };

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatMinorUnits = (value: number, currency: string) => {
    return formatCurrency(value / 100, currency);
  };

  return (
    <div className="flex flex-col items-center min-h-screen pt-4 mb-10">
      <div className="w-full max-w-md rounded-lg shadow-md overflow-hidden p-2">
        <h2 className="text-2xl font-bold mb-6 text-center">Send Remittance</h2>

        {/* Success Display */}
        {success && (
          <div className="mb-6 p-4 border border-green-200 rounded-lg">
            <div className="flex items-center text-green-600 mb-2">
              <CheckCircle className="mr-2" />
              <span className="font-medium">Success</span>
            </div>
            <p>{success}</p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 border border-red-200 rounded-lg">
            <div className="flex items-center text-red-600 mb-2">
              <XCircle className="mr-2" />
              <span className="font-medium">Error</span>
            </div>
            <p>{error}</p>
          </div>
        )}


        <div className="grid grid-cols-2 gap-4 mb-6">
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
            <input
              type="text"
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value.toUpperCase())}
              className="w-full px-4 py-2 border bg-transparent border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue"
              placeholder="USDC"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">To Currency</label>
            <input
              type="text"
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value.toUpperCase())}
              className="w-full px-4 py-2 border bg-transparent border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue"
              placeholder="VES"
            />
          </div>
        </div>

        {/* Amount Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Amount to Send</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-2 border bg-transparent border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue"
            placeholder="0.00"
            min="0"
            step="0.01"
          />
        </div>

        {/* Get Exchange Rate Button */}
        <button
          onClick={fetchExchangeRate}
          disabled={isLoading || !fromCurrency || !toCurrency}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors mb-6
            ${isLoading || !fromCurrency || !toCurrency
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue hover:bg-blue'
            }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="animate-spin mr-2" />
              Fetching Rate...
            </div>
          ) : (
            'Get Exchange Rate'
          )}
        </button>

        {/* Exchange Rate Display */}
        {exchangeRate && (
          <div className="mb-6 p-4 bg-gray-800 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Exchange Rate:</span>
              <div className="flex items-center">
                <span className="mr-2">1 {fromCurrency}</span>
                <ArrowRight size={16} className="mx-1" />
                <span className="ml-2 font-bold">{exchangeRate} {toCurrency}</span>
              </div>
            </div>
          </div>
        )}

        {/* Quote Details */}
        {quote && (
          <div className="mb-6 p-4 bg-gray-800 rounded-lg space-y-4">
            <h3 className="font-semibold text-lg mb-2">Transfer Quote</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Amount to Send:</span>
                <span>{formatMinorUnits(quote.source_amount, fromCurrency)}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Fees:</span>
                <span className="text-gray-400">{formatMinorUnits(quote.total_fees, fromCurrency)}</span>
              </div>
              
              <div className="pt-2 border-t border-gray-700">
                <div className="flex justify-between font-medium">
                  <span>Total Cost:</span>
                  <span>
                    {formatMinorUnits(
                      quote.source_amount + quote.total_fees, 
                      fromCurrency
                    )}
                  </span>
                </div>
              </div>
              
              <div className="pt-2 border-t border-gray-700">
                <div className="flex justify-between text-green-400">
                  <span>Recipient Gets:</span>
                  <span>
                    {formatMinorUnits(quote.quoted_amount, toCurrency)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="pt-2 border-t border-gray-700 text-xs text-gray-400 space-y-1">
              <div>Quote ID: {quote.id}</div>
              <div>Status: {quote.status}</div>
              <div>Expires: {new Date(quote.expires_at).toLocaleString()}</div>
              <div>Created: {new Date(quote.created_at).toLocaleString()}</div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {!quote && (
            <button
              onClick={createTransferQuote}
              disabled={!exchangeRate || !amount || isCreatingQuote}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors
                ${!exchangeRate || !amount || isCreatingQuote
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
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

          {quote && quote.status === "created" && (
            <button
              onClick={payTransferQuote}
              disabled={isPayingQuote}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors
                ${isPayingQuote
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
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
              disabled={isConfirmingQuote}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors
                ${isConfirmingQuote
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
    </div>
  );
};

export default SendRemittance;