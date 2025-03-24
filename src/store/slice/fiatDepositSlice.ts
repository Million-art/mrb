import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
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

export const fetchTransactions = createAsyncThunk(
  'fiatDeposit/fetchTransactions',
  async (telegramId: string, { rejectWithValue }) => {
    try {
      const q = query(collection(db, "receipts"), where("senderTgId", "==", telegramId));
      const querySnapshot = await new Promise<any>((resolve, reject) => {
        const unsubscribe = onSnapshot(q, resolve, reject);
        return () => unsubscribe();
      });

      const fetchedTransactions: Transaction[] = [];
      for (const transactionDoc of querySnapshot.docs) {
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

        const ambassadorDoc = await getDoc(doc(db, "staffs", data.ambassadorId));
        if (ambassadorDoc.exists()) {
          const ambassadorData = ambassadorDoc.data();
          transaction.ambassadorName = `${ambassadorData.firstName} ${ambassadorData.lastName}`;
        } else {
          transaction.ambassadorName = "Unknown Ambassador";
        }

        fetchedTransactions.push(transaction);
      }

      return fetchedTransactions;
    } catch (error) {
      return rejectWithValue('Failed to fetch transactions');
    }
  }
);

const fiatDepositSlice = createSlice({
  name: 'fiatDeposit',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action: PayloadAction<Transaction[]>) => {
        state.transactions = action.payload;
        state.loading = false;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to fetch transactions';
        state.loading = false;
      });
  },
});

export default fiatDepositSlice.reducer;