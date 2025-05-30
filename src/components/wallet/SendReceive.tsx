import { useState } from "react";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import ReceiveModal from "./ReceiveModal";
 
const SendReceive = () => {
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
 
  return (
    <div className="flex items-center gap-4">
      {/* Receive Button */}
      <button
        onClick={() => setIsReceiveOpen(true)}
        className="bg-blue text-white px-5 py-2 rounded-lg shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue flex items-center gap-2"
      >
        <ArrowDownCircle size={20} />
        Receive
      </button>

      {/* Send Button */}
      <button
        className="bg-blue text-white px-5 py-2 rounded-lg shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue flex items-center gap-2"
      >
        <ArrowUpCircle size={20} />
        Send
      </button>

      {/* Receive Modal */}
      {isReceiveOpen && <ReceiveModal onClose={() => setIsReceiveOpen(false)} />}

      {/* Send Modal */}
      {/* {isSendOpen && <SendModal onClose={() => setIsSendOpen(false)} />} */}
    </div>
  );
};

export default SendReceive;