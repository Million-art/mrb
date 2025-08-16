import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/stonfi/ui/card";
import { Settings, Wallet, User, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/stonfi/ui/button";
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/libs/firebase';
import { telegramId } from "@/libs/telegram";
import { useTranslation } from "react-i18next";

const AccountSettings: React.FC = () => {
  const { t } = useTranslation();
  const [customerData, setCustomerData] = useState<any>(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(true);
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
        where('external_id', '==', String(telegramId))
      );
      
      const customerSnapshot = await getDocs(customerQuery);
      
      if (!customerSnapshot.empty) {
        const customerData = customerSnapshot.docs[0].data();
     
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

  if (isLoadingCustomer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-white w-6 h-6" />
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
            <h1 className="text-2xl font-semibold">{t('accountSettings.title', 'Account Settings')}</h1>
          </div>
         <Button
           variant="ghost"
           size="icon"
           onClick={checkCustomerAccount}
           className="text-gray-400 hover:text-white ml-auto"
           aria-label="Refresh customer data"
         >
           <Loader2 className="w-5 h-5" />
         </Button>
        </div>

        <div className="space-y-4">
          {/* Customer Account Card */}
          <Card className="cursor-pointer hover:bg-gray-800/50 transition-colors duration-200">
            <CardContent className="p-6">
              <div 
                className="flex items-center justify-between"
                onClick={() => navigate('/customer-account')}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-light/20 rounded-lg">
                    <User className="w-6 h-6 text-blue-light" />
                    </div>
                  <div>
                    <h3 className="text-lg font-medium">{t('accountSettings.customerAccountTitle', 'Customer Account')}</h3>
                    <p className="text-gray-400 text-sm">
                      {customerData 
                        ? t('accountSettings.customerAccountDescription', 'Manage your customer information and account details')
                        : t('accountSettings.createCustomerDescription', 'Create your customer account to start using remittance services')
                      }
                    </p>
                  </div>
                      </div>
                <div className="text-blue-light">
                  <ArrowRight className="w-4 h-4" />
                      </div>
                      </div>
            </CardContent>
          </Card>

                     {/* Bank Account Card - Show if customer exists */}
                       {customerData && (
              <Card className={`cursor-pointer transition-colors duration-200 ${
                (customerData.customer_id || customerData.id) 
                  ? 'hover:bg-gray-800/50' 
                  : 'opacity-50 cursor-not-allowed'
              }`}>
              <CardContent className="p-6">
                                                   <div 
                   className="flex items-center justify-between"
                   onClick={() => {
                     // Use customer_id field which matches Firebase data structure
                     const customerId = customerData.customer_id || customerData.id;
                     
                     if (!customerId) {
                       console.error('No customer ID found in customer data:', customerData);
                       console.error('Available fields:', Object.keys(customerData));
                       // Show user-friendly error message
                       alert('Customer ID not found. Please try refreshing the page or contact support.');
                       return;
                     }
                     
                     if (!customerData.phone_number) {
                       console.error('Phone number missing from customer data:', customerData);
                       alert('Phone number not found. Please update your customer profile.');
                       return;
                     }
                     
                     console.log('Using customer ID for navigation:', customerId);
                     console.log('Using phone number for navigation:', customerData.phone_number);
                     
                     // Navigate to bank account management page instead of create page
                     navigate(`/bank-accounts/${customerId}`, { 
                       state: { 
                         customerId: customerId,
                         customerData: customerData,
                         fromSettings: true
                       }
                     });
                   }}
                 >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-600/20 rounded-lg">
                      <Wallet className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                      <h3 className="text-lg font-medium">{t('accountSettings.bankAccountTitle', 'Bank Accounts')}</h3>
                      <p className="text-gray-400 text-sm">
                        {customerData.country === 'Venezuela' 
                          ? t('accountSettings.bankAccountDescriptionVenezuela', 'Link and manage your Venezuelan bank accounts (Required)')
                          : t('accountSettings.bankAccountDescription', 'Link and manage your bank accounts for remittance transfers')
                        }
                      </p>
                                             {customerData.country === 'Venezuela' && (
                         <div className="mt-2 p-2 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
                           <p className="text-xs text-yellow-400">
                             ⚠️ Venezuela customers must link a bank account
                           </p>
                         </div>
                       )}
                       
                                               {/* Warning if customer ID is missing */}
                        {!(customerData.customer_id || customerData.id) && (
                          <div className="mt-2 p-2 bg-red-900/20 border border-red-600/30 rounded-lg">
                            <p className="text-xs text-red-400">
                              ⚠️ Customer ID missing - cannot create bank account
                            </p>
                          </div>
                        )}
                    </div>
                  </div>
                   <div className="text-green-600">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}



          </div>
        </div>
    </div>
  );
};

export default AccountSettings;