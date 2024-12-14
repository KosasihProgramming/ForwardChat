// firebaseConfig.js
const { initializeApp } = require("firebase/app");
const { getStorage } = require("firebase/storage");

const firebaseConfig = {
  apiKey: "AIzaSyDHqcMSHj6D42YMZQATrUXxnD1j0-K7ndc",
  authDomain: "scrum-management-6pk6ht.firebaseapp.com",
  projectId: "scrum-management-6pk6ht",
  storageBucket: "scrum-management-6pk6ht.appspot.com",
  messagingSenderId: "1071824203920",
  appId: "1:1071824203920:web:bc37824df956b1773e2815",
};

// Inisialisasi Firebase
const firebaseApp = initializeApp(firebaseConfig);
const storage = getStorage(firebaseApp);

module.exports = { storage };
