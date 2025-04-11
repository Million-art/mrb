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

interface AmbassadorData {
  firstName: string;
  lastName: string;
  [key: string]: unknown; // For any additional properties
}

interface ReceiptData {
  amount: number;
  senderTgId: string;
  ambassadorId: string;
  documents: string[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface DepositTransaction {
  id: string;
  amount: number;
  senderTgId: string;
  ambassadorId: string;
  documents: string[];
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  ambassadorName?: string;
}

interface DepositTransactionsState {
  depositTransactions: DepositTransaction[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: DepositTransactionsState = {
  depositTransactions: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
};

let depositTransactionsUnsubscribe: (() => void) | null = null;

export const fetchDepositTransactions = createAsyncThunk(
  'depositTransactions/fetchDepositTransactions',
  async (telegramId: string, { dispatch, rejectWithValue }) => {
    try {
      // Clean up previous listener if exists
      if (depositTransactionsUnsubscribe) {
        depositTransactionsUnsubscribe();
        depositTransactionsUnsubscribe = null;
      }

      const q = query(
        collection(db, "receipts"),
        where("senderTgId", "==", telegramId),
        orderBy("createdAt", "desc"),
        limit(10)
      );

      return new Promise<void>((resolve, reject) => {
        depositTransactionsUnsubscribe = onSnapshot(q, 
          async (querySnapshot) => {
            const transactionsPromises = querySnapshot.docs.map(async (snapshot: QueryDocumentSnapshot<DocumentData>) => {
              const data = snapshot.data() as ReceiptData;
              const transaction: DepositTransaction = {
                id: snapshot.id,
                amount: data.amount,
                senderTgId: data.senderTgId,
                ambassadorId: data.ambassadorId,
                documents: data.documents,
                status: data.status,
                createdAt: data.createdAt,
              };

              try {
                const ambassadorDocRef = firestoreDoc(db, "staffs", data.ambassadorId);
                const ambassadorDoc = await getDoc(ambassadorDocRef);
                if (ambassadorDoc.exists()) {
                  const ambassadorData = ambassadorDoc.data() as AmbassadorData;
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
              dispatch(setDepositTransactions({
                transactions,
                lastUpdated: new Date().toISOString()
              }));
            } catch (error) {
              console.error("Error processing transactions:", error);
              dispatch(setDepositTransactionsError("Error processing transactions"));
            }
          },
          (error) => {
            console.error("Snapshot error:", error);
            dispatch(setDepositTransactionsError('Failed to listen to transactions'));
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

export const stopListeningToDepositTransactions = createAsyncThunk(
  'depositTransactions/stopListening',
  async (_, { dispatch }) => {
    if (depositTransactionsUnsubscribe) {
      depositTransactionsUnsubscribe();
      depositTransactionsUnsubscribe = null;
    }
    dispatch(clearDepositTransactions());
  }
);

const depositTransactionsSlice = createSlice({
  name: 'depositTransactions',
  initialState,
  reducers: {
    setDepositTransactions: (state, action: PayloadAction<{
      transactions: DepositTransaction[];
      lastUpdated: string;
    }>) => {
      state.depositTransactions = action.payload.transactions;
      state.lastUpdated = action.payload.lastUpdated;
      state.isLoading = false;
      state.error = null;
    },
    setDepositTransactionsError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearDepositTransactions: (state) => {
      state.depositTransactions = [];
      state.isLoading = false;
      state.error = null;
      state.lastUpdated = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDepositTransactions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDepositTransactions.rejected, (state, action) => {
        state.error = action.payload as string || 'Failed to fetch deposit transactions';
        state.isLoading = false;
      });
  },
});

export const { 
  setDepositTransactions, 
  setDepositTransactionsError, 
  clearDepositTransactions 
} = depositTransactionsSlice.actions;

export default depositTransactionsSlice.reducer;