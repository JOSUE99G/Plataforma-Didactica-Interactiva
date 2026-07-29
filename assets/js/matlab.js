const boton = document.getElementById("copiarCodigo");

if (boton) {

    boton.addEventListener("click", () => {

        const codigo = document.getElementById("codigoMatlab").innerText;

        navigator.clipboard.writeText(codigo);

        boton.textContent = "✅ Código copiado";

        setTimeout(() => {

            boton.textContent = "Copiar código";

        }, 2000);

    });

}