import { useEffect, useState } from "react";
import { ArrowDown, ArrowRight, ArrowUp, X } from "lucide-react";
 import TransferModal from "./transfer/TransferModal";
 import { sethasMRBToken, setLoading } from "@/store/slice/PremiumSlice";

  import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

const Buttons = () => {
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(true);
  const [userHasToken, setUserHasToken] = useState<boolean>(false);

    const dispatch = useDispatch();
    const navigate = useNavigate();
    useEffect(() => {
      const MRB_CONTRACT_ADDRESS_RAW =
        "0:b5f322c4e4077bd559ed708c1a32afcfc005b5a36fb4082a07fec4df71d45cee";
    
      const checkIfUserHoldsMRBToken = () => {
        try {
          dispatch(setLoading(true));
    
          // Retrieve jettons from localStorage
          const jettons = localStorage.getItem("jettons");
    
          if (jettons) {
            // Parse the JSON string into an array or object
            const parsedJettons = JSON.parse(jettons);
    
            // Ensure it's an array before checking for the contract address
            const hasToken = Array.isArray(parsedJettons)
              ? parsedJettons.some(
                  (jetton) => jetton.address === MRB_CONTRACT_ADDRESS_RAW
                )
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
      navigate("/fiat-deposit")
  };

  const handleRemittanceClick = () => {
    navigate("/remittance"); 
  };
 
  return (
    <div className="w-full scrollbar-hidden">
      <div className="w-full">
        <div className="grid grid-cols-3 gap-3 mb-6">
          {/* Deposit Button */}
          <button
            onClick={handleDepositClick}
            className="bg-blue-light text-white px-4 py-3 rounded-md flex items-center justify-center gap-2"
          >
            <ArrowDown size={18} />
            <span>Deposit</span>
          </button>

          {/* Remittance Button */}
          <button
            onClick={handleRemittanceClick}
            className="bg-blue-light text-white px-4 py-3 rounded-md flex items-center justify-center gap-2"
          >
            <ArrowUp size={18} />
            <span>Remittance</span>
          </button>

          {/* Transfer Button */}
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="bg-blue-light text-white px-4 py-3 rounded-md flex items-center justify-center gap-2"
          >
            <ArrowRight size={18} />
            <span>Transfer</span>
          </button>
        </div>

        {/* Promotional Banner */}
        {isBannerVisible && userHasToken && (
          <div className="w-full bg-gradient-to-r from-green-500 to-blue-500 p-4 mb-6 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold text-white">MRB with zero fee — only in Fiat Wallet!</p>
                <a
                  href="https://t.me/blum/app?startapp=memepadjetton_MRB_3UKTM-ref_jM0CnzEvER"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white flex items-center mt-1 underline"
                >
                  Buy <ArrowRight size={16} className="ml-1" />
                </a>
              </div>
              <div className="flex items-center">
                <div className="relative">
                  <div className="absolute -top-2 -right-2 text-white text-2xl">✨</div>
                  <div className="h-12 w-12 rounded-full bg-blue-300 bg-opacity-50 flex items-center justify-center">
                    <span className="text-white text-xl font-bold">0%</span>
                  </div>
                </div>
                {/* Close Banner Button */}
                <button onClick={() => setIsBannerVisible(false)} className="ml-4 text-white">
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>


      {/* {isSendModalOpen && <SendModal onClose={() => setIsSendModalOpen(false)} />} */}
      {isTransferModalOpen && <TransferModal onClose={() => setIsTransferModalOpen(false)} />}
    </div>
  );
};

export default Buttons;
