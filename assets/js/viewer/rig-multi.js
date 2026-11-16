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

      // IMPORTANTE: NO se centra la geometría. Las piezas se
      // exportan en coordenadas del ENSAMBLAJE montado y deben
      // conservar su posición; cada pivote solo aporta el giro.

      const mesh = new THREE.Mesh(geometry, material);

      mesh.castShadow = true;

      mesh.receiveShadow = true;

      // SIN rotación individual: las piezas conservan las coordenadas
      // globales del ensamblaje. La conversión Z-up→Y-up se aplica
      // UNA sola vez al rig completo (ver construirRigMulti), así el
      // offset de compensación del pivote no se distorsiona y cada
      // eslabón gira alrededor de SU articulación.

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

    // Conversión Z-up (CAD) → Y-up (Three.js): UNA rotación para todo
    // el rig, no por pieza. Así los offsets de compensación del pivote
    // se calculan en el mismo marco que la geometría y cada eslabón
    // gira alrededor de su articulación real.
    rigMulti.rotation.x = -Math.PI / 2;

    scene.add(rigMulti);

    config.eslabones.forEach((esl) => {
      // Crear pivote en el EJE de la articulación.
      // Con piezas exportadas en coordenadas del ensamblaje, el pivote
      // usa una posición INVERSA: la geometría vive en coords globales
      // del ensamblaje, así que girar alrededor del eje articular
      // requiere pivote en el eje y geometría compensada.
      const pivote = new THREE.Group();

      pivote.name = "pivote_" + esl.id;

      // Posición del eje articular.
      // Los 'origen' del JSON se expresan en el marco CAD del ensamblaje:
      //   x = frente, y = lateral (izquierda), z = altura (Z-up)
      // El rig completo ya está rotado a Y-up, así que aquí se mapea:
      //   three.x = cad.x, three.y = cad.z (altura), three.z = -cad.y
      const oa = esl.origen || { x: 0, y: 0, z: 0 };

      const mapaCAD = {
        x: oa.x || 0,
        y: oa.z || 0,        // altura CAD (Z) -> Y de three
        z: -(oa.y || 0),     // lateral CAD (Y) -> -Z de three
      };

      pivote.position.set(mapaCAD.x, mapaCAD.y, mapaCAD.z);

      pivote.userData.origenAbsCAD = oa;

      pivote.userData.origenMapa = mapaCAD;

      nodos[esl.id] = pivote;

      // Enganchar al padre (o al raíz si es base)
      // Nota: el hijo se agrega SIN offset adicional respecto al padre:
      // la posición relativa entre pivotes ya queda implícita en los
      // valores 'origen' absolutos del ensamblaje, así que se resta
      // la posición del padre para obtener el offset local correcto.
      const intentarColgar = () => {
        const padrePiv = esl.padre ? nodos[esl.padre] : null;

        if (esl.padre && !padrePiv) {
          setTimeout(intentarColgar, 50);
          return;
        }

        // Offset local respecto al padre (diferencia de ejes CAD,
        // mapeada igual que la posición: cad.x→x, cad.z→y, -cad.y→z)
        if (padrePiv) {
          const oaPadre = padrePiv.userData.origenAbsCAD || { x: 0, y: 0, z: 0 };

          const relCAD = {
            x: oa.x - oaPadre.x,
            y: oa.y - oaPadre.y,
            z: oa.z - oaPadre.z,
          };

          pivote.position.set(
            relCAD.x,
            relCAD.z,        // altura CAD
            -relCAD.y,       // lateral CAD
          );
        }

        (padrePiv || rigMulti).add(pivote);
      };

      intentarColgar();

      // Cargar pieza
      cargarPieza(esl, crearMaterial(esl.id), (mesh) => {
        // Compensar: la geometría vive en coords del ensamblaje CAD
        // (x=frente, y=lateral, z=altura). El pivote ya está colocado
        // en el eje articular (marco three), así que la pieza se cuelga
        // con offset NEGATIVO en coords CAD mapeadas igual que arriba.
        const oa = esl.origen || { x: 0, y: 0, z: 0 };

        mesh.position.set(-oa.x, -oa.z, oa.y);

        pivote.add(mesh);

        cargadas++;

        if (cargadas === total) {
          modoRig = "multi";

          // Encuadrar la cámara + ASENTAR EL ROBOT EN LA CAMA
          const box = new THREE.Box3().setFromObject(rigMulti);

          const size = box.getSize(new THREE.Vector3());

          const max = Math.max(size.x, size.y, size.z);

          if (max > 0 && (max < 50 || max > 800)) {
            // Normalizar a ~300mm para escala predecible
            const factor = 300 / max;

            rigMulti.scale.setScalar(factor);
          }

          // Asentar: subir/bajar el rig hasta que su punto más bajo toque y=0
          // y CENTRAR sobre la cuadrícula (el CAD tiene offset en X/Y)
          const boxPost = new THREE.Box3().setFromObject(rigMulti);

          rigMulti.position.y = -boxPost.min.y;

          const centroXZ = boxPost.getCenter(new THREE.Vector3());

          rigMulti.position.x -= centroXZ.x;

          rigMulti.position.z -= centroXZ.z;

          const dir = new THREE.Vector3(1, 0.7, 1).normalize();

          // Cámara más lejana para ver el robot completo con margen
          camera.position.copy(
            orbit.target.clone().addScaledVector(dir, 900),
          );

          orbit.target.set(0, 100, 0);

          orbit.update();

          window.dispatchEvent(new CustomEvent("robotRigListo", { detail: rigMulti }));

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

    // El eje del JSON está en marco CAD (Z-up). Tras la conversión
    // del rig (rotation.x = -90°), los ejes se transforman:
    //   CAD z (altura)  -> eje y local
    //   CAD x (frente)  -> eje x
    //   CAD y (lateral) -> eje z
    const mapaEje = { x: "x", y: "z", z: "y" };

    pivote.rotation[mapaEje[esl.eje] || esl.eje] = d2r(v);
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
export async function cargarConfigRig(archivo = "rig-dobot.json") {
  try {
    const res = await fetch(`assets/models/${archivo}`);

    if (res.ok) {
      configActual = await res.json();

      console.log(`✅ Configuración de rig cargada: ${archivo}`);
    }
  } catch (e) {
    console.log("ℹ Usando configuración de rig por defecto.");
  }

  return configActual;
}

/**
 * Elimina el rig actual de la escena (para cambiar de robot).
 */
export function destruirRigMulti() {
  if (rigMulti) {
    scene.remove(rigMulti);

    rigMulti.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
    });

    rigMulti = null;
    modoRig = "simple";
  }

  // También limpiar el mesh del modo simple si existe
  const simple = scene.getObjectByName("robotSimple");

  if (simple) {
    scene.remove(simple);
    simple.geometry.dispose();
  }
}

/**
 * Carga un robot completo por nombre de archivo JSON.
 * Usado por el selector de robot del visor.
 * Intenta modo multi (piezas); si no existen, usa modo simple (STL único).
 * @param {string} archivoJSON - ej. "rig-brazo.json"
 * @returns {Promise<{ok: boolean, modo: string, config: Object}>}
 */
export async function cargarRobot(archivoJSON) {
  // Limpiar rig anterior
  destruirRigMulti();

  let config;

  try {
    const res = await fetch(`assets/models/${archivoJSON}`);

    if (!res.ok) throw new Error(`No se encontró ${archivoJSON}`);

    config = await res.json();
  } catch (error) {
    console.error("Error cargando robot:", error);

    return { ok: false, modo: "ninguno", config: null };
  }

  configActual = config;

  // Verificar si existen las piezas del primer eslabón
  let piezasDisponibles = false;

  try {
    const probe = await fetch(config.eslabones[0].stl, { method: "HEAD" });

    piezasDisponibles = probe.ok;
  } catch (e) {
    piezasDisponibles = false;
  }

  if (piezasDisponibles) {
    await construirRigMulti(config);

    console.log(`✅ Robot en modo MULTI: ${archivoJSON}`);

    return { ok: true, modo: "multi", config };
  }

  // Fallback: STL completo en modo simple
  const stlSimple =
    (config.modoSimple && config.modoSimple.stl) ||
    "assets/models/MagicianLite.stl";

  try {
    await cargarModoSimple(stlSimple);

    console.log(`ℹ Robot en modo SIMPLE: ${stlSimple}`);

    return { ok: true, modo: "simple", config };
  } catch (error) {
    console.error("No se pudo cargar ni el rig ni el STL simple:", error);

    return { ok: false, modo: "ninguno", config };
  }
}

/**
 * Carga un STL completo (modo simple) y lo añade a la escena.
 */
function cargarModoSimple(rutaSTL) {
  return new Promise((resolve, reject) => {
    loader.load(
      rutaSTL,

      (geometry) => {
        geometry.computeBoundingBox();

        geometry.center();

        const mesh = new THREE.Mesh(
          geometry,
          new THREE.MeshPhysicalMaterial({
            color: 0x3f8cff,
            metalness: 0.15,
            roughness: 0.3,
            clearcoat: 0.3,
          })
        );

        mesh.rotation.x = -Math.PI / 2;

        mesh.castShadow = true;

        mesh.receiveShadow = true;

        mesh.name = "robotSimple";

        scene.add(mesh);

        window.__robotMesh = mesh;

        window.dispatchEvent(new CustomEvent("robotCargado", { detail: mesh }));

        resolve(mesh);
      },

      undefined,

      reject
    );
  });
}
