import { ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/libs/firebase";
import { telegramId } from "@/libs/telegram";
import CreateAccount from "@/components/wallet/FiatWalletTab/CreateAccount/CreateAccount";
import { useTranslation } from "react-i18next";

const CreateCustomerPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);

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
          setIsExistingCustomer(true);
          navigate("/create-bank-account");
        }
      } catch (err) {
        console.error("Error checking existing customer:", err);
      } finally {
        setLoading(false);
      }
    };

    checkExistingCustomer();
  }, [navigate]);

  if (loading) {
    return (
      <div className="text-white w-full min-h-screen p-4 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">{t("createCustomerPage.loading")}</span>
      </div>
    );
  }

  if (isExistingCustomer) {
    return null; // Will be redirected in useEffect
  }

  return (
    <div className="text-white w-full min-h-screen p-4">
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => navigate(-1)} 
          className="text-gray-400 hover:text-white"
          aria-label={t("createCustomerPage.backButton")}
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">{t("createCustomerPage.title")}</h1>
        <div className="w-6" />
      </div>
      <CreateAccount onComplete={(data) => navigate("/create-bank-account")} />
    </div>
  );
};

export default CreateCustomerPage; 