import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/setup#config-object
const firebaseConfig = {
    apiKey: "AIzaSyD3Gx8mwehiwlTJnvy02QkJPjNWurB3ODk",
    authDomain: "costpilot-bb6c5.firebaseapp.com",
    projectId: "costpilot-bb6c5",
    storageBucket: "costpilot-bb6c5.firebasestorage.app",
    messagingSenderId: "889340925770",
    appId: "1:889340925770:web:dd24afebe3f6e0515f93b3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
