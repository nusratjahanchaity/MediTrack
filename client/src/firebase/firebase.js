import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // এটা নতুন

const firebaseConfig = {
  apiKey: "AIzaSyDHjNiwLOJ1Psav4HONO0Yr_wFHslzM1RU ",
  authDomain: "meditrack-24e13.firebaseapp.com",
  projectId: "meditrack-24e13",
  storageBucket: "meditrack-24e13.firebasestorage.app",
  messagingSenderId: "460574555587",
  appId: "G-3ZT3VGN6GC"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app); // Auth export