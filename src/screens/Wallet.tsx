
import { TonConnectButton, useTonConnectUI } from "@tonconnect/ui-react";

import { useCallback, useEffect, useState } from "react";
import { db } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { telegramId } from "../libs/telegram";
import { useDispatch, useSelector } from "react-redux";
import { clearWallet, setTonWalletAddress } from "@/store/slice/walletSlice";
import {  Outlet } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import MyTonWallet from "@/components/wallet/SimulationWallet";
import { Card, CardContent } from "@/components/stonfi/ui/card";
import SendReceive from "@/components/wallet/SendReceive";
import AssetTab from "@/components/wallet/AssetTab";
import ActivityTab from "@/components/wallet/ActivityTab";
import RemittanceTab from "@/components/wallet/RemittanceTab";
import { Loader2 } from "lucide-react";  

const Wallet = () => {
  const [tonConnectUI] = useTonConnectUI();
  const [jettons, setJettons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);

  const tid = String(telegramId);

  const dispatch = useDispatch();
  const { tonWalletAddress } = useSelector((state: any) => state.wallet);
 
  const handleWalletConnection = useCallback(
    async (address: string) => {
      dispatch(setTonWalletAddress(address));
      console.log("Wallet connected:", address);
      setIsLoading(false);

      try {
        const userRef = doc(db, "users", tid);
        await updateDoc(userRef, {
          walletAddress: address,
        });
      } catch (error) {
        console.error("Error updating wallet address in Firebase:", error);
      }
    },
    [tid]
  );

  const handleWalletDisconnect = useCallback(async () => {
    dispatch(clearWallet());
    setIsLoading(false);

    try {
      localStorage.removeItem("jettons");

      const userRef = doc(db, "users", tid);
      await updateDoc(userRef, {
        walletAddress: null,
      });
    } catch (error) {
      console.error("Error resetting wallet address in Firebase:", error);
    }
  }, [tid]);

 

  useEffect(() => {
  //  // MRB contract address in RAW (HEX) format
  //     const MRB_CONTRACT_ADDRESS_RAW =
  //     "0:b5f322c4e4077bd559ed708c1a32afcfc005b5a36fb4082a07fec4df71d45cee";

    const fetchJettons = async (address: string) => {
      try {
        setIsLoading(true)
        const url = `https://tonapi.io/v2/accounts/${address}/jettons?currencies=ton`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
           const parsedJettons = data.balances
            .map((jetton: any) => ({
              address: jetton.jetton.address,
              name: jetton.jetton.name,
              symbol: jetton.jetton.symbol,
              image: jetton.jetton.image,
              balance: jetton.balance,
            }))

          localStorage.setItem("jettons", JSON.stringify(parsedJettons));
          setJettons(parsedJettons);
          setIsLoading(false)
        } else {
          console.error("Failed to fetch jettons");
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Error fetching jettons:", error);
      }
    };

    const checkWalletConnection = async () => {
      if (tonConnectUI.account?.address) {
        await handleWalletConnection(tonConnectUI.account.address);
        fetchJettons(tonConnectUI.account.address);
      } else {
        await handleWalletDisconnect();
      }
    };

    checkWalletConnection();

    const unsubscribe = tonConnectUI.onStatusChange((wallet) => {
      if (wallet) {
        handleWalletConnection(wallet.account.address);
        fetchJettons(wallet.account.address);
      } else {
        handleWalletDisconnect();
      }
    });

    return () => unsubscribe();
  }, [tonConnectUI, handleWalletConnection, handleWalletDisconnect]);

 

  useEffect(() => {
    if (tonWalletAddress) {
      getBalance();
    }
  }, [tonWalletAddress, Wallet]);
  const url = `https://toncenter.com/api/v2/getAddressInformation?address=${tonWalletAddress}`;

  const getBalance = async () => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch balance");
      }
      const res = await response.json();
      console.log(res.result.balance);
      setWalletBalance(parseFloat(res.result.balance) / 1e9);
    } catch (error) {
      console.error("Error fetching balance:", error);
      setWalletBalance(0);
    }
  };


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen py-6">
        <Loader2 className="animate-spin text-white w-6 h-6" />
      </div>
    );
  }

  return (
    <div
      className="flex w-full h-[88vh] flex-col border-b border-gray-800 pb-10 overflow-x-auto overflow-y-hidden scrollbar-hidden relative no-scrollbar"
    >
      {!tonWalletAddress && <MyTonWallet />}
  
      {tonWalletAddress && (
        <div className="min-h-screen p-4 w-full text-white">
          <div className="w-full">
          <Card className="mb-6 p-6 text-white rounded-lg shadow-md">
              <div className="mb-6 flex justify-between items-center">
                <div className="text-3xl font-bold w-[60%]">
                  {walletBalance.toFixed(2)} TON <br/>
                  <small className="text-sm font-thin text-gray-300"> Your Balance</small>
                </div>
                <TonConnectButton className="p-2  rounded-lg shadow-md" />
              </div>
              <SendReceive />
            </Card>

          </div>
  
          <div className="w-full ">
            <Tabs defaultValue="assets" className="w-full">
              <TabsList className="w-full flex gap-3 bg-transparent border-b border-gray-800">
                <TabsTrigger
                  value="assets"
                  className="text-gray data-[state=active]:text-blue data-[state=active]:border-b-2 data-[state=active]:border-blue"
                >
                  Assets
                </TabsTrigger>
                <TabsTrigger
                  value="activity"
                  className="text-gray data-[state=active]:text-blue data-[state=active]:border-b-2 data-[state=active]:border-blue"
                >
                  Activity
                </TabsTrigger>
                <TabsTrigger
                  value="remittance"
                  className="text-gray data-[state=active]:text-blue data-[state=active]:border-b-2 data-[state=active]:border-blue"
                >
                  Remittance
                </TabsTrigger>
              </TabsList>
  
              <TabsContent value="assets" className="h-auto overflow-y-scroll scrollbar-hidden">
                <Card>
                  <CardContent className="rounded-lg shadow-md p-4">
                   <AssetTab loading={isLoading} jettons={jettons} />
                  </CardContent>
                </Card>
              </TabsContent>
  
              <TabsContent value="activity">
                <Card>
                  <CardContent className="text-center text-gray-400 py-8">
                    <ActivityTab  />
                  </CardContent>
                </Card>
              </TabsContent>
  
              <TabsContent value="remittance">
                <Card>
                  <CardContent className="p-4">
                  <RemittanceTab />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

        </div>
      )}
  
      <Outlet />
    </div>
  );
  
};

export default Wallet;
