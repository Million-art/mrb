import { useState, useEffect } from "react";
import { Button } from "@/components/stonfi/ui/button";
import { Input } from "@/components/stonfi/ui/input";
import { Label } from "@/components/stonfi/ui/label";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setShowMessage } from "@/store/slice/messageSlice";
import { Copy, Check, X, Loader2 } from "lucide-react";
import { getBankAccountsUrl, getBankAccountUrl } from "@/config/api";

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
  onComplete?: () => void;
}

// Utility functions
const validateIdDocument = (idDocNumber: string): { isValid: boolean; message?: string } => {
  const trimmed = idDocNumber.trim();
  if (trimmed.length < 8) {
    return { isValid: false, message: "ID document number must be at least 8 characters long" };
  }
  if (!trimmed.match(/^[Vv]\d{7,}$/)) {
    return { isValid: false, message: "ID document number must start with 'V' followed by at least 7 digits" };
  }
  return { isValid: true };
};

const handleApiError = (err: any, dispatch: any, defaultMessage: string) => {
  console.error('Error:', err);
  const errorMessage = err.response?.data?.message || err.response?.data?.details?.message || defaultMessage;
  dispatch(setShowMessage({
    message: errorMessage,
    color: "red"
  }));
};

// Reusable components
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Loader2 className="h-8 w-8 animate-spin text-blue" />
  </div>
);

const FormField = ({ 
  label, 
  name, 
  value, 
  onChange, 
  placeholder, 
  required, 
  pattern, 
  title, 
  maxLength, 
  type = "text" 
}: {
  label: string;
  name: string;
  value: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  placeholder: string;
  required?: boolean;
  pattern?: string;
  title?: string;
  maxLength?: number;
  type?: string;
}) => (
  <div className="space-y-2">
    <Label htmlFor={name}>{label} {required && "*"}</Label>
    <Input
      placeholder={placeholder}
      name={name}
      value={value || ""}
      onChange={onChange}
      className="bg-black border border-gray-600 text-white text-left [&:not(:placeholder-shown)]:bg-black"
      required={required}
      pattern={pattern}
      title={title}
      maxLength={maxLength}
      type={type}
    />
  </div>
);

const BankAccountDetails = ({ bankAccount, onCopy, copied, onDelete, loading }) => (
  <div className="space-y-4 mb-12">
    <div className="mb-4 p-3 rounded-lg bg-gray-dark">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">Bank Account ID</p>
          <p className="text-lg font-medium">{bankAccount.kontigoBankAccountId}</p>
        </div>
        <button
          onClick={onCopy}
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
      
      <div className="col-span-2 p-3 rounded-lg bg-gray-dark">
        <p className="text-sm text-gray-400">Phone Number</p>
        <p className="text-base font-medium">{bankAccount.phone_number}</p>
      </div>
    </div>

    <Button
      onClick={onDelete}
      className="w-full bg-red-600 hover:bg-red-700 text-white mt-4"
      disabled={loading}
    >
      {loading ? "Deleting..." : "Delete Bank Account"}
    </Button>
  </div>
);

export default function CreateBankAccount({ customerId, showLoader = true, customerPhone, onComplete }: CreateBankAccountProps) {
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
    } catch (err) {
      handleApiError(err, dispatch, 'Failed to delete bank account');
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

    const validation = validateIdDocument(formData.id_doc_number);
    if (!validation.isValid) {
      dispatch(setShowMessage({
        message: validation.message || "Invalid ID document number",
        color: "red"
      }));
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(getBankAccountsUrl(customerId), {
        ...formData,
        id_doc_number: formData.id_doc_number.toUpperCase()
      });
      setBankAccount(response.data);
      setDisplayMode('details');
      dispatch(setShowMessage({
        message: "Bank account created successfully!",
        color: "green"
      }));
      
      // Call onComplete if provided
      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      handleApiError(err, dispatch, 'Failed to create bank account');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !dataFetched) {
    return <LoadingSpinner />;
  }

  if (displayMode === 'details' && bankAccount) {
    return (
      <>
        <BankAccountDetails
          bankAccount={bankAccount}
          onCopy={handleCopy}
          copied={copied}
          onDelete={() => setShowDeleteConfirm(true)}
          loading={loading}
        />

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
              <div className="flex gap-4">
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
      </>
    );
  }

  return (
    <div className="space-y-4">
      <FormField
        label="Bank Code"
          name="bank_code"
          value={formData.bank_code}
          onChange={handleChange}
        placeholder="Enter bank code (e.g., 0138)"
          required
        />

      <FormField
        label="Beneficiary Name"
          name="beneficiary_name"
        value={formData.beneficiary_name}
          onChange={handleChange}
        placeholder="Enter beneficiary name (e.g., John Doe)"
      />

      <FormField
        label="Account Number"
          name="account_number"
        value={formData.account_number}
          onChange={handleChange}
        placeholder="Enter account number (e.g., 21281309821)"
      />

      <FormField
        label="ID Document Number"
          name="id_doc_number"
          value={formData.id_doc_number}
          onChange={handleChange}
        placeholder="Enter ID document number (e.g., V12345678)"
          required
          pattern="[Vv]\d{7,}"
          title="ID must start with 'V' followed by at least 7 digits"
          maxLength={20}
        />

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