import { Card, CardContent } from "@/components/stonfi/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { Loader2, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import SendReciveFiat from "./Buttons";
import { telegramId, userName } from "@/libs/telegram";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import DepositTransactions from "./Transactions/DepositTransactions";
import TransferTransactions from "./Transactions/TransferTransactions";
import { doc, getDoc, query, where, getDocs, collection } from 'firebase/firestore';
import { db } from '@/libs/firebase';
import CreateBankAccount from "./CreateAccount/CreateBankAccount";
import Onboarding from "./CreateAccount/Onboarding";


const FiatWalletTab = () => {
  const { loading, error } = useSelector((state: RootState) => state.fiatBalance);
  const [isCheckingStaff, setIsCheckingStaff] = useState(true);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [hasCustomerAccount, setHasCustomerAccount] = useState<boolean | null>(null);
  const [isCheckingCustomer, setIsCheckingCustomer] = useState(true);
  const [customerData, setCustomerData] = useState<any>(null);
  const [hasBankAccount, setHasBankAccount] = useState<boolean | null>(null);

  useEffect(() => {
    const initializeData = async () => {
      console.log('FiatWalletTab mounted with telegramId:', telegramId);
      await Promise.all([
        checkStaffStatus(),
        checkCustomerAccount(),
       ]);
    };

    initializeData();
  }, []);

  useEffect(() => {
    fetchRealBalance();
  }, []);

  const checkStaffStatus = async () => {
    try {
      setIsCheckingStaff(true);
      if (!userName) {
        console.log('No username available for staff check');
        return;
      }

      const cleanUsername = userName.startsWith('@') ? userName.slice(1) : userName;
      console.log('Checking staff status for username:', cleanUsername);
      
      const staffsRef = collection(db, 'staffs');
      const q = query(
        staffsRef,
        where('tgUsername', 'in', [cleanUsername, `@${cleanUsername}`])
      );
      
      const querySnapshot = await getDocs(q);
      console.log('Staff status check result:', !querySnapshot.empty);
    } catch (error) {
      console.error('Error checking staff status:', error);
    } finally {
      setIsCheckingStaff(false);
    }
  };

  const checkCustomerAccount = async () => {
    try {
      setIsCheckingCustomer(true);
      if (!telegramId) {
        console.log('No telegram ID available for customer check');
        setHasCustomerAccount(false);
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
        setHasCustomerAccount(true);

        if (customerData.country === 'VENEZUELA') {
          console.log('Customer is from Venezuela, checking bank account...');
          
          const bankAccountsRef = collection(db, 'bank_accounts');
          const bankAccountQuery = query(
            bankAccountsRef,
            where('customer_id', '==', customerData.kontigoCustomerId)
          );
          
          const bankAccountSnapshot = await getDocs(bankAccountQuery);
          
          if (!bankAccountSnapshot.empty) {
            console.log('Bank account found for Venezuelan customer');
            setHasBankAccount(true);
          } else {
            console.log('No bank account found for Venezuelan customer');
            setHasBankAccount(false);
          }
        } else {
          console.log('Customer is not from Venezuela, bank account not required');
          setHasBankAccount(true);
        }
      } else {
        console.log('No customer found with telegram_id:', telegramId);
        setHasCustomerAccount(false);
        setHasBankAccount(null);
      }
    } catch (error) {
      console.error('Error checking customer account:', error);
      setHasCustomerAccount(false);
      setHasBankAccount(null);
    } finally {
      setIsCheckingCustomer(false);
    }
  };

  const fetchRealBalance = async () => {
    try {
      if (!telegramId) {
        console.error('No telegram ID available for wallet address fetch');
        return;
      }

       const userRef = doc(db, 'users', String(telegramId));
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('User document data:', userData);
        setUserBalance(userData.realBalance || 0);
        
      } else {
        console.log('User document not found in Firestore');
       }
    } catch (error) {
      console.error('Error fetching wallet address:', error);
     }
  };

 

  if (loading || isCheckingStaff || isCheckingCustomer) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-white w-6 h-6" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full text-white scrollbar-hidden">
      {!hasCustomerAccount ? (
        <Onboarding onComplete={() => {
          setHasCustomerAccount(true);
          checkCustomerAccount();
        }} />
      ) : customerData?.country === 'VENEZUELA' && hasBankAccount === false ? (
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800/50 mb-4">
              <Wallet className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Create Your Bank Account</h2>
            <p className="text-gray-400">
              As a Venezuelan citizen, you need to create a bank account to use our USDC wallet services.
            </p>
          </div>
          <CreateBankAccount 
            customerId={customerData.kontigoCustomerId}
            showLoader={false}
            customerPhone={customerData.phone_number}
          />
        </div>
      ) : (
        <>
          <Card className="rounded-lg shadow-md min-w-full scrollbar-hidden">
            <div className="mb-2">
              <div>
                <p className="text-gray-300">Your Balance</p>
                <h1 className="text-3xl font-bold">{userBalance.toFixed(2)} USDC</h1>
                {userBalance === 0 && (
                  <p className="text-sm text-gray-400 mt-1">
                    Your balance will be updated when you receive Recharge or transfers
                  </p>
                )}
              </div>
            </div>
            <SendReciveFiat />
          </Card>

          <div className="mb-4">
            <h2 className="text-xl font-semibold">Transactions</h2>
          </div>

          <Tabs defaultValue="Recharge" className="w-full">
            <TabsList className="w-full flex gap-3 border-b border-gray-800">
              <TabsTrigger
                value="Recharge"
                className="text-gray-400 data-[state=active]:text-blue data-[state=active]:border-b-2 data-[state=active]:border-blue"
              >
                Recharge
              </TabsTrigger>
              <TabsTrigger
                value="transfer"
                className="text-gray-400 data-[state=active]:text-blue data-[state=active]:border-b-2 data-[state=active]:border-blue"
              >
                Transfer
              </TabsTrigger>
            </TabsList>

            <TabsContent value="Recharge">
              <Card>
                <CardContent className="p-4">
                  <DepositTransactions />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="transfer">
              <Card>
                <CardContent className="p-4">
                  <TransferTransactions />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

        </>
      )}
    </div>
  );
};

export default FiatWalletTab;

