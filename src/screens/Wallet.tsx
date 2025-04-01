import FiatWalletTab from "@/components/wallet/FiatWalletTab";
import TonWalletTab from "@/components/wallet/TonWalletTab";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@radix-ui/react-tabs";

const Wallet = () => {
  return (
    <div className=" text-white max-w-md mx-auto rounded-lg overflow-hidden">
      {/* Tabs */}
      <div className="px-4 mt-5">
        <Tabs defaultValue="ton-space" className="w-full">
          <TabsList className="grid w-full grid-cols-2  rounded-full p-1">
            <TabsTrigger
              value="ton-space"
              className="rounded-full py-2 data-[state=active]:bg-[#1A1B1E] data-[state=active]:text-white text-gray-400"
            >
              TON Wallet
            </TabsTrigger>
            <TabsTrigger
              value="wallet"
              className="rounded-full py-2 data-[state=active]:bg-[#1A1B1E] data-[state=active]:text-white text-gray-400"
            >
              Fiat Wallet
            </TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <div className="mt-5">
            <TabsContent value="ton-space">
              <TonWalletTab/>
            </TabsContent>

            <TabsContent value="wallet">
              <FiatWalletTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Wallet;
