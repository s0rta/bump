import { getApp, getApps, initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyBOdjcdv9buzufxWkWd07SNEuV2PioPfX4",
  authDomain: "bump-6b481.firebaseapp.com",
  projectId: "bump-6b481",
  storageBucket: "bump-6b481.appspot.com",
  messagingSenderId: "368021655769",
  appId: "1:368021655769:web:e74cfd81f957681cf6eec8",
};

let firebaseApp;

// Initialize Firebase
if (getApps().length) {
  firebaseApp = getApp("[DEFAULT]");
} else {
  firebaseApp = initializeApp(firebaseConfig);
}
export default firebaseApp;
