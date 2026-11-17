/* ============================================================
   ENTORNO FÍSICO: cubitos agarrables + garra con tenazas
   - Cubos 20×20mm sobre la mesa (colores aleatorios)
   - Garra con 2 tenazas animadas (pivotes locales)
   - Detección por distancia: cerrar garra cerca de un cubo →
     se adjunta al efector (parenting temporal); abrir → se
     suelta y reposa sobre la mesa (gravedad simple).
   ============================================================ */

import * as THREE from "../../three/build/three.module.js";

import { scene } from "./scene.js";

/* ============================================================
   ESTADO
   ============================================================ */

let cubos = [];

let cuboSujeto = null;

let garraPivotes = null; // { izquierda, derecha }

/* ============================================================
   CUBITOS EN LA MESA
   ============================================================ */

const COLORES = [0xe53935, 0x1e88e5, 0x43a047, 0xfdd835, 0x8e24aa];

/**
 * Genera cubitos aleatorios sobre el área de trabajo.
 * @param {number} cantidad
 */
export function generarCubitos(cantidad = 5) {
  // Limpiar anteriores
  cubos.forEach((c) => scene.remove(c));

  cubos = [];

  const tam = 20; // 20×20mm

  for (let i = 0; i < cantidad; i++) {
    const cubo = new THREE.Mesh(
      new THREE.BoxGeometry(tam, tam, tam),
      new THREE.MeshPhysicalMaterial({
        color: COLORES[i % COLORES.length],

        roughness: 0.4,

        clearcoat: 0.2,
      }),
    );

    cubo.castShadow = true;

    cubo.receiveShadow = true;

    cubo.name = "cubo_" + i;

    // Posiciones repartidas al frente del robot (área de trabajo)
    cubo.position.set(
      120 + (i % 3) * 45 + Math.random() * 20,

      tam / 2, // apoyado sobre la mesa (y=0)

      (Math.random() - 0.5) * 120 - 30,
    );

    scene.add(cubo);

    cubos.push(cubo);
  }

  return cubos;
}

/* ============================================================
   GARRA CON TENAZAS
   ============================================================ */

/**
 * Crea las 2 tenazas mecánicas dentro del grupo de herramienta.
 * Llamar una vez al construir el efector.
 * @param {THREE.Group} grupoHerramienta - grupo donde montar
 */
export function crearTenazas(grupoHerramienta) {
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x546e7a,

    roughness: 0.35,

    metalness: 0.3,
  });

  function crearTenaza(offsetZ) {
    const pivote = new THREE.Group();

    pivote.name = offsetZ > 0 ? "tenaza_izq" : "tenaza_der";

    pivote.position.set(14, 0, offsetZ);

    const dedo = new THREE.Mesh(new THREE.BoxGeometry(22, 10, 5), material);

    dedo.position.x = 11;

    dedo.castShadow = true;

    pivote.add(dedo);

    // Punta doblada hacia adentro
    const punta = new THREE.Mesh(new THREE.BoxGeometry(5, 10, 5), material);

    punta.position.set(21, offsetZ > 0 ? -3 : 3, 0);

    punta.castShadow = true;

    pivote.add(punta);

    grupoHerramienta.add(pivote);

    return pivote;
  }

  garraPivotes = {
    izquierda: crearTenaza(6),

    derecha: crearTenaza(-6),
  };

  return garraPivotes;
}

/**
 * Anima las tenazas: apertura 0 (cerrada) a 1 (abierta).
 * @param {number} apertura 0..1
 */
export function animarTenazas(apertura) {
  if (!garraPivotes) return;

  const ang = THREE.MathUtils.degToRad(apertura * 35);

  if (garraPivotes.izquierda) {
    garraPivotes.izquierda.rotation.y = ang;
  }

  if (garraPivotes.derecha) {
    garraPivotes.derecha.rotation.y = -ang;
  }
}

/* ============================================================
   AGARRE / SOLTAR
   ============================================================ */

/**
 * Busca el cubo más cercano a la punta de la herramienta.
 * @param {THREE.Vector3} posHerramienta - posición mundial
 * @param {number} radioDeteccion
 * @returns {THREE.Mesh|null}
 */
function cuboCercano(posHerramienta, radioDeteccion = 45) {
  let masCercano = null;

  let menorDist = radioDeteccion;

  cubos.forEach((c) => {
    if (c === cuboSujeto) return;

    const d = c.position.distanceTo(posHerramienta);

    if (d < menorDist) {
      menorDist = d;

      masCercano = c;
    }
  });

  return masCercano;
}

/**
 * Intenta agarrar el cubo más cercano a la herramienta.
 * @param {THREE.Object3D} efector - el pivotJ4/herramienta
 * @returns {boolean} true si agarró algo
 */
export function agarrar(efector) {
  if (cuboSujeto) return false; // ya tiene uno

  efector.updateWorldMatrix(true, false);

  const pos = new THREE.Vector3();

  efector.getWorldPosition(pos);

  const cubo = cuboCercano(pos, 50);

  if (!cubo) return false;

  // PARENTING temporal: mover a coordenadas locales del efector
  // conservando la posición mundial (attach preserva transform).
  efector.attach(cubo);

  cuboSujeto = cubo;

  return true;
}

/**
 * Suelta el cubo sujetado: vuelve a la escena y "cae" hasta la mesa.
 * @param {THREE.Object3D} efector
 */
export function soltar(efector) {
  if (!cuboSujeto) return false;

  const cubo = cuboSujeto;

  // Conservar posición mundial al re-parentar a la escena
  efector.updateWorldMatrix(true, false);

  const posMundo = new THREE.Vector3();

  cubo.getWorldPosition(posMundo);

  scene.attach(cubo);

  // Reposar sobre la mesa: y = mitad del cubo (gravedad instantánea)
  cubo.position.y = 10;

  // Pequeña animación de caída (visual simple)
  const posYObjetivo = 10;

  const startY = cubo.position.y;

  cubo.position.y = Math.max(startY, posMundo.y);

  // Snap suave: animación por interpolación
  let t = 0;

  const animar = () => {
    t += 0.12;

    cubo.position.y = THREE.MathUtils.lerp(
      cubo.position.y,
      posYObjetivo,
      Math.min(t, 1),
    );

    if (t < 1) requestAnimationFrame(animar);
  };

  requestAnimationFrame(animar);

  cuboSujeto = null;

  return true;
}

/**
 * ¿Hay un cubo sujetado actualmente?
 */
export function tieneCubo() {
  return cuboSujeto !== null;
}
