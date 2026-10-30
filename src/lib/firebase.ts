import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

export const auth = getAuth(app);

/**
 * Validates Firestore server connection as required by Firebase skill.
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.info('Firebase Firestore connected successfully.');
    return true;
  } catch (error: any) {
    if (error?.message && error.message.includes('the client is offline')) {
      console.warn('Please check your Firebase configuration: client is offline.');
      return false;
    }
    // Reaching the server even with non-existent doc means connection is alive
    return true;
  }
}

export { firebaseConfig };
