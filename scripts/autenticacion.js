(() => {
    const loginBtn = document.getElementById("loginButton");
    const registerBtn = document.getElementById("registerButton");

    // Registro de usuario
    if (registerBtn) {
        registerBtn.addEventListener("click", async (e) => {
            e.preventDefault();

            const name = document.getElementById("registerName").value.trim();
            const email = document.getElementById("registerEmail").value.trim();
            const password = document.getElementById("registerPassword").value.trim();

            if (!name || !email || !password) {
                alert("Por favor, completa todos los campos.");
                return;
            }

            try {
                
                const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;

             
                await user.updateProfile({ displayName: name });

               
                await db.collection("usuarios").doc(user.uid).set({
                    nombre: name,
                    correo: email,
                    uid: user.uid,
                    creadoEn: firebase.firestore.FieldValue.serverTimestamp()
                });

                alert("✅ Registro exitoso. Bienvenido/a, " + name);
                window.location.href = "dashboard.html";
            } catch (error) {
                alert("❌ Error: " + error.message);
            }
        });
    }

    // Inicio de sesión
    if (loginBtn) {
        loginBtn.addEventListener("click", async (e) => {
            e.preventDefault();

            const email = document.getElementById("loginEmail").value.trim();
            const password = document.getElementById("loginPassword").value.trim();

            if (!email || !password) {
                alert("Completa todos los campos.");
                return;
            }

            try {
                await firebase.auth().signInWithEmailAndPassword(email, password);
                alert("Inicio de sesión exitoso");
                window.location.href = "dashboard.html";
            } catch (error) {
                alert("Error: " + error.message);
            }
        });
    }
})();
// 🔐 INICIO DE SESIÓN CON GOOGLE
function iniciarConGoogle(boton) {

    if (!boton) return;

    boton.addEventListener("click", async () => {

        try {

            const provider = new firebase.auth.GoogleAuthProvider();

            const cred = await firebase.auth().signInWithPopup(provider);

            const user = cred.user;

            // Registrar en Firestore si es la primera vez
            const ref = db.collection("usuarios").doc(user.uid);

            const doc = await ref.get();

            if (!doc.exists) {

                await ref.set({
                    nombre: user.displayName || "Estudiante",
                    correo: user.email,
                    uid: user.uid,
                    proveedor: "google",
                    creadoEn: firebase.firestore.FieldValue.serverTimestamp()
                });

            }

            window.location.href = "dashboard.html";

        } catch (error) {

            alert("❌ Error con Google: " + error.message);

        }

    });

}

iniciarConGoogle(document.getElementById("btnGoogle"));

iniciarConGoogle(document.getElementById("btnGoogleLogin"));

// 🔐 PROTEGER DASHBOARD: solo actúa si estamos realmente en el dashboard
// y Firebase está disponible (evita redirecciones innecesarias y errores).
if (typeof firebase !== "undefined" && window.location.pathname.includes("dashboard.html")) {
    firebase.auth().onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = "index.html";
        }
    });
}