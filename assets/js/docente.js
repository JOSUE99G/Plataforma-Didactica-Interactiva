/* ============================================================
   Panel Docente: lee la colección "clase" y muestra el
   progreso consolidado de todos los estudiantes.
   ============================================================ */

import { leerResumenesClase } from "./logros.js";

/* ============================================================
   UTILIDADES
   ============================================================ */

function seleccionar(id) {
  return document.getElementById(id);
}

function colorEstado(avance, promedio) {
  if (avance >= 100) return { texto: "🎓 Completado", color: "#43a047" };

  if (promedio >= 70 && avance >= 50)
    return { texto: "✅ En buen camino", color: "#43a047" };

  if (avance >= 25) return { texto: "📘 En progreso", color: "#f57c00" };

  return { texto: "⚠ En riesgo", color: "#d9534f" };
}

function formatearFecha(ts) {
  if (!ts) return "—";

  const d = ts.toDate ? ts.toDate() : new Date(ts);

  return d.toLocaleDateString("es", {
    day: "2-digit",

    month: "short",

    hour: "2-digit",

    minute: "2-digit",
  });
}

/* ============================================================
   RENDERIZADO
   ============================================================ */

function renderizarEstadisticas(estudiantes) {
  const total = estudiantes.length;

  if (total === 0) {
    seleccionar("statEstudiantes").textContent = "0";

    seleccionar("statPromedio").textContent = "—";

    seleccionar("statAprobados").textContent = "0";

    seleccionar("statRiesgo").textContent = "0";

    return;
  }

  const promedioClase = Math.round(
    estudiantes.reduce((s, e) => s + (e.promedio || 0), 0) / total,
  );

  const completados = estudiantes.filter((e) => (e.avance || 0) >= 100).length;

  const enRiesgo = estudiantes.filter((e) => (e.avance || 0) < 25).length;

  seleccionar("statEstudiantes").textContent = total;

  seleccionar("statPromedio").textContent = promedioClase + "%";

  seleccionar("statAprobados").textContent = completados;

  seleccionar("statRiesgo").textContent = enRiesgo;
}

function renderizarTabla(estudiantes) {
  const tbody = seleccionar("tablaEstudiantes");

  tbody.innerHTML = "";

  if (estudiantes.length === 0) {
    tbody.innerHTML = `
            <tr>
                <td colspan="7" style="color:#999">
                    Aún no hay estudiantes con progreso registrado.
                    Los datos aparecen cuando cada alumno visite "Mi progreso".
                </td>
            </tr>
        `;

    return;
  }

  estudiantes.forEach((est) => {
    const estado = colorEstado(est.avance || 0, est.promedio || 0);

    const fila = document.createElement("tr");

    fila.innerHTML = `
            <td><strong>${est.nombre || "Sin nombre"}</strong></td>

            <td>${est.correo || "—"}</td>

            <td>${est.promedio != null ? est.promedio + "%" : "—"}</td>

            <td>
                <div class="mini-barra">
                    <div class="mini-barra-fill" style="width:${est.avance || 0}%"></div>
                </div>
                ${est.avance || 0}%
            </td>

            <td>${est.aprobadas || 0} / ${est.total || 4}</td>

            <td style="color:${estado.color};font-weight:600">${estado.texto}</td>

            <td>${formatearFecha(est.actualizadoEn)}</td>
        `;

    tbody.appendChild(fila);
  });
}

/* ============================================================
   INICIO
   ============================================================ */

document.addEventListener("DOMContentLoaded", async () => {
  const estudiantes = await leerResumenesClase();

  renderizarEstadisticas(estudiantes);

  renderizarTabla(estudiantes);
});
