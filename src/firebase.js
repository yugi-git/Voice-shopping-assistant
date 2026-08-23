// Optional Firebase sync layer.
//
// The app works fully offline-first using localStorage — no setup required.
// If you want real-time cross-device sync, create a Firebase project,
// enable Firestore, and fill in the config below (or set the equivalent
// VITE_FIREBASE_* env vars in a .env.local file, which is gitignored).
//
// Docs: https://firebase.google.com/docs/web/setup

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBRtUOcGP6A5WZYKM8TzqRcE0IG-Xv-VVk",
  authDomain: "chalklist-5f870.firebaseapp.com",
  projectId: "chalklist-5f870",
  storageBucket: "chalklist-5f870.firebasestorage.app",
  messagingSenderId: "497397199394",
  appId: "1:497397199394:web:c0afcc142d027b32c3107b",
  measurementId: "G-0NHTJXJLSJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)

// All devices with the same Firebase config share this single document —
// there's no auth/multi-user separation in this build (matches the brief's
// single-user shopping list scope). Swap this for a per-user path if you
// add authentication later.
const LIST_COLLECTION = 'shoppingLists'
const LIST_DOC_ID = 'default'

let dbInstance = null

// Lazily initialize so the `firebase/*` packages are only touched when
// configured — keeps the app runnable with zero Firebase setup.
async function getDb() {
  if (!isFirebaseConfigured) return null
  if (dbInstance) return dbInstance
  const { initializeApp } = await import('firebase/app')
  const { getFirestore } = await import('firebase/firestore')
  const app = initializeApp(firebaseConfig)
  dbInstance = getFirestore(app)
  return dbInstance
}

/**
 * Subscribe to real-time changes on the shared shopping list document.
 * `onChange` is called with:
 *   { exists, items, updatedAt, fromLocalWrite, error }
 * - fromLocalWrite: true when this snapshot is the optimistic local echo of
 *   a write this tab just made (not yet confirmed by the server). Callers
 *   should treat these as "still syncing" rather than an authoritative
 *   remote update, to avoid feedback loops.
 * Returns an unsubscribe function (or a no-op if Firebase isn't configured).
 */
export async function subscribeToList(onChange) {
  const db = await getDb()
  if (!db) return () => { }
  const { doc, onSnapshot } = await import('firebase/firestore')
  const ref = doc(db, LIST_COLLECTION, LIST_DOC_ID)
  return onSnapshot(
    ref,
    { includeMetadataChanges: true },
    (snapshot) => {
      const data = snapshot.data()
      onChange({
        exists: snapshot.exists(),
        items: data?.items ?? null,
        updatedAt: data?.updatedAt ?? 0,
        fromLocalWrite: snapshot.metadata.hasPendingWrites,
      })
    },
    (error) => onChange({ error })
  )
}

/** Write the full item list up, tagged with the timestamp the caller used locally. */
export async function pushList(items, updatedAt) {
  const db = await getDb()
  if (!db) return
  const { doc, setDoc } = await import('firebase/firestore')
  await setDoc(doc(db, LIST_COLLECTION, LIST_DOC_ID), { items, updatedAt })
}
