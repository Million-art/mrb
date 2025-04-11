import { Card, CardContent } from "@/components/stonfi/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import SendReciveFiat from "./Buttons";
import { telegramId } from "@/libs/telegram";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store/store";
import { fetchRealBalance } from "@/store/slice/fiatBalanceSlice";
import DepositTransactions from "./Transactions/DepositTransactions";
import TransferTransactions from "./Transactions/TransferTransactions";

const FiatWalletTab = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { realBalance, loading, error } = useSelector((state: RootState) => state.fiatBalance);

  useEffect(() => {
    dispatch(fetchRealBalance(String(telegramId)));
  }, [dispatch]);

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
      {/* Balance Card */}
      <Card className="rounded-lg shadow-md min-w-full scrollbar-hidden">
        <div className="mb-2">
          <p className="text-gray-300">Your Balance</p>
          <h1 className="text-3xl font-bold">{realBalance.toFixed(2)} USDC</h1>
          <div className=" inline-block rounded-md">
            <p className="font-bold"></p>
          </div>
        </div>
        <SendReciveFiat />
      </Card>

      {/* Transactions Tab */}
      <Tabs defaultValue="deposit" className="w-full mt-14"> 
          <h1 className="text-center text-xl">Transactions</h1>
        <TabsList className="w-full flex gap-3 border-b border-gray-800">
          <TabsTrigger
            value="deposit"
            className="text-gray-400 data-[state=active]:text-blue data-[state=active]:border-b-2 data-[state=active]:border-blue"
          >
            Deposit
          </TabsTrigger>
          <TabsTrigger
            value="transfer"
            className="text-gray-400 data-[state=active]:text-blue data-[state=active]:border-b-2 data-[state=active]:border-blue"
          >
            Transfer 
          </TabsTrigger>
        </TabsList>

        <TabsContent value="deposit">
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

