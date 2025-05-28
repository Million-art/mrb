import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/libs/firebase";
import { telegramId } from "@/libs/telegram";
import { Loader2, UserPlus, ChevronDown } from "lucide-react";
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

interface CreateAccountProps {
  onComplete?: (data: CustomerData) => void;
}

const CreateAccount = ({ onComplete }: CreateAccountProps) => {
  const dispatch = useDispatch();
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

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

  useEffect(() => {
    if (formData.phone_number && formData.country) {
      const isValid = validatePhoneNumber(formData.phone_number, formData.country);
      setPhoneError(isValid ? null : getPhoneNumberError(formData.country));
    }
  }, [formData.country, formData.phone_number]);

  const validatePhoneNumber = (phone: string, country: string) => {
    if (!phone) return false;
    
    // Remove any non-digit characters for validation
    const cleanPhone = phone.replace(/\D/g, '');
    
    switch (country) {
      case 'Venezuela':
        // Venezuela: +58 followed by 9-10 digits (different providers)
        return /^58\d{9,10}$/.test(cleanPhone);
      case 'Colombia':
        // Colombia: +57 followed by 10 digits (different providers)
        return /^57\d{10}$/.test(cleanPhone);
      case 'Argentina':
        // Argentina: +54 followed by 10-11 digits (different providers)
        return /^54\d{10,11}$/.test(cleanPhone);
      case 'Mexico':
        // Mexico: +52 followed by 10 digits (different providers)
        return /^52\d{10}$/.test(cleanPhone);
      case 'Brazil':
        // Brazil: +55 followed by 10-11 digits (different providers)
        return /^55\d{10,11}$/.test(cleanPhone);
      case 'Chile':
        // Chile: +56 followed by 9 digits (different providers)
        return /^56\d{9}$/.test(cleanPhone);
      case 'Guatemala':
        // Guatemala: +502 followed by 8 digits (different providers)
        return /^502\d{8}$/.test(cleanPhone);
      case 'European Union':
        // EU: Various formats, but typically 10-12 digits
        return cleanPhone.length >= 10 && cleanPhone.length <= 12;
      case 'Panama':
        // Panama: +507 followed by 7-8 digits (different providers)
        return /^507\d{7,8}$/.test(cleanPhone);
      case 'United Kingdom':
        // UK: +44 followed by 10 digits (different providers)
        return /^44\d{10}$/.test(cleanPhone);
      default:
        return false;
    }
  };

  const getPhoneNumberError = (country: string) => {
    switch (country) {
      case 'Venezuela':
        return "Venezuelan numbers must be +58 followed by 9-10 digits";
      case 'Colombia':
        return "Colombian numbers must be +57 followed by 10 digits";
      case 'Argentina':
        return "Argentine numbers must be +54 followed by 10-11 digits";
      case 'Mexico':
        return "Mexican numbers must be +52 followed by 10 digits";
      case 'Brazil':
        return "Brazilian numbers must be +55 followed by 10-11 digits";
      case 'Chile':
        return "Chilean numbers must be +56 followed by 9 digits";
      case 'Guatemala':
        return "Guatemalan numbers must be +502 followed by 8 digits";
      case 'European Union':
        return "EU numbers must be 10-12 digits";
      case 'Panama':
        return "Panamanian numbers must be +507 followed by 7-8 digits";
      case 'United Kingdom':
        return "UK numbers must be +44 followed by 10 digits";
      default:
        return "Please enter a valid phone number";
    }
  };

  const handleSubmit = async () => {
    if (!formData.legal_name || !formData.email || !formData.phone_number || !formData.type || !formData.country) {
      dispatch(setShowMessage({
        message: "All fields are required",
        color: "red"
      }));
      return;
    }

    const isValidPhone = validatePhoneNumber(formData.phone_number, formData.country);
    if (!isValidPhone) {
      const errorMessage = getPhoneNumberError(formData.country);
      dispatch(setShowMessage({
        message: errorMessage,
        color: "red"
      }));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(getCustomerUrl(), {
        ...formData,
        telegram_id: String(telegramId)
      });

      const newCustomerData = response.data;

      dispatch(setShowMessage({
        message: "Customer account created successfully!",
        color: "green"
      }));

      if (onComplete) {
        onComplete(newCustomerData);
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
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isExistingCustomer && customerData) {
    return (
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800/50 mb-4">
          <UserPlus className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Customer Account Already Exists</h2>
        <p className="text-gray-400 mb-6">
          You already have a customer account set up. You can proceed to create your bank account.
        </p>
        {onComplete && (
          <Button
            onClick={() => onComplete(customerData)}
            className="bg-blue text-white py-3 rounded-md hover:bg-blue-light transition-colors"
          >
            Continue to Bank Account
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 mb-24">

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
            defaultCountry="BR"
            value={formData.phone_number}
            onChange={(value) => {
              setFormData(prev => ({ ...prev, phone_number: value || "" }));
              if (value && formData.country) {
                const isValid = validatePhoneNumber(value, formData.country);
                setPhoneError(isValid ? null : getPhoneNumberError(formData.country));
              }
            }}
            className={`bg-black border ${phoneError ? 'border-red-500' : 'border-gray-600'} rounded-md h-10 text-white`}
            required
          />
          {phoneError && (
            <p className="text-sm text-red-500">
              {phoneError}
            </p>
          )}
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
  );
};

export default CreateAccount;
