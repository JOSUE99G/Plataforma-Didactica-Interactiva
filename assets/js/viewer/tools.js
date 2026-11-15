/* ============================================================
   Controles estilo editor de STL (slicer/impresión 3D)
   Requiere los IDs presentes en visualizador.html
   ============================================================ */

import { scene } from "./scene.js";

import { camera } from "./camera.js";

import { orbit } from "./controls.js";

/* ============================================================
   GRID / EJES / SUELO ESTILO SLICER
   ============================================================ */

// Cuadrícula tipo "plataforma de impresión" (más sutil que la actual)
export function configurarEscena() {
  scene.background = new THREE.Color(0xeef1f6);
}

/* ============================================================
   ZOOM / ESCALA DEL MODELO (didáctico)
   ============================================================ */

let escalaActual = 1;

const escalaMin = 0.25;

const escalaMax = 3;

let escalaBase = null; // bounding box original del modelo sin escalar

/**
 * Aplica la escala del modelo a partir del slider (%) conservando
 * la posición sobre el suelo.
 * @param {number} porcentaje - 25 a 300 (%)
 */
export function aplicarEscala(porcentaje) {
  escalaActual = THREE.MathUtils.clamp(porcentaje / 100, escalaMin, escalaMax);

  if (robot && escalaBase) {
    robot.scale.setScalar(escalaActual);
  }
}

/**
 * Devuelve la escala actual en %.
 */
export function obtenerEscala() {
  return Math.round(escalaActual * 100);
}

/* ============================================================
   PANEL DE INFORMACIÓN DEL MODELO (dimensiones reales)
   ============================================================ */

/**
 * Calcula dimensiones del modelo SIN escalar y las muestra en el
 * panel de información del visor.
 * @param {THREE.Mesh} mesh
 */
export function actualizarInfoModelo(mesh) {
  if (!mesh) return;

  const box = new THREE.Box3().setFromObject(mesh);

  const size = box.getSize(new THREE.Vector3());

  // El STL suele venir en mm; mostramos en mm con 1 decimal
  const dims = [size.x, size.y, size.z].map((v) => v.toFixed(1));

  const el = document.getElementById("infoDimensiones");

  if (el) {
    el.textContent = `X: ${dims[0]} mm · Y: ${dims[1]} mm · Z: ${dims[2]} mm`;
  }

  // Guardamos escala base (1.0) y bbox para uso posterior
  escalaBase = 1;
}

/* ============================================================
   CHECKBOXES DE VISUALIZACIÓN (arregla los huérfanos)
   ============================================================ */

export function iniciarCheckboxes(plate, axes) {
  const gridCheck = document.getElementById("gridCheck");

  const axisCheck = document.getElementById("axisCheck");

  const shadowCheck = document.getElementById("shadowCheck");

  const wireframeCheck = document.getElementById("wireframeCheck");

  const transparentCheck = document.getElementById("transparentCheck");

  if (gridCheck && plate) {
    gridCheck.addEventListener("change", (e) => {
      plate.visible = e.target.checked;
    });
  }

  if (axisCheck && axes) {
    axisCheck.addEventListener("change", (e) => {
      axes.visible = e.target.checked;
    });
  }

  if (shadowCheck) {
    shadowCheck.addEventListener("change", (e) => {
      // Aplica a todos los meshes del robot (modo simple o multi)
      const blancos = [
        scene.getObjectByName("robotSimple"),
        scene.getObjectByName("robotRig"),
        scene.getObjectByName("rigMulti"),
      ].filter(Boolean);

      blancos.forEach((raiz) => {
        raiz.traverse((obj) => {
          if (obj.isMesh) obj.castShadow = e.target.checked;
        });
      });
    });
  }

  if (wireframeCheck) {
    wireframeCheck.addEventListener("change", (e) => {
      // Aplica a todos los materiales del robot activo
      const blancos = [
        scene.getObjectByName("robotSimple"),
        scene.getObjectByName("robotRig"),
        scene.getObjectByName("rigMulti"),
      ].filter(Boolean);

      blancos.forEach((raiz) => {
        raiz.traverse((obj) => {
          if (obj.isMesh && obj.material) {
            obj.material.wireframe = e.target.checked;
          }
        });
      });
    });
  }

  if (transparentCheck) {
    transparentCheck.addEventListener("change", (e) => {
      const blancos = [
        scene.getObjectByName("robotSimple"),
        scene.getObjectByName("robotRig"),
        scene.getObjectByName("rigMulti"),
      ].filter(Boolean);

      blancos.forEach((raiz) => {
        raiz.traverse((obj) => {
          if (obj.isMesh && obj.material) {
            obj.material.transparent = e.target.checked;
            obj.material.opacity = e.target.checked ? 0.35 : 1;
            obj.material.needsUpdate = true;
          }
        });
      });
    });
  }
}

/* ============================================================
   SLIDER DE ESCALA UI
   ============================================================ */

export function iniciarSliderEscala() {
  const slider = document.getElementById("scaleSlider");

  const salida = document.getElementById("scaleValue");

  const btn100 = document.getElementById("scaleReset");

  if (!slider) return;

  slider.addEventListener("input", () => {
    const v = Number(slider.value);

    aplicarEscala(v);

    if (salida) salida.textContent = v + "%";
  });

  if (btn100) {
    btn100.addEventListener("click", () => {
      slider.value = 100;

      aplicarEscala(100);

      if (salida) salida.textContent = "100%";
    });
  }
}

/* ============================================================
   ZOOM DE CÁMARA (rueda ya funciona con OrbitControls)
   Botones +/- y reset de zoom
   ============================================================ */

export function iniciarZoomCamara() {
  const btnIn = document.getElementById("zoomIn");

  const btnOut = document.getElementById("zoomOut");

  const btnFit = document.getElementById("fitView");

  function dolly(factor) {
    const dir = new THREE.Vector3()

      .subVectors(orbit.target, camera.position)

      .normalize();

    camera.position.addScaledVector(dir, -factor);

    orbit.update();
  }

  if (btnIn) {
    btnIn.addEventListener("click", () => dolly(-30));
  }

  if (btnOut) {
    btnOut.addEventListener("click", () => dolly(30));
  }

  if (btnFit) {
    btnFit.addEventListener("click", () => {
      if (!robot) return;

      const box = new THREE.Box3().setFromObject(robot);

      const size = box.getSize(new THREE.Vector3());

      const max = Math.max(size.x, size.y, size.z);

      const dist = max * 2.5;

      const dir = new THREE.Vector3(1, 0.7, 1).normalize();

      camera.position.copy(orbit.target.clone().addScaledVector(dir, dist));

      orbit.update();
    });
  }
}
