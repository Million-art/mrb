import * as functions from 'firebase-functions';
import admin from '../firebase'; 

const db = admin.firestore();

interface CreateAdminUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tgUsername: string;
  phone: string;
}

interface CreateAdminUserResponse {
  message: string;
  uid: string;
}

export const createAdminUser = functions.https.onCall(
  async (request: functions.https.CallableRequest<CreateAdminUserRequest>): Promise<CreateAdminUserResponse> => {
    const data = request.data; // Extract input data
    const context = request.auth; // Extract authentication context

    // Ensure only Super Admins can create admins
    if (!context?.token?.superadmin) {
      throw new functions.https.HttpsError("permission-denied", "Only superadmins can create admin users");
    }

    let user: admin.auth.UserRecord | null = null; // Explicitly type user

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
          uid: user!.uid,
          role: "admin",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      // Step 3: Set Custom Claims (Directly using Admin SDK)
      await admin.auth().setCustomUserClaims(user.uid, { role: "admin" });

      return { message: "Admin user created successfully", uid: user.uid };
    } catch (error: any) {
      console.error("Error:", error);

      // Rollback: Delete User if Firestore or Custom Claims Fail
      if (user) {
        await admin.auth().deleteUser(user.uid);
      }

      throw new functions.https.HttpsError("internal", error.message);
    }
  }
);