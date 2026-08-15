import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  connectAuthEmulator,
  getAuth,
  initializeAuth,
} from 'firebase/auth';
import { connectDatabaseEmulator, getDatabase } from 'firebase/database';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

function required(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

const app = getApps().length
  ? getApp()
  : initializeApp({
      apiKey: required('VITE_FIREBASE_API_KEY'),
      authDomain: required('VITE_FIREBASE_AUTH_DOMAIN'),
      projectId: required('VITE_FIREBASE_PROJECT_ID'),
      storageBucket: required('VITE_FIREBASE_STORAGE_BUCKET'),
      messagingSenderId: required('VITE_FIREBASE_MESSAGING_SENDER_ID'),
      appId: required('VITE_FIREBASE_APP_ID'),
      databaseURL: required('VITE_FIREBASE_DATABASE_URL'),
    });

function createAuth() {
  try {
    return initializeAuth(app, {
      persistence: browserLocalPersistence,
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  } catch {
    return getAuth(app);
  }
}

export const auth = createAuth();
export const rtdb = getDatabase(app);
export const firestore = getFirestore(app);

const emulatorFlag = '__hnefataflFirebaseEmulators';

if (import.meta.env.VITE_FIREBASE_EMULATOR === 'true' && !(globalThis as Record<string, unknown>)[emulatorFlag]) {
  (globalThis as Record<string, unknown>)[emulatorFlag] = true;
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectDatabaseEmulator(rtdb, '127.0.0.1', 9000);
  connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
}
