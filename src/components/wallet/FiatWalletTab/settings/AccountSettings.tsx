import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/stonfi/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { Settings, Wallet, Edit2, Check, X, Loader2, Copy, ArrowLeft } from "lucide-react";
import { Button } from "@/components/stonfi/ui/button";
import {  collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/libs/firebase';
import { telegramId } from "@/libs/telegram";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { setShowMessage } from "@/store/slice/messageSlice";
import { updateCustomer } from "@/config/api";
import CreateBankAccount from "@/components/wallet/FiatWalletTab/CreateAccount/CreateBankAccount";
import CreateAccount from "@/components/wallet/FiatWalletTab/CreateAccount/CreateAccount";
import { useTranslation } from "react-i18next";
import { deleteBankAccount, type BankAccountData } from "@/lib/bankAccountService";
import { deleteCustomer, type CustomerData } from "@/lib/customerService";

const AccountSettings: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const [customerData, setCustomerData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasBankAccount, setHasBankAccount] = useState<boolean | null>(null);
  const [bankAccountData, setBankAccountData] = useState<any>(null);
  const [isLoadingBankAccount, setIsLoadingBankAccount] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(true);
  const [showBankAccountCreation, setShowBankAccountCreation] = useState(false);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);
  const [showDeleteCustomerConfirm, setShowDeleteCustomerConfirm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkCustomerAccount();
  }, []);

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

        if (customerData.country === 'VENEZUELA') {
          console.log('Customer is from Venezuela, checking bank account...');
          await fetchBankAccount(customerData.kontigoCustomerId);
        } else {
          console.log('Customer is not from Venezuela, bank account not required');
          setHasBankAccount(true);
          setIsLoadingBankAccount(false);
        }
      } else {
        console.log('No customer found, will show create customer form');
        setCustomerData(null);
      }
    } catch (error) {
      console.error('Error checking customer account:', error);
      setHasBankAccount(false);
      setIsLoadingBankAccount(false);
    } finally {
      setIsLoadingCustomer(false);
    }
  };

  const fetchBankAccount = async (customerId: string) => {
    try {
      setIsLoadingBankAccount(true);
      const bankAccountsRef = collection(db, 'bank_accounts');
      const bankAccountQuery = query(
        bankAccountsRef,
        where('customer_id', '==', customerId)
      );
      
      const bankAccountSnapshot = await getDocs(bankAccountQuery);
      
      if (!bankAccountSnapshot.empty) {
        console.log('Bank account found for Venezuelan customer');
        const doc = bankAccountSnapshot.docs[0];
        const bankAccountData = {
          id: doc.id,
          ...doc.data()
        };
        console.log('Bank account data retrieved:', bankAccountData);
        
        // Validate that we have the required fields
        if (!(bankAccountData as BankAccountData).kontigoBankAccountId) {
          console.error('Bank account data is missing kontigoBankAccountId:', bankAccountData);
        }
        
        setBankAccountData(bankAccountData);
        setHasBankAccount(true);
        setShowBankAccountCreation(false);
      } else {
        console.log('No bank account found for Venezuelan customer');
        setHasBankAccount(false);
        setBankAccountData(null);
        setShowBankAccountCreation(true);
      }
    } catch (error) {
      console.error('Error fetching bank account:', error);
      setHasBankAccount(false);
      setBankAccountData(null);
      setShowBankAccountCreation(true);
    } finally {
      setIsLoadingBankAccount(false);
    }
  };

  const handleEdit = () => {
    setEditedData({ ...customerData });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      if (!telegramId || !customerData?.kontigoCustomerId) {
        dispatch(setShowMessage({
          message: t('accountSettings.messages.unableToUpdate'),
          color: 'red'
        }));
        return;
      }

      setIsSaving(true);

      // First update in Kontigo API with only the required fields
      const kontigoResponse = await updateCustomer(customerData.kontigoCustomerId, {
        legal_name: editedData.legal_name,
        email: editedData.email,
        phone_number: editedData.phone_number,
        type: editedData.type
      });

      // Only proceed with Firebase update if Kontigo update was successful
      if (kontigoResponse) {
        // Update in Firestore with the same fields
        const customersRef = collection(db, 'customers');
        const customerQuery = query(
          customersRef,
          where('telegram_id', '==', String(telegramId))
        );
        
        const customerSnapshot = await getDocs(customerQuery);
        
        if (!customerSnapshot.empty) {
          const customerDoc = customerSnapshot.docs[0];
          await updateDoc(customerDoc.ref, {
            legal_name: editedData.legal_name,
            email: editedData.email,
            phone_number: editedData.phone_number,
            type: editedData.type,
            updatedAt: new Date().toISOString()
          });

          setCustomerData(editedData);
          setIsEditing(false);
          dispatch(setShowMessage({
            message: t('accountSettings.messages.updateSuccess'),
            color: 'green'
          }));
        }
      }
    } catch (error) {
      console.error('Error updating customer data:', error);
      dispatch(setShowMessage({
        message: t('accountSettings.messages.updateFailed'),
        color: 'red'
      }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData(null);
  };

  const handleCopy = async () => {
    if (bankAccountData?.kontigoBankAccountId) {
      await navigator.clipboard.writeText(bankAccountData.kontigoBankAccountId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDelete = async () => {
    if (!bankAccountData) return;
    
    await deleteBankAccount({
      customerId: customerData.kontigoCustomerId,
      bankAccountData: bankAccountData as BankAccountData,
      setLoading: setIsDeleting,
      dispatch,
      t,
      onSuccess: () => {
        setBankAccountData(null);
        setShowDeleteConfirm(false);
        setHasBankAccount(false);
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

  const handleDeleteCustomer = async () => {
    if (!customerData?.kontigoCustomerId) return;
    await deleteCustomer({
      customerId: customerData.kontigoCustomerId,
      setLoading: setIsDeletingCustomer,
      dispatch,
      t,
      onSuccess: () => {
        setShowDeleteCustomerConfirm(false);
        dispatch(setShowMessage({
          message: t('accountSettings.messages.deleteCustomerSuccess') || 'Customer deleted successfully',
          color: 'green',
        }));
        // Navigate back after successful deletion
        navigate(-1);
      },
      onError: (error) => {
        setShowDeleteCustomerConfirm(false);
        dispatch(setShowMessage({
          message: t('accountSettings.messages.deleteCustomerFailed') || 'Failed to delete customer',
          color: 'red',
        }));
      },
    });
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
              <Settings className="w-6 h-6 text-gray-400" />
              <h1 className="text-2xl font-semibold">{t('accountSettings.title')}</h1>
            </div>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold mb-2">{t('accountSettings.createCustomerTitle')}</h2>
                <p className="text-gray-400">
                  {t('accountSettings.createCustomerMessage')}
                </p>
              </div>
              
              <CreateAccount 
                onComplete={(newCustomerData) => {
                  setCustomerData(newCustomerData);
                  checkCustomerAccount();
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show bank account creation for Venezuelan customers without bank account
  if (customerData?.country === 'VENEZUELA' && showBankAccountCreation && !isLoadingBankAccount) {
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
              <h1 className="text-2xl font-semibold">{t('accountSettings.createBankAccountTitle')}</h1>
            </div>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold mb-2">{t('accountSettings.bankAccountRequiredTitle')}</h2>
                <p className="text-gray-400">
                  {t('accountSettings.bankAccountRequiredMessage')}
                </p>
              </div>
              
              <CreateBankAccount 
                customerId={customerData.kontigoCustomerId}
                showLoader={false}
                customerPhone={customerData.phone_number}
                onComplete={() => {
                  setShowBankAccountCreation(false);
                  checkCustomerAccount();
                }}
              />
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
            <Settings className="w-6 h-6 text-gray-400" />
            <h1 className="text-2xl font-semibold">{t('accountSettings.title')}</h1>
          </div>
        </div>

        <Tabs defaultValue="customer" className="w-full">
          <TabsList className="w-full flex gap-3 border-b border-gray-800">
            <TabsTrigger
              value="customer"
              className="text-gray-400 data-[state=active]:text-blue data-[state=active]:border-b-2 data-[state=active]:border-blue"
            >
              {t('accountSettings.customerAccountTab')}
            </TabsTrigger>
            {customerData?.country === 'VENEZUELA' && (
              <TabsTrigger
                value="bank"
                className="text-gray-400 data-[state=active]:text-blue data-[state=active]:border-b-2 data-[state=active]:border-blue"
              >
                {t('accountSettings.bankAccountTab')}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="customer">
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings className="w-5 h-5 text-gray-400" />
                      <h3 className="text-lg font-medium">{t('accountSettings.customerInformationTitle')}</h3>
                    </div>
                    {!isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleEdit}
                        className="text-blue hover:text-blue/90"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        {t('accountSettings.editButton')}
                      </Button>
                    )}
                  </div>
                  {customerData && (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-400">{t('accountSettings.formFields.legalName')}</p>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedData.legal_name}
                            onChange={(e) => setEditedData({ ...editedData, legal_name: e.target.value })}
                            className="w-full bg-gray-800/50 rounded-lg p-2 text-white mt-1"
                          />
                        ) : (
                          <p className="text-white">{customerData.legal_name}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">{t('accountSettings.formFields.email')}</p>
                        {isEditing ? (
                          <input
                            type="email"
                            value={editedData.email}
                            onChange={(e) => setEditedData({ ...editedData, email: e.target.value })}
                            className="w-full bg-gray-800/50 rounded-lg p-2 text-white mt-1"
                          />
                        ) : (
                          <p className="text-white">{customerData.email}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">{t('accountSettings.formFields.phoneNumber')}</p>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={editedData.phone_number}
                            onChange={(e) => setEditedData({ ...editedData, phone_number: e.target.value })}
                            className="w-full bg-gray-800/50 rounded-lg p-2 text-white mt-1"
                          />
                        ) : (
                          <p className="text-white">{customerData.phone_number}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">{t('accountSettings.formFields.type')}</p>
                        {isEditing ? (
                          <select
                            value={editedData.type}
                            onChange={(e) => setEditedData({ ...editedData, type: e.target.value })}
                            className="w-full bg-gray-800/50 rounded-lg p-2 text-white mt-1"
                          >
                            <option value="individual">{t('accountSettings.accountTypes.individual')}</option>
                            <option value="business">{t('accountSettings.accountTypes.business')}</option>
                          </select>
                        ) : (
                          <p className="text-white capitalize">{customerData.type}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">{t('accountSettings.formFields.country')}</p>
                        <p className="text-white">{customerData.country}</p>
                      </div>
                      {isEditing && (
                        <div className="flex justify-end gap-2 mt-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancel}
                            className="text-gray-400 hover:text-gray-300"
                            disabled={isSaving}
                          >
                            <X className="w-4 h-4 mr-2" />
                            {t('accountSettings.cancelButton')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSave}
                            className="text-blue hover:text-blue/90"
                            disabled={isSaving}
                          >
                            {isSaving ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                {t('accountSettings.saving')}
                              </>
                            ) : (
                              <>
                                <Check className="w-4 h-4 mr-2" />
                                {t('accountSettings.saveButton')}
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                      
                      {!isEditing && (
                        <Button
                          onClick={() => setShowDeleteCustomerConfirm(true)}
                          className="w-full bg-red-600 hover:bg-red-700 text-white mt-4"
                          disabled={isDeletingCustomer}
                        >
                          {isDeletingCustomer ? t('accountSettings.deletingCustomer') : t('accountSettings.deleteCustomerButton')}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {customerData?.country === 'VENEZUELA' && (
            <TabsContent value="bank">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-gray-400" />
                      <h3 className="text-lg font-medium">{t('accountSettings.bankAccountInformationTitle')}</h3>
                    </div>
                    
                    {isLoadingBankAccount ? (
                      <div className="flex justify-center items-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                      </div>
                    ) : hasBankAccount ? (
                      <div className="space-y-4">
                        <div className="bg-gray-800/50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="text-sm text-gray-400">{t('accountSettings.formFields.bankAccountId')}</p>
                              <p className="text-lg font-medium">{bankAccountData?.kontigoBankAccountId}</p>
                            </div>
                            <button
                              onClick={handleCopy}
                              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                              aria-label={t('accountSettings.copyButton')}
                            >
                              {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-400">{t('accountSettings.formFields.bankCode')}</p>
                              <p className="font-medium">{bankAccountData?.bank_code}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">{t('accountSettings.formFields.accountNumber')}</p>
                              <p className="font-medium">{bankAccountData?.account_number}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">{t('accountSettings.formFields.accountType')}</p>
                              <p className="font-medium">{bankAccountData?.account_type}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">{t('accountSettings.formFields.beneficiaryName')}</p>
                              <p className="font-medium">{bankAccountData?.beneficiary_name}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">{t('accountSettings.formFields.idDocument')}</p>
                              <p className="font-medium">{bankAccountData?.id_doc_number}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">{t('accountSettings.formFields.phoneNumber')}</p>
                              <p className="font-medium">{bankAccountData?.phone_number}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">{t('accountSettings.formFields.createdAt')}</p>
                              <p className="font-medium">{new Date(bankAccountData?.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <Button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-full bg-red-600 hover:bg-red-700 text-white mt-4"
                            disabled={isDeleting}
                          >
                            {isDeleting ? t('accountSettings.deleting') : t('accountSettings.deleteBankAccountButton')}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-400 mb-4">{t('accountSettings.noBankAccountMessage')}</p>
                        <CreateBankAccount 
                          customerId={customerData.kontigoCustomerId}
                          showLoader={false}
                          customerPhone={customerData.phone_number}
                          onComplete={() => {
                            checkCustomerAccount();
                          }}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-dark p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{t('accountSettings.deleteConfirmTitle')}</h3>
              <button
                onClick={() => setShowDeleteConfirm(false)}
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
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white"
              >
                {t('accountSettings.cancelButton')}
              </Button>
              <Button
                onClick={handleDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={isDeleting}
              >
                {isDeleting ? t('accountSettings.deleting') : t('accountSettings.deleteButton')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDeleteCustomerConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-dark p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{t('accountSettings.deleteCustomerConfirmTitle') || 'Delete Customer Account'}</h3>
              <button
                onClick={() => setShowDeleteCustomerConfirm(false)}
                className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
                aria-label={t('accountSettings.cancelButton')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-gray-300 mb-6">
              {t('accountSettings.deleteCustomerConfirmMessage') || 'Are you sure you want to delete your customer account? This action cannot be undone and will permanently delete all your data including bank accounts.'}
            </p>
            <div className="flex gap-4">
              <Button
                onClick={() => setShowDeleteCustomerConfirm(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white"
              >
                {t('accountSettings.cancelButton')}
              </Button>
              <Button
                onClick={handleDeleteCustomer}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={isDeletingCustomer}
              >
                {isDeletingCustomer ? t('accountSettings.deletingCustomer') : t('accountSettings.deleteCustomerButton')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSettings