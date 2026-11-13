/* ============================================================
   Simulación de articulaciones del Dobot Magician Lite
   - Slider por articulación (grados)
   - Mueve el modelo STL de forma aproximada (rigid transform)
   - Lee la pose del efector final (FK simple sobre pivotes)
   ============================================================ */

import * as THREE from "../../three/build/three.module.js";

import { scene } from "./scene.js";

/* ============================================================
   DEFINICIÓN DE ARTICULACIONES (según Dobot Magician Lite)
   ============================================================ */

const articulaciones = [
  {
    id: "base",
    nombre: "Base (rotación)",
    min: -135,
    max: 135,
    def: 0,
    eje: "y", // gira alrededor de Y (vertical)
  },
  {
    id: "hombro",
    nombre: "Hombro",
    min: -15,
    max: 85,
    def: 20,
    eje: "z", // eleva el brazo
  },
  {
    id: "codo",
    nombre: "Codo",
    min: -95,
    max: 0,
    def: -45,
    eje: "z",
  },
  {
    id: "muneca",
    nombre: "Muñeca",
    min: -105,
    max: 105,
    def: 0,
    eje: "z",
  },
  {
    id: "garra",
    nombre: "Garra (apertura)",
    min: 0,
    max: 100,
    def: 50,
    eje: "z", // apertura % (mapea a ángulo)
  },
];

export let robotRig = null; // grupo raíz con los pivotes

/* ============================================================
   CREAR ESQUELETO / PIVOTES
   El STL completo se subdivide aproximadamente por zonas de X
   para dar sensación de movimiento real del brazo.
   ============================================================ */

/**
 * Construye el rig articulado a partir del mesh del robot.
 * @param {THREE.Mesh} mesh - mesh del STL cargado
 */
export function construirRig(mesh) {
  if (!mesh) return null;

  robotRig = new THREE.Group();

  robotRig.name = "robotRig";

  // Pivotes anidados: base -> hombro -> codo -> muñeca
  // Cada pivote rota alrededor de su origen local.
  const pivoteBase = new THREE.Group(); // rotación Y
  const pivoteHombro = new THREE.Group(); // rotación Z
  const pivoteCodo = new THREE.Group(); // rotación Z
  const pivoteMuneca = new THREE.Group(); // rotación Z

  pivoteBase.name = "pivoteBase";
  pivoteHombro.name = "pivoteHombro";
  pivoteCodo.name = "pivoteCodo";
  pivoteMuneca.name = "pivoteMuneca";

  // Alturas aproximadas del Magician Lite (mm)
  const ALT_BASE = 30; // altura del eje de la base
  const ALT_HOMBRO = 70; // altura del eje del hombro
  const LARGO_BRAZO = 85; // hombro -> codo
  const LARGO_CODO = 70; // codo -> muñeca

  pivoteBase.position.y = ALT_BASE;

  pivoteHombro.position.set(0, ALT_HOMBRO - ALT_BASE, 0);

  pivoteCodo.position.set(LARGO_BRAZO, 0, 0); // el brazo se extiende en X

  pivoteMuneca.position.set(LARGO_CODO, 0, 0);

  // Encadenar pivotes
  pivoteBase.add(pivoteHombro);

  pivoteHombro.add(pivoteCodo);

  pivoteCodo.add(pivoteMuneca);

  // El mesh STL se corta en 4 "capas" por rango de altura:
  // (aproximación didáctica, no es cinemática real de CAD)
  const partes = subdividirMesh(mesh, [
    { hasta: ALT_BASE }, // base fija
    { desde: ALT_BASE, hasta: ALT_HOMBRO }, // hombro
    { desde: ALT_HOMBRO, hasta: ALT_HOMBRO + LARGO_BRAZO }, // brazo
    { desde: ALT_HOMBRO + LARGO_BRAZO }, // antebrazo+muñeca+garra
  ]);

  if (partes && partes.length === 4) {
    partes[0].position.y = 0;

    pivoteBase.add(partes[1]);

    pivoteHombro.add(partes[2]);

    pivoteCodo.add(partes[3]);

    // Sustituir el mesh suelto por el rig
    scene.remove(mesh);

    mesh.visible = false;
  } else {
    // Fallback: si no se puede subdividir, el rig mueve el mesh entero
    pivoteMuneca.add(mesh);
  }

  robotRig.add(pivoteBase);

  scene.add(robotRig);

  return robotRig;
}

/**
 * Subdivide un mesh por rangos de altura Y usando clipping manual
 * de bounding boxes (aproximación por capas).
 */
function subdividirMesh(mesh, rangos) {
  const geometry = mesh.geometry;

  const bbox = geometry.boundingBox;

  if (!bbox) return null;

  const minY = bbox.min.y;

  const maxY = bbox.max.y;

  const altura = maxY - minY;

  if (altura <= 0) return null;

  return rangos.map((r) => {
    const desde = r.desde != null ? r.desde / altura : 0;

    const hasta = r.hasta != null ? r.hasta / altura : 1;

    const geo = geometry.clone();

    const pos = geo.attributes.position;

    // Descartar triángulos fuera del rango de altura
    const keep = [];

    for (let i = 0; i < pos.count; i += 3) {
      const y1 = pos.getY(i);
      const y2 = pos.getY(i + 1);
      const y3 = pos.getY(i + 2);

      const yMedia = (y1 + y2 + y3) / 3;

      const norm = (yMedia - minY) / altura;

      if (norm >= desde && norm < hasta) {
        keep.push(i, i + 1, i + 2);
      }
    }

    if (keep.length === 0) return null;

    // Construir nueva geometría solo con los vértices conservados
    const nuevo = new THREE.BufferGeometry();

    const newPos = [];

    const newNorm = [];

    const normal = geo.attributes.normal;

    for (const idx of keep) {
      newPos.push(pos.getX(idx), pos.getY(idx), pos.getZ(idx));

      if (normal) {
        newNorm.push(normal.getX(idx), normal.getY(idx), normal.getZ(idx));
      }
    }

    nuevo.setAttribute("position", new THREE.Float32BufferAttribute(newPos, 3));

    if (normal) {
      nuevo.setAttribute(
        "normal",
        new THREE.Float32BufferAttribute(newNorm, 3),
      );
    }

    nuevo.computeBoundingBox();

    const parte = new THREE.Mesh(nuevo, mesh.material);

    parte.castShadow = true;

    parte.receiveShadow = true;

    return parte;
  });
}

/* ============================================================
   APLICAR ÁNGULOS A LOS PIVOTES
   ============================================================ */

/**
 * Aplica los ángulos actuales (en grados) a cada pivote.
 * @param {Object} valores - { base, hombro, codo, muneca, garra }
 */
export function aplicarAngulos(valores) {
  if (!robotRig) return;

  const base = robotRig.getObjectByName("pivoteBase");

  const hombro = robotRig.getObjectByName("pivoteHombro");

  const codo = robotRig.getObjectByName("pivoteCodo");

  const muneca = robotRig.getObjectByName("pivoteMuneca");

  const d2r = THREE.MathUtils.degToRad;

  if (base) base.rotation.y = d2r(valores.base);

  if (hombro) hombro.rotation.z = d2r(valores.hombro);

  if (codo) codo.rotation.z = d2r(valores.codo);

  if (muneca) muneca.rotation.z = d2r(valores.muneca);

  // La garra solo se simula como apertura visual (rotación parcial)
}

/* ============================================================
   CALCULAR POSE DEL EECTOR FINAL (FK simplificada)
   ============================================================ */

/**
 * Devuelve la posición mundial del efector final (punta del rig).
 */
export function obtenerPoseEfector() {
  if (!robotRig) return null;

  const muneca = robotRig.getObjectByName("pivoteMuneca");

  if (!muneca) return null;

  const pos = new THREE.Vector3();

  muneca.getWorldPosition(pos);

  return {
    x: +pos.x.toFixed(1),
    y: +pos.y.toFixed(1),
    z: +pos.z.toFixed(1),
  };
}
