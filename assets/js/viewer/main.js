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

import { iniciarSlidersArt } from "./panel-articulaciones.js";

import { cargarSTLLocal, quitarSTLLocal, mostrarInfoArticulacion } from "./stl-estudiante.js";

import {
  generarCubitos,
  crearTenazas,
  animarTenazas,
  agarrar,
  soltar,
  tieneCubo,
} from "./entorno-fisico.js";

import {
  montarDobot,
  aplicarAngulos as aplicarAngulosDobot,
  moverACoordenadas,
  obtenerPose as obtenerPoseDobot,
} from "./dobot-magician.js";

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
   PANEL DE HERRAMIENTA (estilo DobotLab):
   Activar (ventosa/bomba) · Abrir · Cerrar (pinzas)
   Con estados visuales y log en la interfaz.
   ============================================================ */

(function iniciarPanelHerramienta() {

    const logEl = document.getElementById("toolLog");

    const botones = {
        activar: document.getElementById("toolActivar"),
        abrir: document.getElementById("toolAbrir"),
        cerrar: document.getElementById("toolCerrar"),
    };

    let modo = "marcador";      // marcador | ventosa | garra

    let succionActiva = false;

    window.addEventListener("accesorioCambiado", (e) => {

        modo = e.detail.tipo;

        if (modo !== "ventosa" && succionActiva) {

            succionActiva = false;

            log("⚠ Ventosa desmontada: succión apagada.");

        }

    });

    function log(mensaje) {

        if (logEl) logEl.textContent = "> " + mensaje;

        console.log("[Herramienta] " + mensaje);

    }

    function resetEstados() {

        Object.values(botones).forEach(b => b && b.classList.remove("activo"));

    }

    function activar(boton, nombre) {

        if (!boton) return;

        resetEstados();

        boton.classList.add("activo");

        log(nombre);

    }

    function obtenerEfector() {

        const robot = scene.getObjectByName("dobotMagicianLite");

        return robot && robot.getObjectByName("pivotJ4");

    }

    // ACTIVAR: succión (ventosa) o cierre de garra con agarre
    if (botones.activar) {

        botones.activar.addEventListener("click", () => {

            const efector = obtenerEfector();

            if (!efector) {

                log("⚠ Efector no disponible.");

                return;

            }

            if (modo === "ventosa") {

                succionActiva = !succionActiva;

                if (succionActiva) {

                    const agarro = agarrar(efector);

                    activar(botones.activar,
                        agarro ? "🧊 Succión ON · cubo sujetado"
                               : "💨 Succión ON · sin cubo en contacto");

                } else {

                    if (tieneCubo()) {

                        soltar(efector);

                    }

                    activar(botones.activar, "💨 Succión OFF · cubo liberado");

                }

                return;

            }

            // Garra: cerrar = agarrar
            animarTenazas(0);

            const agarro = agarrar(efector);

            activar(botones.activar,
                agarro ? "🧊 Cubo AGARRADO" : "⚠ Nada al alcance de la garra");

        });

    }

    // ABRIR: soltar cubo + abrir tenazas (garra) o apagar succión
    if (botones.abrir) {

        botones.abrir.addEventListener("click", () => {

            animarTenazas(1);

            const efector = obtenerEfector();

            if (modo === "ventosa" && succionActiva) {

                succionActiva = false;

                if (efector && tieneCubo()) soltar(efector);

                activar(botones.abrir, "💨 Succión APAGADA · cubo liberado");

                return;

            }

            if (efector && tieneCubo()) {

                soltar(efector);

                activar(botones.abrir, "Cubo SOLTADO · Pinzas ABIERTAS");

            } else {

                activar(botones.abrir, "Pinzas ABIERTAS");

            }

        });

    }

    // CERRAR: cerrar tenazas e intentar agarre
    if (botones.cerrar) {

        botones.cerrar.addEventListener("click", () => {

            animarTenazas(0);

            const efector = obtenerEfector();

            if (efector) {

                const agarro = agarrar(efector);

                activar(botones.cerrar,
                    agarro ? "🧊 Cubo AGARRADO · Pinzas CERRADAS"
                           : "Pinzas CERRADAS");

            } else {

                activar(botones.cerrar, "Pinzas CERRADAS");

            }

        });

    }

})();

/* ============================================================
   SELECTOR DE ACCESORIO DEL EFECTOR FINAL
   ============================================================ */

(function iniciarAccesorios() {

    let accesorioActivo = "marcador";

    const botones = document.querySelectorAll(".acc-btn");

    if (!botones.length) return;

    botones.forEach(btn => {

        btn.addEventListener("click", () => {

            // Resaltar el activo
            botones.forEach(b => b.classList.remove("activo"));

            btn.classList.add("activo");

            accesorioActivo = btn.dataset.acc;

            import("./robot-procedural.js").then(m => {

                m.aplicarAccesorio(accesorioActivo);

            });

            // Notificar al panel de herramienta qué modo está activo
            window.dispatchEvent(new CustomEvent("accesorioCambiado", {
                detail: { tipo: accesorioActivo },
            }));

        });

    });

    window.accesorioActivo = () => accesorioActivo;

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

    // Robot instantáneo: sin dependencias externas ni esperas
    const dobot = montarDobot();

    // Sliders activos al momento
    generarSlidersDesdeConfig();

    // Cubitos físicos sobre la mesa
    generarCubitos(5);

    // Tenazas dentro del bloque de la muñeca (J4)
    const bloque = dobot.grupo.getObjectByName("bloqueMuneca");

    if (bloque) {

        crearTenazas(bloque);

        animarTenazas(1);   // abiertas al inicio

    }

    if (badge) {

        badge.textContent = "Magician Lite · listo";

        badge.className = "badge dificultad-baja";

    }

})();

iniciarCheckboxes(buildPlate, axes);

iniciarSliderEscala();

iniciarZoomCamara();

animate();