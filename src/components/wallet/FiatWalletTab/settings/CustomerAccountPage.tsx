import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/stonfi/ui/card";
import { Settings, Edit2, Check, X, Loader2, ArrowLeft, User, Trash2 } from "lucide-react";
import { Button } from "@/components/stonfi/ui/button";
import { collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/libs/firebase';
import { telegramId } from "@/libs/telegram";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { setShowMessage } from "@/store/slice/messageSlice";
import { updateCustomer } from "@/config/api";
import CreateAccount from "@/components/wallet/FiatWalletTab/CreateAccount/CreateAccount";
import { useTranslation } from "react-i18next";
import { deleteCustomer } from "@/lib/customerService";

const CustomerAccountPage: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const [customerData, setCustomerData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(true);
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
      } else {
        console.log('No customer found, will show create customer form');
        setCustomerData(null);
      }
    } catch (error) {
      console.error('Error checking customer account:', error);
    } finally {
      setIsLoadingCustomer(false);
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
              <User className="w-6 h-6 text-gray-400" />
              <h1 className="text-2xl font-semibold">{t('accountSettings.customerAccountTitle', 'Customer Account')}</h1>
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
            <User className="w-6 h-6 text-gray-400" />
            <h1 className="text-2xl font-semibold">{t('accountSettings.customerAccountTitle', 'Customer Account')}</h1>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
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
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">{t('accountSettings.formFields.legalName')}</p>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedData.legal_name}
                          onChange={(e) => setEditedData({ ...editedData, legal_name: e.target.value })}
                          className="w-full bg-gray-800/50 rounded-lg p-3 text-white border border-gray-700 focus:border-blue-light focus:outline-none"
                        />
                      ) : (
                        <p className="text-white text-lg">{customerData.legal_name}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-sm text-gray-400 mb-1">{t('accountSettings.formFields.email')}</p>
                      {isEditing ? (
                        <input
                          type="email"
                          value={editedData.email}
                          onChange={(e) => setEditedData({ ...editedData, email: e.target.value })}
                          className="w-full bg-gray-800/50 rounded-lg p-3 text-white border border-gray-700 focus:border-blue-light focus:outline-none"
                        />
                      ) : (
                        <p className="text-white text-lg">{customerData.email}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-sm text-gray-400 mb-1">{t('accountSettings.formFields.phoneNumber')}</p>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={editedData.phone_number}
                          onChange={(e) => setEditedData({ ...editedData, phone_number: e.target.value })}
                          className="w-full bg-gray-800/50 rounded-lg p-3 text-white border border-gray-700 focus:border-blue-light focus:outline-none"
                        />
                      ) : (
                        <p className="text-white text-lg">{customerData.phone_number}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-sm text-gray-400 mb-1">{t('accountSettings.formFields.type')}</p>
                      {isEditing ? (
                        <select
                          value={editedData.type}
                          onChange={(e) => setEditedData({ ...editedData, type: e.target.value })}
                          className="w-full bg-gray-800/50 rounded-lg p-3 text-white border border-gray-700 focus:border-blue-light focus:outline-none"
                        >
                          <option value="individual">{t('accountSettings.accountTypes.individual')}</option>
                          <option value="business">{t('accountSettings.accountTypes.business')}</option>
                        </select>
                      ) : (
                        <p className="text-white text-lg capitalize">{customerData.type}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-sm text-gray-400 mb-1">{t('accountSettings.formFields.country')}</p>
                      <p className="text-white text-lg">{customerData.country}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-400 mb-1">Customer ID</p>
                      <p className="text-white text-lg font-mono">{customerData.kontigoCustomerId}</p>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
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
                    <div className="pt-4 border-t border-gray-700">
                      <Button
                        onClick={() => setShowDeleteCustomerConfirm(true)}
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                        disabled={isDeletingCustomer}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {isDeletingCustomer ? t('accountSettings.deletingCustomer') : t('accountSettings.deleteCustomerButton')}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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

export default CustomerAccountPage; 