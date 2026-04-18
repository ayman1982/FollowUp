// assets/firebase.js (ESM via CDN - Netlify friendly)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  initializeFirestore, serverTimestamp,
  collection, doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc,
  getDocs, query, where, orderBy, limit
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
export const firebaseConfig = {
  "apiKey": "AIzaSyBCEd5Ase3qbAupK2cpC6AXHrifqVY13cE",
  "authDomain": "followup-4cb73.firebaseapp.com",
  "projectId": "followup-4cb73",
  "storageBucket": "followup-4cb73.firebasestorage.app",
  "messagingSenderId": "674071272629",
  "appId": "1:674071272629:web:cbe5c3c7bb2ac9c7b032fc",
  "measurementId": "G-861XRCPWC1"
};
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  useFetchStreams: false
});

export const AUTH = {
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut
};
export const FS = {
  serverTimestamp,
  collection, doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc,
  getDocs, query, where, orderBy, limit
};
