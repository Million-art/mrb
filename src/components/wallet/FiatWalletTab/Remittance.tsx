import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
 import SendRemittance from "./Remittance/SendRemittance";
 
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
      <SendRemittance />
    </div>
  );
};

export default Remittance;