import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { RootState, AppDispatch } from "@/store/store";
import { 
  fetchTransferTransactions, 
  stopListeningToTransferTransactions 
} from "@/store/slice/transferTransactionSlice";
import { Loader2, RefreshCw, AlertCircle, ExternalLink, Frown } from "lucide-react";
import { telegramId } from "@/libs/telegram";

interface TransactionParty {
  label: string;
  id: string;
}

const TransferTransactions = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { 
    transferTransactions, 
    isLoading, 
    error, 
    lastUpdated 
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

  const formatUserId = (id: string | undefined) => {
    if (!id) {
      console.warn('Missing user ID in transaction');
      return t('transferTransactions.unknown');
    }
    return id;
  };

  const getTransactionParty = (transaction: any): TransactionParty => {
    if (!transaction) {
      console.error('Invalid transaction data');
      return { label: t('transferTransactions.unknown'), id: t('transferTransactions.unknown') };
    }

    if (transaction.type === 'transfer_in') {
      return {
        label: t('transferTransactions.partyLabels.from'),
        id: transaction.senderId || t('transferTransactions.unknown')
      };
    } else {
      return {
        label: t('transferTransactions.partyLabels.to'),
        id: transaction.recipientId || t('transferTransactions.unknown')
      };
    }
  };

  if (isLoading && !transferTransactions.length) {
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
          {isIndexError ? t('transferTransactions.databaseConfigNeeded') : error}
        </p>
        
        {isIndexError && (
          <div className="mb-4">
            <p className="text-gray-300 text-sm mb-2">
              {t('transferTransactions.databaseIndexRequired')}
            </p>
            <a
              href={error.match(/https:\/\/[^\s]+/)?.[0] || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline flex items-center justify-center gap-1"
            >
              <span>{t('transferTransactions.clickToCreate')}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
        
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          {t('transferTransactions.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl">{t('transferTransactions.title')}</h2>
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
          {t('transferTransactions.refresh')}
        </button>
      </div>

      {transferTransactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-500">
          <Frown className="w-8 h-8 mb-3 text-gray-400" />
          <p className="text-sm">{t('transferTransactions.noTransactions')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-5 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  {t('transferTransactions.tableHeaders.type')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  {t('transferTransactions.tableHeaders.party')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  {t('transferTransactions.tableHeaders.amount')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  {t('transferTransactions.tableHeaders.balance')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  {t('transferTransactions.tableHeaders.date')}
                </th>
              </tr>
            </thead>
            <tbody>
              {transferTransactions.map((transaction) => {
                const party = getTransactionParty(transaction);
                const isReceived = transaction.type === 'transfer_in';
                return (
                  <tr key={transaction.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        isReceived
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {isReceived
                          ? t('transferTransactions.transactionTypes.received')
                          : t('transferTransactions.transactionTypes.sent')}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {`${party.label}: ${formatUserId(party.id)}`}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={isReceived ? 'text-green-500' : 'text-red-500'}>
                        {isReceived
                          ? t('transferTransactions.amountFormat.positive', { amount: Math.abs(transaction.amount).toFixed(2) })
                          : t('transferTransactions.amountFormat.negative', { amount: Math.abs(transaction.amount).toFixed(2) })}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      ${transaction.balance.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {lastUpdated && (
        <p className="text-xs text-gray-500 text-right">
          {t('transferTransactions.lastUpdated')} {new Date(lastUpdated).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
};

export default TransferTransactions;