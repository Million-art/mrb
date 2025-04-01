import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const ReceiveRemittance = () => {
  const { customerId } = useParams(); 
  const navigate = useNavigate();

  // State for form inputs
  const [bankCode, setBankCode] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [idDocNumber, setIdDocNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [accountType, setAccountType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `https://sandbox-api.kontigo.lat/v1/customers/${customerId}/bank-accounts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": "YOUR_SECRET_TOKEN", 
          },
          body: JSON.stringify({
            bank_code: bankCode,
            country_code: countryCode,
            beneficiary_name: beneficiaryName || null,
            account_number: accountNumber || null,
            id_doc_number: idDocNumber,
            phone_number: phoneNumber || null,
            account_type: accountType,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create bank account");
      }

      const data = await response.json();
      console.log("Bank account created successfully:", data);
      alert("Bank account created successfully!");
      navigate(-1); 
    } catch (err:any) {
      setError(err.message);
      console.error("Error creating bank account:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className=" text-white p-4 mb-10">
      <h2 className="text-xl font-bold mb-4">Connect Bank Account</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Bank Code */}
        <div>
          <label className="block text-sm font-medium mb-1">Bank Code</label>
          <input
            type="text"
            value={bankCode}
            onChange={(e) => setBankCode(e.target.value)}
            className="w-full p-2 bg-gray-700 rounded text-white"
            required
          />
        </div>

        {/* Country Code */}
        <div>
          <label className="block text-sm font-medium mb-1">Country Code</label>
          <input
            type="text"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="w-full p-2 bg-gray-700 rounded text-white"
            required
          />
        </div>

        {/* Beneficiary Name */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Beneficiary Name (Optional)
          </label>
          <input
            type="text"
            value={beneficiaryName}
            onChange={(e) => setBeneficiaryName(e.target.value)}
            className="w-full p-2 bg-gray-700 rounded text-white"
          />
        </div>

        {/* Account Number */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Account Number (Optional)
          </label>
          <input
            type="text"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            className="w-full p-2 bg-gray-700 rounded text-white"
          />
        </div>

        {/* ID Document Number */}
        <div>
          <label className="block text-sm font-medium mb-1">
            ID Document Number
          </label>
          <input
            type="text"
            value={idDocNumber}
            onChange={(e) => setIdDocNumber(e.target.value)}
            className="w-full p-2 bg-gray-700 rounded text-white"
            required
          />
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Phone Number (Optional)
          </label>
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full p-2 bg-gray-700 rounded text-white"
          />
        </div>

        {/* Account Type */}
        <div>
          <label className="block text-sm font-medium mb-1">Account Type</label>
          <select
            value={accountType}
            onChange={(e) => setAccountType(e.target.value)}
            className="w-full p-2 bg-gray-700 rounded text-white"
            required
          >
            <option value="" disabled>
              Select Account Type
            </option>
            <option value="savings">Savings</option>
            <option value="checking">Checking</option>
          </select>
        </div>

        {/* Error Message */}
        {error && <p className="text-red-500 text-sm">{error}</p>}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue text-white py-2 rounded disabled:opacity-50"
        >
          {isLoading ? "Connecting..." : "Connect Bank Account"}
        </button>
      </form>
    </div>
  );
};

export default ReceiveRemittance;