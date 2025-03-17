import * as functions from 'firebase-functions';
import admin from '../firebase'; 

const db = admin.firestore();

interface CreateAmbassadorUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tgUsername: string;
  phone: string;
  country: string;
}


interface CreateAmbassadorUserResponse {
  message: string;
  uid: string;
}

export const createAmbassadorUser = functions.https.onCall(
  async (request: functions.https.CallableRequest<CreateAmbassadorUserRequest>): Promise<CreateAmbassadorUserResponse> => {
    const data = request.data; // Extract input data

    // Validate input data
    if (!data.email || !data.password || !data.firstName || !data.tgUsername || !data.lastName || !data.phone || !data.country) {
      throw new functions.https.HttpsError("invalid-argument", "All fields are required.");
    }

    let user: admin.auth.UserRecord | null = null; 

    try {
      // Step 1: Create Firebase Auth User
      user = await admin.auth().createUser({
        email: data.email,
        password: data.password,
      });

      // Step 2: Firestore Transaction
      await db.runTransaction(async (transaction) => {
        const userRef = db.collection("staffs").doc(user!.uid);
        transaction.set(userRef, {
          firstName: data.firstName,
          lastName: data.lastName,
          tgUsername: data.tgUsername,
          email: data.email,
          phone: data.phone,
          country: data.country,
          uid: user!.uid,
          kyc: "pending",
          role: "ambassador", 
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      // Step 3: Set Custom Claims (Directly using Admin SDK)
      await admin.auth().setCustomUserClaims(user.uid, { role: "ambassador" }); // Use `role` field for consistency

      // Step 4: Send Email Verification (Optional)
      await admin.auth().generateEmailVerificationLink(data.email);

      return { message: "Ambassador user created successfully", uid: user.uid };
    } catch (error: any) {
      console.error("Error:", error);

      // Rollback: Delete User if Firestore or Custom Claims Fail
      if (user) {
        await admin.auth().deleteUser(user.uid);
      }

      // Handle specific errors
      if (error.code === "auth/email-already-exists") {
        throw new functions.https.HttpsError("already-exists", "Email is already in use.");
      } else if (error.code === "auth/invalid-email") {
        throw new functions.https.HttpsError("invalid-argument", "Invalid email address.");
      } else if (error.code === "auth/weak-password") {
        throw new functions.https.HttpsError("invalid-argument", "Password is too weak.");
      } else {
        throw new functions.https.HttpsError("internal", "An error occurred. Please try again.");
      }
    }
  }
);