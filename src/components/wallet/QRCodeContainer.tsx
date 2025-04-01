import { QRCodeSVG } from "qrcode.react";
import mrb from "@/assets/mrb.jpg";

const QRCodeContainer = ({ tonWalletAddress }) => {
  return (
    <div className=" p-2 rounded-xl mb-2 relative">
      <QRCodeSVG value={tonWalletAddress || ""} size={100} bgColor="#2A2A2A" fgColor="white" level="L" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full w-12 h-12 flex items-center justify-center">
        <img src={mrb} alt="Logo" />
      </div>
    </div>
  );
};

export default QRCodeContainer;
