import { Route, Routes, useNavigate } from "react-router-dom";
import { useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { 
  doc, onSnapshot, setDoc, getDocs, 
  query, collection, orderBy, limit, DocumentSnapshot 
} from "firebase/firestore";
import { db } from "@/libs/firebase";
import { toast, ToastContainer } from "react-toastify";
import { AppDispatch, RootState } from "@/store/store";
import { 
  telegramId, userName, firstName, 
  lastName, languageCode, 
  startParam
} from "@/libs/telegram";
import BottomNav from "@/components/BottomNav";
import Loading from "./screens/Loading";
import { Homes } from "./screens/Homes";
import Referrals from "./screens/Dao";
import Earn from "./screens/Earn";
import Daily from "./screens/Defi";
import Airdrop from "./screens/Wallet";
import Swap from "./screens/Swap";
import Pool from "./screens/Pool";
import { selectUser, setUser, TUser } from "./store/slice/userSlice";
import { selectCalculate } from "./store/slice/calculateSlice";
import { selectShowMessage, setShowMessage } from "./store/slice/messageSlice";
import { setTopUsers } from "./store/slice/topUsersSlice";
import { CONFIG } from "./libs/Config";
import { FirestoreUser } from "./interface/FirestoreUser";
import Remittance from "./components/wallet/FiatWalletTab/Remittance";
import FiatDeposit from "./components/wallet/FiatWalletTab/Deposit/FiatDeposit";
import UploadReceipt from "./components/wallet/FiatWalletTab/Deposit/UploadReceipt";
import { initializeReceiptData, setError } from "./store/slice/depositReceiptSlice";
import CreateCustomerPage from "./screens/CreateCustomerPage";
import CreateBankAccountPage from "./screens/CreateBankAccountPage";
import TrasferBalancePage from "./screens/TrasferBalancePage";
import AccountSettings from "./screens/AccountSettings";
import SettingsPage from "./screens/Settings";
import PrivacyPolicy from "./screens/PrivacyPolicy";

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser, shallowEqual);
  const calculate = useSelector((state: RootState) => selectCalculate(state), shallowEqual);
  const message = useSelector((state: RootState) => selectShowMessage(state), shallowEqual);
  const navigate = useNavigate();
   const isInitialized = useSelector((state: RootState) => state.depositReceipt.isInitialized);
  // Firebase user data processor
  const processUserData = useCallback((docSnap: DocumentSnapshot<FirestoreUser>): TUser => {
    const data = docSnap.data() || {} as FirestoreUser;
  
    // Convert claimedTime to milliseconds if it's a Date object
    const claimedTime = data.daily?.claimedTime instanceof Date
      ? data.daily.claimedTime.getTime()  
      : data.daily?.claimedTime || null;  
  
    return {
      uid: docSnap.id,
      balance: data.balance || 0,
      firstName: data.firstName,
      lastName: data.lastName || '',
      userImage: data.userImage || null,
      username: data.username,
      languageCode: data.languageCode,
      referrals: data.referrals || [],
      referredBy: data.referredBy || null,
      isPremium: data.isPremium || false,
      walletAddress: data.walletAddress || null,
      daily: {
        claimedTime,
        claimedDay: data.daily?.claimedDay || 0,
      },
      completedTasks: data.completedTasks || [],
    };
  }, []);


  useEffect(() => {
    const handleStartParam = () => {
      const decodeBase64URL = (str: string) => {
        str = str.replace(/-/g, '+').replace(/_/g, '/');
        while (str.length % 4) {
          str += '=';
        }
        return JSON.parse(Buffer.from(str, 'base64').toString());
      };

      if (startParam && !isInitialized) {
        try {
          const receiptData = decodeBase64URL(startParam);
          //dispatch initialized data
          dispatch(initializeReceiptData(receiptData))
          navigate('/upload-receipt', { replace: true });
        } catch (error:any) {
          console.error('Error parsing startParam:', error);
          //set dispatch error
          dispatch(setError(error));
        }
      }
    };

    handleStartParam();
  }, [navigate, startParam, isInitialized]);
 
useEffect(() => {
  let unsubscribe: () => void;
  const userRef = doc(db, "users", String(telegramId));

  const initializeUser = async () => {
    try {
      const cachedUser = localStorage.getItem(`user_${telegramId}`);
      if (cachedUser) {
        const { data, timestamp } = JSON.parse(cachedUser);
        if (Date.now() - timestamp < CONFIG.USER_CACHE_TTL) {
          dispatch(setUser(data));
        }
      }

      unsubscribe = onSnapshot(userRef, async (docSnap) => {
        // Type assertion here
        const userDocSnap = docSnap as DocumentSnapshot<FirestoreUser>;

        if (!userDocSnap.exists()) {
          await setDoc(userRef, {
            firstName,
            lastName: lastName || '',
            username: userName || null,
            languageCode,
            referrals: [],
            referredBy: null,
            balance: 0,
            realBalance: 0,
            daily: { claimedTime: null, claimedDay: 0 },
            walletAddress: null,
            isPremium: false,
            completedTasks: [],
          }, { merge: true });
          return;
        }

        const userData = processUserData(userDocSnap);
        localStorage.setItem(`user_${telegramId}`, JSON.stringify({
          data: userData,
          timestamp: Date.now()
        }));
        dispatch(setUser(userData));
      });
    } catch (error) {
      console.error("User initialization error:", error);
    }
  };

  initializeUser();
  return () => unsubscribe?.();
}, [dispatch, processUserData]);

  // Top users fetcher with caching
  const fetchTopUsers = useCallback(async () => {
    try {
      const cacheKey = 'topUsers';
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        if (Date.now() - timestamp < CONFIG.TOP_USERS_CACHE_TTL) {
          dispatch(setTopUsers(data));
          return;
        }
      }

      const usersRef = collection(db, "users");
      const q = query(
        usersRef, 
        orderBy("balance", "desc"), 
        limit(CONFIG.TOP_USERS_LIMIT)
      );

      const snapshot = await getDocs(q);
      const topUsers = snapshot.docs.map(docSnap => {
        const data = docSnap.data() as FirestoreUser;
        return {
          id: docSnap.id,
          balance: data.balance,
          userImage: data.userImage || null,
          firstName: data.firstName,
          lastName: data.lastName || '',
        };
      });

      localStorage.setItem(cacheKey, JSON.stringify({
        data: topUsers,
        timestamp: Date.now()
      }));
      dispatch(setTopUsers(topUsers));
    } catch (error) {
      console.error("Top users fetch error:", error);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchTopUsers();
    const interval = setInterval(fetchTopUsers, CONFIG.TOP_USERS_CACHE_TTL);
    return () => clearInterval(interval);
  }, [fetchTopUsers]);

  // Toast message handler
  useEffect(() => {
    if (message) {
      toast(message.message, {
        autoClose: CONFIG.TOAST.AUTO_CLOSE,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        closeButton: false,
      });
      dispatch(setShowMessage(null));
    }
  }, [message, dispatch]);

  // Memoized toast styles
  const toastStyles = useMemo(() => ({
    container: CONFIG.TOAST.STYLE.container,
    toast: {
      ...CONFIG.TOAST.STYLE.toast,
      backgroundColor: message?.color || "#00c000",
      color: "white"
    }
  }), [message?.color]);

  return (
    <>
      {user && calculate && <BottomNav />}
      
      <ToastContainer
        style={toastStyles.container}
        toastStyle={toastStyles.toast}
      />

      <Routes>
        <Route path="*" element={<Loading />} />
        <Route path="/" element={<Homes />} />
        <Route path="/referrals" element={<Referrals />} />
        <Route path="/earn" element={<Earn />} />
        <Route path="/defi" element={<Daily />} />
        <Route path="/wallet" element={<Airdrop />} />
        <Route path="/swap" element={<Swap />} />
        <Route path="/pool" element={<Pool />} />
        <Route path="/addliquidity" element={<Pool />} />
        <Route path="/remittance" element={<Remittance />} />
        <Route path="/fiat-deposit" element={<FiatDeposit />} />
        <Route path="/upload-receipt" element={<UploadReceipt />} />
        <Route path="/create-customer" element={<CreateCustomerPage />} />
        <Route path="/create-bank-account" element={<CreateBankAccountPage />} />
        <Route path="/balance-transfer" element={<TrasferBalancePage />} />
        <Route path="/account-settings" element={<AccountSettings />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      </Routes>
    </>
  );
}

export default App;