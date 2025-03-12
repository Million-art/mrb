import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_SECRET_KEY,
  authDomain: "mrjohn-8ee8b.firebaseapp.com",
  projectId: "mrjohn-8ee8b",
  storageBucket: "mrjohn-8ee8b.appspot.com",
  messagingSenderId: "662877699866",
  appId: "1:662877699866:web:451ade51fbfafafed236a3",
  measurementId: "G-BBLWJYWS31",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const functions = getFunctions(app);
const storage = getStorage(app); // Ensure storage is initialized

// Export Firebase instances
export { app, db, functions, storage };
