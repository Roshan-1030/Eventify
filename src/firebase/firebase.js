// Import Firebase core
import { initializeApp } from "firebase/app";

// (Optional but recommended imports)
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 🔑 Your Firebase config (from Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyDYjawMDFNcofnVyGHZtLzWW38244b0j7U",
  authDomain: "eventify-8d932.firebaseapp.com",
  projectId: "eventify-8d932",
  storageBucket: "eventify-8d932.firebasestorage.app",
  messagingSenderId: "1077344597669",
  appId: "1:1077344597669:web:44723acd948b03b55dff4c"
 
};

// 🚀 Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Export app if needed
export default app;