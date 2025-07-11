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

          {/* Bank Account Card - Only show if customer exists and is from Venezuela */}
          {customerData && customerData.country === 'VENEZUELA' && (
            <Card className="cursor-pointer hover:bg-gray-800/50 transition-colors duration-200">
              <CardContent className="p-6">
                <div 
                  className="flex items-center justify-between"
                  onClick={() => navigate('/bank-account')}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-600/20 rounded-lg">
                      <Wallet className="w-6 h-6 text-green-light" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">{t('accountSettings.bankAccountTitle', 'Bank Accounts')}</h3>
                      <p className="text-gray-400 text-sm">
                        {t('accountSettings.bankAccountDescription', 'Manage your Venezuelan bank accounts for remittance transfers')}
                      </p>
                    </div>
                  </div>
                  <div className="text-green-light">
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