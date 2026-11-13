/* ============================================================
   UI: sliders de articulaciones + pose del efector
   ============================================================ */

import {
  construirRig,
  aplicarAngulos,
  obtenerPoseEfector,
  robotRig,
} from "./articulaciones.js";

const DEFINICION = [
  { id: "base", nombre: "Base", min: -135, max: 135, def: 0 },
  { id: "hombro", nombre: "Hombro", min: -15, max: 85, def: 20 },
  { id: "codo", nombre: "Codo", min: -95, max: 0, def: -45 },
  { id: "muneca", nombre: "Muñeca", min: -105, max: 105, def: 0 },
  { id: "garra", nombre: "Garra %", min: 0, max: 100, def: 50 },
];

const valoresActuales = {};

/**
 * Genera los sliders dinámicamente dentro de #slidersArt
 */
export function iniciarSlidersArt() {
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

  // Un solo listener delegado
  cont.addEventListener("input", (e) => {
    const slider = e.target.closest("input[data-art]");

    if (!slider) return;

    const id = slider.dataset.art;

    const v = Number(slider.value);

    valoresActuales[id] = v;

    const salida = slider.parentElement.querySelector(".art-value");

    if (salida) salida.textContent = v + "°";

    aplicarAngulos(valoresActuales);

    actualizarPose();
  });
}

/**
 * Muestra la pose del efector final en el panel
 */
export function actualizarPose() {
  const el = document.getElementById("poseEfector");

  if (!el) return;

  const pose = obtenerPoseEfector();

  if (!pose) {
    el.textContent = "—";

    return;
  }

  el.textContent = `X: ${pose.x} · Y: ${pose.y} · Z: ${pose.z} mm`;
}

/**
 * Cuando el STL termine de cargar, construir el rig
 */
export function conectarRigAlModelo(mesh) {
  construirRig(mesh);

  // Aplicar pose por defecto
  aplicarAngulos(valoresActuales);

  actualizarPose();
}
