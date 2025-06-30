import { useTonAddress } from "@tonconnect/ui-react";
import { ArrowLeft, X } from "lucide-react";
import QRCodeContainer from "./QRCodeContainer";
import CopyButton from "./CopyButton";
import { useTranslation } from "react-i18next";

const ReceiveModal = ({ onClose }) => {
  const { t } = useTranslation();
  const tonWalletAddress = useTonAddress();

  // Format address with hyphens for better readability
  const formatAddress = (address) => {
    if (!address) return "";
    return address.match(/.{1,15}/g).join("\n"); // Splits every 15 characters
  };

  return (
    <div className="fixed bg-black inset-0 flex items-center justify-center ">
      <div className=" text-white w-full max-w-md rounded-xl overflow-hidden flex flex-col h-full max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label={t("receiveModal.backButton")}> 
            <ArrowLeft size={24} />
          </button>

          <h1 className="text-2xl font-bold">{t("receiveModal.title")}</h1>

          <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label={t("receiveModal.closeButton")}> 
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center scrollbar-hidden">
          <h2 className="text-xl font-bold mb-2 text-center">{t("receiveModal.addressTitle")}</h2>
          <p className="text-center text-sm text-gray-300 mb-2 max-w-xs">
            {t("receiveModal.warning")}
          </p>

          <QRCodeContainer tonWalletAddress={tonWalletAddress} />

          <p className="text-center text-sm text-gray-400 mb-1">
            {t("receiveModal.scanInstructions")}
            <br />
            {t("receiveModal.scanInstructions2")}
          </p>

          <div className="bg-gray-dark w-full rounded-xl p-2 mb-2">
            <p className="text-gray-400 text-center">{t("receiveModal.addressLabel")}</p>
            <p className="font-mono text-center">{formatAddress(tonWalletAddress)}</p>
          </div>

          <CopyButton tonWalletAddress={tonWalletAddress} />
        </div>
      </div>
    </div>
  );
};

export default ReceiveModal;
