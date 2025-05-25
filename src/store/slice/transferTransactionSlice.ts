import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,  
  getDoc, 
  orderBy, 
  limit,
  DocumentData,
  QueryDocumentSnapshot,
  doc as firestoreDoc 
} from "firebase/firestore";
import { db } from "@/libs/firebase";

interface TransferData {
  amount: number;
  recipientId: string;
  createdAt: string;
}

interface TransferTransaction {
  id: string;
  amount: number;
  recipientId: string;
  createdAt: string;
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
  lastUpdated: null,
};

let transferTransactionsUnsubscribe: (() => void) | null = null;

export const fetchTransferTransactions = createAsyncThunk(
  'transferTransactions/fetchTransferTransactions',
  async (telegramId: string, { dispatch, rejectWithValue }) => {
    try {
      // Clean up previous listener if exists
      if (transferTransactionsUnsubscribe) {
        transferTransactionsUnsubscribe();
        transferTransactionsUnsubscribe = null;
      }

      const q = query(
        collection(db, "transfers"),
        where("senderTgId", "==", telegramId),
        orderBy("createdAt", "desc"),
        limit(10)
      );

      return new Promise<void>((resolve, reject) => {
        transferTransactionsUnsubscribe = onSnapshot(q, 
          async (querySnapshot) => {
            const transactionsPromises = querySnapshot.docs.map(async (snapshot: QueryDocumentSnapshot<DocumentData>) => {
              const data = snapshot.data() as TransferData;
              const transaction: TransferTransaction = {
                id: snapshot.id,
                amount: data.amount,
                recipientId: data.recipientId,
                createdAt: data.createdAt,
              };

              try {
                const recipientDocRef = firestoreDoc(db, "recipients", data.recipientId);
                const recipientDoc = await getDoc(recipientDocRef);
                
                if (recipientDoc.exists()) {
                  const recipientData = recipientDoc.data() as { id: string; };
                  transaction.recipientId = recipientData.id;
                } else {
                  console.error("Recipient not found:", data.recipientId);
                }
              } catch (error) {
                console.error("Error fetching recipient:", error);
                dispatch(setTransferTransactionsError("Error fetching recipient data"));
                return null; // Return null if there's an error
              }
              return transaction;
            });

            try {
              const transactions = (await Promise.all(transactionsPromises)).filter(t => t !== null) as TransferTransaction[];
              dispatch(setTransferTransactions({
                transactions,
                lastUpdated: new Date().toISOString()
              }));
            } catch (error) {
              console.error("Error processing transactions:", error);
              dispatch(setTransferTransactionsError("Error processing transactions"));
            }
          },
          (error) => {
            console.error("Snapshot error:", error);
            dispatch(setTransferTransactionsError('Failed to listen to transactions'));
            reject(error);
          }
        );
        resolve();
      });
    } catch (error) {
      return rejectWithValue('Failed to setup transaction listener');
    }
  }
);

export const stopListeningToTransferTransactions = createAsyncThunk(
  'transferTransactions/stopListening',
  async (_, { dispatch }) => {
    if (transferTransactionsUnsubscribe) {
      transferTransactionsUnsubscribe();
      transferTransactionsUnsubscribe = null;
    }
    dispatch(clearTransferTransactions());
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