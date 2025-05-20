import { useState, useEffect } from "react";
import { Loader2, Link2, Unlink } from "lucide-react";
import { telegramId } from "@/libs/telegram";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { db } from "@/libs/firebase";
import { doc, setDoc, getDoc, updateDoc, deleteField } from "firebase/firestore";
import { setShowMessage } from "@/store/slice/messageSlice";

const LinkWallet = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentWallet, setCurrentWallet] = useState<string | null>(null);
  const [isLoadingWallet, setIsLoadingWallet] = useState(true);
  const dispatch = useDispatch<AppDispatch>();

  // Fetch current wallet on component mount
  useEffect(() => {
    const fetchCurrentWallet = async () => {
      try {
        const userRef = doc(db, "users", String(telegramId));
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists() && userDoc.data().externalWalletAddress) {
          setCurrentWallet(userDoc.data().externalWalletAddress);
        }
      } catch (error) {
        console.error("Error fetching wallet:", error);
      } finally {
        setIsLoadingWallet(false);
      }
    };

    fetchCurrentWallet();
  }, []);

  const handleLinkWallet = async () => {
    if (!walletAddress.trim()) {
      dispatch(setShowMessage({
        message: "Please enter a wallet address",
        color: "red"
      }));
      return;
    }

    try {
      setIsLoading(true);
      
      const userRef = doc(db, "users", String(telegramId));
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        dispatch(setShowMessage({
          message: "User not found",
          color: "red"
        }));
        return;
      }

      await setDoc(userRef, {
        externalWalletAddress: walletAddress.trim(),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setCurrentWallet(walletAddress.trim());
      dispatch(setShowMessage({
        message: "USDC wallet linked successfully!",
        color: "green"
      }));
      
      setWalletAddress("");
    } catch (error) {
      console.error("Error linking wallet:", error);
      dispatch(setShowMessage({
        message: "Failed to link USDC wallet",
        color: "red"
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnectWallet = async () => {
    try {
      setIsLoading(true);
      const userRef = doc(db, "users", String(telegramId));
      
      await updateDoc(userRef, {
        externalWalletAddress: deleteField(),
        updatedAt: new Date().toISOString()
      });

      setCurrentWallet(null);
      dispatch(setShowMessage({
        message: "USDC wallet disconnected successfully!",
        color: "green"
      }));
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      dispatch(setShowMessage({
        message: "Failed to disconnect USDC wallet",
        color: "red"
      }));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingWallet) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">
          {currentWallet ? "Connected External Wallet" : "Link Your External Wallet"}
        </h2>
      </div>

      {currentWallet ? (
        <div className="space-y-5">
          <div className="p-4 bg-gray-dark rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-gray-300 break-all">
                  {currentWallet}
                </span>
              </div>
              <button
                onClick={handleDisconnectWallet}
                disabled={isLoading}
                className="p-2 text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                title="Disconnect wallet"
              >
                <Unlink className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Wallet Address for USDC
            </label>
            <input
              type="text"
              className="w-full bg-transparent border border-gray-700 rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              placeholder="Enter your wallet address"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">
              Enter your wallet address where you want to receive USDC
            </p>
          </div>

          <button
            onClick={handleLinkWallet}
            disabled={isLoading || !walletAddress.trim()}
            className="w-full bg-blue text-white py-3 rounded-md hover:bg-blue-light transition-colors flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Linking...
              </>
            ) : (
              <>
                <Link2 className="mr-2 h-4 w-4" />
                Link USDC Wallet
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default LinkWallet; 