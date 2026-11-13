/* ============================================================
   Carga de STL propios del estudiante (didáctico)
   - El estudiante sube su STL desde el PC (no se guarda en servidor)
   - Se monta en el visor junto al robot de referencia
   - Se calculan dimensiones y se muestran en el panel
   ============================================================ */

import * as THREE from "../../three/build/three.module.js";

import { STLLoader } from "../../three/examples/jsm/loaders/STLLoader.js";

import { scene } from "./scene.js";

import { orbit } from "./controls.js";

import { camera } from "./camera.js";

/* ============================================================
   ESTADO
   ============================================================ */

let meshEstudiante = null;

const loader = new STLLoader();

/* ============================================================
   MATERIALES
   ============================================================ */

const materialEstudiante = new THREE.MeshPhysicalMaterial({
  color: 0x9c27b0, // violeta: distinto al robot de referencia

  metalness: 0.15,

  roughness: 0.35,

  clearcoat: 0.3,
});

/* ============================================================
   CARGA DESDE ARCHIVO LOCAL
   ============================================================ */

/**
 * Lee un archivo STL del estudiante y lo añade a la escena.
 * @param {File} file
 * @returns {Promise<{nombre, dimensiones, triangulos}>}
 */
export function cargarSTLLocal(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No se seleccionó ningún archivo"));

      return;
    }

    if (!/\.stl$/i.test(file.name)) {
      reject(new Error("El archivo debe ser .STL"));

      return;
    }

    const reader = new FileReader();

    reader.onload = (evento) => {
      try {
        const buffer = evento.target.result;

        const geometry = loader.parse(buffer);

        geometry.computeBoundingBox();

        geometry.center();

        // Eliminar el mesh anterior si existía
        if (meshEstudiante) {
          scene.remove(meshEstudiante);

          meshEstudiante.geometry.dispose();
        }

        meshEstudiante = new THREE.Mesh(geometry, materialEstudiante);

        meshEstudiante.rotation.x = -Math.PI / 2; // STL en Z-up

        meshEstudiante.castShadow = true;

        meshEstudiante.receiveShadow = true;

        meshEstudiante.name = "modeloEstudiante";

        scene.add(meshEstudiante);

        // Información para el panel
        const size = new THREE.Box3()
          .setFromObject(meshEstudiante)

          .getSize(new THREE.Vector3());

        const dimensiones = {
          x: +size.x.toFixed(1),

          y: +size.y.toFixed(1),

          z: +size.z.toFixed(1),
        };

        const triangulos = geometry.attributes.position.count / 3;

        // Encuadrar la cámara sobre el nuevo modelo
        encuadrar(meshEstudiante);

        resolve({
          nombre: file.name,

          dimensiones,

          triangulos: Math.round(triangulos),
        });
      } catch (error) {
        reject(new Error("El archivo STL no se pudo leer: " + error.message));
      }
    };

    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Encuadra la cámara sobre un objeto (fit to view).
 */
function encuadrar(objeto) {
  const box = new THREE.Box3().setFromObject(objeto);

  const size = box.getSize(new THREE.Vector3());

  const max = Math.max(size.x, size.y, size.z);

  const dist = max * 2.2;

  const dir = new THREE.Vector3(1, 0.7, 1).normalize();

  camera.position.copy(orbit.target.clone().addScaledVector(dir, dist));

  orbit.update();
}

/**
 * Elimina el modelo del estudiante de la escena.
 */
export function quitarSTLLocal() {
  if (meshEstudiante) {
    scene.remove(meshEstudiante);

    meshEstudiante.geometry.dispose();

    meshEstudiante = null;
  }
}

/**
 * ¿Hay un modelo del estudiante cargado?
 */
export function hayModeloEstudiante() {
  return meshEstudiante !== null;
}

/* ============================================================
   PANEL EDUCATIVO DE ARTICULACIONES
   Muestra al estudiante qué articulación está manipulando,
   su eje de rotación y rango mecánico (datos reales Dobot).
   ============================================================ */

export const INFO_ARTICULACIONES = {
  base: {
    nombre: "Base (J1)",
    descripcion:
      "Rota todo el brazo sobre la mesa de trabajo. Es la articulación que determina hacia dónde apunta el robot.",
    eje: "Vertical (Y)",
    tipo: "Rotación",
  },

  hombro: {
    nombre: "Hombro (J2)",
    descripcion:
      "Eleva y baja el brazo principal. Define la altura de alcance del efector.",
    eje: "Horizontal (Z)",
    tipo: "Rotación",
  },

  codo: {
    nombre: "Codo (J3)",
    descripcion:
      "Extiende o contrae el antebrazo. Junto con el hombro define el alcance horizontal.",
    eje: "Horizontal (Z)",
    tipo: "Rotación",
  },

  muneca: {
    nombre: "Muñeca (J4)",
    descripcion:
      "Orienta la herramienta final. Permite ajustar el ángulo de la garra sin mover el brazo.",
    eje: "Horizontal (Z)",
    tipo: "Rotación",
  },

  garra: {
    nombre: "Garra (efector final)",
    descripcion:
      "Abre y cierra las pinzas para agarrar objetos. Es el elemento que interactúa con el mundo.",
    eje: "Apertura lineal",
    tipo: "Prismático",
  },
};

/**
 * Muestra la ficha informativa de una articulación.
 * @param {string} id - base|hombro|codo|muneca|garra
 */
export function mostrarInfoArticulacion(id) {
  const panel = document.getElementById("infoArticulacion");

  const info = INFO_ARTICULACIONES[id];

  if (!panel || !info) return;

  panel.innerHTML = `
        <h5>${info.nombre}</h5>
        <p>${info.descripcion}</p>
        <div class="info-articulacion-datos">
            <span><i class="fa-solid fa-rotate"></i> Tipo: ${info.tipo}</span>
            <span><i class="fa-solid fa-compass"></i> Eje: ${info.eje}</span>
        </div>
    `;

  panel.classList.add("visible");
}
