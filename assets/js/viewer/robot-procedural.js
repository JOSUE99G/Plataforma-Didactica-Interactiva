/* ============================================================
   ROBOT VIRTUAL PROCEDURAL — Dobot Magician Lite
   Apariencia fiel al robot real (blanco + detalles amarillos),
   pivotes NACIENDO en sus articulaciones y 3 efector final
   intercambiable: marcador, ventosa y garra de tentáculos.
   ============================================================ */

import * as THREE from "../../three/build/three.module.js";

import { scene } from "./scene.js";

/* ============================================================
   DIMENSIONES (mm, datasheet aproximado)
   ============================================================ */

const DIM = {
  pedestalRadio: 55,
  pedestalAlto: 60,
  hombroAltura: 80,
  brazoLargo: 135,
  antebrazoLargo: 85,
};

/* ============================================================
   MATERIALES — paleta del Magician Lite real
   Cuerpo blanco glossy + detalles amarillos + gris oscuro
   ============================================================ */

function mat(color, opts = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: opts.metal ?? 0.1,
    roughness: opts.rough ?? 0.35,
    clearcoat: 0.4,
    ...opts.extra,
  });
}

const M = {
  blanco: mat(0xf2f2ee, { rough: 0.3 }),        // cuerpo blanco
  amarillo: mat(0xffc20e, { rough: 0.35 }),     // banda + anillo amarillo
  oscuro: mat(0x2b2f36, { rough: 0.45 }),       // base negra
  gris: mat(0x9aa0aa, { metal: 0.5 }),          // ejes metálicos
  grisClaro: mat(0xd8dce2, { rough: 0.3 }),     // tapas
  marcador: mat(0x111111, { rough: 0.25 }),     // cuerpo del marcador
  marcadorPunta: mat(0x2e7d32),                 // punta verde
  ventosa: mat(0xe53935, { rough: 0.25 }),      // ventosa roja
  tentaculo: mat(0x1565c0, { rough: 0.3 }),     // garra azul
};

/* ============================================================
   HELPERS
   ============================================================ */

function cilindro(radio, altura, material, seg = 32) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radio, radio, altura, seg),
    material,
  );

  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}

function caja(ancho, alto, profundo, material) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(ancho, alto, profundo),
    material,
  );

  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}

function toro(radio, tubo, material) {
  const mesh = new THREE.Mesh(
    new THREE.TorusGeometry(radio, tubo, 16, 40),
    material,
  );

  mesh.castShadow = true;

  return mesh;
}

/* ============================================================
   CONSTRUCCIÓN DEL ROBOT
   ============================================================ */

let robot = null;

export function construirRobotProcedural() {
  if (robot) {
    scene.remove(robot);
  }

  robot = new THREE.Group();

  robot.name = "robotProcedural";

  /* ---------- PEDESTAL (base fija, gris oscuro) ---------- */

  const pedestal = cilindro(DIM.pedestalRadio, DIM.pedestalAlto, M.oscuro);

  pedestal.position.y = DIM.pedestalAlto / 2;

  pedestal.name = "pedestal";

  robot.add(pedestal);

  // Logo plateado decorativo
  const logo = cilindro(12, 2, M.grisClaro);

  logo.position.set(0, DIM.pedestalAlto / 2, DIM.pedestalRadio * 0.8);

  logo.rotation.x = Math.PI / 2;

  robot.add(logo);

  /* ---------- J1: ROTACIÓN BASE ---------- */

  const pivoteJ1 = new THREE.Group();

  pivoteJ1.name = "pivote_J1";

  pivoteJ1.position.y = DIM.pedestalAlto;

  robot.add(pivoteJ1);

  // Cuerpo blanco de la base rotatoria
  const cuerpoBase = cilindro(DIM.pedestalRadio * 0.82, 26, M.blanco);

  cuerpoBase.position.y = 13;

  pivoteJ1.add(cuerpoBase);

  /* ---------- TORRE DEL HOMBRO (blanca) ---------- */

  const torreAlto = DIM.hombroAltura - DIM.pedestalAlto;

  const torre = caja(44, torreAlto, 34, M.blanco);

  torre.position.y = torreAlto / 2;

  pivoteJ1.add(torre);

  /* ---------- J2: HOMBRO (disco con anillo amarillo) ---------- */

  const pivoteJ2 = new THREE.Group();

  pivoteJ2.name = "pivote_J2";

  pivoteJ2.position.y = torreAlto;

  pivoteJ1.add(pivoteJ2);

  // Disco blanco del hombro (la tapa circular característica)
  const discoHombro = cilindro(26, 14, M.blanco);

  discoHombro.rotation.z = Math.PI / 2;   // eje horizontal X

  discoHombro.position.x = 6;

  pivoteJ2.add(discoHombro);

  // Anillo amarillo del disco (detalle icónico)
  const anillo = toro(20, 3.5, M.amarillo);

  anillo.rotation.y = Math.PI / 2;

  anillo.position.x = 14;

  pivoteJ2.add(anillo);

  /* ---------- BRAZO PRINCIPAL (blanco con banda amarilla) ---------- */

  const brazo = caja(DIM.brazoLargo, 30, 26, M.blanco);

  brazo.position.x = DIM.brazoLargo / 2;

  pivoteJ2.add(brazo);

  // Banda amarilla a lo largo del brazo (decorativa, como el real)
  const banda = caja(DIM.brazoLargo * 0.75, 6, 27, M.amarillo);

  banda.position.set(DIM.brazoLargo / 2, 0, 0);

  pivoteJ2.add(banda);

  /* ---------- J3: CODO (disco blanco) ---------- */

  const pivoteJ3 = new THREE.Group();

  pivoteJ3.name = "pivote_J3";

  pivoteJ3.position.x = DIM.brazoLargo;

  pivoteJ2.add(pivoteJ3);

  const discoCodo = cilindro(20, 12, M.blanco);

  discoCodo.rotation.z = Math.PI / 2;

  pivoteJ3.add(discoCodo);

  const anilloCodo = toro(16, 3, M.amarillo);

  anilloCodo.rotation.y = Math.PI / 2;

  anilloCodo.position.x = 8;

  pivoteJ3.add(anilloCodo);

  /* ---------- ANTEBRAZO (blanco, más delgado) ---------- */

  const antebrazo = caja(DIM.antebrazoLargo, 20, 18, M.blanco);

  antebrazo.position.x = DIM.antebrazoLargo / 2;

  pivoteJ3.add(antebrazo);

  const banda2 = caja(DIM.antebrazoLargo * 0.6, 5, 19, M.amarillo);

  banda2.position.set(DIM.antebrazoLargo / 2, 0, 0);

  pivoteJ3.add(banda2);

  /* ---------- J4: MUÑECA ---------- */

  const pivoteJ4 = new THREE.Group();

  pivoteJ4.name = "pivote_J4";

  pivoteJ4.position.x = DIM.antebrazoLargo;

  pivoteJ3.add(pivoteJ4);

  const discoMuneca = cilindro(14, 10, M.blanco);

  discoMuneca.rotation.z = Math.PI / 2;

  pivoteJ4.add(discoMuneca);

  /* ---------- EFECTOR FINAL INTERCAMBIABLE ---------- */

  const pivoteAccesorio = new THREE.Group();

  pivoteAccesorio.name = "pivote_accesorio";

  pivoteAccesorio.position.x = 10;

  pivoteJ4.add(pivoteAccesorio);

  // Los 3 accesorios (solo 1 visible a la vez)
  pivoteAccesorio.add(crearMarcador());

  pivoteAccesorio.add(crearVentosa());

  pivoteAccesorio.add(crearGarra());

  aplicarAccesorio("marcador", pivoteAccesorio);

  /* ---------- MONTAR ---------- */

  scene.add(robot);

  console.log("✅ Magician Lite procedural (apariencia real + 3 accesorios).");

  return robot;
}

/* ============================================================
   ACCESORIOS DEL EFECTOR FINAL
   ============================================================ */

function crearMarcador() {
  const grupo = new THREE.Group();

  grupo.name = "accesorio_marcador";

  // Cuerpo negro del marcador
  const cuerpo = cilindro(5, 34, M.marcador);

  cuerpo.rotation.z = Math.PI / 2;

  cuerpo.position.x = 17;

  grupo.add(cuerpo);

  // Anillo amarillo
  const anillo = cilindro(5.5, 3, M.amarillo);

  anillo.rotation.z = Math.PI / 2;

  anillo.position.x = 8;

  grupo.add(anillo);

  // Punta cónica verde
  const punta = new THREE.Mesh(
    new THREE.ConeGeometry(3, 10, 16),
    M.marcadorPunta,
  );

  punta.rotation.z = -Math.PI / 2;

  punta.position.x = 38;

  punta.castShadow = true;

  grupo.add(punta);

  return grupo;
}

function crearVentosa() {
  const grupo = new THREE.Group();

  grupo.name = "accesorio_ventosa";

  // Soporte
  const soporte = cilindro(6, 12, M.grisClaro);

  soporte.rotation.z = Math.PI / 2;

  soporte.position.x = 8;

  grupo.add(soporte);

  // Copa roja (esfera achatada)
  const copa = new THREE.Mesh(
    new THREE.SphereGeometry(12, 24, 16),
    M.ventosa,
  );

  copa.scale.set(0.6, 1, 1);      // achatada en X

  copa.position.x = 22;

  copa.castShadow = true;

  grupo.add(copa);

  // Nipple central
  const nipple = cilindro(4, 5, M.ventosa);

  nipple.rotation.z = Math.PI / 2;

  nipple.position.x = 30;

  grupo.add(nipple);

  return grupo;
}

function crearGarra() {
  const grupo = new THREE.Group();

  grupo.name = "accesorio_garra";

  // Hub central
  const hub = cilindro(9, 14, M.grisClaro);

  hub.rotation.z = Math.PI / 2;

  hub.position.x = 8;

  grupo.add(hub);

  // 3 tentáculos curvos a 120° (simplificados como cajas curvadas)
  for (let i = 0; i < 3; i++) {

    const ang = (i * 120 * Math.PI) / 180;

    const tent = caja(6, 34, 5, M.tentaculo);

    // Pivotar desde el hub hacia afuera
    tent.position.set(20, 0, 0);

    const brazoTent = new THREE.Group();

    brazoTent.rotation.y = ang;

    brazoTent.add(tent);

    // Curvar la punta hacia adentro
    tent.rotation.z = 0.4;

    tent.position.set(20, 12, 0);

    grupo.add(brazoTent);

  }

  return grupo;
}

/* ============================================================
   SELECCIÓN DE ACCESORIO
   ============================================================ */

/**
 * Muestra solo el accesorio elegido.
 * @param {string} tipo - "marcador" | "ventosa" | "garra"
 */
export function aplicarAccesorio(tipo, pivoteAccesorio = null) {

  const raiz = pivoteAccesorio ||
    (robot && robot.getObjectByName("pivote_accesorio"));

  if (!raiz) return;

  ["marcador", "ventosa", "garra"].forEach(nombre => {

    const obj = raiz.getObjectByName("accesorio_" + nombre);

    if (obj) obj.visible = nombre === tipo;

  });

}

/* ============================================================
   ÁNGULOS (convención Dobot Magician Lite)
   ============================================================ */

export function aplicarAngulosProcedural(ang) {
  if (!robot) return;

  const d2r = THREE.MathUtils.degToRad;

  const j1 = robot.getObjectByName("pivote_J1");

  const j2 = robot.getObjectByName("pivote_J2");

  const j3 = robot.getObjectByName("pivote_J3");

  const j4 = robot.getObjectByName("pivote_J4");

  // Apertura visual de la garra (afecta a tentáculos si está activa)
  if (j1) j1.rotation.y = d2r(ang.base ?? 0);

  if (j2) j2.rotation.z = d2r(ang.hombro ?? 0);

  if (j3) j3.rotation.z = d2r(ang.codo ?? 0);

  if (j4) j4.rotation.z = d2r(ang.muneca ?? 0);

  // La garra de tentáculos abre/cierra con el slider
  const g = robot.getObjectByName("accesorio_garra");

  if (g) {
    const apertura = ((ang.garra ?? 50) / 100) * 0.5;

    g.children.forEach((brazo, i) => {
      if (i === 0) return;   // el primer hijo es el propio tentáculo base

      brazo.children.forEach((tent) => {

        // Cada tentáculo rota hacia afuera según apertura
        tent.rotation.y = apertura * (i - 1) * 1.2;

      });
    });
  }
}

/* ============================================================
   POSE DEL EFECTOR
   ============================================================ */

export function obtenerPoseProcedural() {
  if (!robot) return null;

  const punta = robot.getObjectByName("pivote_accesorio");

  if (!punta) return null;

  punta.updateWorldMatrix(true, false);

  const pos = new THREE.Vector3();

  punta.getWorldPosition(pos);

  return {
    x: +pos.x.toFixed(1),
    y: +pos.y.toFixed(1),
    z: +pos.z.toFixed(1),
  };
}

/**
 * Escala el robot completo.
 */
export function escalarRobotProcedural(factor) {
  if (!robot) return;

  robot.scale.setScalar(factor);
}
