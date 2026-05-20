import { auth } from "./firebase-config.js";

import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const form = document.getElementById("login-form");

form.addEventListener("submit", (e) => {

  e.preventDefault();

  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  signInWithEmailAndPassword(auth, email, password)

    .then(() => {

      alert("Bienvenido");
      window.location.href = "dashboard.html";

    })

    .catch((error) => {
      alert(error.message);
    });

});