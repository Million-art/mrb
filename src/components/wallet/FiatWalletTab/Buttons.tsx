import { useEffect, useState } from "react";
import { ArrowDown, ArrowRight, ArrowUp, X, Landmark  } from "lucide-react"; // Changed Home to Landmark 
import { sethasMRBToken, setLoading } from "@/store/slice/PremiumSlice";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

const Buttons = () => {
  const [isBannerVisible, setIsBannerVisible] = useState(true);
  const [userHasToken, setUserHasToken] = useState<boolean>(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const MRB_CONTRACT_ADDRESS_RAW = "0:b5f322c4e4077bd559ed708c1a32afcfc005b5a36fb4082a07fec4df71d45cee";
    
    const checkIfUserHoldsMRBToken = () => {
      try {
        dispatch(setLoading(true));
    
        const jettons = localStorage.getItem("jettons");
    
        if (jettons) {
          const parsedJettons = JSON.parse(jettons);
          const hasToken = Array.isArray(parsedJettons)
            ? parsedJettons.some((jetton) => jetton.address === MRB_CONTRACT_ADDRESS_RAW)
            : parsedJettons[MRB_CONTRACT_ADDRESS_RAW] !== undefined;
          
          dispatch(sethasMRBToken(hasToken));
          setUserHasToken(hasToken);
        } else {
          dispatch(sethasMRBToken(false));
          setUserHasToken(false);
        }
      } catch (error) {
        console.error("Error checking user status: ", error);
        setUserHasToken(false);
      } finally {
        dispatch(setLoading(false));
      }
    };
    
    checkIfUserHoldsMRBToken();
  }, [dispatch]);


  const handleDepositClick = () => {
    navigate("/fiat-deposit");
  };

  const handleRemittanceClick = () => {
    navigate("/remittance"); 
  };

 
 
  const handleTransferClick = () => {
    navigate("/balance-transfer"); 
  };

  
  return (
    <div className="w-full scrollbar-hidden">
      <div className="w-full">
        <div className="grid grid-cols-3 gap-3 mb-6">
          {/* Deposit Icon */}
          <div onClick={handleDepositClick} className="flex flex-col items-center cursor-pointer">
            <ArrowDown size={25} strokeWidth={2} className="outline hover:text-blue  rounded-full p-1" />
            <span className="text-xs mt-2">Deposit</span>
          </div>

          {/* Remittance Icon */}
          <div onClick={handleRemittanceClick} className="flex flex-col items-center cursor-pointer">
            <ArrowUp size={25} strokeWidth={2} className="outline hover:text-blue  rounded-full p-1" />
            <span className="text-xs mt-2">Remittance</span>
          </div>

           <div onClick={handleTransferClick} className="flex flex-col items-center cursor-pointer">
            <ArrowRight  size={25} strokeWidth={2} className="outline hover:text-blue  rounded-full p-1" /> 
            <span className="text-xs mt-2">Transfer</span>
          </div>

        </div>

        {/* Promotional Banner */}
        {isBannerVisible && userHasToken && (
          <div className="w-full bg-gradient-to-r from-green-500 to-blue p-4 mb-6 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold text-white">MRB with zero fee — only in Fiat Wallet!</p>
                <a
                  href="https://t.me/blum/app?startapp=memepadjetton_MRB_3UKTM-ref_jM0CnzEvER"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white flex items-center mt-1 underline hover:text-blue-200 transition-colors"
                >
                  Buy <ArrowRight size={16} strokeWidth={2} className="ml-1" />
                </a>
              </div>
              <div className="flex items-center">
                <div className="relative">
                  <div className="absolute -top-2 -right-2 text-white text-2xl">✨</div>
                  <div className="h-12 w-12 rounded-full bg-blue-300 bg-opacity-50 flex items-center justify-center">
                    <span className="text-white text-xl font-bold">0%</span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsBannerVisible(false)} 
                  className="ml-4 text-white hover:text-blue-200 transition-colors"
                  aria-label="Close banner"
                >
                  <X size={20} strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Buttons;