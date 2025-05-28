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
            // Only proceed to bank account step if user is from Venezuela
            if (data.country === 'VENEZUELA') {
              setCurrentStep(2);
            } else {
              // For non-Venezuelan users, complete onboarding
              if (onComplete) {
                onComplete();
              } else {
                navigate("/wallet");
              }
            }
          }}
        />
      ),
    },
    {
      title: "Set Up Bank Account",
      description: "Link your bank account to enable transactions",
      component: customerData && customerData.country === 'VENEZUELA' && (
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

  // Filter steps based on user's country
  const visibleSteps = customerData?.country === 'VENEZUELA' ? steps : [steps[0]];

  return (
    <div className="min-h-screen text-white">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-800">
        <div
          className="h-full bg-blue transition-all duration-300"
          style={{ width: `${((currentStep - 1) / (visibleSteps.length - 1)) * 100}%` }}
        />
      </div>

      {/* Header */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Step Indicator */}
        <div className="flex justify-center mb-8">
          {visibleSteps.map((_, index) => (
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
              {index < visibleSteps.length - 1 && (
                <div
                  className={`w-16 h-1 transition-colors ${
                    index + 1 < currentStep ? "bg-blue" : "bg-gray-800"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">{visibleSteps[currentStep - 1].title}</h1>
            <p className="text-gray-400">{visibleSteps[currentStep - 1].description}</p>
          </div>
          <div className="w-6" />
        </div>

        {/* Content */}
        <div className="rounded-lg p-6">
          {visibleSteps[currentStep - 1].component}
        </div>
      </div>
    </div>
  );
};

export default Onboarding; 