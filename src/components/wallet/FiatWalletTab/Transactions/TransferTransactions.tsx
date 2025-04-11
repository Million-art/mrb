import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store/store";
import { 
  fetchTransferTransactions, 
  stopListeningToTransferTransactions 
} from "@/store/slice/transferTransactionSlice";
import { Loader2, RefreshCw, AlertCircle, ExternalLink } from "lucide-react";
import { telegramId } from "@/libs/telegram";

const TransferTransactions = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    transferTransactions, 
    isLoading, 
    error, 
  } = useSelector((state: RootState) => state.transferTransactions);

  useEffect(() => {
    dispatch(fetchTransferTransactions(String(telegramId)));
    
    return () => {
      dispatch(stopListeningToTransferTransactions());
    };
  }, [dispatch, telegramId]);

  const handleRefresh = () => {
    dispatch(fetchTransferTransactions(String(telegramId)));
  };

  if (isLoading && !transferTransactions.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (error) {
    const isIndexError = error.includes("The query requires an index");
    
    return (
      <div className="flex flex-col items-center justify-center h-64 p-4 text-center">
        <AlertCircle className="text-red-500 w-8 h-8 mb-2" />
        <p className="text-red-500 mb-2">
          {isIndexError ? "Database configuration needed" : error}
        </p>
        
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
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2  text-blue"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Transfer History</h2>
        <button
          onClick={handleRefresh}
          className="flex items-center text-sm text-blue hover:text-blue-light"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="animate-spin mr-1" size={16} />
          ) : (
            <RefreshCw className="mr-1" size={16} />
          )}
          Refresh
        </button>
      </div>

      {transferTransactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-500">
          <p>No transfer transactions found</p>
          <p className="text-sm mt-2">Your transfer history will appear here</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Recipient
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {transferTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    ${transaction.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {transaction.recipientId}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
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

export default TransferTransactions;