import { RootState } from '@/store/store';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';

// Define user object type
export type TUser = {
  id: string;
  balance: number;
  userImage: string | null;
  firstName: string;
  lastName: string;
};

// Define slice state
export type TTopUsersSlice = {
  value: TUser[] | null;  
};

const initialState: TTopUsersSlice = {
  value: [],
};

const topUsersSlice = createSlice({
  name: 'topUsers',
  initialState,
  reducers: {
    setTopUsers: (state, action: PayloadAction<TUser[]>) => {
      state.value = action.payload;  
    },
  },
});

export const selectTopUsers = (state: RootState) => state.topUsers.value;
export const { setTopUsers } = topUsersSlice.actions;
export default topUsersSlice.reducer;
