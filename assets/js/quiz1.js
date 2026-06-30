document.getElementById("quizForm").addEventListener("submit", async function(e){

    e.preventDefault();

    let totalPreguntas = 3;
    let respuestasCorrectas = 0;

    // Obtener todas las respuestas seleccionadas
    const respuestas = document.querySelectorAll('input[type="radio"]:checked');

    // Verificar que todas las preguntas estén contestadas
    if(respuestas.length < totalPreguntas){

        alert("⚠ Debes responder todas las preguntas.");

        return;
    }

    // Contar respuestas correctas
    respuestas.forEach(respuesta =>{

        respuestasCorrectas += Number(respuesta.value);

    });

    // Calcular nota sobre 100
    let nota = Math.round((respuestasCorrectas / totalPreguntas) * 100);

    const user = firebase.auth().currentUser;

if(user){

    try{

        // Obtener documento del Quiz
        const quizRef = db.collection("usuarios")
            .doc(user.uid)
            .collection("evaluaciones")
            .doc("quiz1");

        // Leer si ya existe
        const doc = await quizRef.get();

        let intentos = 1;

        if(doc.exists){
            intentos = doc.data().intentos + 1;
        }

        // Guardar información
        await quizRef.set({

            nota: nota,
            correctas: respuestasCorrectas,
            total: totalPreguntas,
            aprobado: nota >= 70,
            intentos: intentos,
            fecha: firebase.firestore.FieldValue.serverTimestamp()

        });

        console.log("✅ Resultado guardado correctamente.");

    }
    catch(error){

        console.error(error);

        alert("No se pudo guardar la evaluación.");

    }

}

    // Mostrar resultado
    let resultado = document.getElementById("resultado");

    if(nota >= 70){

        resultado.innerHTML = `
            <h2 style="color:green;">
                ✅ ¡Aprobaste!
            </h2>

            <p>Tu calificación es:</p>

            <h1>${nota}/100</h1>
        `;

    }else{

        resultado.innerHTML = `
            <h2 style="color:red;">
                ❌ No aprobaste
            </h2>

            <p>Tu calificación es:</p>

            <h1>${nota}/100</h1>
        `;

    }

});