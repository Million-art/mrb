import { Card, CardContent } from "@/components/stonfi/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { Loader2, Currency, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import SendReciveFiat from "./Buttons";
import { telegramId } from "@/libs/telegram";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store/store";
import { fetchRealBalance } from "@/store/slice/fiatBalanceSlice";
import DepositTransactions from "./Transactions/DepositTransactions";
import TransferTransactions from "./Transactions/TransferTransactions";
import ExchangeRates from "./Transactions/ExchangeRates";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/stonfi/ui/dialog";
import { Button } from "@/components/stonfi/ui/button";
import axios from "axios";

const FiatWalletTab = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { realBalance, loading, error } = useSelector((state: RootState) => state.fiatBalance);
  const [isExchangeRateOpen, setIsExchangeRateOpen] = useState(false);
  const [isGeneratingWallet, setIsGeneratingWallet] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchRealBalance(String(telegramId)));
  }, [dispatch]);

  const generateCircleWallet = async () => {
    try {
      setIsGeneratingWallet(true);
      setWalletError(null);
      
      const response = await axios.post('/api/v1/wallet/create', {
        telegramId: String(telegramId)
      });

      if (response.data?.address) {
        setWalletAddress(response.data.address);
      } else {
        throw new Error('No wallet address in response');
      }
    } catch (err: any) {
      console.error('Error generating wallet:', err);
      setWalletError(err.response?.data?.message || 'Failed to generate wallet');
    } finally {
      setIsGeneratingWallet(false);
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
      {/* Balance Card */}
      <Card className="rounded-lg shadow-md min-w-full scrollbar-hidden">
        <div className="mb-2">
          <div>
            <p className="text-gray-300">Your Balance</p>
            <h1 className="text-3xl font-bold">{realBalance.toFixed(2)} USDC</h1>
          </div>
          <div className="inline-block rounded-md">
            <p className="font-bold"></p>
          </div>
        </div>
        <SendReciveFiat />
      </Card>

      {/* Exchange Rates Section */}
      <div className="mt-8 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-xl blur-xl"></div>
        <div className="relative bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-xl p-6 backdrop-blur-sm border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Exchange Rates
              </h2>
              <p className="text-sm text-gray-300">Current exchange rates for all supported currencies</p>
            </div>
            <Dialog open={isExchangeRateOpen} onOpenChange={setIsExchangeRateOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center gap-1.5 text-sm bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <Currency className="w-3.5 h-3.5" />
                  View All
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] border-none bg-black/80 backdrop-blur-xl">
                <DialogHeader>
                  <DialogTitle className="text-white">Exchange Rates</DialogTitle>
                </DialogHeader>
                <ExchangeRates />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Circle Wallet Section */}
      <div className="mt-8">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Create Wallet</h2>
         </div>
        
        <Card className="p-6">
          {!walletAddress ? (
            <div className="flex flex-col items-center justify-center space-y-4">
 
              <Button
                onClick={generateCircleWallet}
                disabled={isGeneratingWallet}
                className="flex items-center gap-2 bg-blue hover:bg-blue/90"
              >
                {isGeneratingWallet ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wallet className="w-4 h-4" />
                )}
                {isGeneratingWallet ? 'Generating...' : 'Generate Wallet'}
              </Button>
              {walletError && (
                <p className="text-red-500 text-sm">{walletError}</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-gray-400">Wallet Address</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(walletAddress)}
                  className="text-blue hover:text-blue/90"
                >
                  Copy
                </Button>
              </div>
              <p className="text-sm break-all bg-gray-800/50 p-3 rounded-lg">
                {walletAddress}
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Transactions Section */}
      <div className="mt-8">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Transactions</h2>
        </div>

        <Tabs defaultValue="deposit" className="w-full">
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
    </div>
  );
};

export default FiatWalletTab;

