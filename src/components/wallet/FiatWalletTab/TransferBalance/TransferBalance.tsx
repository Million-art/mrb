import BottomNav from "@/components/BottomNav";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TransferBalance = () => {
  const navigate = useNavigate();
  
  return (
    <div className=" bg-black bg-opacity-80 z-50">
      <div className=" text-white w-full max-w-md rounded-xl overflow-hidden flex flex-col p-6 relative">
        <div className="">
            <button 
            onClick={() => navigate(-1)} 
            className="text-gray-400 hover:text-white absolute top-6 left-6"
            >
            <ArrowLeft size={24} />
            </button>
            
            <h2 className="text-xl font-semibold mb-4 text-white text-center">
            Transfer Funds in USDC
            </h2>
        </div>

        {/* Transfer Form */}
        <div className="space-y-5 mt-15">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Recipient
            </label>
            <input
              type="text"
              className="w-full bg-transparent border border-gray-700 rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              placeholder="Enter recipient Telegram ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount
            </label>
            <input
              type="number"
              className="w-full bg-transparent border border-gray-700 rounded-md p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              placeholder="Enter amount"
            />
          </div>

          <button className="w-full bg-blue text-white py-3 rounded-md hover:bg-blue-light transition-colors">
            Transfer
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default TransferBalance;