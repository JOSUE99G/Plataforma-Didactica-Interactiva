import "./scene.js";

import "./camera.js";

import "./renderer.js";

import "./lights.js";

import "./controls.js";

import "./loader.js";

import "./transform.js";

import "./ui.js";

import { animate } from "./animation.js";

import { iniciarCheckboxes, iniciarSliderEscala, iniciarZoomCamara, actualizarInfoModelo } from "./tools.js";

import { iniciarSlidersArt, conectarRigAlModelo } from "./panel-articulaciones.js";

import { cargarSTLLocal, quitarSTLLocal, mostrarInfoArticulacion } from "./stl-estudiante.js";

import { cargarConfigRig, construirRigMulti, modoRig } from "./rig-multi.js";

import { buildPlate, axes } from "./scene.js";

// El STL carga de forma asíncrona: cuando llegue, inicializamos
// el panel de información y dejamos lista la escala base.
window.addEventListener("robotCargado", (event) => {

    actualizarInfoModelo(event.detail);

    conectarRigAlModelo(event.detail);

});

iniciarSlidersArt();

/* ============================================================
   SUBIDA DE STL DEL ESTUDIANTE
   Drag & drop + clic en la caja de subida
   ============================================================ */

(function iniciarSubidaSTL() {

    const caja = document.getElementById("stlUploadBox");

    const input = document.getElementById("stlFileInput");

    const info = document.getElementById("stlInfo");

    const acciones = document.getElementById("stlAcciones");

    if (!caja || !input) return;

    async function procesar(file) {

        try {

            const resultado = await cargarSTLLocal(file);

            caja.classList.add("cargado");

            if (info) {

                info.style.display = "block";

                info.innerHTML = `
                    <strong>✅ ${resultado.nombre}</strong><br>
                    Dimensiones: ${resultado.dimensiones.x} × ${resultado.dimensiones.y} × ${resultado.dimensiones.z} mm<br>
                    ${resultado.triangulos.toLocaleString("es")} triángulos
                `;

            }

            if (acciones) acciones.style.display = "flex";

        } catch (error) {

            if (info) {

                info.style.display = "block";

                info.innerHTML = `⚠ ${error.message}`;

            }

        }

    }

    // Clic para explorar
    caja.addEventListener("click", () => input.click());

    input.addEventListener("change", () => {

        if (input.files[0]) procesar(input.files[0]);

    });

    // Drag & drop
    ["dragover", "dragenter"].forEach(ev =>
        caja.addEventListener(ev, (e) => {

            e.preventDefault();

            caja.classList.add("arrastrando");

        })
    );

    ["dragleave", "drop"].forEach(ev =>
        caja.addEventListener(ev, (e) => {

            e.preventDefault();

            caja.classList.remove("arrastrando");

        })
    );

    caja.addEventListener("drop", (e) => {

        const file = e.dataTransfer.files[0];

        if (file) procesar(file);

    });

    // Botón quitar
    const btnQuitar = document.getElementById("btnQuitarSTL");

    if (btnQuitar) {

        btnQuitar.addEventListener("click", () => {

            quitarSTLLocal();

            caja.classList.remove("cargado");

            if (info) info.style.display = "none";

            if (acciones) acciones.style.display = "none";

        });

    }

})();

/* ============================================================
   FICHA EDUCATIVA: al mover un slider, mostrar qué articulación es
   ============================================================ */

(function iniciarFichasArticulaciones() {

    const cont = document.getElementById("slidersArt");

    if (!cont) return;

    cont.addEventListener("input", (e) => {

        const slider = e.target.closest("input[data-art]");

        if (slider) mostrarInfoArticulacion(slider.dataset.art);

    });

})();

// Intentar construir el RIG MULTI (piezas STL separadas con cinemática real).
// Si los archivos no existen, el modo simple (1 STL + capas) sigue funcionando.
(async () => {

    const config = await cargarConfigRig();

    try {

        const primera = config.eslabones[0];

        const probe = await fetch(primera.stl, { method: "HEAD" });

        if (probe.ok) {

            const rig = await construirRigMulti(config);

            console.log("✅ RIG MULTI activo: cinemática real por eslabones.");

            window.__rigMultiListo = rig;

        } else {

            console.log("ℹ Piezas STL separadas no encontradas: modo simple.");

        }

    } catch (e) {

        console.log("ℹ Modo simple (STL único):", e.message);

    }

})();

iniciarCheckboxes(buildPlate, axes);

iniciarSliderEscala();

iniciarZoomCamara();

animate();