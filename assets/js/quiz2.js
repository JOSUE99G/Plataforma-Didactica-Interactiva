document
  .getElementById("quizForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const form = e.target;

    // Leer respuestas y total de preguntas desde el propio formulario
    const datos = leerRespuestasQuiz(form);

    // Verificar que todas las preguntas estén contestadas
    if (datos.respondidas < datos.totalPreguntas) {
      alert("⚠ Debes responder todas las preguntas.");

      return;
    }

    // Calcular nota sobre 100
    const nota = calcularNota(datos.correctas, datos.totalPreguntas);

    try {
      await guardarResultadoQuiz("quiz2", {
        correctas: datos.correctas,
        total: datos.totalPreguntas,
      });
      console.log("✅ Resultado guardado correctamente.");
    } catch (error) {
      console.error(error);
      alert("Error al guardar:\n\n" + error.code + "\n\n" + error.message);
    }

    // Mostrar resultado
    mostrarResultadoQuiz(nota);
  });
