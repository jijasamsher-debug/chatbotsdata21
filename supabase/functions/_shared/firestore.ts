import { initializeApp, cert, getApps } from 'npm:firebase-admin@^12/app';
import { getFirestore, FieldValue } from 'npm:firebase-admin@^12/firestore';

const getFirestoreDb = () => {
  const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_KEY');
  if (!serviceAccountJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not configured');
  }

  if (getApps().length === 0) {
    const serviceAccount = JSON.parse(serviceAccountJson);
    initializeApp({ credential: cert(serviceAccount) });
  }

  return getFirestore();
};

export { getFirestoreDb, FieldValue };
