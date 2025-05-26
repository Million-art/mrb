import { useState } from 'react';
import { Card } from "@/components/stonfi/ui/card";
import { Button } from "@/components/stonfi/ui/button";
import { Input } from "@/components/stonfi/ui/input";
import { Loader2, Link, Unlink, ExternalLink } from "lucide-react";
import { doc, updateDoc, deleteField } from 'firebase/firestore';
import { db } from '@/libs/firebase';
import { telegramId } from "@/libs/telegram";

interface LinkWalletProps {
  walletAddress: string | null;
  onWalletUpdate: (address: string | null) => void;
}

const LinkWallet = ({ walletAddress, onWalletUpdate }: LinkWalletProps) => {
  const [newAddress, setNewAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLinkWallet = async () => {
    if (!newAddress.trim()) {
      setError('Please enter a valid wallet address');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      const userRef = doc(db, 'users', String(telegramId));
      await updateDoc(userRef, {
        usdcexternalWalletAddress: newAddress.trim()
      });
      onWalletUpdate(newAddress.trim());
      setSuccess('Wallet connected successfully');
      setNewAddress('');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError('Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlinkWallet = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      const userRef = doc(db, 'users', String(telegramId));
      await updateDoc(userRef, {
        usdcexternalWalletAddress: deleteField()
      });
      onWalletUpdate(null);
      setSuccess('Wallet disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      setError('Failed to disconnect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 max-w-md mx-auto">
      {!walletAddress ? (
        <div className="space-y-4">
          <Input
            type="text"
            placeholder="Enter your USDC wallet address"
            value={newAddress}
            onChange={(e) => {
              setNewAddress(e.target.value);
              setError(null);
            }}
            className="bg-gray-800/50 border-gray-700 text-left"
            dir="ltr"
          />
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          {success && (
            <p className="text-sm text-green-500">{success}</p>
          )}
          <Button
            onClick={handleLinkWallet}
            disabled={isLoading || !newAddress.trim()}
            className="w-full flex items-center justify-center gap-2 bg-blue hover:bg-blue/90"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Link className="w-4 h-4" />
            )}
            {isLoading ? 'Connecting...' : 'Connect Wallet'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-gray-400" />
              <p className="text-gray-400">Connected USDC Wallet Address</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(walletAddress);
                  setSuccess('Address copied to clipboard');
                }}
                className="text-blue hover:text-blue/90"
              >
                Copy
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUnlinkWallet}
                disabled={isLoading}
                className="text-red-500 hover:text-red-400"
              >
                <Unlink className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <p className="text-sm break-all bg-gray-800/50 p-3 rounded-lg text-left" dir="ltr">
            {walletAddress}
          </p>
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          {success && (
            <p className="text-sm text-green-500">{success}</p>
          )}
        </div>
      )}
    </Card>
  );
};

export default LinkWallet; 