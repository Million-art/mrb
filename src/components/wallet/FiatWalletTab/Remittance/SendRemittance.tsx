import { useState } from "react";
import axios from "axios";

const SendRemittance = () => {
  const [amount, setAmount] = useState("");
  const [fromCurrency, setFromCurrency] = useState("");
  const [toCurrency, setToCurrency] = useState("");
  const [exchangeRate, setExchangeRate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Retrieve the exchange rate
  const fetchExchangeRate = async () => {
    if (!fromCurrency || !toCurrency) {
      setError("Please select both source and destination currencies.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const organizationId = "org_jxo76fiqgy3zkhi";
      const response = await axios.get(
        `https://sandbox-api.kontigo.lat/v1/organizations/${organizationId}/exchange-rates`,
        {
          params: { from_currency: fromCurrency, to_currency: toCurrency },
          headers: {
            "X-Api-Key": "pk_CH59Nex4ByzhFrgfLOfqOYczJoQM5LqF6efBcpxBR8",
            "Content-Type": "application/json",
          },
        }
      );

      setExchangeRate(response.data.rate);
      console.log("Exchange rate retrieved successfully:", response.data);
    } catch (err) {
      setError("Failed to fetch exchange rate. Please try again.");
      console.error("Error fetching exchange rate:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Create Transfer Quote
  const createTransferQuote = async () => {
    if (!amount || !exchangeRate) {
      setError("Please enter a valid amount and fetch exchange rate first.");
      return;
    }

    try {
      const response = await axios.post(
        "https://sandbox-api.kontigo.lat/v1/transfers/quote",
        {
          amount: parseFloat(amount) * 100, // Convert to minor units
          customer_id: "cus_1234567890",
          source: {
            payment_rail: "prefunded_account",
            currency: fromCurrency,
            account_id: "pa_lp7xtrnq7ee06na",
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
            "X-Api-Key": " ",
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Transfer Quote Created:", response.data);
      alert("Transfer quote created successfully!");
    } catch (error) {
      setError("Error creating transfer quote. Please try again.");
      console.error("Error creating transfer quote:", error);
    }
  };

  return (
    <div className="bg-[#1E1E1E] text-white p-4 rounded-md max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Send Remittance</h2>

      {/* Amount Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Amount</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-2 bg-gray-700 rounded text-white"
          required
        />
      </div>

      {/* Source Currency */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Source Currency</label>
        <input
          type="text"
          placeholder="e.g., USD"
          value={fromCurrency}
          onChange={(e) => setFromCurrency(e.target.value.toUpperCase())}
          className="w-full p-2 bg-gray-700 rounded text-white"
          required
        />
      </div>

      {/* Destination Currency */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Destination Currency</label>
        <input
          type="text"
          placeholder="e.g., EUR"
          value={toCurrency}
          onChange={(e) => setToCurrency(e.target.value.toUpperCase())}
          className="w-full p-2 bg-gray-700 rounded text-white"
          required
        />
      </div>

      {/* Error Message */}
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {/* Get Exchange Rate Button */}
      <button
        onClick={fetchExchangeRate}
        disabled={isLoading || !fromCurrency || !toCurrency}
        className="w-full bg-blue text-white py-2 rounded mb-4 disabled:opacity-50"
      >
        {isLoading ? "Fetching Exchange Rate..." : "Get Exchange Rate"}
      </button>

      {/* Display Exchange Rate */}
      {exchangeRate && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Exchange Rate</h3>
          <p className="text-gray-400">
            1 {fromCurrency} = {exchangeRate} {toCurrency}
          </p>
        </div>
      )}

      {/* Send Remittance Button */}
      <button
        onClick={createTransferQuote}
        disabled={!exchangeRate || !amount}
        className="w-full bg-green-500 text-white py-2 rounded disabled:opacity-50"
      >
        Send Remittance
      </button>
    </div>
  );
};

export default SendRemittance;