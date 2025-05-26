import { Card, CardContent } from "@/components/stonfi/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { Loader2, Wallet, ExternalLink, Unlink } from "lucide-react";
import { useEffect, useState } from "react";
import SendReciveFiat from "./Buttons";
import { telegramId, userName } from "@/libs/telegram";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store/store";
import { fetchRealBalance } from "@/store/slice/fiatBalanceSlice";
import DepositTransactions from "./Transactions/DepositTransactions";
import TransferTransactions from "./Transactions/TransferTransactions";
import { Button } from "@/components/stonfi/ui/button";
import LinkWallet from "./LinkWallet";
import { doc, getDoc, updateDoc, deleteField, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/libs/firebase';



const FiatWalletTab = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.fiatBalance);
  const [externalwalletAddress, setexternalWalletAddress] = useState<string | null>(null);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [isStaff, setIsStaff] = useState<boolean | null>(null);
  const [isCheckingStaff, setIsCheckingStaff] = useState(true);
  const [userBalance, setUserBalance] = useState<number>(0);

  useEffect(() => {
    console.log('FiatWalletTab mounted with telegramId:', telegramId);
    checkStaffStatus();
    if (externalwalletAddress) {
      console.log('Fetching real balance for telegramId:', telegramId);
      dispatch(fetchRealBalance(String(telegramId)));
    }
    fetchexternalWalletAddress();
  }, [dispatch, externalwalletAddress]);

  useEffect(() => {
    console.log('Balance state updated:', {
      userBalance,
      loading,
      error,
      telegramId,
      externalwalletAddress
    });
  }, [userBalance, loading, error, externalwalletAddress]);

  const checkStaffStatus = async () => {
    try {
      setIsCheckingStaff(true);
      if (!userName) {
        console.log('No username available for staff check');
        setIsStaff(false);
        return;
      }

      // Remove @ if present for comparison
      const cleanUsername = userName.startsWith('@') ? userName.slice(1) : userName;
      console.log('Checking staff status for username:', cleanUsername);
      
      const staffsRef = collection(db, 'staffs');
      const q = query(
        staffsRef,
        where('tgUsername', 'in', [cleanUsername, `@${cleanUsername}`])
      );
      
      const querySnapshot = await getDocs(q);
      const isStaffUser = !querySnapshot.empty;
      console.log('Staff status check result:', isStaffUser);
      setIsStaff(isStaffUser);
    } catch (error) {
      console.error('Error checking staff status:', error);
      setIsStaff(false);
    } finally {
      setIsCheckingStaff(false);
    }
  };

  const fetchexternalWalletAddress = async () => {
    try {
      if (!telegramId) {
        console.error('No telegram ID available for wallet address fetch');
        return;
      }

      console.log('Fetching wallet address for telegramId:', telegramId);
      const userRef = doc(db, 'users', String(telegramId));
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('User document data:', userData);
        const externalwalletAddress = userData.usdcexternalWalletAddress;
        // Set the real balance from Firestore
        setUserBalance(userData.realBalance || 0);
        if (externalwalletAddress) {
          console.log('Wallet address found:', externalwalletAddress);
          setexternalWalletAddress(externalwalletAddress);
        } else {
          console.log('No wallet address found for user');
          setexternalWalletAddress(null);
        }
      } else {
        console.log('User document not found in Firestore');
        setexternalWalletAddress(null);
      }
    } catch (error) {
      console.error('Error fetching wallet address:', error);
      setexternalWalletAddress(null);
    }
  };

  const handleUnlinkWallet = async () => {
    try {
      setIsUnlinking(true);
      const userRef = doc(db, 'users', String(telegramId));
      await updateDoc(userRef, {
        usdcexternalWalletAddress: deleteField()
      });
      setexternalWalletAddress(null);
    } catch (error) {
      console.error('Error unlinking wallet:', error);
    } finally {
      setIsUnlinking(false);
    }
  };

  if (loading || isCheckingStaff) {
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

  // If user is staff, show full wallet UI without connection prompt
  if (isStaff) {
    return (
      <div className="min-h-screen w-full text-white scrollbar-hidden">
        {/* Balance Card */}
        <Card className="rounded-lg shadow-md min-w-full scrollbar-hidden">
          <div className="mb-2">
            <div>
              <p className="text-gray-300">Your Balance</p>
              <h1 className="text-3xl font-bold">{userBalance.toFixed(2)} USDC</h1>
              {userBalance === 0 && (
                <p className="text-sm text-gray-400 mt-1">
                  Your balance will be updated when you receive deposits or transfers
                </p>
              )}
            </div>
            <div className="inline-block rounded-md">
              <p className="font-bold"></p>
            </div>
          </div>
          <SendReciveFiat />
        </Card>

        {/* Transactions Section */}
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
    );
  }

  // For regular users, show conditional UI based on wallet connection
  return (
    <div className="min-h-screen w-full text-white scrollbar-hidden">
      {!externalwalletAddress ? (
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800/50 mb-4">
            <Wallet className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Connect Your USDC Wallet</h2>
          <p className="text-gray-400 max-w-md mx-auto mb-8">
            Connect your external USDC wallet to get referral commission and access fiat wallet
          </p>
          <LinkWallet 
            walletAddress={externalwalletAddress}
            onWalletUpdate={setexternalWalletAddress}
          />
        </div>
      ) : (
        <>
          {/* Balance Card */}
          <Card className="rounded-lg shadow-md min-w-full scrollbar-hidden">
            <div className="mb-2">
              <div>
                <p className="text-gray-300">Your Balance</p>
                <h1 className="text-3xl font-bold">{userBalance.toFixed(2)} USDC</h1>
                {userBalance === 0 && (
                  <p className="text-sm text-gray-400 mt-1">
                    Your balance will be updated when you receive deposits or transfers
                  </p>
                )}
              </div>
              <div className="inline-block rounded-md">
                <p className="font-bold"></p>
              </div>
            </div>
            <SendReciveFiat />
          </Card>

          {/* Transactions Section */}
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

          {/* Connected Wallet Section */}
          <div className="mt-8 mb-24">
            <h2 className="text-lg font-semibold mb-2">Connected USDC Wallet Address</h2>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1">
                    {externalwalletAddress ? (
                      <p className="text-sm break-all bg-gray-800/50 p-2 rounded-lg text-left" dir="ltr">
                        {externalwalletAddress}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400">No wallet address found</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {externalwalletAddress && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(externalwalletAddress)}
                      className="text-blue hover:text-blue/90"
                    >
                      Copy
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleUnlinkWallet}
                    disabled={isUnlinking}
                    className="text-red-500 hover:text-red-400"
                  >
                    {isUnlinking ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Unlink className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default FiatWalletTab;

