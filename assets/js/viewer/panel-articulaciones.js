/* ============================================================
   UI: sliders de articulaciones del ROBOT PROCEDURAL
   Rangos según datasheet del Dobot Magician Lite.
   ============================================================ */

import {
  aplicarAngulosProcedural,
  obtenerPoseProcedural,
  construirRobotProcedural,
} from "./robot-procedural.js";

import { mostrarInfoArticulacion } from "./stl-estudiante.js";

const DEFINICION = [
  { id: "base", nombre: "Base (J1)", min: -135, max: 135, def: 0 },
  { id: "hombro", nombre: "Hombro (J2)", min: -40, max: 85, def: 20 },
  { id: "codo", nombre: "Codo (J3)", min: -20, max: 90, def: 30 },
  { id: "muneca", nombre: "Muñeca (J4)", min: -90, max: 90, def: 0 },
  { id: "garra", nombre: "Garra", min: 0, max: 100, def: 50 },
];

const valoresActuales = {};

/**
 * Genera los sliders de articulación.
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
      <input type="range" min="${a.min}" max="${a.max}" value="${a.def}" step="1" data-art="${a.id}">
      <span class="art-value">${a.def}°</span>
    `;

    cont.appendChild(fila);
  });

  aplicarAngulosProcedural(valoresActuales);

  actualizarPose();
}

/**
 * Listener delegado de los sliders.
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

    aplicarAngulosProcedural(valoresActuales);

    mostrarInfoArticulacion(id);

    actualizarPose();
  });
}

/**
 * Pose del efector final (FK del robot procedural).
 */
export function actualizarPose() {
  const el = document.getElementById("poseEfector");

  if (!el) return;

  const pose = obtenerPoseProcedural();

  if (!pose) {
    el.textContent = "—";

    return;
  }

  el.textContent = `X: ${pose.x} · Y: ${pose.y} · Z: ${pose.z} mm`;
}

/**
 * Compatibilidad: eventos robotCargado.
 */
export function conectarRigAlModelo() {
  actualizarPose();
}
