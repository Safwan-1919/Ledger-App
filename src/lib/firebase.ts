import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getFunctions, type Functions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

/** When false, the app runs fully local (AsyncStorage) and cloud features are disabled. */
export function isFirebaseConfigured(): boolean {
  const configured = Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  );
  if (!configured) {
    console.warn('[firebase] Not configured:', {
      apiKey: !!firebaseConfig.apiKey,
      projectId: !!firebaseConfig.projectId,
      appId: !!firebaseConfig.appId,
    });
  }
  return configured;
}

/** No-auth single-owner id. Replace with a real user id if you add auth later. */
export const OWNER_ID = 'default-owner';

let app: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;
let functionsInstance: Functions | null = null;

export function getFirebase() {
  if (!isFirebaseConfigured()) {
    return { app: null, db: null, storage: null, functions: null };
  }
  if (!app) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    dbInstance = getFirestore(app);
    storageInstance = getStorage(app);
    functionsInstance = getFunctions(app);
  }
  return { app, db: dbInstance, storage: storageInstance, functions: functionsInstance };
}

export { dbInstance as db };
