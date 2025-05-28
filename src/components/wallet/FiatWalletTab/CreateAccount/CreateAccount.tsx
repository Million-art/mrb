import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/libs/firebase";
import { telegramId } from "@/libs/telegram";
import { Navigate, useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import CreateBankAccount from "./CreateBankAccount";

interface CustomerData {
  id: string;
  legal_name: string;
  email: string;
  phone_number: string;
  type: string;
  kontigoCustomerId: string;
}

const CreateAccount = () => {
  const navigate = useNavigate();
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);

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
            <h1 className="text-xl font-bold"> Bank Account</h1>
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

  return <Navigate to="/create-customer" replace />;
};

export default CreateAccount;
