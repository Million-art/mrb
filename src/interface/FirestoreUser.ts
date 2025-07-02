import { DocumentData } from "firebase/firestore";


export interface FirestoreUser extends DocumentData {
    balance: number; //POINT
    realBalance: number; //USDC
    firstName: string;
    lastName: string;
    userImage?: string | null;
    username?: string;
    languageCode?: string;
    referrals: string[];
    referredBy?: string | null;
    isPremium: boolean;
    walletAddress?: string | null; //Telegram wallet
    daily: {
      claimedTime?: Date | null;
      claimedDay: number;
    };
    completedTasks: string[];
    
  }
  
  
  