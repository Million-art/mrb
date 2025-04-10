import { db } from "@/libs/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export const getCustomerIdByTelegramId = async (telegramId: string) => {
  // Query the customers collection where telegram_id equals the provided ID
  const q = query(
    collection(db, "customers"),
    where("telegram_id", "==", telegramId)
  );
  
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return undefined;
  }
  
  // Return the kontigoCustomerId from the first matching document
  return querySnapshot.docs[0].data().kontigoCustomerId;
};