import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

import localConfig from "../../../firebase-applet-config.json";

// Prefer env variables for production, fallback to local config if not placeholders
const isPlaceholder = (val: string) => !val || val.startsWith("PLACEHOLDER_");

const getCfg = (envKey: keyof ImportMetaEnv, localVal: string) => {
  const envVal = import.meta.env[envKey] as string;
  return (!isPlaceholder(envVal)) ? envVal : ((!isPlaceholder(localVal)) ? localVal : "");
};

const firebaseConfig = {
  apiKey: getCfg("VITE_FIREBASE_API_KEY", localConfig.apiKey),
  authDomain: getCfg("VITE_FIREBASE_AUTH_DOMAIN", localConfig.authDomain),
  projectId: getCfg("VITE_FIREBASE_PROJECT_ID", localConfig.projectId),
  storageBucket: getCfg("VITE_FIREBASE_STORAGE_BUCKET", localConfig.storageBucket),
  messagingSenderId: getCfg("VITE_FIREBASE_MESSAGING_SENDER_ID", localConfig.messagingSenderId),
  appId: getCfg("VITE_FIREBASE_APP_ID", localConfig.appId),
  measurementId: getCfg("VITE_FIREBASE_MEASUREMENT_ID" as any, localConfig.measurementId),
  firestoreDatabaseId: getCfg("VITE_FIREBASE_DATABASE_ID" as any, localConfig.firestoreDatabaseId) || '(default)'
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

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
