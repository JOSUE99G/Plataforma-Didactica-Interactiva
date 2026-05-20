// Importar Firebase
import { initializeApp } from 
"https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import { getAuth } from 
"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Configuración (COPIA LA TUYA DE FIREBASE)
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_DOMINIO",
  projectId: "TU_ID",
  storageBucket: "TU_BUCKET",
  messagingSenderId: "TU_ID",
  appId: "TU_APP_ID"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar autenticación
export const auth = getAuth(app);