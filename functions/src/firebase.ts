import * as admin from "firebase-admin";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Initialize Firebase Admin SDK (only if it hasn't been initialized already)
if (!admin.apps.length) {
  admin.initializeApp();
}

export default admin;