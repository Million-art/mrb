import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { collection, query, where, onSnapshot, doc, getDoc, orderBy, limit } from "firebase/firestore";
import { db } from "@/libs/firebase";

interface Transaction {
  id: string;
  amount: number;
  senderTgId: string;
  ambassadorId: string;
  documents: string[];
  createdAt: string;
  status: string;
  ambassadorName?: string;
}

interface FiatDepositState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
}

const initialState: FiatDepositState = {
  transactions: [],
  loading: false,
  error: null,
};

// Store unsubscribe function outside of Redux
let unsubscribeListener: (() => void) | null = null;

export const fetchTransactions = createAsyncThunk(
  'fiatDeposit/fetchTransactions',
  async (telegramId: string, { dispatch, rejectWithValue }) => {
    try {
      // Clean up previous listener if exists
      if (unsubscribeListener) {
        unsubscribeListener();
        unsubscribeListener = null;
      }

      const q = query(
        collection(db, "receipts"),
        where("senderTgId", "==", telegramId),
        orderBy("createdAt", "desc"),
        limit(10)
      );

      return new Promise<void>((resolve, reject) => {
        unsubscribeListener = onSnapshot(q, 
          async (querySnapshot) => {
            const transactionsPromises = querySnapshot.docs.map(async (transactionDoc) => {
              const data = transactionDoc.data();
              const transaction: Transaction = {
                id: transactionDoc.id,
                amount: data.amount,
                senderTgId: data.senderTgId,
                ambassadorId: data.ambassadorId,
                documents: data.documents,
                status: data.status,
                createdAt: data.createdAt,
              };

              try {
                const ambassadorDoc = await getDoc(doc(db, "staffs", data.ambassadorId));
                if (ambassadorDoc.exists()) {
                  const ambassadorData = ambassadorDoc.data();
                  transaction.ambassadorName = `${ambassadorData.firstName} ${ambassadorData.lastName}`;
                } else {
                  transaction.ambassadorName = "Unknown Ambassador";
                }
              } catch (error) {
                console.error("Error fetching ambassador:", error);
                transaction.ambassadorName = "Error loading ambassador";
              }

              return transaction;
            });

            try {
              const transactions = await Promise.all(transactionsPromises);
              dispatch(setTransactions(transactions));
            } catch (error) {
              console.error("Error processing transactions:", error);
              dispatch(setError("Error processing transactions"));
            }
          },
          (error) => {
            console.error("Snapshot error:", error);
            dispatch(setError('Failed to listen to transactions'));
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

export const stopListeningToTransactions = createAsyncThunk(
  'fiatDeposit/stopListening',
  async (_, { dispatch }) => {
    if (unsubscribeListener) {
      unsubscribeListener();
      unsubscribeListener = null;
    }
    dispatch(clearTransactions());
  }
);

const fiatDepositSlice = createSlice({
  name: 'fiatDeposit',
  initialState,
  reducers: {
    setTransactions: (state, action: PayloadAction<Transaction[]>) => {
      state.transactions = action.payload;
      state.loading = false;
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearTransactions: (state) => {
      state.transactions = [];
      state.loading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to fetch transactions';
        state.loading = false;
      });
  },
});

export const { setTransactions, setError, clearTransactions } = fiatDepositSlice.actions;
export default fiatDepositSlice.reducer;