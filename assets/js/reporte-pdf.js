/* ============================================================
   Exportación del progreso del estudiante a PDF (jsPDF)
   Genera un reporte con datos, notas por evaluación y logros.
   ============================================================ */

/**
 * Genera y descarga el reporte PDF del estudiante.
 * @param {Object} datos - { nombre, correo, promedio, avance, evaluaciones, insignias }
 */
export async function exportarProgresoPDF(datos) {
  // jsPDF se carga desde CDN (window.jspdf)
  if (typeof window.jspdf === "undefined") {
    alert("El generador de PDF no está disponible. Revisa tu conexión.");

    return;
  }

  const { jsPDF } = window.jspdf;

  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const M = 20; // margen

  let y = 25;

  /* --- Encabezado --- */

  doc.setFillColor(12, 45, 105);

  doc.rect(0, 0, 210, 32, "F");

  doc.setTextColor(255);

  doc.setFontSize(17);

  doc.text("Plataforma Didáctica — Laboratorio de Robótica", M, 15);

  doc.setFontSize(10);

  doc.text("Reporte de progreso del estudiante · Dobot Magician Lite", M, 23);

  doc.setTextColor(30);

  y = 46;

  /* --- Datos del estudiante --- */

  doc.setFontSize(14);

  doc.setFont(undefined, "bold");

  doc.text(datos.nombre || "Estudiante", M, y);

  y += 7;

  doc.setFontSize(10);

  doc.setFont(undefined, "normal");

  doc.text(`Correo: ${datos.correo || "—"}`, M, y);

  y += 6;

  doc.text(`Fecha del reporte: ${new Date().toLocaleDateString("es")}`, M, y);

  y += 12;

  /* --- Resumen --- */

  doc.setFontSize(12);

  doc.setFont(undefined, "bold");

  doc.text("Resumen general", M, y);

  y += 8;

  doc.setFont(undefined, "normal");

  doc.setFontSize(10);

  doc.text(`Promedio general: ${datos.promedio}%`, M, y);
  y += 6;

  doc.text(`Avance del curso: ${datos.avance}%`, M, y);
  y += 6;

  doc.text(
    `Evaluaciones aprobadas: ${datos.aprobadas} de ${datos.total}`,
    M,
    y,
  );
  y += 12;

  /* --- Tabla de evaluaciones --- */

  doc.setFontSize(12);

  doc.setFont(undefined, "bold");

  doc.text("Detalle de evaluaciones", M, y);

  y += 8;

  doc.setFontSize(10);

  // Encabezados de tabla
  doc.setFillColor(233, 237, 247);

  doc.rect(M, y - 5, 170, 7, "F");

  doc.setFont(undefined, "bold");

  doc.text("Evaluación", M + 2, y);
  doc.text("Nota", M + 80, y);
  doc.text("Estado", M + 105, y);
  doc.text("Intentos", M + 145, y);

  y += 7;

  doc.setFont(undefined, "normal");

  datos.evaluaciones.forEach((ev) => {
    if (y > 270) {
      doc.addPage();
      y = 25;
    }

    doc.text(String(ev.nombre).substring(0, 40), M + 2, y);

    doc.text(ev.nota != null ? String(ev.nota) : "—", M + 80, y);

    doc.text(
      ev.aprobada ? "Aprobado" : ev.nota != null ? "Reprobado" : "Pendiente",
      M + 105,
      y,
    );

    doc.text(String(ev.intentos ?? 0), M + 145, y);

    y += 6.5;
  });

  y += 10;

  /* --- Logros --- */

  if (y > 250) {
    doc.addPage();
    y = 25;
  }

  doc.setFontSize(12);

  doc.setFont(undefined, "bold");

  doc.text("Logros obtenidos", M, y);

  y += 8;

  doc.setFontSize(10);

  doc.setFont(undefined, "normal");

  const obtenidas = datos.insignias.filter((i) => i.obtenida);

  if (obtenidas.length === 0) {
    doc.text("Aún no se han obtenido insignias.", M, y);

    y += 6;
  } else {
    obtenidas.forEach((ins) => {
      if (y > 270) {
        doc.addPage();
        y = 25;
      }

      doc.text(`• ${ins.nombre}`, M, y);

      y += 6;
    });
  }

  /* --- Pie --- */

  const totalPaginas = doc.internal.getNumberOfPages();

  for (let p = 1; p <= totalPaginas; p++) {
    doc.setPage(p);

    doc.setFontSize(8);

    doc.setTextColor(150);

    doc.text(
      "Generado automáticamente por la Plataforma Didáctica Interactiva",
      M,
      288,
    );

    doc.text(`Página ${p} de ${totalPaginas}`, 165, 288);
  }

  /* --- Descargar --- */

  const nombreArchivo = `progreso_${(datos.nombre || "estudiante")
    .toLowerCase()
    .replace(/\\s+/g, "_")
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")}.pdf`;

  doc.save(nombreArchivo);
}
