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

        sumaNotas += datos.nota;

        nombresEvaluaciones.push(evaluacion.nombre);

        notasEvaluaciones.push(datos.nota);
        

        tabla.innerHTML += `
            <tr>

                <td>${evaluacion.nombre}</td>

                <td>${datos.nota}</td>

                <td>✅ Aprobado</td>

                <td>${datos.intentos}</td>

            </tr>
        `;

    }else{

        tabla.innerHTML += `
            <tr>

                <td>${evaluacion.nombre}</td>

                <td>—</td>

                <td>⏳ Pendiente</td>

                <td>0</td>

            </tr>
        `;

    }

});

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

    catch(error){

        console.error(error);

        alert("Error al cargar el progreso.");

    }

});