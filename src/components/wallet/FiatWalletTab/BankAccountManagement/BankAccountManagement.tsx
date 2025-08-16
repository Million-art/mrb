import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/stonfi/ui/button";
import { ArrowLeft, Plus, Trash2, Copy, Check, Loader2, Wallet, X } from "lucide-react";
import { useDispatch } from "react-redux";
import { setShowMessage } from "@/store/slice/messageSlice";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/libs/firebase";
import axios from "axios";
import { getBankAccountsUrl } from "@/config/api";

interface BankAccount {
  id: string;
  bank_code: string;
  id_doc_number: string;
  account_type: string;
  account_number: string;
  bankAccountId: string;
  customer_id: string;
  createdAt?: string;
}

interface CustomerData {
  customer_id: string;
  phone_number: string;
  legal_name: string;
  email: string;
  country: string;
}

const BankAccountManagement = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<BankAccount | null>(null);
  
  const customerData = location.state?.customerData as CustomerData;

  useEffect(() => {
    if (customerId) {
      fetchBankAccounts();
    }
  }, [customerId]);

  const fetchBankAccounts = async () => {
    try {
      setLoading(true);
      console.log('Fetching bank accounts from Firebase for customerId:', customerId);
      
      // Query Firebase for bank accounts where customer_id matches
      const bankAccountsRef = collection(db, "bank_accounts");
      const q = query(bankAccountsRef, where("customer_id", "==", customerId));
      const querySnapshot = await getDocs(q);
      
      const accounts: BankAccount[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        accounts.push({
          id: doc.id,
          bank_code: data.bank_code || '',
          id_doc_number: data.id_doc_number || '',
          account_type: data.account_type || '',
          account_number: data.account_number || '',
          bankAccountId: data.bankAccountId || data.id || '',
          customer_id: data.customer_id || '',
          createdAt: data.createdAt || data.created_at || ''
        });
      });
      
      console.log('Bank accounts from Firebase:', accounts);
      setBankAccounts(accounts);
    } catch (error) {
      console.error('Error fetching bank accounts from Firebase:', error);
      setBankAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    if (customerData?.phone_number) {
      navigate(`/create-bank-account/${customerId}/${customerData.phone_number}`, {
        state: {
          customerId: customerId,
          customerData: customerData,
          fromBankAccountManagement: true
        }
      });
    }
  };

  const handleDelete = async (bankAccount: BankAccount) => {
    setAccountToDelete(bankAccount);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!accountToDelete) return;
    
    setDeletingId(accountToDelete.id);
    try {
      // Delete from backend API
      await axios.delete(`${getBankAccountsUrl(accountToDelete.customer_id)}/${accountToDelete.id}`);
      
      // Remove from local state
      setBankAccounts(prev => prev.filter(acc => acc.id !== accountToDelete.id));
      
      // Show success message
      dispatch(setShowMessage({ 
        message: "Bank account deleted successfully",
        color: "green"
      }));
    } catch (error) {
      console.error('Error deleting bank account:', error);
      dispatch(setShowMessage({ 
        message: "Failed to delete bank account",
        color: "red"
      }));
    } finally {
      setDeletingId(null);
      setShowDeleteConfirm(false);
      setAccountToDelete(null);
    }
  };



  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setAccountToDelete(null);
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'bank_account_ve':
        return "Bank Account";
      case 'pagomovil':
        return "PagoMóvil";
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-white w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full text-white scrollbar-hidden">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-white"
            aria-label="Back"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
                     <div className="flex items-center gap-2">
             <Wallet className="w-6 h-6 text-green-600" />
             <h1 className="text-2xl font-semibold">
                 Bank Accounts
             </h1>
           </div>
        </div>





        {/* Bank Accounts List */}
        {bankAccounts.length === 0 ? (
          <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6 text-center">
            <Wallet className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              No Bank Accounts
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              You haven't added any bank accounts yet.
            </p>
            <Button
              onClick={handleCreateNew}
              className="bg-green-600 hover:bg-green-700 text-white text-sm py-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Bank Account
            </Button>
          </div>
                ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-200">
                Your Bank Accounts ({bankAccounts.length})
              </h2>
              <Button
                onClick={handleCreateNew}
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add New Bank Account
              </Button>
            </div>
            
                         {bankAccounts.map((account) => (
                <div key={account.id} className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">Bank Code:</span>
                          <span className="text-white font-medium text-sm">{account.bank_code}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">Account Type:</span>
                          <span className="text-white font-medium text-sm">{getAccountTypeLabel(account.account_type)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">ID Document:</span>
                          <span className="text-white font-medium text-sm">{account.id_doc_number}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">Account Number:</span>
                          <span className="text-white font-medium text-sm">{account.account_number}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">Customer ID:</span>
                          <span className="text-white font-mono text-xs bg-gray-700 px-2 py-1 rounded">
                            {account.customer_id}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">Bank Account ID:</span>
                          <span className="text-white font-mono text-xs bg-gray-700 px-2 py-1 rounded">
                            {account.bankAccountId}
                          </span>
                        </div>
                      </div>
                      
                      {account.bankAccountId && (
                        <div className="p-2 bg-gray-700/30 rounded border border-gray-600">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">Bank Account ID:</span>
                              <span className="text-white font-mono text-xs bg-gray-600 px-2 py-1 rounded">
                                {account.bankAccountId}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCopy(account.bankAccountId!, account.id)}
                              className="text-gray-400 hover:text-white h-6 w-6"
                            >
                              {copiedId === account.id ? (
                                <Check className="w-3 h-3 text-green-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                                             )}
                     </div>
                     
                    
                   </div>
                   <div className="pt-4 border-t border-gray-700">
                       <Button
                         onClick={() => handleDelete(account)}
                         className="w-full bg-red-600 hover:bg-red-700 text-white"
                         disabled={deletingId === account.id}
                       >
                         <Trash2 className="w-4 h-4 mr-2" />
                         {deletingId === account.id ? (
                           <>
                             <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                             Deleting...
                           </>
                         ) : (
                           'Delete Account'
                         )}
                       </Button>
                     </div>
                 </div>
               ))}
          </div>
                 )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && accountToDelete && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gray-dark p-6 rounded-lg max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Delete Bank Account</h3>
                <button
                  onClick={cancelDelete}
                  className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="Cancel"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete this bank account? This action cannot be undone and will permanently remove the account from your profile.
              </p>
              
              <div className="mb-6 p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                <div className="text-sm text-gray-300 mb-2">Account Details:</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Bank Code:</span>
                    <span className="text-white font-medium">{accountToDelete.bank_code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Account Type:</span>
                    <span className="text-white font-medium">{getAccountTypeLabel(accountToDelete.account_type)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Account Number:</span>
                    <span className="text-white font-medium">{accountToDelete.account_number}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={cancelDelete}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  disabled={deletingId === accountToDelete.id}
                >
                  {deletingId === accountToDelete.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Account'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
       </div>
     </div>
   );
 };

export default BankAccountManagement;
