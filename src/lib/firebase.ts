import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  updateProfile,
  User,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FB_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FB_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FB_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FB_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FB_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FB_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db   = getFirestore(app);

export function getCurrentUID(): string | null {
  return auth.currentUser?.uid ?? null;
}

export async function requireUID(): Promise<string> {
  if (auth.currentUser) return auth.currentUser.uid;

  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, (user: User | null) => {
      unsub();
      if (user) resolve(user.uid);
      else reject(new Error("Not signed in. Please log in to continue."));
    });
  });
}

export const googleProvider = new GoogleAuthProvider();

export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
};
export type { User };
