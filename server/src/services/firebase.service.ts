import admin from "firebase-admin";

let firebaseAdmin: admin.app.App | null = null;

export function getFirebaseAdmin() {
  if (!firebaseAdmin) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      try {
        firebaseAdmin = admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        console.log("Firebase Admin initialized successfully.");
      } catch (error) {
        console.error("Firebase Admin initialization failed:", error);
      }
    } else {
      console.warn("Firebase Admin credentials not fully provided. Some backend features may be disabled.");
    }
  }
  return firebaseAdmin;
}

export const db = () => {
    const app = getFirebaseAdmin();
    return app ? app.firestore() : null;
};

export const auth = () => {
    const app = getFirebaseAdmin();
    return app ? app.auth() : null;
};
