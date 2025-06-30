import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { RootState, AppDispatch } from "@/store/store";
import { 
  fetchDepositTransactions, 
  stopListeningToDepositTransactions 
} from "@/store/slice/depositTransactionsSlice";
import { Loader2, RefreshCw, AlertCircle, ExternalLink, Frown } from "lucide-react";
import { telegramId } from "@/libs/telegram";

const DepositTransactions = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { 
    depositTransactions, 
    isLoading, 
    error, 
    lastUpdated 
  } = useSelector((state: RootState) => state.depositTransactions);

  useEffect(() => {
    dispatch(fetchDepositTransactions(String(telegramId)));
    
    return () => {
      dispatch(stopListeningToDepositTransactions());
    };
  }, [dispatch, telegramId]);

  const handleRefresh = () => {
    dispatch(fetchDepositTransactions(String(telegramId)));
  };

  if (isLoading && !depositTransactions.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (error) {
    const isIndexError = error.includes("The query requires an index");
    
    return (
      <div className="flex flex-col items-center justify-center h-64 py-4 text-center">
        <AlertCircle className="text-red-500 w-8 h-8 mb-2" />
        <p className="text-red-500 mb-2">
          {isIndexError ? t('depositTransactions.databaseConfigNeeded') : error}
        </p>
        
        {isIndexError && (
          <div className="mb-4">
            <p className="text-gray-300 text-sm mb-2">
              {t('depositTransactions.databaseIndexRequired')}
            </p>
            <a
              href={error.match(/https:\/\/[^\s]+/)?.[0] || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline flex items-center justify-center gap-1"
            >
              <span>{t('depositTransactions.clickToCreate')}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
        
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          {t('depositTransactions.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl">{t('depositTransactions.title')}</h2>
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
          {t('depositTransactions.refresh')}
        </button>
      </div>

      {depositTransactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-500">
          <Frown className="w-8 h-8 mb-3 text-gray-400" />
          <p className="text-sm">{t('depositTransactions.noTransactions')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-5 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium  uppercase tracking-wider">
                  {t('depositTransactions.tableHeaders.ambassador')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium  uppercase tracking-wider">
                  {t('depositTransactions.tableHeaders.amount')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium  uppercase tracking-wider">
                  {t('depositTransactions.tableHeaders.status')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium  uppercase tracking-wider">
                  {t('depositTransactions.tableHeaders.date')}
                </th>
              </tr>
            </thead>
            <tbody className=" ">
              {depositTransactions.map((transaction) => (
                <tr key={transaction.id} className="">
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {transaction.ambassadorName}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm ">
                    {transaction.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      transaction.status === 'approved' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : transaction.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {t(`depositTransactions.statuses.${transaction.status}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm ">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {lastUpdated && (
        <p className="text-xs text-gray-500 text-right">
          {t('depositTransactions.lastUpdated')} {new Date(lastUpdated).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
};

export default DepositTransactions;