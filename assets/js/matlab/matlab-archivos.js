/* ============================================================
   Gestión de archivos .m del estudiante en Firestore
   Ruta: usuarios/{uid}/matlabArchivos/{docId}
   Cada documento: { nombre, contenido, actualizadoEn, creadoEn }
   ============================================================ */

/* ============================================================
   ESTADO
   ============================================================ */

let archivosCargados = []; // [{id, nombre, contenido}]

let archivoActualId = null; // id del archivo abierto en el editor

let usuarioUid = null;

/* ============================================================
   SESIÓN
   ============================================================ */

/**
 * Espera la sesión de Firebase y guarda el uid.
 * @returns {Promise<string|null>} uid o null si no hay sesión
 */
export function esperarSesion() {
  return new Promise((resolve) => {
    if (typeof firebase === "undefined") {
      resolve(null);

      return;
    }

    firebase.auth().onAuthStateChanged((user) => {
      usuarioUid = user ? user.uid : null;

      resolve(usuarioUid);
    });
  });
}

/**
 * Referencia a la colección de archivos del usuario actual.
 */
function refArchivos() {
  if (!usuarioUid) return null;

  return firebase
    .firestore()
    .collection("usuarios")
    .doc(usuarioUid)
    .collection("matlabArchivos");
}

/* ============================================================
   LISTAR
   ============================================================ */

/**
 * Carga los archivos del estudiante desde Firestore.
 * @returns {Promise<Array>}
 */
export async function listarArchivos() {
  const ref = refArchivos();

  if (!ref) return [];

  try {
    const snap = await ref.orderBy("nombre").get();

    archivosCargados = snap.docs.map((d) => ({
      id: d.id,

      nombre: d.data().nombre,

      contenido: d.data().contenido || "",
    }));

    return archivosCargados;
  } catch (error) {
    console.error("Error listando archivos:", error);

    return [];
  }
}

/* ============================================================
   CREAR
   ============================================================ */

/**
 * Crea un nuevo archivo .m vacío (o con contenido inicial) en Firestore.
 * @param {string} nombre
 * @param {string} contenido
 * @returns {Promise<{id, nombre, contenido}|null>}
 */
export async function crearArchivo(nombre, contenido = "") {
  const ref = refArchivos();

  if (!ref) return null;

  const nombreLimpio = nombre.replace(/\.m$/i, "") + ".m";

  try {
    const doc = await ref.add({
      nombre: nombreLimpio,

      contenido: contenido,

      creadoEn: firebase.firestore.FieldValue.serverTimestamp(),

      actualizadoEn: firebase.firestore.FieldValue.serverTimestamp(),
    });

    const nuevo = { id: doc.id, nombre: nombreLimpio, contenido };

    archivosCargados.push(nuevo);

    return nuevo;
  } catch (error) {
    console.error("Error creando archivo:", error);

    return null;
  }
}

/* ============================================================
   GUARDAR (sobrescribir)
   ============================================================ */

/**
 * Guarda el contenido actual del editor en el archivo abierto.
 * @param {string} contenido
 * @returns {Promise<boolean>}
 */
export async function guardarArchivo(contenido) {
  if (!archivoActualId) {
    // Si no hay archivo abierto, crear uno con nombre automático
    const n = archivosCargados.length + 1;

    const creado = await crearArchivo(`script_${n}.m`, contenido);

    if (creado) archivoActualId = creado.id;

    return !!creado;
  }

  const ref = refArchivos();

  if (!ref) return false;

  try {
    await ref.doc(archivoActualId).set(
      {
        contenido: contenido,

        actualizadoEn: firebase.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    const local = archivosCargados.find((a) => a.id === archivoActualId);

    if (local) local.contenido = contenido;

    return true;
  } catch (error) {
    console.error("Error guardando archivo:", error);

    return false;
  }
}

/* ============================================================
   ABRIR
   ============================================================ */

/**
 * Marca un archivo como abierto y devuelve su contenido.
 * @param {string} id
 * @returns {{id, nombre, contenido}|null}
 */
export function abrirArchivo(id) {
  const archivo = archivosCargados.find((a) => a.id === id);

  if (!archivo) return null;

  archivoActualId = id;

  return archivo;
}

/**
 * Nombre del archivo actualmente abierto (para el título del editor).
 */
export function nombreArchivoActual() {
  const a = archivosCargados.find((x) => x.id === archivoActualId);

  return a ? a.nombre : "sin_titulo.m";
}

/* ============================================================
   SUBIR DESDE EL PC
   ============================================================ */

/**
 * Importa un archivo .m local del estudiante hacia Firestore.
 * @param {File} file - objeto File del input[type=file]
 * @returns {Promise<{id, nombre, contenido}|null>}
 */
export async function importarArchivo(file) {
  if (!file || !/\.m$/i.test(file.name)) {
    throw new Error("Solo se admiten archivos .m");
  }

  const contenido = await file.text();

  return await crearArchivo(file.name, contenido);
}

/* ============================================================
   ELIMINAR
   ============================================================ */

/**
 * Elimina un archivo del workspace de Firestore.
 * @param {string} id
 */
export async function eliminarArchivo(id) {
  const ref = refArchivos();

  if (!ref) return false;

  try {
    await ref.doc(id).delete();

    archivosCargados = archivosCargados.filter((a) => a.id !== id);

    if (archivoActualId === id) archivoActualId = null;

    return true;
  } catch (error) {
    console.error("Error eliminando archivo:", error);

    return false;
  }
}
