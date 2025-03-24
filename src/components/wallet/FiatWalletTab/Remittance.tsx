import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/stonfi/ui/tab"; 
import { Card, CardContent } from "@/components/stonfi/ui/card"; 
import SendRemittance from "./Remittance/SendRemittance";
import ReceiveRemittance from "./Remittance/ReceiveRemittance";

const Remittance = () => {

  const navigate = useNavigate();


  return (
    <div className="bg-[#1E1E1E] text-white w-full min-h-screen p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)} 
          className="text-gray-400 hover:text-white"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Remittance</h1>
        <div className="w-6"></div> 
      </div>

      {/* Tabs for Send and Receive */}
      <Tabs defaultValue="send" className="w-full">
        <TabsList className="w-full flex gap-3 border-b border-gray-800">
          <TabsTrigger
            value="send"
            className="text-gray-400 data-[state=active]:text-blue data-[state=active]:border-b-2 data-[state=active]:border-blue"
          >
            Send
          </TabsTrigger>
          <TabsTrigger
            value="receive"
            className="text-gray-400 data-[state=active]:text-blue data-[state=active]:border-b-2 data-[state=active]:border-blue"
          >
            Receive
          </TabsTrigger>
        </TabsList>

        {/* Send Tab Content */}
        <TabsContent value="send">
          <Card className="border-none">
            <CardContent className="p-4">
                <SendRemittance />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Receive Tab Content */}
        <TabsContent value="receive">
          <Card className="border-none">
            <CardContent className="p-4">
              <ReceiveRemittance />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Remittance;