import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyD1eZfruF35j9VcGMgxX9ZTJjcrpax5r5E',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'chatbotsaas-2eb6e.firebaseapp.com',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || 'https://chatbotsaas-2eb6e-default-rtdb.firebaseio.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'chatbotsaas-2eb6e',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'chatbotsaas-2eb6e.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '8466380048',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:8466380048:web:aaaffc133893092c29e195',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-M5HB92QZED'
};

const requiredConfigValues = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.storageBucket,
  firebaseConfig.messagingSenderId,
  firebaseConfig.appId
];

const hasPlaceholderValue = requiredConfigValues.some((value) =>
  !value || value.includes('your_') || value.includes('_here')
);

export const isFirebaseConfigured = !hasPlaceholderValue;
export const firebaseConfigError = isFirebaseConfigured
  ? null
  : 'Firebase is not configured. Add valid VITE_FIREBASE_* values in project environment settings.';

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'asia-south1');
