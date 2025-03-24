import { X } from "lucide-react";

const TransferModal = ({ onClose }) => {
  return (
    <div className="fixed  inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
      <div className="bg-[#1E1E1E] text-white w-full max-w-md rounded-xl overflow-hidden flex flex-col p-6 relative">
        {/* Modal Title */}
        <h2 className="text-xl font-semibold mb-4 text-white text-center">Transfer Funds</h2>

        {/* Transfer Form */}
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Recipient</label>
            <input
              type="text"
              className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              placeholder="Enter recipient ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
            <input
              type="number"
              className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              placeholder="Enter amount"
            />
          </div>

          <button className="w-full bg-cyan-500 text-white py-3 rounded-md hover:bg-cyan-600 transition-colors">
            Transfer
          </button>
        </div>

        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white" aria-label="Close">
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default TransferModal;
