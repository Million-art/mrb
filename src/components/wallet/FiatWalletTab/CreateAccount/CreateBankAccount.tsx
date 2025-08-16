import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/stonfi/ui/button";
import { Input } from "@/components/stonfi/ui/input";
import { Label } from "@/components/stonfi/ui/label";
import { addDoc, collection, deleteDoc, doc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/libs/firebase";
import { useDispatch } from "react-redux";
import { setShowMessage } from "@/store/slice/messageSlice";
import { Copy, Check, X, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface BankAccountFormData {
  bank_code: string;
  id_doc_number: string;
  phone_number: string | null;
  account_type: 'bank_account_ve' | 'pagomovil';
}

interface BankAccount {
  id: string;
  bank_code: string;
  id_doc_number: string;
  phone_number: string | null;
  account_type: string;
  account_number: string;
  customer_id: string;
  bankAccountId: string;
  createdAt?: string;
}

interface CreateBankAccountProps {
  customerId: string;
  showLoader?: boolean;
  customerPhone: string;
  onComplete?: () => void;
  forceFormDisplay?: boolean;
}

// Utility functions
const validateIdDocument = (idDocNumber: string, t: any): { isValid: boolean; message?: string } => {
  const trimmed = idDocNumber.trim();
  if (trimmed.length < 8) {
    return { isValid: false, message: t("createBankAccount.idDocumentTooShort") };
  }

  return { isValid: true };
};

const handleApiError = (err: any, dispatch: any, defaultMessage: string) => {
  console.error('Error:', err);
  const errorMessage = err.response?.data?.message || defaultMessage;
  dispatch(setShowMessage({
    message: errorMessage,
    color: "red"
  }));
};

// Reusable components
const LoadingSpinner = ({ t }: { t: any }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Loader2 className="h-8 w-8 animate-spin text-blue" />
    <span className="ml-2">{t("createBankAccount.loading")}</span>
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

const BankAccountDetails = ({ bankAccount, onCopy, copied, onDelete, loading, t }: { 
  bankAccount: BankAccount; 
  onCopy: () => void; 
  copied: boolean; 
  onDelete: () => void; 
  loading: boolean;
  t: any;
}) => (
  <div className="space-y-4 mb-12">
    <div className="mb-4 p-3 rounded-lg bg-gray-dark">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{t("createBankAccount.bankAccountId")}</p>
          <p className="text-lg font-medium">{bankAccount.bankAccountId}</p>
        </div>
        <button
          onClick={onCopy}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          aria-label={t("createBankAccount.copyButton")}
        >
          {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
        </button>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div className="p-3 rounded-lg bg-gray-dark">
        <p className="text-sm text-gray-400">{t("createBankAccount.bankCode")}</p>
        <p className="text-base font-medium">{bankAccount.bank_code}</p>
      </div>
      
      <div className="p-3 rounded-lg bg-gray-dark">
        <p className="text-sm text-gray-400">{t("createBankAccount.idDocument")}</p>
        <p className="text-base font-medium">{bankAccount.id_doc_number}</p>
      </div>

      
      <div className="col-span-2 p-3 rounded-lg bg-gray-dark">
        <p className="text-sm text-gray-400">{t("createBankAccount.phoneNumber")}</p>
        <p className="text-base font-medium">{bankAccount.phone_number}</p>
      </div>
    </div>

    <Button
      onClick={onDelete}
      className="w-full bg-red-600 hover:bg-red-700 text-white mt-4"
      disabled={loading}
    >
      {loading ? t("createBankAccount.deleting") : t("createBankAccount.deleteBankAccountButton")}
    </Button>
  </div>
);

export default function CreateBankAccount({ customerId, showLoader = true, customerPhone, onComplete, forceFormDisplay = false }: CreateBankAccountProps) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [displayMode, setDisplayMode] = useState<'loading' | 'details' | 'form'>('loading');
  const [dataFetched, setDataFetched] = useState(false);

  const [formData, setFormData] = useState<BankAccountFormData>({
    bank_code: "",
    id_doc_number: "",
    phone_number: customerPhone,
    account_type: 'bank_account_ve',
  });

  useEffect(() => {
    const fetchBankAccount = async () => {
      try {
        // If forceFormDisplay is true, skip fetching and go directly to form
        if (forceFormDisplay) {
          setDisplayMode('form');
          setIsLoading(false);
          setDataFetched(true);
          return;
        }



        // Query Firebase for existing bank accounts
        const bankAccountsRef = collection(db, "bank_accounts");
        const q = query(bankAccountsRef, where("customer_id", "==", customerId));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const bankAccountData = querySnapshot.docs[0].data();
          const bankAccount: BankAccount = {
            id: querySnapshot.docs[0].id,
            bank_code: bankAccountData.bank_code || '',
            id_doc_number: bankAccountData.id_doc_number || '',
            phone_number: bankAccountData.phone_number || null,
            account_type: bankAccountData.account_type || '',
            account_number: bankAccountData.account_number || '',
            customer_id: bankAccountData.customer_id || '',
            bankAccountId: querySnapshot.docs[0].id,
            createdAt: bankAccountData.createdAt || bankAccountData.created_at || ''
          };
          console.log('Setting bank account from Firebase:', bankAccount);
          setBankAccount(bankAccount);
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
  }, [customerId, forceFormDisplay]);

  const handleCopy = async () => {
    if (bankAccount) {
      await navigator.clipboard.writeText(bankAccount.bankAccountId || bankAccount.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDelete = async () => {
    if (!bankAccount) return;
    
    try {
      // Delete from Firebase
      const bankAccountRef = doc(db, "bank_accounts", bankAccount.id);
      await deleteDoc(bankAccountRef);
      
      setBankAccount(null);
      setShowDeleteConfirm(false);
      setDisplayMode('form');
      dispatch(setShowMessage({
        message: t("createBankAccount.bankAccountDeletedSuccess"),
        color: "green"
      }));
    } catch (error) {
      console.error('Error deleting bank account from Firebase:', error);
      dispatch(setShowMessage({
        message: t("createBankAccount.failedToDeleteBankAccount"),
        color: "red"
      }));
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
        message: t("createBankAccount.bankCodeRequired"),
        color: "red"
      }));
      return;
    }

    const validation = validateIdDocument(formData.id_doc_number, t);
    if (!validation.isValid) {
      dispatch(setShowMessage({
        message: validation.message || t("createBankAccount.invalidIdDocument"),
        color: "red"
      }));
      return;
    }

    setLoading(true);

    try {
      // Save to Firebase instead of backend API
      const bankAccountData = {
        bank_code: formData.bank_code,
        id_doc_number: formData.id_doc_number.toUpperCase(),
        account_type: formData.account_type,
        account_number: formData.phone_number || '', // Map phone_number to account_number, ensure string
        customer_id: customerId,
        createdAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, "bank_accounts"), bankAccountData);
      
      // Create bank account object with the generated ID
      const newBankAccount: BankAccount = {
        id: docRef.id,
        bank_code: bankAccountData.bank_code,
        id_doc_number: bankAccountData.id_doc_number,
        phone_number: formData.phone_number,
        account_type: bankAccountData.account_type,
        account_number: bankAccountData.account_number,
        customer_id: bankAccountData.customer_id,
        bankAccountId: docRef.id,
        createdAt: bankAccountData.createdAt
      };
      
      setBankAccount(newBankAccount);
      setDisplayMode('details');
      dispatch(setShowMessage({
        message: t("createBankAccount.bankAccountCreatedSuccess"),
        color: "green"
      }));
      
      // Check if user came from bank account management page
      const fromBankAccountManagement = location.state?.fromBankAccountManagement;
      if (fromBankAccountManagement) {
        // Redirect back to bank account management page after a short delay
        setTimeout(() => {
          navigate(`/bank-accounts/${customerId}`, {
            state: {
              customerId: customerId,
              customerData: location.state?.customerData,
              fromSettings: location.state?.fromSettings
            }
          });
        }, 1500);
      }
      
      // Call onComplete if provided
      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      handleApiError(err, dispatch, t("createBankAccount.failedToCreateBankAccount"));
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !dataFetched) {
    return <LoadingSpinner t={t} />;
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
          t={t}
        />

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gray-dark p-6 rounded-lg max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{t("createBankAccount.deleteConfirmTitle")}</h3>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-gray-300 mb-6">
                {t("createBankAccount.deleteConfirmMessage")}
              </p>
              <div className="flex gap-4">
                <Button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white"
                >
                  {t("createBankAccount.cancelButton")}
                </Button>
                <Button
                  onClick={handleDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  disabled={loading}
                >
                  {loading ? t("createBankAccount.deleting") : t("createBankAccount.deleteButton")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="space-y-4 mb-12">
      <div className="space-y-2">
        <Label htmlFor="account_type">{t("createBankAccount.accountTypeLabel")}</Label> <br />
        <select
          name="account_type"
          id="account_type"
          value={formData.account_type}
          onChange={handleChange}
          className="bg-black border w-full border-gray-600 text-white rounded-md px-3 py-2"
        >
          <option value="bank_account_ve">{t("createBankAccount.accountTypes.bankAccount")}</option>
          <option value="pagomovil">{t("createBankAccount.accountTypes.pagomovil")}</option>
        </select>
      </div>
      <FormField
        label={t("createBankAccount.bankCodeLabel")}
        name="bank_code"
        value={formData.bank_code}
        onChange={handleChange}
        placeholder={t("createBankAccount.bankCodePlaceholder")}
        required
      />


      <FormField
        label={t("createBankAccount.idDocumentLabel")}
        name="id_doc_number"
        value={formData.id_doc_number}
        onChange={handleChange}
        placeholder={t("createBankAccount.idDocumentPlaceholder")}
        required
        pattern="[Vv]\d{7,}"
        title={t("createBankAccount.idDocumentTitle")}
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
            {t("createBankAccount.creating")}
          </>
        ) : (
          t("createBankAccount.createBankAccountButton")
        )}
      </Button>
    </div>
  );
} 