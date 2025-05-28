import { useState, useEffect } from "react";
import { Button } from "@/components/stonfi/ui/button";
import { Input } from "@/components/stonfi/ui/input";
import { Label } from "@/components/stonfi/ui/label";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setShowMessage } from "@/store/slice/messageSlice";
import { Copy, Check, X, Loader2 } from "lucide-react";
import { getBankAccountsUrl, getBankAccountUrl } from "@/config/api";
import { API_CONFIG } from "@/config/api";
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '@/libs/firebase';

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
  showLoader?: boolean;
  customerPhone: string;
}

export default function CreateBankAccount({ customerId, showLoader = true, customerPhone }: CreateBankAccountProps) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [displayMode, setDisplayMode] = useState<'loading' | 'details' | 'form'>('loading');
  const [dataFetched, setDataFetched] = useState(false);

  const [formData, setFormData] = useState<BankAccountFormData>({
    bank_code: "",
    beneficiary_name: null,
    account_number: null,
    id_doc_number: "",
    phone_number: customerPhone,
  });

  useEffect(() => {
    const fetchBankAccount = async () => {
      try {
        const response = await axios.get(getBankAccountsUrl(customerId));
        if (response.data && response.data.length > 0) {
          setBankAccount(response.data[0]);
          setDisplayMode('details');
        } else {
          setDisplayMode('form');
        }
      } catch (err) {
        console.error('Error fetching bank account:', err);
        setDisplayMode('form');
      } finally {
        setIsLoading(false);
        setDataFetched(true);
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

  const handleDelete = async () => {
    if (!bankAccount) return;
    
    setLoading(true);
    try {
      await axios.delete(getBankAccountUrl(customerId, bankAccount.id));
      setBankAccount(null);
      setShowDeleteConfirm(false);
      setDisplayMode('form');
      dispatch(setShowMessage({
        message: "Bank account deleted successfully!",
        color: "green"
      }));
    } catch (err: any) {
      console.error('Error:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.details?.message || 'Failed to delete bank account';
      dispatch(setShowMessage({
        message: errorMessage,
        color: "red"
      }));
    } finally {
      setLoading(false);
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
      dispatch(setShowMessage({
        message: "Bank code and ID document number are required",
        color: "red"
      }));
      return;
    }

    // Enhanced ID document number validation
    const idDocNumber = formData.id_doc_number.trim();
    if (idDocNumber.length < 8) {
      dispatch(setShowMessage({
        message: "ID document number must be at least 8 characters long",
        color: "red"
      }));
      return;
    }

    if (!idDocNumber.match(/^[Vv]\d{7,}$/)) {
      dispatch(setShowMessage({
        message: "ID document number must start with 'V' followed by at least 7 digits",
        color: "red"
      }));
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(getBankAccountsUrl(customerId), {
        ...formData,
        id_doc_number: idDocNumber.toUpperCase() // Normalize to uppercase
      });
      setBankAccount(response.data);
      setDisplayMode('details');
      dispatch(setShowMessage({
        message: "Bank account created successfully!",
        color: "green"
      }));
    } catch (err: any) {
      console.error('Error:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.details?.message || 'Failed to create bank account';
      dispatch(setShowMessage({
        message: errorMessage,
        color: "red"
      }));
    } finally {
      setLoading(false);
    }
  };

  // Show loading state until data is fetched
  if (isLoading || !dataFetched) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue" />
      </div>
    );
  }

  // Bank account details view
  if (displayMode === 'details' && bankAccount) {
    return (
      <div className="space-y-4">
        <div className="mb-4 p-3 rounded-lg bg-gray-dark">
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

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-gray-dark">
            <p className="text-sm text-gray-400">Bank Code</p>
            <p className="text-base font-medium">{bankAccount.bank_code}</p>
          </div>
          
          <div className="p-3 rounded-lg bg-gray-dark">
            <p className="text-sm text-gray-400">ID Document</p>
            <p className="text-base font-medium">{bankAccount.id_doc_number}</p>
          </div>
          
          {bankAccount.beneficiary_name && (
            <div className="p-3 rounded-lg bg-gray-dark">
              <p className="text-sm text-gray-400">Beneficiary</p>
              <p className="text-base font-medium">{bankAccount.beneficiary_name}</p>
            </div>
          )}
          
          {bankAccount.account_number && (
            <div className="p-3 rounded-lg bg-gray-dark">
              <p className="text-sm text-gray-400">Account Number</p>
              <p className="text-base font-medium">{bankAccount.account_number}</p>
            </div>
          )}
          
          {bankAccount.phone_number && (
            <div className="col-span-2 p-3 rounded-lg bg-gray-dark">
              <p className="text-sm text-gray-400">Phone Number</p>
              <p className="text-base font-medium">{bankAccount.phone_number}</p>
            </div>
          )}
        </div>

        <Button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full bg-red-600 hover:bg-red-700 text-white mt-4"
          disabled={loading}
        >
          {loading ? "Deleting..." : "Delete Bank Account"}
        </Button>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gray-dark p-6 rounded-lg max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Delete Bank Account</h3>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete this bank account? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  disabled={loading}
                >
                  {loading ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Create bank account form
  return (
    <div className="space-y-4">
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
          placeholder="Enter ID document number (e.g., V12345678)"
          name="id_doc_number"
          value={formData.id_doc_number}
          onChange={handleChange}
          className="bg-black border border-gray-600 text-white text-left [&:not(:placeholder-shown)]:bg-black"
          required
          pattern="[Vv]\d{7,}"
          title="ID must start with 'V' followed by at least 7 digits"
          maxLength={20}
        />
        <p className="text-xs text-gray-400 mt-1">
          Must start with 'V' followed by at least 7 digits (e.g., V12345678)
        </p>
      </div>

      <Button
        onClick={handleSubmit}
        className="w-full bg-blue text-white py-3 rounded-md hover:bg-blue-light transition-colors flex items-center justify-center"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : (
          "Create Bank Account"
        )}
      </Button>
    </div>
  );
} 