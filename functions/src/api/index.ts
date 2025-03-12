// functions/api/index.ts
import * as functions from 'firebase-functions';
import admin from '../firebase'; 

// Define the structure of the request data
interface ClaimTaskRequest {
  telegramId: string;
  taskId: string;
}

// Define the structure of the response data
interface ClaimTaskResponse {
  success: boolean;
}
// The rest of your code remains the same
export const claimTask = functions.https.onCall(
  async (request: functions.https.CallableRequest<ClaimTaskRequest>): Promise<ClaimTaskResponse> => {
    const { telegramId, taskId } = request.data;

    if (!telegramId || !taskId) {
      throw new functions.https.HttpsError('invalid-argument', 'Telegram ID and task ID are required.');
    }

    const userRef = admin.firestore().doc(`users/${telegramId}`);
    const taskRef = admin.firestore().doc(`tasks/${taskId}`);

    try {
      await admin.firestore().runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const taskDoc = await transaction.get(taskRef);

        if (!taskDoc.exists) {
          throw new functions.https.HttpsError('not-found', 'Task not found.');
        }

        const taskPoint = taskDoc.data()?.point;
        if (!taskPoint) {
          throw new functions.https.HttpsError('invalid-argument', 'Task point is missing.');
        }

        const completedTasks = userDoc.data()?.completedTasks || [];
        if (completedTasks.includes(taskId)) {
          throw new functions.https.HttpsError('already-exists', 'Task already claimed.');
        }

        transaction.update(userRef, {
          balance: admin.firestore.FieldValue.increment(taskPoint),
          completedTasks: admin.firestore.FieldValue.arrayUnion(taskId),
        });

        transaction.update(taskRef, {
          completions: admin.firestore.FieldValue.increment(1),
        });
      });

      return { success: true }; 
    } catch (error) {
      console.error('Error claiming task:', error);
      throw new functions.https.HttpsError('internal', 'Failed to claim task.');
    }
  }
);