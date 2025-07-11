import React, { useState, useEffect, useCallback } from "react";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/libs/firebase";
import { Ambassador, PaymentMethod } from "@/interface/Ambassador";
import HourglassAnimation from "../AnimateLoader";
import { ArrowLeft, X, Loader2, Currency } from "lucide-react";
import { useTranslation } from "react-i18next";
import { telegramId } from "@/libs/telegram";
import { useDispatch } from "react-redux";
import { setShowMessage } from "@/store/slice/messageSlice";
import { dmDepositDetails } from "@/config/api";

interface Country {
  name: string;
}

interface ExchangeRate {
  id: string;
  currencyCode: string;
  rate: number;
  countryName: string;
  updatedAt: string;
}

interface ReceiveModalProps {
  country: Country;
  onClose: () => void;
}

const ErrorDisplay: React.FC<{ error: string }> = ({ error }) => (
  <div className="mt-4 text-center text-red-400 py-6 rounded-lg">{error}</div>
);

const PaymentMethodItem: React.FC<{
  method: PaymentMethod;
  isSelected: boolean;
  onSelect: () => void;
  maskAccountNumber: (accountNumber?: string) => string;
}> = ({ method, isSelected, onSelect, maskAccountNumber }) => {
  const { t } = useTranslation();
  
  return (
    <div
      className={`p-3 rounded-lg border cursor-pointer ${
        isSelected ? "border-blue bg-gray-700" : "border-gray-700 bg-gray-800"
      }`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSelect();
      }}
      aria-label={`Select ${method.details.bankName} payment method`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-white">{method.details.bankName}</span>
          </div>
          <p className="text-sm text-gray-400">
             {t('sendDepositDetails.account')} {maskAccountNumber(method.details.accountNumber)} 
             {/* Account: {method.details.accountNumber}  */}
          </p>
        </div>
        <div
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            isSelected ? "bg-blue text-white" : "bg-gray-700 text-gray-300"
          }`}
        >
          {isSelected ? t('sendDepositDetails.selected') : t('sendDepositDetails.select')}
        </div>
      </div>
    </div>
  );
};

const SendDepositDetails: React.FC<ReceiveModalProps> = ({ country, onClose }) => {
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<{
    ambassador: Ambassador;
    method: PaymentMethod;
  } | null>(null);
  const [loadingAmbassadors, setLoadingAmbassadors] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const maskAccountNumber = useCallback((accountNumber?: string) => {
    if (!accountNumber) return "••••";
    const visibleDigits = 4;
    return accountNumber.slice(-visibleDigits).padStart(accountNumber.length, "•");
  }, []);

  const fetchAmbassadors = useCallback(async () => {
    try {
      if (!country) return;

      setLoadingAmbassadors(true);
      setError(null);
      setAmbassadors([]);

      const q = query(
        collection(db, "staffs"),
        where("role", "==", "ambassador"),
        where("kyc", "==", "approved"),
        where("country", "==", country.name),
        limit(20)
      );
      const querySnapshot = await getDocs(q);
      const fetchedAmbassadors: Ambassador[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedAmbassadors.push({
          id: doc.id,
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          tgUsername: data.tgUsername || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          idFront: data.idFront || "",
          idBack: data.idBack || "",
          country: data.country || "",
          photoUrl: data.photoUrl || "",
          paymentMethods: (data.paymentMethods || []).map((method: any) => ({
            type: method.type || "bank",
            details: method.details || {},
          })),
          createdAt: data.createdAt.toDate(),
          role: data.role || "ambassador",
          kyc: data.kyc || "pending",
        });
      });

      console.log('Fetched ambassadors:', fetchedAmbassadors);

      setAmbassadors(fetchedAmbassadors);
    } catch (error) {
      console.error("Error fetching ambassadors:", error);
      setError("Failed to fetch ambassadors. Please try again later.");
    } finally {
      setLoadingAmbassadors(false);
    }
  }, [country]);

  const fetchExchangeRate = useCallback(async () => {
    try {
      const exchangeRatesRef = collection(db, "exchangeRates");
      const q = query(
        exchangeRatesRef,
        where("countryName", "==", country.name),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const rateData = doc.data() as Omit<ExchangeRate, 'id'>;
        setExchangeRate({
          id: doc.id,
          ...rateData
        });
      } else {
        setExchangeRate(null);
      }
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
      setExchangeRate(null);
    }
  }, [country.name]);

  useEffect(() => {
    fetchAmbassadors();
    fetchExchangeRate();
  }, [fetchAmbassadors, fetchExchangeRate]);

  const handlePaymentMethodSelect = useCallback(
    (methodId: string, ambassadorId: string) => {
      const ambassador = ambassadors.find((amb) => amb.id === ambassadorId);
      const method = ambassador?.paymentMethods.find(
        (m) => m.details.id === methodId
      );

      if (ambassador && method) {
        setSelectedPayment({ ambassador, method });
      }
    },
    [ambassadors]
  );

  const sendPaymentMethodToBot = useCallback(async () => {
    if (!selectedPayment) {
      setError(t('sendDepositDetails.selectPaymentFirst'));
      return;
    }

    setLoading(true);
    setError(null);

    const requestData = {
      jsonData: {
        paymentMethod: {
          type: selectedPayment.method.type,
          details: {
            id: selectedPayment.method.details.id,
            bankName: selectedPayment.method.details.bankName || '',
            accountNumber: selectedPayment.method.details.accountNumber || '',
          },
        },
        ambassador: {
          id: selectedPayment.ambassador.id,
          firstName: selectedPayment.ambassador.firstName || '',
          lastName: selectedPayment.ambassador.lastName || '',
          tgUsername: selectedPayment.ambassador.tgUsername || '',
        },
      },
      telegramId: String(telegramId),
    };

    try {
      const response = await dmDepositDetails(requestData);
        console.log('Request data:', requestData);
      console.log('Response from cloud function:', response.data);
      
      dispatch(setShowMessage({
        message: t('sendDepositDetails.detailsSentSuccess'),
        color: "green"
      }));
      
      // Delay the redirection to allow the user to read the message
      setTimeout(() => {
        onClose();
        window.location.href = `https://t.me/mrbeasapp_bot`; 
      }, 3000);
    } catch (error: any) {
      console.error("Error sending data to bot:", error);
      
      let errorMessage = t('sendDepositDetails.failedToSend');
      
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        errorMessage = t('sendDepositDetails.networkError');
      } else if (error.response) {
        // Handle API error responses
        errorMessage = error.response.data?.message || t('sendDepositDetails.serverError', { status: error.response.status });
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }

      setError(errorMessage);
      dispatch(setShowMessage({
        message: errorMessage,
        color: "red"
      }));
    } finally {
      setLoading(false);
    }
  }, [selectedPayment, onClose, telegramId, dispatch, t]);

  return (
    <div className="fixed bg-black inset-0 flex items-center justify-center h-[100vh] z-50">
      <div className="text-white w-full max-w-md flex flex-col max-h-[100vh] overflow-hidden">
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-800 sticky top-0 z-10">
          <button
            onClick={onClose}
            className="hover:text-gray-300"
            aria-label={t('sendDepositDetails.closeModal')}
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">{t('sendDepositDetails.title')}</h1>
          <button
            onClick={onClose}
            className="hover:text-gray-300"
            aria-label={t('sendDepositDetails.closeModal')}
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hidden">
          {country && (
            <div className="p-6">
              {/* Exchange Rate Display */}
              <div className="mb-6 p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Currency className="w-4 h-4 text-blue" />
                    <div>
                      {exchangeRate ? (
                        <>
                          <p className="text-sm text-gray-400">{t('sendDepositDetails.exchangeRate')}</p>
                          <p className="text-base font-medium">
                            1 USDC = {exchangeRate.rate.toFixed(2)} {exchangeRate.currencyCode}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-400">{t('sendDepositDetails.noExchangeRate')}</p>
                      )}
                    </div>
                  </div>
                  {exchangeRate && (
                    <p className="text-xs text-gray-500">
                      {new Date(exchangeRate.updatedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <p className="font-semibold text-lg">{country.name}</p>
                </div>
              </div>

              {loadingAmbassadors ? (
                <div className="mt-6 flex justify-center">
                  <HourglassAnimation />
                </div>
              ) : error ? (
                <ErrorDisplay error={error} />
              ) : ambassadors.length > 0 ? (
                <div className="mt-4">
                  {ambassadors.map((ambassador) => (
                    <div key={ambassador.id} className="mb-6">
                      {ambassador.paymentMethods.length > 0 ? (
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-gray-300">
                            {t('sendDepositDetails.paymentMethods')}
                          </h4>
                          {ambassador.paymentMethods.map((method, index) => {
                            const isSelected =
                              selectedPayment?.method.details.id ===
                                method.details.id &&
                              selectedPayment?.ambassador.id === ambassador.id;
                            return (
                              <PaymentMethodItem
                                key={index}
                                method={method}
                                isSelected={isSelected}
                                onSelect={() =>
                                  handlePaymentMethodSelect(
                                    method.details.id,
                                    ambassador.id
                                  )
                                }
                                maskAccountNumber={maskAccountNumber}
                              />
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center text-gray-400 py-4 rounded-lg">
                         </div>
                      )} 
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 text-center text-gray-400 py-6 rounded-lg">
                  {t('sendDepositDetails.noRechargeOption')}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 p-4 border-t border-gray-800">
          <button
            onClick={sendPaymentMethodToBot}
            disabled={!selectedPayment || loading}
            className={`w-full bg-blue text-white font-bold py-2 px-4 rounded ${
              !selectedPayment || loading
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-blue"
            }`}
            aria-label={t('sendDepositDetails.getDepositDetails')}
          >
            {loading ? (
              <Loader2 className="animate-spin mr-2 inline-block" />
            ) : (
              t('sendDepositDetails.getRechargeDetails')
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendDepositDetails;