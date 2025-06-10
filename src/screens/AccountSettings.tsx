import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/stonfi/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { Settings, Edit2, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/stonfi/ui/button";
import { collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/libs/firebase';
import { telegramId } from "@/libs/telegram";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { setShowMessage } from "@/store/slice/messageSlice";
import { updateCustomer } from "@/config/api";

const AccountSettings: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [customerData, setCustomerData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

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
      }
    } catch (error) {
      console.error('Error checking customer account:', error);
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

  if (!customerData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-white w-6 h-6" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full text-white p-4">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
      
      <Tabs defaultValue="customer" className="w-full">
        <TabsList className="w-full flex gap-3 border-b border-gray-800">
          <TabsTrigger
            value="customer"
            className="text-gray-400 data-[state=active]:text-blue data-[state=active]:border-b-2 data-[state=active]:border-blue"
          >
            Customer Account
          </TabsTrigger>
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
      </Tabs>
    </div>
  );
};

export default AccountSettings; 