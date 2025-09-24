// services/firebase.ts
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBIaSvjdBToOtNgZ3Wkf7iR4iwc_KapO3s",
    authDomain: "controleempadas.firebaseapp.com",
    projectId: "controleempadas",
    storageBucket: "controleempadas.appspot.com", // corrigido aqui
    messagingSenderId: "43579606238",
    appId: "1:43579606238:web:ead9e5f9fc45f0d4dcae4f",
    measurementId: "G-K9GJH4ZTNS"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
export { app, analytics, db };
