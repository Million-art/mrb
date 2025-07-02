import { convertTimestamps } from '@/libs/firestore';
import { RootState } from '@/store/store';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';

// Define user type
export type TUser = {
  uid: string;
  balance: number;
  daily?: {
    claimedTime: number | null; 
    claimedDay: number; // The current claim day
  };
  firstName: string;
  lastName: string;
  userImage: string | null;
  username?: string;
  languageCode?: string;
  referrals?: string[];
  referredBy?: string | null;
  isPremium?: boolean;
  walletAddress?: string | null;
  rank?: number;
  completedTasks?: string[];
};

export type TUserSlice = {
  value: TUser | null;
};

// Initial state
const initialState: TUserSlice = {
  value: null,
};

// Create the slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Action to set user data
    setUser: (state, action: PayloadAction<TUser>) => {
      const userData = action.payload;

      // Convert claimedTime to milliseconds if it exists
      if (userData.daily?.claimedTime) {
        userData.daily.claimedTime = convertTimestamps(userData.daily.claimedTime);
      }

      state.value = {
        ...userData,
        completedTasks: userData.completedTasks || [],
      };
    },
    // Action to clear user data
    clearUser: (state) => {
      state.value = null;
    },
    // Action to update user balance
    updateUserBalance: (state, action: PayloadAction<number>) => {
      if (state.value) {
        state.value.balance = action.payload; 
      }
    },
    // Action to add a task to completed tasks
    addCompletedTask: (state, action: PayloadAction<string>) => {
      if (state.value) {
        // Initialize completedTasks if undefined
        state.value.completedTasks = state.value.completedTasks || [];
        // Add the task if it's not already included
        if (!state.value.completedTasks.includes(action.payload)) {
          state.value.completedTasks.push(action.payload);
        }
      }
    },
    // Action to update user language
    updateUserLanguage: (state, action: PayloadAction<string>) => {
      if (state.value) {
        state.value.languageCode = action.payload;
      }
    },
  },
});

// Selector to get the user from the Redux state
export const selectUser = (state: RootState): TUser | null => state.user.value;

// Export actions and reducer
export const { setUser, clearUser, updateUserBalance, addCompletedTask, updateUserLanguage } = userSlice.actions;
export default userSlice.reducer;