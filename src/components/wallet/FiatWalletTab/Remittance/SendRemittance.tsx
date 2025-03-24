import { useState } from "react";

const SendRemittance = () => {
  const [amount, setAmount] = useState(0);
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
        const response = await fetch(
          `https://sandbox-api.kontigo.lat/v1/organizations/${organizationId}/exchange-rates?from_currency=${fromCurrency}&to_currency=${toCurrency}`,
          {
            mode: "no-cors", // Disable CORS
            method: "GET",
            headers: {
              "X-Api-Key": "pk_CH59Nex4ByzhFrgfLOfqOYczJoQM5LqF6efBcpxBR8",  
            },
          }
        );

      if (!response.ok) {
        throw new Error("Failed to fetch exchange rate");
      }

      const data = await response.json();
      setExchangeRate(data.rate);
      console.log("Exchange rate retrieved successfully:", data);
    } catch (err:any) {
      setError(err.message);
      console.error("Error fetching exchange rate:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#1E1E1E] text-white p-4">
      <h2 className="text-xl font-bold mb-4">Send Remittance</h2>

      {/* Amount Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Amount</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
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
        <label className="block text-sm font-medium mb-1">
          Destination Currency
        </label>
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
        className="w-full  text-white py-2 rounded mb-4 disabled:opacity-50"
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

      {/* Send Button */}
      <button
        disabled={!exchangeRate || !amount}
        className="w-full bg-blue text-white py-2 rounded disabled:opacity-50"
      >
        Send Remittance
      </button>
    </div>
  );
};

export default SendRemittance;