/* ============================================================
   Módulo compartido para los quizzes de la plataforma.
   Requiere: firebase-config.js (Firebase v8) cargado antes.
   ============================================================ */

/**
 * Calcula la nota (0-100) a partir de las respuestas correctas.
 * Función pura: fácil de probar con cualquier test runner.
 * @param {number} correctas  - número de respuestas correctas
 * @param {number} total      - número total de preguntas
 * @returns {number} nota redondeada sobre 100
 */
function calcularNota(correctas, total) {
  if (!total || total <= 0) return 0;
  return Math.round((correctas / total) * 100);
}

/**
 * Lee las respuestas marcadas del formulario de un quiz.
 * Cuenta el total de preguntas a partir de los grupos de radios
 * (name únicos), no de un número fijo, así añadir/quitar preguntas
 * no rompe la calificación.
 * @param {HTMLFormElement} formulario
 * @returns {{respondidas: number, totalPreguntas: number, correctas: number}}
 */
function leerRespuestasQuiz(formulario) {
  const marcados = formulario.querySelectorAll('input[type="radio"]:checked');
  const grupos = new Set();
  formulario
    .querySelectorAll('input[type="radio"]')
    .forEach((r) => grupos.add(r.name));

  let correctas = 0;
  marcados.forEach((r) => {
    correctas += Number(r.value) || 0;
  });

  return {
    respondidas: marcados.length,
    totalPreguntas: grupos.size,
    correctas: correctas,
  };
}

/**
 * Guarda el resultado de un quiz en Firestore:
 * usuarios/{uid}/evaluaciones/{quizId}
 * Incrementa "intentos" si ya existía una entrada previa.
 * @param {string} quizId  - "quiz1", "quiz2", ...
 * @param {{correctas: number, total: number}} datos
 * @returns {Promise<{nota: number, intentos: number}>}
 */
async function guardarResultadoQuiz(quizId, datos) {
  const user = firebase.auth().currentUser;
  if (!user) return null; // sin sesión: no se guarda, pero no rompe

  const nota = calcularNota(datos.correctas, datos.total);
  const quizRef = db
    .collection("usuarios")
    .doc(user.uid)
    .collection("evaluaciones")
    .doc(quizId);

  const doc = await quizRef.get();
  const intentos = doc.exists ? (doc.data().intentos || 0) + 1 : 1;

  await quizRef.set({
    nota: nota,
    correctas: datos.correctas,
    total: datos.total,
    aprobado: nota >= 70,
    intentos: intentos,
    fecha: firebase.firestore.FieldValue.serverTimestamp(),
  });

  return { nota: nota, intentos: intentos };
}

/**
 * Muestra el resultado en el elemento #resultado con una sola
 * plantilla (elimina el HTML duplicado de aprobado/reprobado).
 * @param {number} nota
 * @param {number} aprobadoDesde - nota mínima para aprobar (70 por defecto)
 */
function mostrarResultadoQuiz(nota, aprobadoDesde = 70) {
  const resultado = document.getElementById("resultado");
  if (!resultado) return;

  const aprobado = nota >= aprobadoDesde;
  resultado.innerHTML = `
        <h2 style="color:${aprobado ? "green" : "red"};">
            ${aprobado ? "✅ ¡Aprobaste!" : "❌ No aprobaste"}
        </h2>

        <p>Tu calificación es:</p>

        <h1>${nota}/100</h1>
    `;
}
