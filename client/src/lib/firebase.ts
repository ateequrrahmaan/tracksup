import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Prefer env variables for production
const getCfg = (envKey: string, defaultValue?: string) => {
  const envVal = import.meta.env[envKey] as string;
  const isEnvPlaceholder = !envVal || envVal.startsWith("PLACEHOLDER_");
  
  if (!isEnvPlaceholder) return envVal;
  return defaultValue;
};

const rawDbId = getCfg("VITE_FIREBASE_DATABASE_ID");
const firebaseConfig = {
  apiKey: getCfg("VITE_FIREBASE_API_KEY"),
  authDomain: getCfg("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: getCfg("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: getCfg("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getCfg("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: getCfg("VITE_FIREBASE_APP_ID"),
  measurementId: getCfg("VITE_FIREBASE_MEASUREMENT_ID"),
  firestoreDatabaseId: (rawDbId && rawDbId !== "(default)") ? rawDbId : undefined
};

// Diagnostic log for configuration issues
if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
  console.warn("[Firestore] WARNING: Missing or placeholder configuration detected in environment variables.");
}

const app = initializeApp(firebaseConfig as any);
export const auth = getAuth(app);
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId) 
  : getFirestore(app);

export const hasFirebaseConfig = !!(firebaseConfig.projectId && firebaseConfig.apiKey);

import { doc, getDocFromServer } from 'firebase/firestore';

async function testConnection() {
  try {
    console.log(`[Firestore] Initializing connection to project: ${firebaseConfig.projectId}, database: ${firebaseConfig.firestoreDatabaseId || '(default)'}`);
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("[Firestore] Connection verified successfully.");
  } catch (error) {
    if(error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('not found'))) {
      const isPlaceholder = (val: string) => !val || val.startsWith("PLACEHOLDER_");
      const hasPlaceholders = isPlaceholder(firebaseConfig.projectId) || isPlaceholder(firebaseConfig.apiKey);
      console.error("[Firestore] Database initialization issue encountered:", error.message);
      if (hasPlaceholders) {
        console.error("[Firestore] CRITICAL: Placeholder values detected in environment variables. Please check your .env file or deployment settings.");
      }
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('[FIRESTORE_ERROR_INFO]: ', JSON.stringify(errInfo));
  const finalError = new Error(JSON.stringify(errInfo));
  (finalError as any).isFirestoreErrorInfo = true;
  throw finalError;
}
