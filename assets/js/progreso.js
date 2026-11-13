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
        nombre: "Quiz 1"
    },

    {
        id: "quiz2",
        nombre: "Quiz 2"
    },

    {
        id: "quiz3",
        nombre: "Quiz 3"
    },

    {
        id: "final",
        nombre: "Evaluación Final"
    }

];

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

    }

    catch(error){

        console.error(error);

        alert("Error al cargar el progreso.");

    }

});