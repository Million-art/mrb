import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,  
  orderBy, 
  limit
} from "firebase/firestore";
import { db } from "@/libs/firebase";

interface TransferTransaction {
  id: string;
  userId: string;
  type: 'transfer_in' | 'transfer_out' | 'remittance_out';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  relatedTransferId?: string;
  relatedQuoteId?: string;
  senderId?: string;
  recipientId?: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

interface TransferTransactionsState {
  transferTransactions: TransferTransaction[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: TransferTransactionsState = {
  transferTransactions: [],
  isLoading: false,
  error: null,
  lastUpdated: null
};

export const fetchTransferTransactions = createAsyncThunk(
  'transferTransactions/fetchTransferTransactions',
  async (userId: string, { dispatch }) => {
    try {
      const transactionsRef = collection(db, 'transactions');
      
      // Create queries for different transaction types
      const incomingQuery = query(
        transactionsRef,
        where('userId', '==', userId),
        where('type', '==', 'transfer_in'),
        orderBy('createdAt', 'desc'),
        limit(25)
      );

      const outgoingQuery = query(
        transactionsRef,
        where('userId', '==', userId),
        where('type', 'in', ['transfer_out', 'remittance_out']),
        orderBy('createdAt', 'desc'),
        limit(25)
      );

      return new Promise<void>((resolve, reject) => {
        let incomingUnsubscribe: (() => void) | null = null;
        let outgoingUnsubscribe: (() => void) | null = null;
        let incomingTransactions: TransferTransaction[] = [];
        let outgoingTransactions: TransferTransaction[] = [];

        const processTransactions = () => {
          // Log the raw data we're getting
          console.log('Incoming transactions:', incomingTransactions);
          console.log('Outgoing transactions:', outgoingTransactions);

          // Combine and sort transactions
          const allTransactions = [...incomingTransactions, ...outgoingTransactions]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 50);

          dispatch(setTransferTransactions({
            transactions: allTransactions,
            lastUpdated: new Date().toISOString()
          }));
        };

        // Listen to incoming transfers
        incomingUnsubscribe = onSnapshot(
          incomingQuery,
          (snapshot) => {
            incomingTransactions = snapshot.docs.map(doc => {
              const data = doc.data();
              console.log('Raw incoming transaction data:', data);
              if (!data.senderId || !data.recipientId) {
                console.warn('Transaction missing senderId or recipientId:', data);
              }
              return {
                id: doc.id,
                ...data
              } as TransferTransaction;
            });
            processTransactions();
          },
          (error) => {
            console.error('Error fetching incoming transfers:', error);
            if (error.message.includes('requires an index')) {
              dispatch(setTransferTransactionsError(
                'Database index is being created. Please try again in a few minutes.'
              ));
            } else {
              dispatch(setTransferTransactionsError('Failed to fetch incoming transfers'));
            }
          }
        );

        // Listen to outgoing transfers
        outgoingUnsubscribe = onSnapshot(
          outgoingQuery,
          (snapshot) => {
            outgoingTransactions = snapshot.docs.map(doc => {
              const data = doc.data();
              console.log('Raw outgoing transaction data:', data);
              if (!data.senderId || !data.recipientId) {
                console.warn('Transaction missing senderId or recipientId:', data);
              }
              return {
                id: doc.id,
                ...data
              } as TransferTransaction;
            });
            processTransactions();
          },
          (error) => {
            console.error('Error fetching outgoing transfers:', error);
            if (error.message.includes('requires an index')) {
              dispatch(setTransferTransactionsError(
                'Database index is being created. Please try again in a few minutes.'
              ));
            } else {
              dispatch(setTransferTransactionsError('Failed to fetch outgoing transfers'));
            }
          }
        );

        // Store unsubscribe functions
        (window as any).transferTransactionsUnsubscribe = () => {
          if (incomingUnsubscribe) incomingUnsubscribe();
          if (outgoingUnsubscribe) outgoingUnsubscribe();
        };

        resolve();
      });
    } catch (error) {
      console.error('Error in fetchTransferTransactions:', error);
      throw error;
    }
  }
);

export const stopListeningToTransferTransactions = createAsyncThunk(
  'transferTransactions/stopListening',
  async () => {
    const unsubscribe = (window as any).transferTransactionsUnsubscribe;
    if (unsubscribe) {
      unsubscribe();
      (window as any).transferTransactionsUnsubscribe = null;
    }
  }
);

const transferTransactionsSlice = createSlice({
  name: 'transferTransactions',
  initialState,
  reducers: {
    setTransferTransactions: (state, action: PayloadAction<{
      transactions: TransferTransaction[];
      lastUpdated: string;
    }>) => {
      state.transferTransactions = action.payload.transactions;
      state.lastUpdated = action.payload.lastUpdated;
      state.isLoading = false;
      state.error = null;
    },
    setTransferTransactionsError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearTransferTransactions: (state) => {
      state.transferTransactions = [];
      state.isLoading = false;
      state.error = null;
      state.lastUpdated = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransferTransactions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTransferTransactions.rejected, (state, action) => {
        state.error = action.payload as string || 'Failed to fetch transfer transactions';
        state.isLoading = false;
      });
  },
});

export const { 
  setTransferTransactions, 
  setTransferTransactionsError, 
  clearTransferTransactions 
} = transferTransactionsSlice.actions;

export default transferTransactionsSlice.reducer;