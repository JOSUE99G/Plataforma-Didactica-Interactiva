/* ============================================================
   Dobot Magician Lite — modelo cinemático Three.js
   Jerarquía de grupos anidados, pivotes en los ejes reales.

   ESPECIFICACIONES (mm):
   - Base cuadrada 150×150, alto 70, borde inferior negro
   - Altura suelo→eje J2: 107 (J1 en y=70 + torreta 37)
   - Eslabón trasero (J2→J3): L1 = 150
   - Eslabón delantero (J3→efector): L2 = 150
   - Rmax horizontal: 340 | Altura máx: ~250 | Prof: -150

   MARCO DE REFERENCIA:
   - Y hacia arriba (escena estándar Three.js)
   - El frente del robot mira a +X
   - J2 y J3 rotan sobre el eje Z (pitch)
   - J1 yaw sobre Y, J4 roll sobre el eje de la herramienta

   Para una escena con Z arriba (Z-up), ver la constante
   CONFIG.EJE_ALTURA al final del archivo.
   ============================================================ */

import * as THREE from "../../three/build/three.module.js";

import { scene } from "./scene.js";

/* ============================================================
   CONSTANTES CINEMÁTICAS (mm)
   ============================================================ */

const K = {
  BASE_XY: 150, // lado de la base cuadrada
  BASE_ALTO: 70, // altura de la base
  TORRETA_ALTO: 37, // J1 (70) -> eje J2 (107 total)
  ALTURA_J2: 107, // altura del eje J2 desde el suelo
  L1: 150, // eslabón trasero (J2 -> J3)
  L2: 150, // eslabón delantero (J3 -> efector)
  RMAX: 340, // alcance horizontal máximo
};

/* ============================================================
   MATERIALES — blanco mate + amarillo + negro
   ============================================================ */

function mat(color, rough = 0.4) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: rough,
    metalness: 0.05,
    clearcoat: 0.25,
  });
}

const COL = {
  blanco: 0xf5f5f5,
  blancoSuave: 0xf8f9fa,
  negro: 0x222222,
  negroSuave: 0x2b2d2f,
  amarillo: 0xffd100,
  grisEje: 0x9aa0aa,
  ventosa: 0xe53935,
};

const M = {
  blanco: mat(COL.blanco, 0.35),

  blancoSuave: mat(COL.blancoSuave, 0.3),

  negro: mat(COL.negro, 0.5),

  negroSuave: mat(COL.negroSuave, 0.55),

  amarillo: mat(COL.amarillo, 0.35),

  gris: mat(COL.grisEje, 0.3),

  ventosa: mat(COL.ventosa, 0.25),
};

/* ============================================================
   HELPERS
   ============================================================ */

function caja(w, h, d, material, radio = 0) {
  const shape = new THREE.Shape();

  // Caja con bordes biselados: usar RoundedBox aproximado con
  // ExtrudeGeometry cuando radio > 0 (silueta del Magician real)
  if (radio > 0) {
    const w2 = w / 2;

    const h2 = h / 2;

    shape.moveTo(-w2 + radio, -h2);

    shape.lineTo(w2 - radio, -h2);

    shape.quadraticCurveTo(w2, -h2, w2, -h2 + radio);

    shape.lineTo(w2, h2 - radio);

    shape.quadraticCurveTo(w2, h2, w2 - radio, h2);

    shape.lineTo(-w2 + radio, h2);

    shape.quadraticCurveTo(-w2, h2, -w2, h2 - radio);

    shape.lineTo(-w2, -h2 + radio);

    shape.quadraticCurveTo(-w2, -h2, -w2 + radio, -h2);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: d,
      bevelEnabled: true,
      bevelThickness: radio * 0.5,
      bevelSize: radio * 0.5,
      bevelSegments: 3,
      curveSegments: 6,
    });

    geo.center();

    const m = new THREE.Mesh(geo, material);

    m.castShadow = true;

    m.receiveShadow = true;

    return m;
  }

  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);

  m.castShadow = true;

  m.receiveShadow = true;

  return m;
}

function cilindro(r, h, material, seg = 32) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), material);

  m.castShadow = true;

  m.receiveShadow = true;

  return m;
}

function esfera(r, material) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), material);

  m.castShadow = true;

  return m;
}

/* ============================================================
   EFECTOR FINAL (ventosa por defecto)
   ============================================================ */

function crearVentosa() {
  const g = new THREE.Group();

  // Portaherramientas
  const porta = cilindro(10, 14, M.gris);

  porta.rotation.z = Math.PI / 2;

  porta.position.x = 8;

  g.add(porta);

  // Copa
  const copa = esfera(11, M.ventosa);

  copa.scale.set(0.55, 1, 1);

  copa.position.x = 22;

  g.add(copa);

  return g;
}

/* ============================================================
   FUNCIÓN PRINCIPAL: crearDobotMagicianLite()
   Devuelve { grupo, j1, j2, j3, j4, efector }
   ============================================================ */

export function crearDobotMagicianLite() {
  const grupo = new THREE.Group();

  grupo.name = "dobotMagicianLite";

  /* ============================================================
     1. BASE FIJA (150×150×70, borde inferior negro)
     ============================================================ */

  const baseMesh = caja(K.BASE_XY, K.BASE_ALTO, K.BASE_XY, M.blanco);

  baseMesh.position.y = K.BASE_ALTO / 2;

  baseMesh.name = "baseMesh";

  grupo.add(baseMesh);

  // Borde inferior negro
  const bordeNegro = caja(K.BASE_XY + 4, 10, K.BASE_XY + 4, M.negro);

  bordeNegro.position.y = 5;

  grupo.add(bordeNegro);

  /* ============================================================
     2. J1 — YAW sobre Y, en (0, 70, 0)
     ============================================================ */

  const pivotJ1 = new THREE.Group();

  pivotJ1.name = "pivotJ1";

  pivotJ1.position.set(0, K.BASE_ALTO, 0); // y = 70

  grupo.add(pivotJ1);

  // Torreta giratoria blanca (37mm: total 107 hasta eje J2)
  const torreta = caja(60, K.TORRETA_ALTO, 44, M.blanco);

  torreta.position.y = K.TORRETA_ALTO / 2;

  pivotJ1.add(torreta);

  // Bloque motor trasero negro sobresaliendo hacia atrás
  const motorTrasero = caja(34, 26, 20, M.negro);

  motorTrasero.position.set(-20, K.TORRETA_ALTO / 2, 0);

  pivotJ1.add(motorTrasero);

  /* ============================================================
     3. J2 — HOMBRO, hijo de J1, en (0, 37, 0) local (107 del suelo)
        Pitch sobre Z. El eslabón trasero sube 150 hacia atrás-arriba.
        Construido horizontal hacia +X; el ángulo se aplica en Z.
     ============================================================ */

  const pivotJ2 = new THREE.Group();

  pivotJ2.name = "pivotJ2";

  pivotJ2.position.set(0, K.TORRETA_ALTO, 0); // +37 local

  pivotJ1.add(pivotJ2);

  // Disco del hombro con anillo amarillo
  const discoJ2 = cilindro(20, 12, M.blanco);

  discoJ2.rotation.z = Math.PI / 2;

  pivotJ2.add(discoJ2);

  const anilloJ2 = new THREE.Mesh(
    new THREE.TorusGeometry(16, 3, 12, 40),
    M.amarillo,
  );

  anilloJ2.rotation.y = Math.PI / 2;

  anilloJ2.position.x = 8;

  pivotJ2.add(anilloJ2);

  // ESLABÓN TRASERO: 150 exactos hacia -X (hacia ATRÁS, como el
  // Magician real: el hombro lanza el brazo hacia atrás y el codo
  // lo devuelve hacia adelante — silueta "V" invertida).
  const eslabonTrasero = caja(K.L1, 30, 24, M.blancoSuave, 6);

  eslabonTrasero.position.x = -K.L1 / 2;

  pivotJ2.add(eslabonTrasero);

  // Franja central amarilla interna
  const franja1 = caja(K.L1 * 0.7, 8, 25, M.amarillo);

  franja1.position.x = -K.L1 / 2;

  pivotJ2.add(franja1);

  // Franja negra inferior
  const franjaNegra1 = caja(K.L1 * 0.6, 5, 25, M.negro);

  franjaNegra1.position.set(-K.L1 / 2, -11, 0);

  pivotJ2.add(franjaNegra1);

  /* ============================================================
     4. J3 — CODO, hijo de J2, a L1=150 del pivote J2
        Pitch sobre Z (paralelo a J2)
     ============================================================ */

  const pivotJ3 = new THREE.Group();

  pivotJ3.name = "pivotJ3";

  pivotJ3.position.x = -K.L1; // 150 del hombro, hacia atrás

  pivotJ2.add(pivotJ3);

  const discoJ3 = cilindro(16, 10, M.blanco);

  discoJ3.rotation.z = Math.PI / 2;

  pivotJ3.add(discoJ3);

  // ESLABÓN DELANTERO: 150 exactos hacia +X (adelante), biselado
  const eslabonDelantero = caja(K.L2, 22, 19, M.blancoSuave, 5);

  eslabonDelantero.position.x = K.L2 / 2;

  pivotJ3.add(eslabonDelantero);

  // Tapas circulares grises sobre los ejes de J2 y J3
  const tapaJ2 = cilindro(22, 4, M.gris);

  tapaJ2.rotation.z = Math.PI / 2;

  tapaJ2.position.x = 2;

  pivotJ2.add(tapaJ2);

  const tapaJ3 = cilindro(18, 4, M.gris);

  tapaJ3.rotation.z = Math.PI / 2;

  tapaJ3.position.x = 1;

  pivotJ3.add(tapaJ3);

  // CABLE/GUÍA CURVO AMARILLO pasando por encima del codo:
  // TubeGeometry siguiendo una curva CatmullRom entre los discos.
  const curvaCable = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-20, 16, 0),                      // sale del disco J2
    new THREE.Vector3(-K.L1 / 2, 34, 0),                // punto medio alto
    new THREE.Vector3(-K.L1 + 10, 22, 0),               // sobre el codo
    new THREE.Vector3(-K.L1 - 10, 12, 0),               // entra al eslabón 2
  ]);

  const cable = new THREE.Mesh(
    new THREE.TubeGeometry(curvaCable, 24, 2.5, 10, false),
    M.amarillo,
  );

  cable.castShadow = true;

  pivotJ2.add(cable);

  /* ============================================================
     CABEZAL (siempre paralelo al suelo — paralelogramo)
     Es hijo de J3 y su rotación se compensa en aplicarAngulos:
     cabezal.rotation.z = -(j2 + j3)
     ============================================================ */

  const cabezal = new THREE.Group();

  cabezal.name = "cabezal";

  cabezal.position.x = K.L2; // 150 del codo

  pivotJ3.add(cabezal);

  // Carcasa trasera del motor (gris oscuro/negro mate)
  const carcasaMotor = caja(40, 30, 26, M.negroSuave, 4);

  carcasaMotor.position.set(-4, 2, 0);

  cabezal.add(carcasaMotor);

  // LED indicador de estado (esferita amarilla al frente)
  const led = esfera(3, M.amarillo);

  led.position.set(18, 4, 8);

  cabezal.add(led);

  // Botón de desbloqueo físico (negro, encima del cabezal)
  const botonUnlock = cilindro(5, 6, M.negro);

  botonUnlock.position.set(0, 14, 0);

  cabezal.add(botonUnlock);

  /* ============================================================
     5. J4 — EFECTOR FINAL, hijo del cabezal, roll sobre Y local
     ============================================================ */

  // BLOQUE DE MUÑECA (J4): rota sobre Y local (roll) y siempre
  // apunta la herramienta hacia abajo (-90° en Z, fijado en
  // aplicarAngulos). El portaherramientas/herramienta se construye
  // hacia +X local: al rotar -90° queda colgando vertical.
  const bloqueMuneca = new THREE.Group();

  bloqueMuneca.name = "bloqueMuneca";

  bloqueMuneca.position.set(22, -4, 0);

  cabezal.add(bloqueMuneca);

  const pivotJ4 = new THREE.Group();

  pivotJ4.name = "pivotJ4";

  bloqueMuneca.add(pivotJ4);

  // Portaherramientas con FRANJA INDICADORA de rotación:
  // el usuario ve claramente cómo gira J4 sobre sí mismo (yaw local).
  const portaherramientas = cilindro(8, 16, M.gris);

  portaherramientas.rotation.z = Math.PI / 2;

  portaherramientas.position.x = 8;

  bloqueMuneca.add(portaherramientas);

  // Franja amarilla longitudinal: al girar J4 se desplaza visualmente
  const franjaJ4 = caja(18, 3, 2, M.amarillo);

  franjaJ4.position.set(8, 6, 0);

  bloqueMuneca.add(franjaJ4);

  const ventosa = crearVentosa();

  ventosa.position.x = 14;

  bloqueMuneca.add(ventosa);

  /* ============================================================
     MONTAR EN ESCENA
     ============================================================ */

  scene.add(grupo);

  return {
    grupo,
    j1: pivotJ1,
    j2: pivotJ2,
    j3: pivotJ3,
    j4: pivotJ4,
    cabezal,
    efector: pivotJ4,
  };
}

/* ============================================================
   APLICAR ÁNGULOS (grados, convención Dobot)
   - j1: yaw base (±150°)
   - j2: pitch hombro (positivo eleva)
   - j3: pitch codo (positivo pliega hacia arriba)
   - j4: roll efector
   - Compensación paralelogramo: cabezal = -(j2 + j3)
   ============================================================ */

let refs = null;

/* ============================================================
   POSTURA INICIAL: "V" INVERTIDA de trabajo
   hombro inclinado atrás/arriba, codo bajando hacia adelante
   ============================================================ */

const POSTURA_INICIAL = {
  base: 0,
  hombro: 50,
  codo: 35,
  muneca: 0,
};

export function montarDobot() {
  if (refs) return refs; // ya montado

  refs = crearDobotMagicianLite();

  aplicarAngulos(POSTURA_INICIAL);

  return refs;
}

export function aplicarAngulos(ang) {
  if (!refs) montarDobot();

  const d2r = THREE.MathUtils.degToRad;

  const t2 = ang.hombro ?? 0;

  const t3 = ang.codo ?? 0;

  refs.j1.rotation.y = d2r(ang.base ?? 0);

  // CONVENCIÓN J2: el brazo REPOSA E INCLINA HACIA ADELANTE
  // (hacia la cuadrícula y los cubos), nunca hacia atrás sobre
  // la base. Slider negativo = atrás, positivo = adelante/abajo.
  const t2Clamp = THREE.MathUtils.clamp(t2, -80, 110);

  refs.j2.rotation.z = d2r(t2Clamp);

  // J3 (codo): clamp físico ampliado; evita que el antebrazo
  // cruce el trasero en los extremos del nuevo rango.
  const t3Clamp = THREE.MathUtils.clamp(t3, -100, 110);

  refs.j3.rotation.z = d2r(t3Clamp);

  // PARALELOGRAMO + EFECTOR VERTICAL:
  // el cabezal compensa (t2 - t3) para quedar paralelo al suelo,
  // y el bloque J4/herramienta cuelga del cabezal apuntando hacia
  // abajo (rotación fija -90° en Z): la punta mira SIEMPRE a la mesa
  // sin importar J2/J3. La rotación del slider J4 (muñeca) gira
  // sobre el eje vertical local (roll) sin alterar esa verticalidad.
  refs.cabezal.rotation.z = d2r(-t2Clamp - t3Clamp);

  const bloqueMuneca = refs.cabezal.getObjectByName("bloqueMuneca");

  if (bloqueMuneca) {

    // -90° fijo: la herramienta apunta verticalmente hacia abajo.
    // Se re-aplica tras el roll para no acumular rotaciones.
    bloqueMuneca.rotation.z = -Math.PI / 2;

    bloqueMuneca.rotation.y = d2r(ang.muneca ?? 0);

  }

  refs.j4.rotation.y = d2r(ang.muneca ?? 0);
}

/* ============================================================
   6. CINEMÁTICA INVERSA (IK)
   moverACoordenadas(x, y, z, r)
   - x, y: plan horizontal (x=frente, y=lateral)
   - z: altura sobre la base (puede ser negativa: -150)
   - r: orientación del efector (grados, roll)
   Modelo: 2 eslabones L1=L2=150, base del brazo a ALTURA_J2.
   Devuelve { ok, theta1..theta4 } y aplica los ángulos.
   ============================================================ */

export function moverACoordenadas(x, y, z, r = 0) {
  if (!refs) montarDobot();

  // --- θ1 (yaw): dirección en el plano horizontal ---
  const theta1 = Math.atan2(y, x);

  // --- Radio horizontal hasta el efector ---
  const rHoriz = Math.sqrt(x * x + y * y);

  // --- Altura relativa al hombro (eje J2 a 107mm del suelo) ---
  const dz = z - K.ALTURA_J2;

  // --- Distancia directa (hombro → objetivo) ---
  const d = Math.sqrt(rHoriz * rHoriz + dz * dz);

  // Alcance máximo físico (con margen para no saltar el codo recto)
  const alcanceMax = (K.L1 + K.L2) * 0.999;

  if (d > alcanceMax) {
    console.warn(
      `⚠ Objetivo fuera de alcance: d=${d.toFixed(0)}mm > ${alcanceMax.toFixed(0)}mm`,
    );

    return { ok: false, error: "fuera_de_alcance" };
  }

  if (d < Math.abs(K.L1 - K.L2) + 1) {
    console.warn("⚠ Objetivo demasiado cerca del hombro.");

    return { ok: false, error: "demasiado_cerca" };
  }

  // --- Ley de cosenos: ángulo del codo (interior) ---
  const cosT3 = (K.L1 * K.L1 + K.L2 * K.L2 - d * d) / (2 * K.L1 * K.L2);

  const t3_interior = Math.acos(THREE.MathUtils.clamp(cosT3, -1, 1));

  // Convención: codo negativo pliega hacia abajo (configuración estándar)
  const theta3 = -t3_interior;

  // --- Ángulo del hombro respecto al plano horizontal ---
  // phi: ángulo del vector objetivo
  const phi = Math.atan2(dz, rHoriz);

  // beta: ángulo entre L1 y la línea hombro→objetivo
  const cosBeta = (K.L1 * K.L1 + d * d - K.L2 * K.L2) / (2 * K.L1 * d);

  const beta = Math.acos(THREE.MathUtils.clamp(cosBeta, -1, 1));

  // Codo hacia abajo (elbow-down): hombro = phi + beta
  let theta2 = phi + beta;

  // Límites del datasheet: hombro -40° ~ +85° aprox
  theta2 = THREE.MathUtils.clamp(THREE.MathUtils.radToDeg(theta2), -40, 85);

  theta2 = THREE.MathUtils.degToRad(theta2);

  // θ4 (roll del efector): orientación solicitada
  const theta4 = THREE.MathUtils.degToRad(r);

  // --- Aplicar ---
  aplicarAngulos({
    base: THREE.MathUtils.radToDeg(theta1),

    hombro: THREE.MathUtils.radToDeg(theta2),

    codo: THREE.MathUtils.radToDeg(theta3),

    muneca: THREE.MathUtils.radToDeg(theta4),
  });

  return {
    ok: true,

    theta1: THREE.MathUtils.radToDeg(theta1).toFixed(1),

    theta2: THREE.MathUtils.radToDeg(theta2).toFixed(1),

    theta3: THREE.MathUtils.radToDeg(theta3).toFixed(1),

    theta4: THREE.MathUtils.radToDeg(theta4).toFixed(1),
  };
}

/* ============================================================
   POSE DEL EFECTOR (FK, para la interfaz)
   ============================================================ */

export function obtenerPose() {
  if (!refs) montarDobot();

  refs.efector.updateWorldMatrix(true, false);

  const pos = new THREE.Vector3();

  refs.efector.getWorldPosition(pos);

  return {
    x: +pos.x.toFixed(1),

    y: +pos.y.toFixed(1),

    z: +pos.y === pos.y ? +pos.z.toFixed(1) : +pos.z.toFixed(1),
  };
}

/* ============================================================
   ESCENA Z-UP (opcional)
   Si tu escena usa Z como altura, monta el robot dentro de un
   grupo con rotation.x = -PI/2 y todos los cálculos siguen
   funcionando sin cambios (las coordenadas de IK son locales).
   ============================================================ */

export const CONFIG = {
  EJE_ALTURA: "y", // cambiar montaje si tu escena es Z-up
};
