document
  .getElementById("quizForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const form = e.target;

    const datos = leerRespuestasQuiz(form);

    if (datos.respondidas < datos.totalPreguntas) {
      alert("⚠ Debes responder todas las preguntas.");

      return;
    }

    const nota = calcularNota(datos.correctas, datos.totalPreguntas);

    try {
      await guardarResultadoQuiz("quiz3", {
        correctas: datos.correctas,
        total: datos.totalPreguntas,
      });
      console.log("✅ Resultado guardado correctamente.");
    } catch (error) {
      console.error(error);
      alert("Error al guardar:\n\n" + error.code + "\n\n" + error.message);
    }

    mostrarResultadoQuiz(nota);
  });
