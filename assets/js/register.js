import { auth } from "./firebase-config.js";

import {
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const form = document.getElementById("register-form");

form.addEventListener("submit", (e) => {

  e.preventDefault();

  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password").value;

  createUserWithEmailAndPassword(auth, email, password)

    .then(() => {

      alert("Usuario registrado");
      window.location.href = "dashboard.html";

    })

    .catch((error) => {
      alert(error.message);
    });

});