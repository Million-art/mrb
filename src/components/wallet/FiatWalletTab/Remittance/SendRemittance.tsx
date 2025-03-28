import { useState } from "react";
import axios from "axios";
import { Loader2, ArrowRight, XCircle } from "lucide-react";

interface QuoteResponse {
  quote_id: string;
  amount: number; // in minor units
  fees: number; // in minor units
  exchange_rate: number;
  destination_amount: number; // in minor units
  expires_at: string;
  estimated_delivery: string;
}

const SendRemittance = () => {
  const [amount, setAmount] = useState("");
  const [fromCurrency, setFromCurrency] = useState("USDC");
  const [toCurrency, setToCurrency] = useState("VES");
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingQuote, setIsCreatingQuote] = useState(false);
  const [error, setError] = useState("");

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
    if (!amount || isNaN(parseFloat(amount))) {
      setError("Please enter a valid amount");
      return;
    }

    if (!exchangeRate) {
      setError("Please get the exchange rate first");
      return;
    }

    setIsCreatingQuote(true);
    setError("");

    try {
      const amountInMinorUnits = Math.round(parseFloat(amount) * 100);
      
      const response = await axios.post<QuoteResponse>(
        "https://sandbox-api.kontigo.lat/v1/transfers/quote",
        {
          amount: amountInMinorUnits,
          customer_id: "cus_1234567890",  
          source: {
            payment_rail: "prefunded_account",
            currency: fromCurrency,
            account_id: "",
          },
          destination: {
            payment_rail: "pagomovil",
            currency: toCurrency,
            account_id: "ba_destination456",
          },
          fees_paid_by: "source", 
        },
        {
          headers: {
            "X-Api-Key": "",
            "Content-Type": "application/json",
            "accept": "application/json",
          },
        }
      );

      setQuote(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 
                         err.message || 
                         "Failed to create transfer quote";
      setError(errorMessage);
      console.error("Quote creation error:", {
        config: err.config,
        response: err.response,
        message: err.message
      });
    } finally {
      setIsCreatingQuote(false);
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

  return (
    <div className="flex flex-col items-center bg-gray-dark min-h-screen pt-4">
      <div className="w-full max-w-md rounded-lg shadow-md overflow-hidden p-2">
        <h2 className="text-2xl font-bold mb-6 text-center">Send Remittance</h2>

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
                <span>{formatCurrency(parseFloat(amount), fromCurrency)}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Fees:</span>
                <span className="text-gray-400">{formatCurrency(quote.fees / 100, fromCurrency)}</span>
              </div>
              
              <div className="pt-2 border-t border-gray-700">
                <div className="flex justify-between font-medium">
                  <span>Total Cost:</span>
                  <span>
                    {formatCurrency(
                      parseFloat(amount) + (quote.fees / 100), 
                      fromCurrency
                    )}
                  </span>
                </div>
              </div>
              
              <div className="pt-2 border-t border-gray-700">
                <div className="flex justify-between text-green-400">
                  <span>Recipient Gets:</span>
                  <span>
                    {formatCurrency(quote.destination_amount / 100, toCurrency)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="pt-2 border-t border-gray-700 text-xs text-gray-400 space-y-1">
              <div>Quote ID: {quote.quote_id}</div>
              <div>Expires: {new Date(quote.expires_at).toLocaleString()}</div>
              {quote.estimated_delivery && (
                <div>Estimated Delivery: {new Date(quote.estimated_delivery).toLocaleString()}</div>
              )}
            </div>
          </div>
        )}

        {/* Create Quote Button */}
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
      </div>
    </div>
  );
};

export default SendRemittance;