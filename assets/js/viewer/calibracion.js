/* ============================================================
   PANEL DE CALIBRACIÓN DE ARTICULACIONES
   Permite ajustar en VIVO el eje y el origen de cada articulación
   sobre el robot montado, y exportar el JSON corregido.
   Flujo: mover sliders de calibración → cuando el giro queda en
   la unión correcta → "Copiar JSON" → pegar en rig-brazo.json.
   ============================================================ */

import * as THREE from "../../three/build/three.module.js";

import { scene } from "./scene.js";

/* ============================================================
   ESTADO
   ============================================================ */

let configCalibracion = null;

let ejesVisuales = null; // grupo con los AxesHelpers de cada joint

/* ============================================================
   AYUDAS VISUALES: mostrar el eje de giro de cada articulación
   ============================================================ */

function crearEjesVisuales(config) {
  if (ejesVisuales) {
    scene.remove(ejesVisuales);

    ejesVisuales = null;
  }

  ejesVisuales = new THREE.Group();

  ejesVisuales.name = "ejesCalibracion";

  const rig = scene.getObjectByName("rigMulti");

  if (!rig) return;

  config.eslabones.forEach((esl) => {
    const pivote = rig.getObjectByName("pivote_" + esl.id);

    if (!pivote) return;

    // AxesHelper en la posición mundial del pivote:
    // rojo=X, verde=Y, azul=Z — el eje de giro debe verse
    // pasando por la unión física de las piezas.
    const helper = new THREE.AxesHelper(60);

    helper.name = "eje_" + esl.id;

    // Posicionar el helper donde está el pivote (mundo)
    pivote.updateWorldMatrix(true, false);

    const pos = new THREE.Vector3();

    pivote.getWorldPosition(pos);

    helper.position.copy(pos);

    ejesVisuales.add(helper);
  });

  scene.add(ejesVisuales);
}

function quitarEjesVisuales() {
  if (ejesVisuales) {
    scene.remove(ejesVisuales);

    ejesVisuales = null;
  }
}

/* ============================================================
   PANEL UI
   ============================================================ */

/**
 * Abre el panel de calibración con la config actual del robot.
 * @param {Object} config - configuración cargada (rig-brazo.json)
 * @param {Function} onAplicar - callback(config) para re-aplicar cambios
 */
export function abrirCalibracion(config, onAplicar) {
  configCalibracion = JSON.parse(JSON.stringify(config));

  // Inyectar el panel en el body (flotante)
  let panel = document.getElementById("panelCalibracion");

  if (!panel) {
    panel = document.createElement("div");

    panel.id = "panelCalibracion";

    document.body.appendChild(panel);
  }

  panel.innerHTML = `
        <div class="cal-header">
            <strong><i class="fa-solid fa-screwdriver-wrench"></i> Calibración de articulaciones</strong>
            <button id="calCerrar" title="Cerrar">✕</button>
        </div>
        <p class="cal-ayuda">
            Ajusta eje y origen hasta que el giro quede en la unión.
            Los ejes de color (R=X, G=Y, B=Z) marcan cada pivote.
        </p>
        <div id="calSliders"></div>
        <div class="cal-acciones">
            <button id="calAplicar" class="mod-btn">Aplicar</button>
            <button id="calCopiar" class="mod-btn secundario">Copiar JSON</button>
            <button id="calEjes" class="btn-mini" title="Mostrar/ocultar ejes">👁</button>
        </div>
    `;

  renderizarSliders(onAplicar);

  crearEjesVisuales(configCalibracion);

  // Cerrar
  panel.querySelector("#calCerrar").onclick = () => {
    panel.remove();

    quitarEjesVisuales();
  };

  // Aplicar cambios
  panel.querySelector("#calAplicar").onclick = () => {
    onAplicar(configCalibracion);

    crearEjesVisuales(configCalibracion);
  };

  // Copiar JSON corregido
  panel.querySelector("#calCopiar").onclick = () => {
    const limpio = { ...configCalibracion };

    delete limpio._ayuda;

    const texto = JSON.stringify(limpio, null, 2);

    navigator.clipboard.writeText(texto).then(() => {
      const btn = panel.querySelector("#calCopiar");

      btn.textContent = "✅ Copiado";

      setTimeout(() => (btn.textContent = "Copiar JSON"), 1500);
    });
  };

  // Toggle ejes
  panel.querySelector("#calEjes").onclick = () => {
    if (ejesVisuales) {
      ejesVisuales.visible = !ejesVisuales.visible;
    }
  };
}

function renderizarSliders(onAplicar) {
  const cont = document.getElementById("calSliders");

  cont.innerHTML = "";

  configCalibracion.eslabones.forEach((esl, idx) => {
    const div = document.createElement("div");

    div.className = "cal-eslabon";

    div.innerHTML = `
            <h5>${esl.id}</h5>
            <div class="cal-fila">
                <label>Eje:</label>
                <select data-idx="${idx}" data-campo="eje">
                    ${["x", "y", "z"]
                      .map(
                        (e) =>
                          `<option ${esl.eje === e ? "selected" : ""}>${e}</option>`,
                      )
                      .join("")}
                </select>
            </div>
            ${["x", "y", "z"]
              .map(
                (e) => `
                <div class="cal-fila">
                    <label>origen.${e}:</label>
                    <input type="number" step="5" value="${(esl.origen && esl.origen[e]) || 0}"
                           data-idx="${idx}" data-campo="origen" data-eje="${e}">
                </div>
            `,
              )
              .join("")}
        `;

    cont.appendChild(div);
  });

  // Listeners: editar configCalibracion en vivo
  cont.querySelectorAll("select, input").forEach((input) => {
    input.addEventListener("change", () => {
      const idx = +input.dataset.idx;

      const esl = configCalibracion.eslabones[idx];

      if (input.dataset.campo === "eje") {
        esl.eje = input.value;
      } else {
        esl.origen[input.dataset.eje] = +input.value || 0;
      }

      // Aplicar en vivo
      onAplicar(configCalibracion);

      crearEjesVisuales(configCalibracion);
    });
  });
}
