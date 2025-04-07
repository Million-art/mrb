import { useState, useEffect } from "react";
import { Button } from "@/components/stonfi/ui/button";
import { Input } from "@/components/stonfi/ui/input";
import { Label } from "@/components/stonfi/ui/label";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setShowMessage } from "@/store/slice/messageSlice";
import { useNavigate } from "react-router-dom";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import './phone-input-dark.css';
import { Copy, Check } from "lucide-react";

interface BankAccountFormData {
  bank_code: string;
  beneficiary_name: string | null;
  account_number: string | null;
  id_doc_number: string;
  phone_number: string | null;
}

interface BankAccount extends BankAccountFormData {
  id: string;
  kontigoBankAccountId: string;
}

interface CreateBankAccountProps {
  customerId: string;
}

export default function CreateBankAccount({ customerId }: CreateBankAccountProps) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState<BankAccountFormData>({
    bank_code: "",
    beneficiary_name: null,
    account_number: null,
    id_doc_number: "",
    phone_number: null,
  });

  useEffect(() => {
    const fetchBankAccount = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3002/customers/${customerId}/bank-accounts`
        );
        if (response.data && response.data.length > 0) {
          setBankAccount(response.data[0]);
          setFormData({
            bank_code: response.data[0].bank_code,
            beneficiary_name: response.data[0].beneficiary_name,
            account_number: response.data[0].account_number,
            id_doc_number: response.data[0].id_doc_number,
            phone_number: response.data[0].phone_number,
          });
        }
      } catch (err) {
        console.error('Error fetching bank account:', err);
      }
    };

    fetchBankAccount();
  }, [customerId]);

  const handleCopy = async () => {
    if (bankAccount) {
      await navigator.clipboard.writeText(bankAccount.kontigoBankAccountId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value || null
    }));
  };

  const handleSubmit = async () => {
    if (!formData.bank_code || !formData.id_doc_number) {
      setError("Required fields must be filled");
      return;
    }

    if (formData.id_doc_number.length < 8) {
      setError("ID document number must be at least 8 characters long");
      return;
    }

    if (!formData.id_doc_number.startsWith('V')) {
      setError("ID document number must start with 'V'");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (bankAccount) {
        await axios.put(
          `http://localhost:3002/customers/${customerId}/bank-accounts/${bankAccount.id}`,
          formData
        );
        dispatch(setShowMessage({
          message: "Bank account updated successfully!",
          color: "green"
        }));
      } else {
        await axios.post(
          `http://localhost:3002/customers/${customerId}/bank-accounts`,
          formData
        );
        dispatch(setShowMessage({
          message: "Bank account created successfully!",
          color: "green"
        }));
      }

      navigate("/wallet");
    } catch (err: any) {
      console.error('Error:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.details?.message || 'Failed to save bank account';
      setError(errorMessage);
      dispatch(setShowMessage({
        message: errorMessage,
        color: "red"
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {bankAccount && (
        <div className="mb-6 p-4 bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Bank Account ID</p>
              <p className="text-lg font-medium">{bankAccount.kontigoBankAccountId}</p>
            </div>
            <button
              onClick={handleCopy}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500 text-red-500 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="bank_code">Bank Code *</Label>
        <Input
          placeholder="Enter bank code (e.g., 0138)"
          name="bank_code"
          value={formData.bank_code}
          onChange={handleChange}
          className="bg-black border border-gray-600 text-white text-left [&:not(:placeholder-shown)]:bg-black"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="beneficiary_name">Beneficiary Name</Label>
        <Input
          placeholder="Enter beneficiary name (e.g., John Doe)"
          name="beneficiary_name"
          value={formData.beneficiary_name || ""}
          onChange={handleChange}
          className="bg-black border border-gray-600 text-white text-left [&:not(:placeholder-shown)]:bg-black"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="account_number">Account Number</Label>
        <Input
          placeholder="Enter account number (e.g., 21281309821)"
          name="account_number"
          value={formData.account_number || ""}
          onChange={handleChange}
          className="bg-black border border-gray-600 text-white text-left [&:not(:placeholder-shown)]:bg-black"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="id_doc_number">ID Document Number *</Label>
        <Input
          placeholder="Enter ID document number (e.g., V1234567)"
          name="id_doc_number"
          value={formData.id_doc_number}
          onChange={handleChange}
          className="bg-black border border-gray-600 text-white text-left [&:not(:placeholder-shown)]:bg-black"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone_number">Phone Number</Label>
        <PhoneInput
          international
          defaultCountry="VE"
          placeholder="Enter phone number (e.g., +584123456787)"
          value={formData.phone_number || ""}
          onChange={(value) => {
            setFormData(prev => ({
              ...prev,
              phone_number: value || null
            }))
          }}
          className="bg-black border border-gray-600 rounded-md h-10 text-white"
        />
      </div>

      <div className="pt-4">
        <Button
          onClick={handleSubmit}
          className="w-full bg-blue hover:bg-blue-light text-white"
          disabled={loading}
        >
          {loading ? "Saving..." : bankAccount ? "Update Bank Account" : "Create Bank Account"}
        </Button>
      </div>
    </div>
  );
} 