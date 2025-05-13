// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDhyJX0CGTOS14Grr9-k92h0PEavFUzPoQ",
  authDomain: "sean-and-lizzie.firebaseapp.com",
  projectId: "sean-and-lizzie",
  storageBucket: "sean-and-lizzie.firebasestorage.app",
  messagingSenderId: "663769296270",
  appId: "1:663769296270:web:fc5b9251694f2aa62e48df"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };