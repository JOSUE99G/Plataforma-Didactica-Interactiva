const firebaseConfig = {
    apiKey: "AIzaSyAFPRQMxKeYuXCAxATEM5E92CMTpHVvogk",
    authDomain: "robotica-lab-mecatronica.firebaseapp.com",
    projectId: "robotica-lab-mecatronica",
    storageBucket: "robotica-lab-mecatronica.firebasestorage.app",
    messagingSenderId: "856148247166",
    appId: "1:856148247166:web:47902d9745e8fe272c4e2f"
    };
// Inicializar Firebase solo una vez
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Firestore
const db = firebase.firestore();