import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDhyJX0CGTOS14Grr9-k92h0PEavFUzPoQ",
  authDomain: "sean-and-lizzie.firebaseapp.com",
  projectId: "sean-and-lizzie",
  storageBucket: "sean-and-lizzie.appspot.com", // Fixed storage bucket URL format
  messagingSenderId: "663769296270",
  appId: "1:663769296270:web:fc5b9251694f2aa62e48df"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Authentication helper functions
const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

const registerUser = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Update user profile with display name
    await updateProfile(userCredential.user, {
      displayName: displayName
    });
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

const logoutUser = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

// Export everything needed
export { 
  app, 
  db, 
  storage, 
  auth, 
  loginUser, 
  registerUser, 
  logoutUser 
};