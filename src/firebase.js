// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBv5xpW6Fn5Sb7vcPqDGrpcsteP0vCpLwc",
  authDomain: "yt-stock-ai.firebaseapp.com",
  projectId: "yt-stock-ai",
  storageBucket: "yt-stock-ai.firebasestorage.app",
  messagingSenderId: "194630789653",
  appId: "1:194630789653:web:9ef4e4c5008555bd697c1c",
  measurementId: "G-948PKDZ94V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);