import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/libs/firebase";

interface ExchangeRate {
  id: string;
  countryCode: string;
  currencyCode: string;
  rate: number;
  countryName: string;
  updatedAt: string;
  updatedBy: string;
}

const ExchangeRates = () => {
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
      setError(err.message || 'Failed to fetch exchange rates');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="animate-spin text-white w-5 h-5" />
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
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="text-left py-2 px-2 text-gray-400 font-medium text-xs">Country</th>
            <th className="text-left py-2 px-2 text-gray-400 font-medium text-xs">Currency</th>
            <th className="text-right py-2 px-2 text-gray-400 font-medium text-xs">Rate</th>
            <th className="text-right py-2 px-2 text-gray-400 font-medium text-xs">Date</th>
          </tr>
        </thead>
        <tbody>
          {exchangeRates.map((rate) => (
            <tr key={rate.id} className="border-b border-gray-800 hover:bg-gray-800/50">
              <td className="py-2 px-2 text-white text-xs">{rate.countryName}</td>
              <td className="py-2 px-2 text-white text-xs">{rate.currencyCode}</td>
              <td className="py-2 px-2 text-white text-xs text-right">{rate.rate.toFixed(2)}</td>
              <td className="py-2 px-2 text-gray-400 text-xs text-right">
                {new Date(rate.updatedAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
          {exchangeRates.length === 0 && (
            <tr>
              <td colSpan={4} className="py-3 text-center text-gray-400 text-xs">
                No exchange rates available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ExchangeRates; 