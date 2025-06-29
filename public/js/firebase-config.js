// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBTJhDmwzrbFyZz0s69XhjleCkRi65PM6A",
  authDomain: "ev-recharge-bunk-b6707.firebaseapp.com",
  projectId: "ev-recharge-bunk-b6707",
  storageBucket: "ev-recharge-bunk-b6707.appspot.com",
  messagingSenderId: "1024337257163",
  appId: "1:1024337257163:web:a2774cf1c264ab6643714e",
  measurementId: "G-3RXMHWK55S"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Enable Firestore offline persistence
db.enablePersistence()
  .catch((err) => {
    console.log("Firestore offline persistence error: ", err);
  });

export { auth, db, storage };