const boton = document.getElementById("copiarCodigo");

if (boton) {

    boton.addEventListener("click", async () => {

        const codigo = document.getElementById("codigoMatlab").innerText;

        try {

            await navigator.clipboard.writeText(codigo);

        } catch (error) {

            // Fallback si el navegador bloquea el portapapeles
            const rango = document.createRange();
            rango.selectNodeContents(document.getElementById("codigoMatlab"));
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(rango);
            document.execCommand("copy");
            sel.removeAllRanges();
        }

        boton.textContent = "✅ Código copiado";

        setTimeout(() => {

            boton.textContent = "Copiar código";

        }, 2000);

    });

}