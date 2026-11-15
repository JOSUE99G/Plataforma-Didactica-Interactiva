/* ============================================================
   UI: sliders de articulaciones + pose del efector
   Los sliders se generan desde la CONFIGURACIÓN del rig activo
   (rig-brazo.json), así se adaptan al robot cargado.
   ============================================================ */

import { aplicarAngulosMulti, obtenerPoseEfectorMulti } from "./rig-multi.js";

import { mostrarInfoArticulacion } from "./stl-estudiante.js";

/* Nombres didácticos por id de eslabón */
const NOMBRES = {
  base: "Base (J1)",
  hombro: "Hombro (J2)",
  codo: "Codo (J3)",
  brazo1: "Brazo A",
  brazo2: "Brazo B",
  muneca: "Muñeca (J4)",
  griper: "Efector",
  garra: "Garra",
  efector: "Efector final",
};

const valoresActuales = {};

let configRig = null;

/**
 * Genera los sliders a partir de la configuración del robot.
 * @param {Object} config - { eslabones: [{id, rango, ...}] }
 */
export function generarSlidersDesdeConfig(config) {
  configRig = config;

  const cont = document.getElementById("slidersArt");

  if (!cont || !config || !config.eslabones) return;

  cont.innerHTML = "";

  config.eslabones.forEach((esl) => {
    const [min, max] = esl.rango || [-180, 180];

    const def = Math.max(min, Math.min(max, 0));

    valoresActuales[esl.id] = def;

    const nombre = NOMBRES[esl.id] || esl.id;

    const fila = document.createElement("div");

    fila.className = "art-slider";

    fila.innerHTML = `
      <label>${nombre}</label>
      <input type="range" min="${min}" max="${max}" value="${def}" step="1" data-art="${esl.id}">
      <span class="art-value">${def}°</span>
    `;

    cont.appendChild(fila);
  });

  aplicarAngulosMulti(valoresActuales);

  actualizarPose();
}

/**
 * Listener de sliders: mueve el rig MULTI activo.
 */
export function iniciarSlidersArt() {
  const cont = document.getElementById("slidersArt");

  if (!cont) return;

  cont.addEventListener("input", (e) => {
    const slider = e.target.closest("input[data-art]");

    if (!slider) return;

    const id = slider.dataset.art;

    const v = Number(slider.value);

    valoresActuales[id] = v;

    const salida = slider.parentElement.querySelector(".art-value");

    if (salida) salida.textContent = v + "°";

    // Rig multi (piezas STL separadas)
    aplicarAngulosMulti(valoresActuales);

    // Ficha educativa de la articulación movida
    mostrarInfoArticulacion(id);

    actualizarPose();
  });
}

/**
 * Pose del efector final según el rig activo.
 */
export function actualizarPose() {
  const el = document.getElementById("poseEfector");

  if (!el) return;

  const pose = obtenerPoseEfectorMulti();

  if (!pose) {
    el.textContent = "—";

    return;
  }

  el.textContent = `X: ${pose.x} · Y: ${pose.y} · Z: ${pose.z} mm`;
}

/**
 * Compatibilidad con llamadas antiguas (robotCargado).
 * Con el rig multi, los sliders ya se generan desde el JSON;
 * esta función solo refresca la pose.
 */
export function conectarRigAlModelo() {
  actualizarPose();
}
