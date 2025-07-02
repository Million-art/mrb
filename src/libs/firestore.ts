import { Timestamp } from "firebase/firestore";
import { db } from './firebase';
import { doc, updateDoc} from 'firebase/firestore';

export const convertTimestamps = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') return obj;
    
    if (obj instanceof Timestamp) {
      return obj.toMillis();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(convertTimestamps);
    }
  
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, convertTimestamps(value)])
    );
  };

// Function to update user language in Firestore
export const updateUserLanguage = async (userId: string, languageCode: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      languageCode: languageCode,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error updating user language:', error);
    throw error;
  }
};