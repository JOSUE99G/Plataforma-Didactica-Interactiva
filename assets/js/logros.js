/* ============================================================
   Logros y sincronización de progreso en Firestore
   - usuarios/{uid}/logros/{insigniaId}  → insignias obtenidas
   - clase/{uid}                          → resumen para el docente
   ============================================================ */

const NODO_APROBADO = 70;

/* ============================================================
   SESIÓN
   ============================================================ */

function esperarSesion() {
  return new Promise((resolve) => {
    if (typeof firebase === "undefined") {
      resolve(null);

      return;
    }

    firebase.auth().onAuthStateChanged((user) => {
      resolve(user ? user.uid : null);
    });
  });
}

/* ============================================================
   INSIGNIAS
   ============================================================ */

/**
 * Calcula las insignias según el progreso y las guarda en Firestore.
 * Solo escribe las NUEVAS (no sobrescribe las ya obtenidas).
 * @param {Object} realizadas - { quiz1: {nota, ...}, ... }
 * @param {number} promedio - promedio general 0-100
 * @param {Array} insigniasCalculadas - lista de {id, obtenida}
 * @returns {Promise<Array>} lista de insignias obtenidas (incluye nuevas)
 */
export async function sincronizarInsignias(
  realizadas,
  promedio,
  insigniasCalculadas,
) {
  const uid = await esperarSesion();

  if (!uid) return insigniasCalculadas;

  const ref = firebase
    .firestore()
    .collection("usuarios")
    .doc(uid)
    .collection("logros");

  try {
    const existentes = await ref.get();

    const yaObtenidas = new Set(existentes.docs.map((d) => d.id));

    const lote = firebase.firestore().batch();

    let hayNuevas = false;

    insigniasCalculadas.forEach((ins) => {
      if (ins.obtenida && !yaObtenidas.has(ins.id)) {
        lote.set(ref.doc(ins.id), {
          nombre: ins.nombre,

          descripcion: ins.desc,

          obtenidaEn: firebase.firestore.FieldValue.serverTimestamp(),
        });

        hayNuevas = true;
      }
    });

    if (hayNuevas) await lote.commit();

    // Devolver el estado combinado (locales + guardadas)
    return insigniasCalculadas.map((ins) => ({
      ...ins,

      obtenida: ins.obtenida || yaObtenidas.has(ins.id),
    }));
  } catch (error) {
    console.error("Error sincronizando insignias:", error);

    return insigniasCalculadas;
  }
}

/* ============================================================
   RESUMEN PARA EL DOCENTE (colección clase/)
   ============================================================ */

/**
 * Guarda/actualiza el resumen del estudiante en la colección "clase",
 * que el panel docente lee para ver el progreso de todos.
 * @param {Object} datos - { nombre, correo, promedio, avance, aprobadas, total }
 */
export async function sincronizarResumenDocente(datos) {
  const uid = await esperarSesion();

  if (!uid) return false;

  try {
    await firebase
      .firestore()
      .collection("clase")
      .doc(uid)
      .set(
        {
          nombre: datos.nombre || "",

          correo: datos.correo || "",

          promedio: datos.promedio || 0,

          avance: datos.avance || 0,

          aprobadas: datos.aprobadas || 0,

          total: datos.total || 0,

          actualizadoEn: firebase.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

    return true;
  } catch (error) {
    console.error("Error sincronizando resumen:", error);

    return false;
  }
}

/**
 * Lee todos los resúmenes de estudiantes (solo para panel docente).
 * @returns {Promise<Array>}
 */
export async function leerResumenesClase() {
  if (typeof firebase === "undefined") return [];

  try {
    const snap = await firebase
      .firestore()
      .collection("clase")
      .orderBy("promedio", "desc")
      .get();

    return snap.docs.map((d) => ({
      uid: d.id,

      ...d.data(),
    }));
  } catch (error) {
    console.error("Error leyendo clase:", error);

    return [];
  }
}
