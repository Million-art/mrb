import { Card, CardContent } from "@/components/stonfi/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import SendReciveFiat from "./Buttons";
import { telegramId } from "@/libs/telegram";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import DepositTransactions from "./Transactions/DepositTransactions";
import TransferTransactions from "./Transactions/TransferTransactions";
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/libs/firebase';

const FiatWalletTab = () => {
  const { loading, error } = useSelector((state: RootState) => state.fiatBalance);
  const [userBalance, setUserBalance] = useState<number>(0);

  useEffect(() => {
    fetchRealBalance();
  }, []);

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

  if (loading) {
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
      <Card className="rounded-lg shadow-md min-w-full scrollbar-hidden">
        <div className="mb-10">
          <div>
            <p className="text-gray-300">Your Balance</p>
            <h1 className="text-3xl font-bold">{userBalance.toFixed(2)} USDC</h1>

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
    </div>
  );
};

export default FiatWalletTab;

