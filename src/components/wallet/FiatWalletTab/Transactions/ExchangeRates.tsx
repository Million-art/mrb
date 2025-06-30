import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/libs/firebase";
import { ScrollArea } from "@/components/stonfi/ui/scroll-area";

interface ExchangeRate {
  id: string;
  currencyCode: string;
  rate: number;
  countryName: string;
  updatedAt: string;
  updatedBy: string;
}

const ExchangeRates = () => {
  const { t } = useTranslation();
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExchangeRates();
  }, []);

  const fetchExchangeRates = async () => {
    try {
      setLoading(true);
      const exchangeRatesRef = collection(db, "exchangeRates");
      const q = query(exchangeRatesRef, orderBy("updatedAt", "desc"));
      const querySnapshot = await getDocs(q);
      
      const rates = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ExchangeRate[];

      setExchangeRates(rates);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching exchange rates:", err);
      setError(t('exchangeRates.error'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="animate-spin text-white w-5 h-5" />
        <span className="ml-2 text-sm">{t('exchangeRates.loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-32">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-3">
        {exchangeRates.map((rate) => (
          <div
            key={rate.id}
            className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <img
                  src={`https://flagcdn.com/${rate.countryName.toLowerCase().replace(/\s+/g, '-')}.svg`}
                  alt={rate.countryName}
                  className="w-7 h-5 object-cover rounded"
                />
              </div>
              <div>
                <h3 className="font-medium text-white text-sm">{rate.countryName}</h3>
                <p className="text-xs text-gray-400">{rate.currencyCode}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-base font-semibold text-white">
                {t('exchangeRates.exchangeRateFormat', { rate: rate.rate.toFixed(2), currency: rate.currencyCode })}
              </p>
              <p className="text-xs text-gray-400">
                {t('exchangeRates.updated', { date: new Date(rate.updatedAt).toLocaleDateString() })}
              </p>
            </div>
          </div>
        ))}
        {exchangeRates.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            {t('exchangeRates.noRatesAvailable')}
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export default ExchangeRates; 