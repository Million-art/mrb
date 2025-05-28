import { useState, useEffect } from "react";
import { Card } from "@/components/stonfi/ui/card";
import { Button } from "@/components/stonfi/ui/button";
import { Input } from "@/components/stonfi/ui/input";
import { Loader2, Link, Unlink, ExternalLink } from "lucide-react";
import { doc, updateDoc, deleteField } from 'firebase/firestore';
import { db } from '@/libs/firebase';
import { telegramId } from "@/libs/telegram";
import CreateAccount from "./CreateAccount/CreateAccount";
import CreateBankAccount from "./CreateAccount/CreateBankAccount";
import { collection, query, where, getDocs } from "firebase/firestore";

interface OnboardingProps {
  onComplete: () => void;
}

interface StepIndicatorProps {
  step: number;
  currentStep: number;
  label: string;
}

const StepIndicator = ({ step, currentStep, label }: StepIndicatorProps) => (
  <div className={`flex flex-col items-center ${currentStep >= step ? 'text-blue' : 'text-gray-400'}`}>
    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${currentStep >= step ? 'bg-blue' : 'bg-gray-800'}`}>
      {step}
    </div>
    <span className="text-sm">{label}</span>
  </div>
);

interface MessageProps {
  type: 'error' | 'success';
  message: string | null;
}

const Message = ({ type, message }: MessageProps) => {
  if (!message) return null;
  return (
    <p className={`text-sm ${type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
      {message}
    </p>
  );
};

const Onboarding = ({ onComplete }: OnboardingProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [customerData, setCustomerData] = useState<any>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const steps = [
    { number: 1, label: 'Customer Account' },
    { number: 2, label: 'Bank Account' },
    { number: 3, label: 'USDC Wallet' },
    { number: 4, label: 'Complete' }
  ];

  useEffect(() => {
    const checkCustomerAccount = async () => {
      try {
        if (!telegramId) {
          setLoading(false);
          return;
        }

        const q = query(
          collection(db, "customers"),
          where("telegram_id", "==", String(telegramId))
        );

        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const customerDoc = querySnapshot.docs[0];
          setCustomerData({
            id: customerDoc.id,
            ...customerDoc.data()
          });
          setCurrentStep(2);
        }
      } catch (err) {
        console.error("Error checking customer account:", err);
      } finally {
        setLoading(false);
      }
    };

    checkCustomerAccount();
  }, []);

  const handleCustomerAccountComplete = (data: any) => {
    setCustomerData(data);
    setCurrentStep(2);
  };

  const handleBankAccountComplete = () => {
    setCurrentStep(3);
  };

  const handleLinkWallet = async () => {
    if (!newAddress.trim()) {
      setError('Please enter a valid wallet address');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      const userRef = doc(db, 'users', String(telegramId));
      await updateDoc(userRef, {
        usdcexternalWalletAddress: newAddress.trim()
      });
      setWalletAddress(newAddress.trim());
      setSuccess('Wallet connected successfully');
      setNewAddress('');
      setCurrentStep(4);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError('Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlinkWallet = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      const userRef = doc(db, 'users', String(telegramId));
      await updateDoc(userRef, {
        usdcexternalWalletAddress: deleteField()
      });
      setWalletAddress(null);
      setSuccess('Wallet disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      setError('Failed to disconnect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const renderWalletStep = () => (
    <Card className="p-6 max-w-md mx-auto">
      {!walletAddress ? (
        <div className="space-y-4">
          <Input
            type="text"
            placeholder="Enter your USDC wallet address"
            value={newAddress}
            onChange={(e) => {
              setNewAddress(e.target.value);
              setError(null);
            }}
            className="bg-gray-800/50 border-gray-700 text-left"
            dir="ltr"
          />
          <Message type="error" message={error} />
          <Message type="success" message={success} />
          <Button
            onClick={handleLinkWallet}
            disabled={isLoading || !newAddress.trim()}
            className="w-full flex items-center justify-center gap-2 bg-blue hover:bg-blue/90"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Link className="w-4 h-4" />
            )}
            {isLoading ? 'Connecting...' : 'Connect Wallet'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-gray-400" />
              <p className="text-gray-400">Connected USDC Wallet Address</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(walletAddress);
                  setSuccess('Address copied to clipboard');
                }}
                className="text-blue hover:text-blue/90"
              >
                Copy
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUnlinkWallet}
                disabled={isLoading}
                className="text-red-500 hover:text-red-400"
              >
                <Unlink className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <p className="text-sm break-all bg-gray-800/50 p-3 rounded-lg text-left" dir="ltr">
            {walletAddress}
          </p>
          <Message type="error" message={error} />
          <Message type="success" message={success} />
          <Button
            onClick={() => setCurrentStep(4)}
            className="w-full bg-blue hover:bg-blue/90"
          >
            Continue
          </Button>
        </div>
      )}
    </Card>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex-1">
          <div className="h-2 bg-gray-800 rounded-full">
            <div 
              className="h-2 bg-blue rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between mb-4">
        {steps.map((step) => (
          <StepIndicator
            key={step.number}
            step={step.number}
            currentStep={currentStep}
            label={step.label}
          />
        ))}
      </div>

      {currentStep === 1 && (
        <CreateAccount onComplete={handleCustomerAccountComplete} />
      )}

      {currentStep === 2 && customerData && (
        <CreateBankAccount 
          customerData={customerData} 
          onComplete={handleBankAccountComplete}
        />
      )}

      {currentStep === 3 && renderWalletStep()}

      {currentStep === 4 && (
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Setup Complete!</h2>
          <p className="text-gray-400 mb-6">
            Your account has been successfully set up. You can now start using all features.
          </p>
          <Button
            onClick={onComplete}
            className="bg-blue hover:bg-blue/90"
          >
            Get Started
          </Button>
        </div>
      )}
    </div>
  );
};

export default Onboarding; 