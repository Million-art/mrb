import { configureStore } from '@reduxjs/toolkit';
import userSlice from './slice/userSlice'
import tasksReducer from './slice/tasksSlice'
import calculateSlice from './slice/calculateSlice'
import coinShowSlice from './slice/coinShowSlice'
import messageSlice from './slice/messageSlice'
import topUsersSlice from './slice/topUsersSlice'
import premiumSlice from './slice/PremiumSlice'
import walletSlice from './slice/walletSlice'
import swapSettingsSlice from "./slice/swapSettingsSlice";
import swapFormSlice from "./slice/swapForm";
import swapTransactionSlice from "./slice/swapTransactionSlice";
import liquidityFormSlice from "./slice/LiqudityForm";
import fiatDepositSlice from "./slice/fiatDepositSlice";
import fiatBalanceSlice from "./slice/fiatBalanceSlice";
import depositReceiptSlice from "./slice/depositReceiptSlice";

export const store = configureStore({
    reducer: {
        user: userSlice,
        tasks: tasksReducer,
        calculate: calculateSlice,
        coinShow: coinShowSlice,
        message:messageSlice,
        topUsers:topUsersSlice,
        premium: premiumSlice,
        wallet: walletSlice,
        swapSettings: swapSettingsSlice,
        swapForm: swapFormSlice,
        swapTransaction:swapTransactionSlice,
        liquidityForm:liquidityFormSlice,
        fiatDeposit:fiatDepositSlice,
        fiatBalance:fiatBalanceSlice,
        depositReceipt:depositReceiptSlice,


    },
});


export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
