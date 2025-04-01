import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store/store";
import { fetchTransactions, stopListeningToTransactions } from "@/store/slice/fiatDepositSlice";
import { Loader2, RefreshCw, AlertCircle, ExternalLink } from "lucide-react";
import { telegramId } from "@/libs/telegram";

const FiatTransactions = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { transactions, loading, error } = useSelector((state: RootState) => state.fiatDeposit);

  useEffect(() => {
    dispatch(fetchTransactions(String(telegramId)));
    
    return () => {
      dispatch(stopListeningToTransactions());
    };
  }, [dispatch, telegramId]);

  const handleRetry = () => {
    dispatch(fetchTransactions(String(telegramId)));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="animate-spin text-white w-8 h-8 mb-2" />
        <p className="text-gray-300">Loading transactions...</p>
      </div>
    );
  }

  if (error) {
    const isIndexError = error.includes("The query requires an index");
    
    return (
      <div className="flex flex-col items-center justify-center h-64 p-4 text-center">
        <AlertCircle className="text-red-500 w-8 h-8 mb-2" />
        <p className="text-red-500 mb-2">{isIndexError ? "Database configuration needed" : error}</p>
        
        {isIndexError && (
          <div className="mb-4">
            <p className="text-gray-300 text-sm mb-2">
              This feature requires a database index to be created.
            </p>
            <a
              href={error.match(/https:\/\/[^\s]+/)?.[0] || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline flex items-center justify-center gap-1"
            >
              <span>Click here to create it</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
        
        <button
          onClick={handleRetry}
          className="flex items-center gap-2 px-4 py-2 bg-blue text-white rounded-lg hover:bg-blue-light transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center pb-5 mb-5 h-[1/2] overflow-y-scroll scrollbar-hidden">
      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48">
          <p className="text-gray-300">No Deposit found.</p>
          <p className="text-gray-400 text-xs">Start a new Deposit to see it here.</p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <h1 className="text-center text-lg font-semibold mb-2">Your Deposit Details</h1>
          <table className="min-w-full rounded-lg shadow-md">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="px-2 py-2 text-left text-xs font-semibold text-gray-300">Ambassador</th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-gray-300">Amount</th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-gray-300">Status</th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-gray-300">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-gray-700 last:border-b-0">
                  <td className="px-2 py-2 text-xs text-gray-300">{transaction.ambassadorName}</td>
                  <td className="px-2 py-2 text-xs text-gray-300">{transaction.amount}</td>
                  <td className="px-2 py-2 text-xs text-gray-300">{transaction.status}</td>
                  <td className="px-2 py-2 text-xs text-gray-300">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FiatTransactions;