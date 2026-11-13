const firebaseConfig = {
    apiKey: "AIzaSyAFPRQMxKeYuXCAxATEM5E92CMTpHVvogk",
    authDomain: "robotica-lab-mecatronica.firebaseapp.com",
    projectId: "robotica-lab-mecatronica",
    storageBucket: "robotica-lab-mecatronica.firebasestorage.app",
    messagingSenderId: "856148247166",
    appId: "1:856148247166:web:47902d9745e8fe272c4e2f"
    };

/* ============================================================
   DETECCIÓN DE MODO DE OPERACIÓN
   - MODO NUBE: la plataforma usa Firebase (GitHub Pages, hosting)
   - MODO LABORATORIO: el servidor local (servidor-laboratorio.js)
     responde en /api/ping y la plataforma opera sin internet
     con su propio backend. Detección automática.
   ============================================================ */

async function inicializarAlmacenamiento() {

    let modoLocal = false;

    try {

        const res = await fetch(
            (window.PLATAFORMA_API_URL || "http://localhost:3000/api") + "/ping",
            { signal: AbortSignal.timeout ? AbortSignal.timeout(1500) : undefined }
        );

        modoLocal = res.ok;

    } catch (e) {

        modoLocal = false;

    }

    if (modoLocal) {

        console.log("🏠 MODO LABORATORIO: usando el servidor local.");

        await import("./modo-local.js");

        window.firebase = window.firebaseModoLocal;

    } else {

        console.log("☁ MODO NUBE: usando Firebase.");

        if (typeof firebase !== "undefined" && !firebase.apps.length) {

            firebase.initializeApp(firebaseConfig);

        }

    }

    window.__modoAlmacenamiento = modoLocal ? "laboratorio" : "nube";

    window.dispatchEvent(new CustomEvent("almacenamientoListo", {
        detail: { modo: window.__modoAlmacenamiento }
    }));

}

inicializarAlmacenamiento();

// Compatibilidad: la variable global db se define tras elegir el modo
let db = null;

window.addEventListener("almacenamientoListo", () => {

    db = firebase.firestore();

    window.db = db;

});