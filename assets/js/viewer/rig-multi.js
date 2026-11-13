/* ============================================================
   Cargador de RIG MULTI-STL
   Permite cargar las piezas del robot por separado (exportadas
   desde Fusion 360 como STL individuales por eslabón) y armar
   una cadena cinemática REAL: cada pieza rota alrededor de su
   eje articular verdadero, no por aproximación de capas.

   Formato esperado: objeto JSON de configuración en
   assets/models/rig-dobot.json (ver DESPLEGE-LABORATORIO.md)
   ============================================================ */

import * as THREE from "../../three/build/three.module.js";

import { STLLoader } from "../../three/examples/jsm/loaders/STLLoader.js";

import { scene } from "./scene.js";

import { orbit } from "./controls.js";

import { camera } from "./camera.js";

/* ============================================================
   ESTADO
   ============================================================ */

export let rigMulti = null; // grupo raíz de la cadena cinemática

export let modoRig = "simple"; // "simple" (1 STL) | "multi" (varios)

const loader = new STLLoader();

/* ============================================================
   DEFINICIÓN POR DEFECTO (Dobot Magician Lite, mm)
   Si existe assets/models/rig-dobot.json se usa esa en su lugar.
   ============================================================ */

const CONFIG_DEFECTO = {
  eslabones: [
    {
      id: "base",
      stl: "assets/models/piezas/base.stl",
      padre: null,
      eje: "y",
      rango: [-135, 135],
    },
    {
      id: "hombro",
      stl: "assets/models/piezas/hombro.stl",
      padre: "base",
      eje: "z",
      rango: [-15, 85],
      origen: { x: 0, y: 63, z: 0 },
    },
    {
      id: "codo",
      stl: "assets/models/piezas/codo.stl",
      padre: "hombro",
      eje: "z",
      rango: [-95, 0],
      origen: { x: 85, y: 0, z: 0 },
    },
    {
      id: "muneca",
      stl: "assets/models/piezas/muneca.stl",
      padre: "codo",
      eje: "z",
      rango: [-105, 105],
      origen: { x: 70, y: 0, z: 0 },
    },
    {
      id: "garra",
      stl: "assets/models/piezas/garra.stl",
      padre: "muneca",
      eje: "z",
      rango: [0, 100],
      origen: { x: 30, y: 0, z: 0 },
    },
  ],

  efector: "muneca",
};

/* ============================================================
   CONSTRUCCIÓN DEL RIG
   ============================================================ */

function crearMaterial(piezaId) {
  // Colores por eslabón para identificación didáctica
  const colores = {
    base: 0x2b3444,
    hombro: 0x3f8cff,
    codo: 0x43a047,
    muneca: 0xf57c00,
    garra: 0xe53935,
  };

  return new THREE.MeshPhysicalMaterial({
    color: colores[piezaId] || 0x3f8cff,
    metalness: 0.2,
    roughness: 0.35,
    clearcoat: 0.3,
  });
}

/**
 * Carga un STL y lo centra en su pivote local.
 * El origen del pivote debe coincidir con el EJE de la articulación
 * (por eso en Fusion 360 cada pieza se exporta con su origen en la
 * articulación — ver guía).
 */
function cargarPieza(eslabon, material, onListos) {
  loader.load(
    eslabon.stl,

    function (geometry) {
      geometry.computeBoundingBox();

      geometry.center(); // centrar la pieza en su pivote

      const mesh = new THREE.Mesh(geometry, material);

      mesh.castShadow = true;

      mesh.receiveShadow = true;

      // Orientación estándar: los STL de CAD suelen venir en Z-up
      mesh.rotation.x = -Math.PI / 2;

      onListos(mesh);
    },

    undefined,

    function (error) {
      console.warn(`⚠ No se pudo cargar ${eslabon.stl}:`, error);
    },
  );
}

/**
 * Construye la cadena cinemática completa a partir de una config.
 * @param {Object} config - { eslabones: [...], efector: "muneca" }
 * @returns {Promise<THREE.Group>} rig raíz
 */
export function construirRigMulti(config = CONFIG_DEFECTO) {
  return new Promise((resolve) => {
    const nodos = {}; // id -> pivote

    const total = config.eslabones.length;

    let cargadas = 0;

    rigMulti = new THREE.Group();

    rigMulti.name = "rigMulti";

    scene.add(rigMulti);

    config.eslabones.forEach((esl) => {
      // Crear pivote con su origen articular
      const pivote = new THREE.Group();

      pivote.name = "pivote_" + esl.id;

      if (esl.origen) {
        pivote.position.set(
          esl.origen.x || 0,
          esl.origen.y || 0,
          esl.origen.z || 0,
        );
      }

      nodos[esl.id] = pivote;

      // Enganchar al padre (o al raíz si es base)
      const padre = esl.padre ? nodos[esl.padre] : rigMulti;

      // Esperar a que el padre exista (carga en orden)
      const intentarColgar = () => {
        const p = esl.padre ? nodos[esl.padre] : rigMulti;

        if (p) {
          p.add(pivote);
        } else {
          setTimeout(intentarColgar, 50);
        }
      };

      intentarColgar();

      // Cargar pieza
      cargarPieza(esl, crearMaterial(esl.id), (mesh) => {
        pivote.add(mesh);

        cargadas++;

        if (cargadas === total) {
          modoRig = "multi";

          resolve(rigMulti);
        }
      });
    });
  });
}

/**
 * Aplica ángulos (grados) a los pivotes del rig multi.
 * Misma interfaz que aplicarAngulos() del rig simple.
 * @param {Object} valores - { base, hombro, codo, muneca, garra }
 */
export function aplicarAngulosMulti(valores) {
  if (!rigMulti) return;

  const d2r = THREE.MathUtils.degToRad;

  configActual.eslabones.forEach((esl) => {
    const pivote = rigMulti.getObjectByName("pivote_" + esl.id);

    if (!pivote) return;

    const valor = valores[esl.id];

    if (valor == null) return;

    // Clamp al rango articular real
    const [min, max] = esl.rango || [-360, 360];

    const v = THREE.MathUtils.clamp(valor, min, max);

    pivote.rotation[esl.eje] = d2r(v);
  });
}

let configActual = CONFIG_DEFECTO;

/**
 * Pose del efector final (posición mundial del pivote efector)
 */
export function obtenerPoseEfectorMulti() {
  if (!rigMulti) return null;

  const efector = rigMulti.getObjectByName("pivote_" + configActual.efector);

  if (!efector) return null;

  const pos = new THREE.Vector3();

  efector.getWorldPosition(pos);

  return {
    x: +pos.x.toFixed(1),
    y: +pos.y.toFixed(1),
    z: +pos.z.toFixed(1),
  };
}

/**
 * Carga la configuración desde JSON si existe (permite ajustar
 * orígenes articulares sin tocar el código).
 */
export async function cargarConfigRig() {
  try {
    const res = await fetch("assets/models/rig-dobot.json");

    if (res.ok) {
      configActual = await res.json();

      console.log("✅ Configuración de rig cargada desde rig-dobot.json");
    }
  } catch (e) {
    console.log("ℹ Usando configuración de rig por defecto.");
  }

  return configActual;
}
