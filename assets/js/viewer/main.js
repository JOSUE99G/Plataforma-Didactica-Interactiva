import "./scene.js";

import "./camera.js";

import "./renderer.js";

import "./lights.js";

import "./controls.js";

// La cinemática articulada se ejecuta en Fusion 360 (CAD con joints
// reales, controlado desde el laboratorio MATLAB vía puente local).
// El visor web queda como explorador del modelo + STL del estudiante.

// loader.js ya NO se importa aquí: carga el STL por defecto al inicio y
// causaba que los robots se superpusieran al cambiar con el selector.
// La carga la hace ahora cargarRobot() según el robot elegido.

import "./transform.js";

import "./ui.js";

import { animate } from "./animation.js";

import { iniciarCheckboxes, iniciarSliderEscala, iniciarZoomCamara, actualizarInfoModelo } from "./tools.js";

import { iniciarSlidersArt, conectarRigAlModelo } from "./panel-articulaciones.js";

import { cargarSTLLocal, quitarSTLLocal, mostrarInfoArticulacion } from "./stl-estudiante.js";

import { construirRobotProcedural, aplicarAngulosProcedural, obtenerPoseProcedural } from "./robot-procedural.js";

import { generarSlidersDesdeConfig } from "./panel-articulaciones.js";

import { scene } from "./scene.js";

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
   SELECTOR DE ACCESORIO DEL EFECTOR FINAL
   ============================================================ */

(function iniciarAccesorios() {

    const botones = document.querySelectorAll(".acc-btn");

    if (!botones.length) return;

    botones.forEach(btn => {

        btn.addEventListener("click", () => {

            // Resaltar el activo
            botones.forEach(b => b.classList.remove("activo"));

            btn.classList.add("activo");

            import("./robot-procedural.js").then(m => {

                m.aplicarAccesorio(btn.dataset.acc);

            });

        });

    });

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

// ============================================================
// ROBOT PROCEDURAL: carga instantánea, cinemática por construcción
// ============================================================

(async () => {

    const badge = document.getElementById("rigModoBadge");

    construirRobotProcedural();

    // Sliders de articulación (rangos datasheet Magician Lite)
    generarSlidersDesdeConfig();

    if (badge) {

        badge.textContent = "Magician Lite · modelo cinemático";

        badge.className = "badge dificultad-baja";

    }

})();

iniciarCheckboxes(buildPlate, axes);

iniciarSliderEscala();

iniciarZoomCamara();

animate();