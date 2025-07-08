import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/stonfi/ui/card";
import { Button } from "@/components/stonfi/ui/button";
import { ArrowLeft, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";
import CreateBankAccount from "@/components/wallet/FiatWalletTab/CreateAccount/CreateBankAccount";

const CreateBankAccountPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { customerId, customerPhone } = useParams();

  const handleComplete = () => {
    // Navigate back to account settings after successful creation
    navigate(-1);
  };

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
            <h1 className="text-2xl font-semibold">{t('accountSettings.createBankAccountTitle', 'Create Bank Account')}</h1>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold mb-2">{t('accountSettings.createBankAccountSubtitle', 'Add New Bank Account')}</h2>
              <p className="text-gray-400">
                {t('accountSettings.createBankAccountMessage', 'Enter your bank account details to add a new account.')}
              </p>
            </div>
            
            <CreateBankAccount 
              customerId={customerId || ''}
              showLoader={false}
              customerPhone={customerPhone || ''}
              onComplete={handleComplete}
              forceFormDisplay={true}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateBankAccountPage; 