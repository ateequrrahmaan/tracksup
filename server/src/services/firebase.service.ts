import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

let firebaseAdmin: admin.app.App | null = null;

export function getFirebaseAdmin() {
  if (firebaseAdmin) return firebaseAdmin;
  
  if (admin.apps.length > 0) {
    firebaseAdmin = admin.apps[0]!;
    return firebaseAdmin;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    try {
      // 1. Initial cleanup
      privateKey = privateKey.trim();
      
      // 2. Remove any surrounding quotes
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
      if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
        privateKey = privateKey.slice(1, -1);
      }

      // 3. Fix escaped newlines (literal \n characters)
      privateKey = privateKey.replace(/\\n/g, '\n').replace(/\\r/g, '');
      
      // 4. Ensure the key has the standard PEM headers if they are missing
      const header = "-----BEGIN PRIVATE KEY-----";
      const footer = "-----END PRIVATE KEY-----";
      
      // Remove header/footer if they exist to clean the body, then re-add correctly
      let body = privateKey
        .replace(header, "")
        .replace(footer, "")
        .replace(/\s/g, ""); // Remove all whitespace
      
      // Reconstruct PEM with 64-character lines for the body
      const chunks = body.match(/.{1,64}/g) || [];
      privateKey = `${header}\n${chunks.join("\n")}\n${footer}`;
      
      console.log(`[Firebase] Initializing Admin for project: ${projectId}`);
      
      firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      
      console.log("[Firebase] Admin initialized successfully.");
      return firebaseAdmin;
    } catch (error: any) {
      console.error("[Firebase] Initialization failed:", error.message);
      if (error.stack) console.error(error.stack);
      return null;
    }
  } else {
    const missing = [];
    if (!projectId) missing.push("FIREBASE_PROJECT_ID");
    if (!clientEmail) missing.push("FIREBASE_CLIENT_EMAIL");
    if (!privateKey) missing.push("FIREBASE_PRIVATE_KEY");
    console.warn(`[Firebase] Missing credentials: ${missing.join(", ")}. Admin init skipped.`);
    return null;
  }
}

export const db = () => {
  const app = getFirebaseAdmin();
  if (!app) {
    console.warn("[Firebase] No Admin app available, firestore() returning null");
    return null;
  }
  
  const databaseId = process.env.FIREBASE_DATABASE_ID?.trim();
  try {
    // Attempt to identify which database we are connecting to
    if (databaseId) {
      console.log(`[Firebase] Attempting connection to specified database: ${databaseId}`);
    } else {
      console.warn("[Firebase] FIREBASE_DATABASE_ID not set. Defaulting to (default) database.");
    }
    
    const dbInstance = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
    console.log(`[Firebase] Firestore instance obtained ${databaseId ? `for database: ${databaseId}` : "(default database)"}`);
    return dbInstance;
  } catch (error: any) {
    console.error(`[Firebase] Error getting Firestore instance ${databaseId ? `for database: ${databaseId}` : "(default database)"}:`, error.message);
    return null;
  }
};

export const auth = () => {
    const app = getFirebaseAdmin();
    return app ? app.auth() : null;
};
