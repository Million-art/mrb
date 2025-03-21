import { Card, CardContent } from "@/components/stonfi/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import FiatTransactions from "./FiatTransactions";
import SendReciveFiat from "./SendReciveFiat";
import { telegramId } from "@/libs/telegram";
import { db } from "@/libs/firebase"; 
import { doc, getDoc } from "firebase/firestore";

const FiatWalletTab = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [realBalance, setRealBalance] = useState(0);
  const id = String(telegramId);

  useEffect(() => {
    const fetchRealBalance = async () => {
      try {
        const userRef = doc(db, "users", id);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setRealBalance(userData.realBalance || 0); 
        } else {
          console.error("No such user document!");
        }
      } catch (error) {
        console.error("Error fetching real balance:", error);
      } finally {
        setIsLoading(false); 
      }
    };

    fetchRealBalance();
  }, [id]); 

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-white w-6 h-6" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full text-white scrollbar-hidden">
      {/* Balance Card */}
      <Card className="rounded-lg shadow-md min-w-full scrollbar-hidden">
        <div className="mb-2">
          <p className="text-gray-300">Your Balance</p>
          <h1 className="text-2xl font-bold">{realBalance.toFixed(2)} USDC</h1> 
          <div className="bg-gray-900 inline-block rounded-md">
            <p className="font-bold"></p>
          </div>
        </div>
        <SendReciveFiat />
      </Card>

      {/* Transactions Tab */}
      <Tabs defaultValue="remittance" className="w-full">
        <TabsList className="w-full flex gap-3 border-b border-gray-800">
          <TabsTrigger
            value="remittance"
            className="text-gray-400 data-[state=active]:text-blue data-[state=active]:border-b-2 data-[state=active]:border-blue"
          >
            Transactions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="remittance">
          <Card>
            <CardContent className="p-4">
              <FiatTransactions />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FiatWalletTab;