import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/stonfi/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { Settings, Wallet, Edit2, Check, X, Loader2, Copy } from "lucide-react";
import { Button } from "@/components/stonfi/ui/button";
import {  collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/libs/firebase';
import { telegramId } from "@/libs/telegram";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { setShowMessage } from "@/store/slice/messageSlice";
import { updateCustomer } from "@/config/api";
import CreateBankAccount from "@/components/wallet/FiatWalletTab/CreateAccount/CreateBankAccount";
import axios from "axios";
import { getBankAccountUrl } from "@/config/api";

const AccountSettings: React.FC = () => {
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

  useEffect(() => {
    checkCustomerAccount();
  }, []);

  const checkCustomerAccount = async () => {
    try {
      if (!telegramId) {
        console.log('No telegram ID available for customer check');
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
      }
    } catch (error) {
      console.error('Error checking customer account:', error);
      setHasBankAccount(false);
      setIsLoadingBankAccount(false);
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
        const bankAccountData = bankAccountSnapshot.docs[0].data();
        setBankAccountData(bankAccountData);
        setHasBankAccount(true);
      } else {
        console.log('No bank account found for Venezuelan customer');
        setHasBankAccount(false);
        setBankAccountData(null);
      }
    } catch (error) {
      console.error('Error fetching bank account:', error);
      setHasBankAccount(false);
      setBankAccountData(null);
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
          message: 'Unable to update customer information. Please try again.',
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
            message: 'Customer information updated successfully',
            color: 'green'
          }));
        }
      }
    } catch (error) {
      console.error('Error updating customer data:', error);
      dispatch(setShowMessage({
        message: 'Failed to update customer information. Please try again.',
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
    
    setIsDeleting(true);
    try {
      await axios.delete(getBankAccountUrl(customerData.kontigoCustomerId, bankAccountData.id));
      setBankAccountData(null);
      setShowDeleteConfirm(false);
      setHasBankAccount(false);
      dispatch(setShowMessage({
        message: "Bank account deleted successfully!",
        color: "green"
      }));
    } catch (error) {
      console.error('Error deleting bank account:', error);
      dispatch(setShowMessage({
        message: "Failed to delete bank account. Please try again.",
        color: "red"
      }));
    } finally {
      setIsDeleting(false);
    }
  };

  if (!customerData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-white w-6 h-6" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full text-white scrollbar-hidden">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="w-6 h-6 text-gray-400" />
          <h1 className="text-2xl font-semibold">Account Settings</h1>
        </div>

        <Tabs defaultValue="customer" className="w-full">
          <TabsList className="w-full flex gap-3 border-b border-gray-800">
            <TabsTrigger
              value="customer"
              className="text-gray-400 data-[state=active]:text-blue data-[state=active]:border-b-2 data-[state=active]:border-blue"
            >
              Customer Account
            </TabsTrigger>
            {customerData?.country === 'VENEZUELA' && (
              <TabsTrigger
                value="bank"
                className="text-gray-400 data-[state=active]:text-blue data-[state=active]:border-b-2 data-[state=active]:border-blue"
              >
                Bank Account
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
                      <h3 className="text-lg font-medium">Customer Information</h3>
                    </div>
                    {!isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleEdit}
                        className="text-blue hover:text-blue/90"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                  {customerData && (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-400">Legal Name</p>
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
                        <p className="text-sm text-gray-400">Email</p>
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
                        <p className="text-sm text-gray-400">Phone Number</p>
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
                        <p className="text-sm text-gray-400">Type</p>
                        {isEditing ? (
                          <select
                            value={editedData.type}
                            onChange={(e) => setEditedData({ ...editedData, type: e.target.value })}
                            className="w-full bg-gray-800/50 rounded-lg p-2 text-white mt-1"
                          >
                            <option value="individual">Individual</option>
                            <option value="business">Business</option>
                          </select>
                        ) : (
                          <p className="text-white capitalize">{customerData.type}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Country</p>
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
                            Cancel
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
                                Saving...
                              </>
                            ) : (
                              <>
                                <Check className="w-4 h-4 mr-2" />
                                Save
                              </>
                            )}
                          </Button>
                        </div>
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
                      <h3 className="text-lg font-medium">Bank Account Information</h3>
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
                              <p className="text-sm text-gray-400">Bank Account ID</p>
                              <p className="text-lg font-medium">{bankAccountData?.kontigoBankAccountId}</p>
                            </div>
                            <button
                              onClick={handleCopy}
                              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                              {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-400">Bank Code</p>
                              <p className="font-medium">{bankAccountData?.bank_code}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">Account Number</p>
                              <p className="font-medium">{bankAccountData?.account_number}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">Account Type</p>
                              <p className="font-medium">{bankAccountData?.account_type}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">Beneficiary Name</p>
                              <p className="font-medium">{bankAccountData?.beneficiary_name}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">ID Document</p>
                              <p className="font-medium">{bankAccountData?.id_doc_number}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">Phone Number</p>
                              <p className="font-medium">{bankAccountData?.phone_number}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">Created At</p>
                              <p className="font-medium">{new Date(bankAccountData?.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <Button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-full bg-red-600 hover:bg-red-700 text-white mt-4"
                            disabled={isDeleting}
                          >
                            {isDeleting ? "Deleting..." : "Delete Bank Account"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-400 mb-4">No bank account found. Please create one to continue.</p>
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
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSettings;