import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/libs/firebase';

interface FiatBalanceState {
  realBalance: number;
  loading: boolean;
  error: string | null;
}

const initialState: FiatBalanceState = {
  realBalance: 0,
  loading: false,
  error: null,
};

export const fetchRealBalance = createAsyncThunk(
  'fiatBalance/fetchRealBalance',
  async (telegramId: string, { rejectWithValue }) => {
    try {
      const userRef = doc(db, 'users', telegramId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        console.error('User document not found for telegramId:', telegramId);
        return 0;
      }

      const userData = userDoc.data();
      const balance = userData.realBalance || 0;
      console.log('Fetched real balance:', { telegramId, balance });
      return balance;
    } catch (error) {
      console.error('Error fetching real balance:', error);
      return rejectWithValue('Failed to fetch real balance');
    }
  }
);

const fiatBalanceSlice = createSlice({
  name: 'fiatBalance',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRealBalance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRealBalance.fulfilled, (state, action: PayloadAction<number>) => {
        state.realBalance = action.payload;
        state.loading = false;
      })
      .addCase(fetchRealBalance.rejected, (state, action) => {
        state.error = action.payload as string;
        state.loading = false;
      });
  },
});

export default fiatBalanceSlice.reducer;