// Obtiene el contenedor con el id 'container' del documento HTML
const container = document.getElementById('container');


const registerBtn = document.getElementById('register');
const loginBtn = document.getElementById('login');


if (registerBtn && container) {
    registerBtn.addEventListener('click', () => {
        container.classList.add("active");
    });
}

// Añade un evento al botón de inicio de sesión que se activa cuando se hace clic
if (loginBtn && container) {
    // Al hacer clic se elimina la clase 'active': muestra el formulario de inicio de sesión
    loginBtn.addEventListener('click', () => {
        container.classList.remove("active");
    });
}
