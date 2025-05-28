import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/libs/firebase";
import { telegramId } from "@/libs/telegram";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, UserPlus, ChevronDown } from "lucide-react";
import CreateBankAccount from "./CreateBankAccount";
import { Button } from "@/components/stonfi/ui/button";
import { Input } from "@/components/stonfi/ui/input";
import { Label } from "@/components/stonfi/ui/label";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import './phone-input-dark.css';
import { countries } from "./countries";
import { useDispatch } from "react-redux";
import { setShowMessage } from "@/store/slice/messageSlice";
import { getCustomerUrl } from "@/config/api";
import axios from "axios";

interface CustomerData {
  id: string;
  legal_name: string;
  email: string;
  phone_number: string;
  type: string;
  kontigoCustomerId: string;
  country: string;
}

interface FormData {
  legal_name: string;
  email: string;
  phone_number: string;
  type: "individual" | "business";
  country: string;
}

const DOCUMENT_TYPES = [
  { value: "passport", label: "Passport" },
  { value: "national_id", label: "National ID" },
  { value: "drivers_license", label: "Driver's License" },
  { value: "residence_permit", label: "Residence Permit" }
];

interface CreateAccountProps {
  onComplete?: () => void;
}

const CreateAccount = ({ onComplete }: CreateAccountProps) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCountryOpen, setIsCountryOpen] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    legal_name: "",
    email: "",
    phone_number: "",
    type: "individual",
    country: ""
  });

  useEffect(() => {
    const checkExistingCustomer = async () => {
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
            ...customerDoc.data() as Omit<CustomerData, 'id'>
          });
          setIsExistingCustomer(true);
        }
      } catch (err) {
        console.error("Error checking existing customer:", err);
      } finally {
        setLoading(false);
      }
    };

    checkExistingCustomer();
  }, []);

  const handleSubmit = async () => {
    if (!formData.legal_name || !formData.email || !formData.phone_number || !formData.type || !formData.country) {
      dispatch(setShowMessage({
        message: "All fields are required",
        color: "red"
      }));
      return;
    }

    setIsSubmitting(true);

    try {
      await axios.post(getCustomerUrl(), {
        ...formData,
        telegram_id: String(telegramId)
      });

      // Show success message
      dispatch(setShowMessage({
        message: "Customer account created successfully!",
        color: "green"
      }));

      // Call onComplete if provided
      if (onComplete) {
        onComplete();
      } else {
        // Navigate to bank account creation if no onComplete provided
        navigate("/create-bank-account");
      }

    } catch (err: any) {
      console.error('Error:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.details?.message || 'Failed to create customer account';
      dispatch(setShowMessage({
        message: errorMessage,
        color: "red"
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-white w-full min-h-screen p-4 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isExistingCustomer && customerData) {
    return (
      <div className="text-white w-full min-h-screen">
        <div className="w-full max-w-md mx-auto p-6 rounded-lg space-y-6">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => navigate("/wallet")} className="text-gray-400 hover:text-white">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold">Bank Account</h1>
            <div className="w-6" />
          </div>

          <CreateBankAccount 
            customerId={customerData.kontigoCustomerId}
            customerPhone={customerData.phone_number}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="text-white w-full min-h-screen">
      <div className="w-full max-w-md mx-auto p-6 rounded-lg space-y-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate("/wallet")} className="text-gray-400 hover:text-white">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Create Customer Account</h1>
          <div className="w-6" />
        </div>

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800/50 mb-4">
            <UserPlus className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-400 mb-8">
            To use our fiat wallet services, you need to create a customer account first.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="legal_name">Legal Name *</Label>
            <Input
              placeholder="Enter your full legal name"
              name="legal_name"
              value={formData.legal_name}
              onChange={(e) => setFormData(prev => ({ ...prev, legal_name: e.target.value }))}
              className="bg-black border border-gray-600 text-white text-left [&:not(:placeholder-shown)]:bg-black"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              placeholder="example@email.com"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="bg-black border border-gray-600 text-white text-left [&:not(:placeholder-shown)]:bg-black"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <PhoneInput
              international
              defaultCountry="VE"
              value={formData.phone_number}
              onChange={(value) => setFormData(prev => ({ ...prev, phone_number: value || "" }))}
              className="bg-black border border-gray-600 rounded-md h-10 text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Account Type *</Label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as "individual" | "business" }))}
              className="w-full h-10 px-3 py-2 bg-black border border-gray-600 rounded-md text-white text-left [&:not(:placeholder-shown)]:bg-black"
              required
            >
              <option value="individual">Individual</option>
              <option value="business">Business</option>
            </select>
          </div>

          <div className="relative">
            <Label htmlFor="country">Country *</Label>
            <button
              type="button"
              onClick={() => setIsCountryOpen(!isCountryOpen)}
              className="w-full flex items-center justify-between p-2 bg-black border border-gray-600 rounded-md text-left"
            >
              {formData.country ? (
                <div className="flex items-center gap-2">
                  <img 
                    src={countries.find(c => c.name === formData.country)?.flag} 
                    alt={formData.country}
                    className="w-6 h-6 rounded-full"
                  />
                  <span>{formData.country}</span>
                </div>
              ) : (
                <span className="text-gray-400">Select your country</span>
              )}
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {isCountryOpen && (
              <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
                {countries.map((country) => (
                  <button
                    key={country.code}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, country: country.name }));
                      setIsCountryOpen(false);
                    }}
                    className="w-full flex items-center gap-2 p-2 hover:bg-gray-700 text-left"
                  >
                    <img 
                      src={country.flag} 
                      alt={country.name}
                      className="w-6 h-6 rounded-full"
                    />
                    <span>{country.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full bg-blue text-white py-3 rounded-md hover:bg-blue-light transition-colors flex items-center justify-center"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateAccount;
