import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CreateAccount from "./CreateAccount";
import CreateBankAccount from "./CreateBankAccount";
 
interface OnboardingProps {
  onComplete?: () => void;
}

const Onboarding = ({ onComplete }: OnboardingProps) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [customerData, setCustomerData] = useState<any>(null);

  const steps = [
    {
      title: "Create Customer Account",
      description: "Set up your customer profile to start using our services",
      component: (
        <CreateAccount
          onComplete={(data) => {
            setCustomerData(data);
            setCurrentStep(2);
          }}
        />
      ),
    },
    {
      title: "Set Up Bank Account",
      description: "Link your bank account to enable transactions",
      component: customerData && (
        <CreateBankAccount
          customerId={customerData.kontigoCustomerId}
          customerPhone={customerData.phone_number}
          onComplete={() => {
            if (onComplete) {
              onComplete();
            } else {
              navigate("/wallet");
            }
          }}
        />
      ),
    },
  ];
 

  return (
    <div className="min-h-screen text-white">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-800">
        <div
          className="h-full bg-blue transition-all duration-300"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />
      </div>

      {/* Header */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">{steps[currentStep - 1].title}</h1>
            <p className="text-gray-400">{steps[currentStep - 1].description}</p>
          </div>
          <div className="w-6" />
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center mb-8">
          {steps.map((_, index) => (
            <div key={index} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  index + 1 <= currentStep
                    ? "bg-blue text-white"
                    : "bg-gray-800 text-gray-400"
                }`}
              >
                {index + 1}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-16 h-1 transition-colors ${
                    index + 1 < currentStep ? "bg-blue" : "bg-gray-800"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="rounded-lg p-6">
          {steps[currentStep - 1].component}
        </div>
      </div>
    </div>
  );
};

export default Onboarding; 