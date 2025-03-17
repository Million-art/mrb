import { useState } from "react";
import { ArrowDown, ArrowRight, ArrowUp, X } from "lucide-react";
import ReceiveModal from "./ReceiveModal";
import SendModal from "./SendModal";
import TransferModal from "./TransferModal";
import CountrySelector from "./CountrySelector";

// Assuming this is the correct type definition for a country
import { Country } from "@/interface/country"; 

const ModalContainer = () => {
  const [isCountrySelectorOpen, setIsCountrySelectorOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)

  // Handle deposit click: Open country selection first
  const handleDepositClick = () => {
    setIsCountrySelectorOpen(true);
  };

  // When a country is selected, open the ReceiveModal
  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setIsCountrySelectorOpen(false);  
    setIsReceiveModalOpen(true);  
  };

  return (
    <div className="w-full">
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
            onClick={() => setIsSendModalOpen(true)}
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
        {isBannerVisible && (
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

      {/* Country Selector Modal */}
      {isCountrySelectorOpen && (
        <CountrySelector onSelect={handleCountrySelect} onClose={() => setIsCountrySelectorOpen(false)} />
      )}

      {/* Modals */}
      {isReceiveModalOpen && (
        <ReceiveModal country={selectedCountry} onClose={() => setIsReceiveModalOpen(false)} />
      )}
      {isSendModalOpen && <SendModal onClose={() => setIsSendModalOpen(false)} />}
      {isTransferModalOpen && <TransferModal onClose={() => setIsTransferModalOpen(false)} />}
    </div>
  );
};

export default ModalContainer;
