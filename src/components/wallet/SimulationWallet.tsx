import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/stonfi/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import mrb from "@/assets/mrb.jpg"
import { TonConnectButton } from "@tonconnect/ui-react";
import PromoMrb from "./PromoMrb";
interface CryptoData {
  price: string;
  change: string;
  changePercent: string;
}

export default function MyTonWallet() {
  const [btcData, setBtcData] = useState<CryptoData>({ price: "$0.00", change: "↑ 0%", changePercent: "0%" });
  const [tonData, setTonData] = useState<CryptoData>({ price: "$0.00", change: "↑ 0%", changePercent: "0%" });

  useEffect(() => {

    const API_KEY = "bb1f4d40-7cf2-4d4a-ad24-4c48c3c2d96d"; 
const TOKEN_SYMBOL = "MRB";  

fetch(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${TOKEN_SYMBOL}`, {
  headers: {
    "X-CMC_PRO_API_KEY": API_KEY,
  },
})
.then(response => response.json())
.then(data => {
  console.log("Token Price:", data.data[TOKEN_SYMBOL].quote.USD.price);
})
.catch(error => console.error("Error fetching price:", error));


    const wsbtc = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@ticker");
    wsbtc.onmessage = (event) => {
      const json = JSON.parse(event.data);
      
      const price = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 5,
      }).format(Number(json.c));

      const change = parseFloat(json.p).toFixed(2);  
      const changePercent = parseFloat(json.P).toFixed(2);  
      setBtcData({
        price,
        change: `${parseFloat(changePercent) > 0 ? "↑" : "↓"} ${changePercent}%`,  
        changePercent: `${parseFloat(change) > 0 ? "+" : ""}$${change}`,  
      });
    };
    return () => wsbtc.close();
  }, []);

  useEffect(() => {
    const wston = new WebSocket("wss://stream.binance.com:9443/ws/tonusdt@ticker");
    wston.onmessage = (event) => {
      const json = JSON.parse(event.data);

      const price = parseFloat(json.c).toFixed(2);
      const change = parseFloat(json.p).toFixed(2);  
      const changePercent = parseFloat(json.P).toFixed(2);  

      setTonData({
        price: `$${price}`,
        change: `${parseFloat(changePercent) > 0 ? "↑" : "↓"} ${changePercent}%`, 
        changePercent: `${parseFloat(change) > 0 ? "+" : ""}$${change}`,  
      });
    };
    return () => wston.close();
  }, []);

  return (
    <div className="min-h-screen p-2 w-full text-white">
      <div className="max-w-md">
        <Card className="flex justify-between items-center mb-2  p-1 text-white rounded-lg">
          <div className="">
            <div className="text-xl font-bold">{btcData.price}</div>
            <div className={`flex items-center text-sm ${parseFloat(btcData.changePercent) < 0 ? "text-red-400" : "text-green-400"}`}>
              <span className="text-white">{btcData.change}</span>
            </div>
          <div className="mb-6 text-sm opacity-80">current BTC price</div> 
          </div>
          <TonConnectButton className='' />
        </Card>

        <PromoMrb/>
        <Tabs defaultValue="assets" className="w-full max-w-md mx-auto">
          <TabsList className="w-full flex gap-3 bg-transparent border-b border-gray-800">
            <TabsTrigger
              value="assets"
              className="text-gray data-[state=active]:text-blue data-[state=active]:border-b-2 data-[state=active]:border-blue"
            >
              Assets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assets">
            <Card>
              <CardContent className="p-3 space-y-6 rounded-lg shadow-md">
                  <div className="flex items-center justify-between space-x-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={mrb}
                      alt="Toncoin"
                      className="h-10 w-10 rounded-full"
                    />
                    <div>
                      <div className="text-xl font-semibold text-gray-100">MRB</div>
                      <div className="text-sm text-gray-300">
                        $0.00004157
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bitcoin Section */}
                <div className="flex items-center justify-between space-x-4">
                  <div className="flex items-center gap-4">
                    <img
                      src="https://res.cloudinary.com/dd6sildog/image/upload/v1744210593/R_cpoorc.png"
                      alt="Bitcoin"
                      className="h-10 w-10 rounded-full"
                    />
                    <div>
                      <div className="text-xl font-semibold text-gray-100">Bitcoin</div>
                      <div className="text-sm text-gray-300">
                       {btcData.price}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Toncoin Section */}
                <div className="flex items-center justify-between space-x-4">
                  <div className="flex items-center gap-4">
                    <img
                      src="https://res.cloudinary.com/dd6sildog/image/upload/v1744210472/OIP_2_ny2wlg.jpg"
                      alt="Toncoin"
                      className="h-10 w-10 rounded-full"
                    />
                    <div>
                      <div className="text-xl font-semibold text-gray-100">Toncoin</div>
                      <div className="text-sm text-gray-300">
                        {tonData.price}
                      </div>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardContent className="text-center text-gray-400 py-8">No recent activity</CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
