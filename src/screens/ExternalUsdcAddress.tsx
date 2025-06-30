import  { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/stonfi/ui/button";
import { Input } from "@/components/stonfi/ui/input";
import { ArrowLeft, Loader2, Copy, Check, Trash2 } from "lucide-react";
import { doc, getDoc, updateDoc, deleteField } from "firebase/firestore";
import { db } from "@/libs/firebase";
import { telegramId } from "@/libs/telegram";
import { useTranslation } from "react-i18next";

const ExternalUsdcAddress = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchWalletAddress = async () => {
      try {
        const userRef = doc(db, 'users', String(telegramId));
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          setWalletAddress(userDoc.data().usdcexternalWalletAddress || null);
        }
      } catch (error) {
        console.error('Error fetching wallet address:', error);
        setError(t('externalUsdcAddress.messages.fetchFailed'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchWalletAddress();
  }, [t]);

  const handleSave = async () => {
    if (!newAddress.trim()) {
      setError(t('externalUsdcAddress.messages.addressRequired'));
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(newAddress.trim())) {
      setError(t('externalUsdcAddress.messages.invalidAddress'));
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      const userRef = doc(db, 'users', String(telegramId));
      await updateDoc(userRef, {
        usdcexternalWalletAddress: newAddress.trim()
      });
      setWalletAddress(newAddress.trim());
      setSuccess(t('externalUsdcAddress.messages.connectSuccess'));
      setNewAddress('');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError(t('externalUsdcAddress.messages.connectFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      setSuccess(null);
      const userRef = doc(db, 'users', String(telegramId));
      await updateDoc(userRef, {
        usdcexternalWalletAddress: deleteField()
      });
      setWalletAddress(null);
      setSuccess(t('externalUsdcAddress.messages.disconnectSuccess'));
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      setError(t('externalUsdcAddress.messages.disconnectFailed'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopy = async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying address:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full text-white scrollbar-hidden">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full text-white scrollbar-hidden">
      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-gray-400 hover:text-white"
              aria-label={t('externalUsdcAddress.backButton')}
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">{t('externalUsdcAddress.title')}</h1>
            </div>
          </div>
          <div className="mt-4 border-t border-gray-800" />
        </div>

        <div className="space-y-6">
          <div className=" rounded-lg p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-white mb-2">{t('externalUsdcAddress.linkWalletTitle')}</h3>
                <p className="text-sm text-gray-400">
                  {t('externalUsdcAddress.linkWalletMessage')}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-800">
                {!walletAddress ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                      <img
                        src="https://storage.googleapis.com/ks-setting-1d682dca/a57f3983-8573-4f43-8b4c-f5217aee72b11697621136693.png"
                        alt="Base Network logo"
                        className="w-6 h-6 object-contain"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{t('externalUsdcAddress.baseNetwork')}</p>
                        <p className="text-xs text-gray-400">
                          {t('externalUsdcAddress.baseNetworkDescription')}
                        </p>
                      </div>
                    </div>

                    <div className="relative">
                      <Input
                        type="text"
                        placeholder={t('externalUsdcAddress.addressPlaceholder')}
                        value={newAddress}
                        onChange={(e) => {
                          setNewAddress(e.target.value);
                          setError(null);
                        }}
                        className="bg-gray-800/50 border-gray-700 text-left pr-10"
                        dir="ltr"
                      />
                    </div>

                    {error && (
                      <p className="text-sm text-red-500">{error}</p>
                    )}
                    {success && (
                      <p className="text-sm text-green-500">{success}</p>
                    )}

                    <Button
                      onClick={handleSave}
                      disabled={isSaving || !newAddress.trim()}
                      className="w-full flex items-center justify-center gap-2 bg-blue hover:bg-blue/90"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t('externalUsdcAddress.connecting')}
                        </>
                      ) : (
                        t('externalUsdcAddress.connectWalletButton')
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="text-gray-400">{t('externalUsdcAddress.connectedAddressLabel')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCopy}
                          className="text-blue hover:text-blue/90"
                          aria-label={t('externalUsdcAddress.copyButton')}
                        >
                          {copied ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleDelete}
                          disabled={isDeleting}
                          className="text-red-500 hover:text-red-400"
                          aria-label={t('externalUsdcAddress.deleteButton')}
                        >
                          <Trash2 className="w-4 h-4" />
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExternalUsdcAddress; 