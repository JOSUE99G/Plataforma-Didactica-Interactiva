firebase.auth().onAuthStateChanged(async (user) => {

    if (!user) {
        window.location.href = "index.html";
        return;
    }

    // ==========================
    // Mostrar datos del usuario
    // ==========================

    document.getElementById("nombreAlumno").textContent =
        user.displayName || "Estudiante";

    document.getElementById("correoAlumno").textContent =
        user.email;

    // ==========================
    // Leer evaluaciones
    // ==========================

    const tabla = document.getElementById("tablaResultados");

    const tablaWrapper = tabla ? tabla.closest("table") : null;

    tabla.innerHTML = "";

    const evaluaciones = [

    {
        id: "quiz1",
        nombre: "Fundamentos de Robótica",
        etapa: "Fundamentos",
        enlace: "evaluaciones.html",
        icono: "fa-book"
    },

    {
        id: "quiz2",
        nombre: "Cinemática del Brazo",
        etapa: "Cinemática",
        enlace: "quiz2.html",
        icono: "fa-arrows-up-down-left-right"
    },

    {
        id: "quiz3",
        nombre: "Prácticas con el Robot",
        etapa: "Prácticas",
        enlace: "practicas.html",
        icono: "fa-flask"
    },

    {
        id: "final",
        nombre: "Evaluación Final",
        etapa: "Integración",
        enlace: "evaluaciones.html",
        icono: "fa-trophy"
    }

];

    const NODO_APROBADO = 70;

    let sumaNotas = 0;
    let numeroEvaluaciones = 0;

    const totalEvaluaciones = evaluaciones.length;

    let evaluacionesCompletadas = 0;

    let nombresEvaluaciones=[];

    let notasEvaluaciones=[];

    let filas=[];

    try{

        const snapshot = await db
        .collection("usuarios")
        .doc(user.uid)
        .collection("evaluaciones")
        .get();

        const realizadas = {};

snapshot.forEach(doc => {

    realizadas[doc.id] = doc.data();

});
evaluaciones.forEach(evaluacion => {

    if(realizadas[evaluacion.id]){

        const datos = realizadas[evaluacion.id];

        numeroEvaluaciones++;

        evaluacionesCompletadas++;

        sumaNotas += datos.nota || 0;

        nombresEvaluaciones.push(evaluacion.nombre);

        notasEvaluaciones.push(datos.nota || 0);

        filas.push(`
            <tr>

                <td>${evaluacion.nombre}</td>

                <td>${datos.nota != null ? datos.nota : "—"}</td>

                <td>✅ Aprobado</td>

                <td>${datos.intentos != null ? datos.intentos : 0}</td>

            </tr>
        `);

    }else{

        filas.push(`
            <tr>

                <td>${evaluacion.nombre}</td>

                <td>—</td>

                <td>⏳ Pendiente</td>

                <td>0</td>

            </tr>
        `);

    }

});

// Asignar el HTML una sola vez (evita re-parsear la tabla en cada iteración)
tabla.innerHTML = filas.join("");

// Estado vacío: si no hay ninguna evaluación realizada, mostrar mensaje amigable
const contenedorTabla = tabla.closest(".card, .tabla-card, section") || tabla.parentElement;
let estadoVacio = contenedorTabla.querySelector(".empty-state");

if (numeroEvaluaciones === 0) {

    if (!estadoVacio) {

        estadoVacio = document.createElement("div");
        estadoVacio.className = "empty-state";
        estadoVacio.innerHTML = `
            <div class="empty-icon">📭</div>
            <h3>Aún no tienes evaluaciones registradas</h3>
            <p>Realiza tu primer quiz en la sección <a href="evaluaciones.html">Evaluaciones</a> y aquí verás tu progreso.</p>
        `;

        contenedorTabla.appendChild(estadoVacio);

    }

    if (tablaWrapper) tablaWrapper.style.display = "none";

} else {

    if (estadoVacio) estadoVacio.remove();
    if (tablaWrapper) tablaWrapper.style.display = "";

}

        // ======================
        // Promedio
        // ======================

        let promedio = 0;

        if(numeroEvaluaciones > 0){

            promedio = Math.round(sumaNotas / numeroEvaluaciones);

        }

        document.getElementById("promedio").textContent =
            promedio + " %";

        document.getElementById("barraProgreso").style.width =
            promedio + "%";

         const avance = Math.round(

(evaluacionesCompletadas / totalEvaluaciones) * 100

);

document.getElementById("avanceCurso").textContent =

avance + "%";

document.getElementById("barraCurso").style.width =

avance + "%";   

const ctx=document.getElementById("graficoNotas");

// Solo crear el gráfico si hay evaluaciones registradas
if(nombresEvaluaciones.length > 0){

new Chart(ctx,{

type:"bar",

data:{

labels:nombresEvaluaciones,

datasets:[{

label:"Calificación",

data:notasEvaluaciones,

borderWidth:1

}]

},

options:{

responsive:true,

plugins:{

legend:{

display:false

}

},

scales:{

y:{

beginAtZero:true,

max:100

}

}

}

});

}

// ==========================
// RUTA SECUENCIAL (roadmap)
// ==========================

renderizarRoadmap(realizadas);

renderizarInsignias(realizadas, promedio);

// Actualizar el nombre del estudiante en la tarjeta
if (user) {

    const nombreEl = document.getElementById("nombreAlumnoTexto");

    if (nombreEl) nombreEl.textContent = user.displayName || "Estudiante";

    const correoEl = document.getElementById("correoAlumno");

    if (correoEl) correoEl.textContent = user.email || "";

}

// Actualizar el avance en el hero del dashboard (si estamos ahí)
const statProgreso = document.getElementById("statProgreso");

if (statProgreso) {

    statProgreso.textContent = Math.round((aprobadas / total) * 100) + "%";

}

    }

    catch(error){

        console.error(error);

        alert("Error al cargar el progreso.");

    }

});
/* ============================================================
   RUTA DE APRENDIZAJE SECUENCIAL (roadmap)
   Cada etapa se desbloquea al aprobar la anterior (nota >= 70).
   ============================================================ */

function renderizarRoadmap(realizadas) {

    const cont = document.getElementById("roadmap");

    if (!cont) return;

    cont.innerHTML = "";

    let etapaAnteriorAprobada = true; // la primera siempre está desbloqueada

    evaluaciones.forEach((ev, indice) => {

        const datos = realizadas[ev.id];

        const nota = datos ? (datos.nota || 0) : null;

        const aprobada = nota != null && nota >= NODO_APROBADO;

        // Estado de la etapa
        let estado, clase, icono;

        if (aprobada) {

            estado = "Completada";
            clase = "completada";
            icono = "fa-check";

        } else if (etapaAnteriorAprobada) {

            estado = nota != null ? "Reintentar" : "Disponible";
            clase = nota != null ? "reintentar" : "disponible";
            icono = nota != null ? "fa-rotate-right" : "fa-play";

        } else {

            estado = "Bloqueada";
            clase = "bloqueada";
            icono = "fa-lock";

        }

        const paso = document.createElement("div");

        paso.className = `roadmap-paso ${clase}`;

        paso.innerHTML = `
            <div class="roadmap-circulo">
                <i class="fa-solid ${icono}"></i>
            </div>

            <div class="roadmap-info">
                <span class="roadmap-etapa">Etapa ${indice + 1}</span>
                <h4>${ev.nombre}</h4>
                <span class="roadmap-estado">${estado}${nota != null ? ` · Nota: ${nota}` : ""}</span>
            </div>

            ${clase !== "bloqueada"
                ? `<a class="roadmap-btn" href="${ev.enlace}">Ir</a>`
                : `<span class="roadmap-btn deshabilitado">🔒</span>`}
        `;

        cont.appendChild(paso);

        // La siguiente etapa se desbloquea solo si esta está aprobada
        etapaAnteriorAprobada = aprobada;

    });

}

/* ============================================================
   INSIGNIAS (gamificación)
   ============================================================ */

function renderizarInsignias(realizadas, promedio) {

    const cont = document.getElementById("insignias");

    if (!cont) return;

    const total = evaluaciones.length;

    const aprobadas = evaluaciones.filter(e =>
        realizadas[e.id] && (realizadas[e.id].nota || 0) >= NODO_APROBADO
    ).length;

    const algunaNota100 = evaluaciones.some(e =>
        realizadas[e.id] && realizadas[e.id].nota === 100
    );

    const insignias = [

        {
            icono: "fa-seedling",
            nombre: "Primer paso",
            desc: "Completa tu primera evaluación",
            obtenida: aprobadas >= 1
        },

        {
            icono: "fa-star-half-stroke",
            nombre: "A la mitad",
            desc: "Aprueba 2 evaluaciones",
            obtenida: aprobadas >= 2
        },

        {
            icono: "fa-graduation-cap",
            nombre: "Curso completado",
            desc: "Aprueba todas las evaluaciones",
            obtenida: aprobadas === total
        },

        {
            icono: "fa-crown",
            nombre: "Perfeccionista",
            desc: "Obtén una nota perfecta (100)",
            obtenida: algunaNota100
        },

        {
            icono: "fa-medal",
            nombre: "Excelencia",
            desc: "Promedio general ≥ 90",
            obtenida: promedio >= 90
        }

    ];

    cont.innerHTML = "";

    insignias.forEach(ins => {

        const div = document.createElement("div");

        div.className = `insignia ${ins.obtenida ? "obtenida" : "pendiente"}`;

        div.title = ins.desc;

        div.innerHTML = `
            <i class="fa-solid ${ins.icono}"></i>
            <span>${ins.nombre}</span>
        `;

        cont.appendChild(div);

    });

    // Persistir en Firestore las insignias nuevas + resumen para el docente
    sincronizarConFirestore(insignias, promedio, realizadas, aprobadas, total);

    // Actualizar el resumen visual rápido (4 tarjetas superiores)
    actualizarStatsAlumno(promedio, aprobadas, total, insignias);

    // Guardar datos para el botón de exportar PDF
    window.__datosProgreso = {
        evaluaciones: evaluaciones.map(ev => ({
            nombre: ev.nombre,
            nota: realizadas[ev.id] ? realizadas[ev.id].nota : null,
            aprobada: realizadas[ev.id] ? (realizadas[ev.id].nota || 0) >= NODO_APROBADO : false,
            intentos: realizadas[ev.id] ? realizadas[ev.id].intentos : null
        })),
        insignias: insignias
    };

    // Conectar el botón de exportar PDF
    const btnPDF = document.getElementById("btnExportarPDF");

    if (btnPDF) {

        btnPDF.addEventListener("click", async () => {

            try {

                const { exportarProgresoPDF } = await import("./reporte-pdf.js");

                const user = firebase.auth().currentUser;

                await exportarProgresoPDF({
                    nombre: user ? user.displayName : "Estudiante",
                    correo: user ? user.email : "",
                    promedio: promedio,
                    avance: Math.round((aprobadas / total) * 100),
                    aprobadas: aprobadas,
                    total: total,
                    evaluaciones: window.__datosProgreso.evaluaciones,
                    insignias: insignias
                });

            } catch (error) {

                console.error(error);

                alert("No se pudo generar el PDF: " + error.message);

            }

        });

    }

}

/**
 * Guarda en Firestore: logros nuevos + resumen del estudiante.
 * Import dinámico para no romper si firebase falla.
 */
async function sincronizarConFirestore(insignias, promedio, realizadas, aprobadas, total) {

    try {

        const { sincronizarInsignias, sincronizarResumenDocente } = await import("./logros.js");

        const listaConIds = insignias.map(ins => ({ ...ins, id: slug(ins.nombre) }));

        await sincronizarInsignias(realizadas, promedio, listaConIds);

        const user = firebase.auth().currentUser;

        await sincronizarResumenDocente({
            nombre: user ? (user.displayName || "Estudiante") : "Estudiante",
            correo: user ? user.email : "",
            promedio: promedio,
            avance: Math.round((aprobadas / total) * 100),
            aprobadas: aprobadas,
            total: total
        });

    } catch (error) {

        console.warn("Sync de logros no disponible:", error.message);

    }

}

/**
 * Convierte un nombre en id seguro para Firestore: "Primer paso" → "primer-paso"
 */
function slug(texto) {

    return texto
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

}

/**
 * Rellena las 4 tarjetas de resumen del encabezado del progreso.
 */
function actualizarStatsAlumno(promedio, aprobadas, total, insignias) {

    const el = (id) => document.getElementById(id);

    if (el("statPromedioAlumno")) el("statPromedioAlumno").textContent = promedio + "%";

    if (el("statAvanceAlumno"))
        el("statAvanceAlumno").textContent = Math.round((aprobadas / total) * 100) + "%";

    if (el("statAprobadasAlumno")) el("statAprobadasAlumno").textContent = `${aprobadas}/${total}`;

    if (el("statLogrosAlumno"))
        el("statLogrosAlumno").textContent = insignias.filter(i => i.obtenida).length;

}
