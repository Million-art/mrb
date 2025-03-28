import { useState } from "react";
import axios from "axios";

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
    <div className="bg-[#1E1E1E] text-white p-4 rounded-md max-w-md mx-auto mb-16">
      <h2 className="text-xl font-bold mb-4">Send Remittance</h2>

      <div className="space-y-4">
        {/* Currency Inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">From Currency</label>
            <input
              type="text"
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value.toUpperCase())}
              className="w-full p-2 bg-gray-700 rounded"
              placeholder="USDC"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">To Currency</label>
            <input
              type="text"
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value.toUpperCase())}
              className="w-full p-2 bg-gray-700 rounded"
              placeholder="VES"
            />
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-sm mb-1">Amount to Send</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 bg-gray-700 rounded"
            placeholder="0.00"
            min="0"
            step="0.01"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-2 bg-red-900 text-white rounded text-sm">
            {error}
          </div>
        )}

        {/* Get Exchange Rate Button */}
        <button
          onClick={fetchExchangeRate}
          disabled={isLoading || !fromCurrency || !toCurrency}
          className="w-full bg-blue py-2 rounded disabled:opacity-50"
        >
          {isLoading ? "Fetching Rate..." : "Get Exchange Rate"}
        </button>

        {/* Exchange Rate Display */}
        {exchangeRate && (
          <div className="bg-gray-800 p-3 rounded">
            <div className="flex justify-between">
              <span className="text-gray-400">Exchange Rate:</span>
              <span>1 {fromCurrency} = {exchangeRate} {toCurrency}</span>
            </div>
          </div>
        )}

        {/* Quote Details */}
        {quote && (
          <div className="bg-gray-800 p-3 rounded space-y-3">
            <div className="flex justify-between">
              <span>Amount to Send:</span>
              <span>{formatCurrency(parseFloat(amount), fromCurrency)}</span>
            </div>
            
            <div className="flex justify-between text-sm text-gray-400">
              <span>Fees:</span>
              <span>{formatCurrency(quote.fees / 100, fromCurrency)}</span>
            </div>
            
            <div className="flex justify-between font-medium">
              <span>Total Cost:</span>
              <span>
                {formatCurrency(
                  parseFloat(amount) + (quote.fees / 100), 
                  fromCurrency
                )}
              </span>
            </div>
            
            <div className="pt-2 border-t border-gray-700">
              <div className="flex justify-between text-green-400">
                <span>Recipient Gets:</span>
                <span>
                  {formatCurrency(quote.destination_amount / 100, toCurrency)}
                </span>
              </div>
            </div>
            
            <div className="text-xs text-gray-400">
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
          className="w-full bg-green-600 py-2 rounded disabled:opacity-50"
        >
          {isCreatingQuote ? "Creating Quote..." : "Create Transfer Quote"}
        </button>
      </div>
    </div>
  );
};

export default SendRemittance;