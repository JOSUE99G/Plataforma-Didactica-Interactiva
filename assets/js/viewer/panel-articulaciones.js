/* ============================================================
   UI: sliders J1-J4 (instantáneos, sin esperar modelo externo)
   + Pose del efector por Cinemática Directa en tiempo real.
   ============================================================ */

import {
  aplicarAngulos as aplicarAngulosDobot,
  obtenerPose as obtenerPoseDobot,
} from "./dobot-magician.js";

import { mostrarInfoArticulacion } from "./stl-estudiante.js";

const DEFINICION = [
  { id: "base", nombre: "J1 · Base", min: -180, max: 180, def: 0, step: 1 },
  { id: "hombro", nombre: "J2 · Hombro", min: -80, max: 110, def: -40, step: 1 },
  { id: "codo", nombre: "J3 · Codo", min: -100, max: 110, def: 45, step: 1 },
  { id: "muneca", nombre: "J4 · Efector", min: -180, max: 180, def: 0, step: 1 },
];

const valoresActuales = {};

/**
 * Genera e inyecta los 4 sliders al instante.
 */
export function generarSlidersDesdeConfig() {
  const cont = document.getElementById("slidersArt");

  if (!cont) return;

  cont.innerHTML = "";

  DEFINICION.forEach((a) => {
    valoresActuales[a.id] = a.def;

    const fila = document.createElement("div");

    fila.className = "art-slider";

    fila.innerHTML = `
      <label>${a.nombre}</label>
      <input type="range" min="${a.min}" max="${a.max}" value="${a.def}" step="${a.step}" data-art="${a.id}">
      <span class="art-value">${a.def}°</span>
    `;

    cont.appendChild(fila);
  });

  aplicarAngulosDobot(valoresActuales);

  actualizarPose();
}

/**
 * Listener delegado: mueve el robot y actualiza la pose (CD).
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

    aplicarAngulosDobot(valoresActuales);

    mostrarInfoArticulacion(id);

    actualizarPose();
  });
}

/**
 * Pose del efector final por Cinemática Directa (mundo).
 */
export function actualizarPose() {
  const el = document.getElementById("poseEfector");

  if (!el) return;

  const pose = obtenerPoseDobot();

  if (!pose) {
    el.textContent = "—";

    return;
  }

  el.textContent = `X: ${pose.x} · Y: ${pose.y} · Z: ${pose.z} mm`;
}

/**
 * Compatibilidad con eventos robotCargado.
 */
export function conectarRigAlModelo() {
  actualizarPose();
}
