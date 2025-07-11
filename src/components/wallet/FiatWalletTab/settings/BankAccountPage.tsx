import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/stonfi/ui/card";
import { Wallet, Check, X, Loader2, ArrowLeft, Plus, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/stonfi/ui/button";
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/libs/firebase';
import { telegramId } from "@/libs/telegram";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { setShowMessage } from "@/store/slice/messageSlice";
import { useTranslation } from "react-i18next";
import { deleteBankAccount, fetchAllBankAccounts, type BankAccountData } from "@/lib/bankAccountService";

const BankAccountPage: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const [customerData, setCustomerData] = useState<any>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccountData[]>([]);
  const [isLoadingBankAccount, setIsLoadingBankAccount] = useState(false);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkCustomerAccount();
  }, []);

  // Refresh bank accounts when component mounts or returns from create page
  useEffect(() => {
    if (customerData?.country === 'VENEZUELA' && customerData?.kontigoCustomerId) {
      fetchBankAccounts(customerData.kontigoCustomerId);
    }
  }, [customerData]);

  const checkCustomerAccount = async () => {
    try {
      if (!telegramId) {
        console.log('No telegram ID available for customer check');
        setIsLoadingCustomer(false);
        return;
      }

      console.log('Checking customer account for telegramId:', telegramId);
      
      const customersRef = collection(db, 'customers');
      const customerQuery = query(
        customersRef,
        where('telegram_id', '==', String(telegramId))
      );
      
      const customerSnapshot = await getDocs(customerQuery);
      
      if (!customerSnapshot.empty) {
        const customerData = customerSnapshot.docs[0].data();
        console.log('Customer found in customers collection:', customerData);
        setCustomerData(customerData);
      } else {
        console.log('No customer found');
        setCustomerData(null);
      }
    } catch (error) {
      console.error('Error checking customer account:', error);
    } finally {
      setIsLoadingCustomer(false);
    }
  };

  const fetchBankAccounts = async (customerId: string) => {
    try {
      setIsLoadingBankAccount(true);
      const bankAccountsData = await fetchAllBankAccounts(customerId);
      console.log('Bank accounts fetched:', bankAccountsData);
      setBankAccounts(bankAccountsData || []);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      setBankAccounts([]);
    } finally {
      setIsLoadingBankAccount(false);
    }
  };

  const handleCopy = async (bankAccountId: string) => {
    const bankAccount = bankAccounts.find(acc => acc.id === bankAccountId);
    if (bankAccount?.kontigoBankAccountId) {
      await navigator.clipboard.writeText(bankAccount.kontigoBankAccountId);
      setCopied(bankAccountId);
      setTimeout(() => setCopied(null), 2000);
      dispatch(setShowMessage({
        message: t('accountSettings.messages.copiedSuccess'),
        color: "green"
      }));
    }
  };

  const handleDelete = async (bankAccountId: string) => {
    const bankAccount = bankAccounts.find(acc => acc.id === bankAccountId);
    if (!bankAccount) return;
    
    await deleteBankAccount({
      customerId: customerData.kontigoCustomerId,
      bankAccountData: bankAccount,
      setLoading: setIsDeleting,
      dispatch,
      t,
      onSuccess: () => {
        setBankAccounts(prev => prev.filter(acc => acc.id !== bankAccountId));
        setShowDeleteConfirm(null);
        dispatch(setShowMessage({
          message: t('accountSettings.messages.deleteSuccess'),
          color: "green"
        }));
      },
      onError: (error) => {
        dispatch(setShowMessage({
          message: t('accountSettings.messages.deleteFailed'),
          color: "red"
        }));
      }
    });
  };

  const handleAddBankAccount = () => {
    if (customerData?.kontigoCustomerId) {
      navigate(`/create-bank-account/${customerData.kontigoCustomerId}/${customerData.phone_number}`);
    }
  };

  const handleNavigateToCustomerAccount = () => {
    navigate('/customer-account');
  };

  if (isLoadingCustomer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-white w-6 h-6" />
      </div>
    );
  }

  if (!customerData) {
    return (
      <div className="min-h-screen w-full text-white scrollbar-hidden">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-gray-400 hover:text-white"
              aria-label={t('accountSettings.backButton')}
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div className="flex items-center gap-2">
              <Wallet className="w-6 h-6 text-gray-400" />
              <h1 className="text-2xl font-semibold">{t('accountSettings.bankAccountTitle', 'Bank Accounts')}</h1>
            </div>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold mb-2">{t('accountSettings.noCustomerTitle', 'No Customer Account')}</h2>
                <p className="text-gray-400 mb-4">
                  {t('accountSettings.noCustomerMessage', 'You need to create a customer account first before managing bank accounts.')}
                </p>
                <Button
                  onClick={handleNavigateToCustomerAccount}
                  className="bg-blue-light hover:bg-blue-light text-white"
                >
                  Create Customer Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (customerData?.country !== 'VENEZUELA') {
    return (
      <div className="min-h-screen w-full text-white scrollbar-hidden">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-gray-400 hover:text-white"
              aria-label={t('accountSettings.backButton')}
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div className="flex items-center gap-2">
              <Wallet className="w-6 h-6 text-gray-400" />
              <h1 className="text-2xl font-semibold">{t('accountSettings.bankAccountTitle', 'Bank Accounts')}</h1>
            </div>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold mb-2">{t('accountSettings.venezuelaOnlyTitle', 'Venezuela Only')}</h2>
                <p className="text-gray-400">
                  {t('accountSettings.venezuelaOnlyMessage', 'Bank account management is currently only available for customers from Venezuela.')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full text-white scrollbar-hidden">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-white"
            aria-label={t('accountSettings.backButton')}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-2">
            <Wallet className="w-6 h-6 text-gray-400" />
            <h1 className="text-2xl font-semibold">{t('accountSettings.bankAccountTitle', 'Bank Accounts')}</h1>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-gray-400" />
                    <h3 className="text-lg font-medium">{t('accountSettings.bankAccountInformationTitle')}</h3>
                </div>
              </div>
                {bankAccounts.length > 0 && (
                  <Button
                    onClick={handleAddBankAccount}
                    className="bg-blue-light hover:bg-blue-light text-white"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t('accountSettings.addBankAccountButton', 'Add Bank Account')}
                  </Button>
                )}
              
              {isLoadingBankAccount ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : bankAccounts.length > 0 ? (
                <div className="space-y-4">
                  {bankAccounts.map((bankAccount) => (
                    <div key={bankAccount.id} className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex-1">
                          <p className="text-sm text-gray-400 mb-1">{t('accountSettings.formFields.bankAccountId')}</p>
                          <p className="text-lg font-mono text-blue-light">{bankAccount.kontigoBankAccountId}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCopy(bankAccount.id)}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            aria-label={t('accountSettings.copyButton')}
                          >
                            {copied === bankAccount.id ? 
                              <Check className="h-5 w-5 text-green-500" /> : 
                              <Copy className="h-5 w-5" />
                            }
                          </button>
                          <Button
                            onClick={() => setShowDeleteConfirm(bankAccount.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-600/20"
                            aria-label={t('accountSettings.deleteButton')}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {t('accountSettings.deleteButton')}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">{t('accountSettings.formFields.bankCode')}</p>
                          <p className="font-medium text-white">{bankAccount.bank_code}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400 mb-1">{t('accountSettings.formFields.accountNumber')}</p>
                          <p className="font-medium text-white">{bankAccount.account_number}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400 mb-1">{t('accountSettings.formFields.accountType')}</p>
                          <p className="font-medium text-white">{bankAccount.account_type}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400 mb-1">{t('accountSettings.formFields.beneficiaryName')}</p>
                          <p className="font-medium text-white">{bankAccount.beneficiary_name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400 mb-1">{t('accountSettings.formFields.idDocument')}</p>
                          <p className="font-medium text-white">{bankAccount.id_doc_number}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400 mb-1">{t('accountSettings.formFields.phoneNumber')}</p>
                          <p className="font-medium text-white">{bankAccount.phone_number}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400 mb-1">{t('accountSettings.formFields.createdAt')}</p>
                          <p className="font-medium text-white">
                            {bankAccount.createdAt ? new Date(bankAccount.createdAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">{t('accountSettings.noBankAccountTitle', 'No Bank Accounts')}</h3>
                  <p className="text-gray-400 mb-6">{t('accountSettings.noBankAccountMessage')}</p>
                  <Button
                    onClick={handleAddBankAccount}
                    className="bg-blue-light hover:bg-blue-light text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t('accountSettings.addBankAccountButton', 'Add Bank Account')}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-dark p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{t('accountSettings.deleteConfirmTitle')}</h3>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
                aria-label={t('accountSettings.cancelButton')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-gray-300 mb-6">
              {t('accountSettings.deleteConfirmMessage')}
            </p>
            <div className="flex gap-4">
              <Button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white"
              >
                {t('accountSettings.cancelButton')}
              </Button>
              <Button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={isDeleting}
              >
                {isDeleting ? t('accountSettings.deleting') : t('accountSettings.deleteButton')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankAccountPage; 