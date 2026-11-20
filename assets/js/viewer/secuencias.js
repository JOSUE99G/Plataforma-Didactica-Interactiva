/* ============================================================
   GESTOR DE SECUENCIAS + EXPORTADOR PYTHON (DobotLab style)
   - Grabar paso: captura pose actual (CD), ángulos y herramienta
   - Reproducir: interpola el brazo paso a paso con acciones
   - Generar Python: traduce la secuencia a script DobotEDU
   ============================================================ */

import { obtenerPose as obtenerPoseDobot } from "./dobot-magician.js";

import { scene } from "./scene.js";

/* ============================================================
   ESTADO
   ============================================================ */

let secuencia = [];

let grabando = false;

let accionPendiente = null; // {tipo: "ventosa_on"|"garra_cerrar"|...}

/* ============================================================
   HELPERS
   ============================================================ */

function obtenerAngulosUI() {
  // Leer los sliders actuales del panel
  const out = {};

  document.querySelectorAll("#slidersArt input[data-art]").forEach((s) => {
    out[s.dataset.art] = Number(s.value);
  });

  return out;
}

function obtenerHerramientaUI() {
  // Del panel de accesorios
  const activo = document.querySelector(".acc-btn.activo");

  return activo ? activo.dataset.acc : "ventosa";
}

function obtenerLogUI() {
  const el = document.getElementById("toolLog");

  return el ? el.textContent.replace(/^>\s*/, "") : "";
}

/* ============================================================
   GRABAR PASO
   ============================================================ */

/**
 * Registra el paso actual del brazo.
 * @param {Object} extra - acción opcional pendiente {accion}
 */
export function grabarPaso(extra = {}) {
  const pose = obtenerPoseDobot();

  const angulos = obtenerAngulosUI();

  const paso = {
    n: secuencia.length + 1,

    // Coordenadas cartesianas (CD del efector)
    x: pose.x,

    y: pose.y,

    z: pose.z,

    r: angulos.muneca || 0,

    // Ángulos articulares
    j1: angulos.base || 0,

    j2: angulos.hombro || 0,

    j3: angulos.codo || 0,

    j4: angulos.muneca || 0,

    // Herramienta y acción
    herramienta: extra.herramienta || obtenerHerramientaUI(),

    accion: extra.accion || extraaccionDesdeLog(),

    t: extra.pausa ?? 1, // pausa tras el paso (segundos)
  };

  secuencia.push(paso);

  renderizarLista();

  return paso;
}

function extraaccionDesdeLog() {
  const log = obtenerLogUI();

  if (/AGARRADO|sujetado/i.test(log)) return "agarrar";

  if (/SOLTADO|liberado/i.test(log)) return "soltar";

  if (/ABIERTAS/i.test(log)) return "abrir";

  if (/CERRADAS/i.test(log)) return "cerrar";

  if (/succión ON|succión ON|Succión ON/i.test(log)) return "ventosa_on";

  if (/succión OFF|Succión OFF/i.test(log)) return "ventosa_off";

  return "esperar";
}

/* ============================================================
   LISTA VISIBLE DE PASOS
   ============================================================ */

export function renderizarLista() {
  const lista = document.getElementById("secuenciaLista");

  if (!lista) return;

  if (secuencia.length === 0) {
    lista.innerHTML = '<p class="secuencia-vacia">Sin pasos grabados.</p>';

    return;
  }

  lista.innerHTML = "";

  secuencia.forEach((p, i) => {
    const fila = document.createElement("div");

    fila.className = "secuencia-paso";

    fila.innerHTML = `
            <span class="sec-num">${i + 1}</span>
            <span class="sec-det">
                X:${p.x} Y:${p.y} Z:${p.z}<br>
                <small>${p.herramienta} · ${p.accion}</small>
            </span>
            <button class="sec-del" data-i="${i}" title="Eliminar paso">✕</button>
        `;

    lista.appendChild(fila);
  });

  // Eliminar paso individual
  lista.querySelectorAll(".sec-del").forEach((btn) => {
    btn.addEventListener("click", () => {
      secuencia.splice(+btn.dataset.i, 1);

      secuencia.forEach((p, i) => (p.n = i + 1));

      renderizarLista();
    });
  });
}

/* ============================================================
   REPRODUCCIÓN PASO A PASO
   ============================================================ */

function obtenerEfector() {
  const robot = scene.getObjectByName("dobotMagicianLite");

  return robot && robot.getObjectByName("pivotJ4");
}

/**
 * Aplica un paso: ángulos + acción de herramienta.
 * Los ángulos mueven el brazo (más fiable que la IK para reproducir
 * exactamente lo grabado); la acción ejecuta la herramienta.
 */
async function ejecutarPaso(paso, logFn) {
  // Mover articulaciones (aplicación directa de ángulos)
  aplicarAngulosUI(paso);

  logFn(
    `Paso ${paso.n}: X:${paso.x} Y:${paso.y} Z:${paso.z} · ` +
      `${paso.herramienta} → ${paso.accion}`,
  );

  // Esperar interpolación visual
  await esperar(700);

  // Acción de herramienta
  const efector = obtenerEfector();

  switch (paso.accion) {
    case "agarrar":
    case "cerrar":
      window.dispatchEvent(
        new CustomEvent("herramientaComando", {
          detail: { accion: "cerrar" },
        }),
      );
      break;

    case "soltar":
    case "abrir":
      window.dispatchEvent(
        new CustomEvent("herramientaComando", {
          detail: { accion: "abrir" },
        }),
      );
      break;

    case "ventosa_on":
      window.dispatchEvent(
        new CustomEvent("herramientaComando", {
          detail: { accion: "ventosa_on" },
        }),
      );
      break;

    case "ventosa_off":
      window.dispatchEvent(
        new CustomEvent("herramientaComando", {
          detail: { accion: "ventosa_off" },
        }),
      );
      break;

    default:
      break; // esperar: solo movimiento
  }

  await esperar((paso.t || 1) * 600);
}

function aplicarAngulosUI(ang) {
  // Reusar el pipeline de sliders: disparar aplicarAngulos del módulo
  import("./dobot-magician.js").then((m) => {
    m.aplicarAngulos(ang);
  });

  // Sincronizar sliders visualmente
  document.querySelectorAll("#slidersArt input[data-art]").forEach((s) => {
    const id = s.dataset.art;

    const v = ang[id];

    if (v != null) {
      s.value = v;

      const salida = s.parentElement.querySelector(".art-value");

      if (salida) salida.textContent = v + "°";
    }
  });
}

function esperar(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Reproduce la secuencia completa en orden.
 * @param {Function} logFn - para escribir en el log de la UI
 */
export async function reproducirSecuencia(logFn = console.log) {
  if (secuencia.length === 0) {
    logFn("⚠ No hay pasos grabados.");

    return;
  }

  logFn(`▶ Reproduciendo ${secuencia.length} pasos...`);

  for (const paso of secuencia) {
    await ejecutarPaso(paso, logFn);
  }

  logFn("✅ Secuencia completada.");
}

/* ============================================================
   LIMPIAR
   ============================================================ */

export function limpiarSecuencia() {
  secuencia = [];

  renderizarLista();
}

export function obtenerSecuencia() {
  return secuencia;
}

/* ============================================================
   EXPORTADOR PYTHON (estilo DobotLab / DobotEDU)
   ============================================================ */

const ENCABEZADO = `# =============================================================
#  Script generado por la Plataforma Didáctica Interactiva
#  Robot: Dobot Magician Lite (DobotEDU / DobotLab - Python Lab)
#
#  COTAS DE REFERENCIA (validar el espacio de trabajo ANTES de
#  ejecutar en el robot físico):
#    - Base:                150 x 150 mm
#    - Altura del hombro:   107 mm (eje J2)
#    - Eslabón trasero L1:  150 mm
#    - Eslabón delantero L2: 150 mm
#    - Alcance horizontal:  340 mm máx (Rmax)
#    - Alcance vertical:    +250 / -150 mm
#
#  CONVENCIÓN: ptp(mode=0, x, y, z, r) en mm y grados.
# =============================================================

from DobotEDU import *
import time

`;

/**
 * Genera el script Python de la secuencia.
 * @param {Array} pasos
 * @returns {string}
 */
export function generarPython(pasos = secuencia) {
  if (pasos.length === 0) {
    return "# Sin pasos: graba una secuencia primero.";
  }

  let code = ENCABEZADO;

  code += "# --- Secuencia: " + pasos.length + " pasos ---\n\n";

  code += "# Posición inicial segura\n";

  code += "magician.home()\n";

  code += "time.sleep(1)\n\n";

  pasos.forEach((p) => {
    code += `# Paso ${p.n} · ${p.herramienta} · ${p.accion}\n`;

    code += `magician.ptp(mode=0, x=${p.x}, y=${p.y}, z=${p.z}, r=${p.r})\n`;

    code += `time.sleep(${(p.t || 1).toFixed(1)})\n`;

    switch (p.accion) {
      case "agarrar":
      case "cerrar":
        code += "# Cerrar garra / activar succión\n";
        code += "magician.gripper(0)\n";
        break;

      case "soltar":
      case "abrir":
        code += "# Abrir garra / liberar succión\n";
        code += "magician.gripper(100)\n";
        break;

      case "ventosa_on":
        code += "# Activar bomba de vacío\n";
        code += "magician.gripper(0)\n";
        break;

      case "ventosa_off":
        code += "# Desactivar bomba de vacío\n";
        code += "magician.gripper(100)\n";
        break;
    }

    code += "\n";
  });

  code += "\n# Fin de la secuencia\n";

  code += "magician.home()\n";

  return code;
}
