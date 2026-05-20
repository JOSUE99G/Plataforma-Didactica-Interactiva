document.addEventListener("DOMContentLoaded", () => {

    const btnTop = document.getElementById("logoutBtn");
    const btnSidebar = document.getElementById("logoutSidebar");

    const cerrarSesion = async () => {
        try {
            await firebase.auth().signOut();
            alert("Sesión cerrada");
            window.location.href = "index.html";
        } catch (error) {
            alert(error.message);
        }
    };

    if (btnTop) {
        btnTop.addEventListener("click", cerrarSesion);
    }

    if (btnSidebar) {
        btnSidebar.addEventListener("click", cerrarSesion);
    }

});