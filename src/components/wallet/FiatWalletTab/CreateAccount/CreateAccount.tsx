import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/libs/firebase";
import { telegramId } from "@/libs/telegram";
import { Loader2, UserPlus, ChevronDown } from "lucide-react";
import { Button } from "@/components/stonfi/ui/button";
import { Input } from "@/components/stonfi/ui/input";
import { Label } from "@/components/stonfi/ui/label";
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import './phone-input-dark.css';
import { countries } from "./countries";
import { useDispatch } from "react-redux";
import { setShowMessage } from "@/store/slice/messageSlice";
import { getCustomerUrl } from "@/config/api";
import axios from "axios";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [hasInteractedWithPhone, setHasInteractedWithPhone] = useState(false);

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

  const getPhoneNumberError = (phone: string, country: string) => {
    if (!phone) {
      return t("createAccount.phoneRequired");
    }

    if (!isValidPhoneNumber(phone)) {
      return t("createAccount.phoneInvalid");
    }

    const cleanPhone = phone.replace(/\D/g, '');
    
    switch (country) {
      case 'Venezuela':
        if (!/^58\d{9,10}$/.test(cleanPhone)) {
          return t("createAccount.phoneValidation.venezuela");
        }
        break;
      case 'Colombia':
        if (!/^57\d{10}$/.test(cleanPhone)) {
          return t("createAccount.phoneValidation.colombia");
        }
        break;
      case 'Argentina':
        if (!/^54\d{10,11}$/.test(cleanPhone)) {
          return t("createAccount.phoneValidation.argentina");
        }
        break;
      case 'Mexico':
        if (!/^52\d{10}$/.test(cleanPhone)) {
          return t("createAccount.phoneValidation.mexico");
        }
        break;
      case 'Brazil':
        if (!/^55\d{10,11}$/.test(cleanPhone)) {
          return t("createAccount.phoneValidation.brazil");
        }
        break;
      case 'Chile':
        if (!/^56\d{9}$/.test(cleanPhone)) {
          return t("createAccount.phoneValidation.chile");
        }
        break;
      case 'Guatemala':
        if (!/^502\d{8}$/.test(cleanPhone)) {
          return t("createAccount.phoneValidation.guatemala");
        }
        break;
      case 'European Union':
        if (cleanPhone.length < 10 || cleanPhone.length > 12) {
          return t("createAccount.phoneValidation.eu");
        }
        break;
      case 'Panama':
        if (!/^507\d{7,8}$/.test(cleanPhone)) {
          return t("createAccount.phoneValidation.panama");
        }
        break;
      case 'United Kingdom':
        if (!/^44\d{10}$/.test(cleanPhone)) {
          return t("createAccount.phoneValidation.uk");
        }
        break;
    }

    return null;
  };

  useEffect(() => {
    if (!hasInteractedWithPhone) return;

    const timeoutId = setTimeout(() => {
      if (formData.phone_number && formData.country) {
        const error = getPhoneNumberError(formData.phone_number, formData.country);
        setPhoneError(error);
      } else if (formData.phone_number && !formData.country) {
        setPhoneError(isValidPhoneNumber(formData.phone_number) ? null : t("createAccount.phoneInvalid"));
      } else {
        setPhoneError(null);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.country, formData.phone_number, hasInteractedWithPhone, t]);

  const handleSubmit = async () => {
    if (!formData.legal_name || !formData.email || !formData.phone_number || !formData.type || !formData.country) {
      dispatch(setShowMessage({
        message: t("createAccount.allFieldsRequired"),
        color: "red"
      }));
      return;
    }

    const phoneError = getPhoneNumberError(formData.phone_number, formData.country);
    if (phoneError) {
      dispatch(setShowMessage({
        message: phoneError,
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
        message: t("createAccount.accountCreatedSuccess"),
        color: "green"
      }));

      if (onComplete) {
        onComplete(newCustomerData);
      }

    } catch (err: any) {
      console.error('Error:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.details?.message || t("createAccount.failedToCreateAccount");
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
        <span className="ml-2">{t("createAccount.loading")}</span>
      </div>
    );
  }

  if (isExistingCustomer && customerData) {
    return (
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800/50 mb-4">
          <UserPlus className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">{t("createAccount.existingAccountTitle")}</h2>
        <p className="text-gray-400 mb-6">
          {t("createAccount.existingAccountMessage")}
        </p>
        {onComplete && (
          <Button
            onClick={() => onComplete(customerData)}
            className="bg-blue text-white py-3 rounded-md hover:bg-blue-light transition-colors"
          >
            {t("createAccount.continueToBankAccount")}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 mb-24">

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="legal_name">{t("createAccount.legalNameLabel")}</Label>
          <Input
            placeholder={t("createAccount.legalNamePlaceholder")}
            name="legal_name"
            value={formData.legal_name}
            onChange={(e) => setFormData(prev => ({ ...prev, legal_name: e.target.value }))}
            className="bg-black border border-gray-600 text-white text-left [&:not(:placeholder-shown)]:bg-black"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{t("createAccount.emailLabel")}</Label>
          <Input
            placeholder={t("createAccount.emailPlaceholder")}
            name="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="bg-black border border-gray-600 text-white text-left [&:not(:placeholder-shown)]:bg-black"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">{t("createAccount.phoneLabel")}</Label>
          <PhoneInput
            international
            defaultCountry="BR"
            value={formData.phone_number}
            onChange={(value) => {
              setFormData(prev => ({ ...prev, phone_number: value || "" }));
              setHasInteractedWithPhone(true);
            }}
            onBlur={() => setHasInteractedWithPhone(true)}
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
          <Label htmlFor="type">{t("createAccount.accountTypeLabel")}</Label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as "individual" | "business" }))}
            className="w-full h-10 px-3 py-2 bg-black border border-gray-600 rounded-md text-white text-left [&:not(:placeholder-shown)]:bg-black"
            required
          >
            <option value="individual">{t("createAccount.individual")}</option>
            <option value="business">{t("createAccount.business")}</option>
          </select>
        </div>

        <div className="relative">
          <Label htmlFor="country">{t("createAccount.countryLabel")}</Label>
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
              <span className="text-gray-400">{t("createAccount.selectCountry")}</span>
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
              {t("createAccount.creating")}
            </>
          ) : (
            t("createAccount.createAccountButton")
          )}
        </Button>
      </div>
    </div>
  );
};

export default CreateAccount;
