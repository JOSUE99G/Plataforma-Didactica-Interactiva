/* ============================================================
   Orquestador del entorno MATLAB didáctico
   Conecta: ribbon, editor, consola, workspace y robot virtual
   ============================================================ */

import { Interprete } from "./matlab-interprete.js";

import { RobotVirtual } from "./matlab-robot-api.js";

import {
  esperarSesion,
  listarArchivos,
  crearArchivo,
  guardarArchivo,
  abrirArchivo,
  nombreArchivoActual,
  importarArchivo,
  eliminarArchivo,
} from "./matlab-archivos.js";

/* ============================================================
   REFERENCIAS DOM
   ============================================================ */

const editor = document.getElementById("matlabEditor");

const consola = document.getElementById("matlabConsole");

const workspaceTabla = document.getElementById("workspaceTable");

const btnEjecutar = document.getElementById("btnEjecutar");

const btnDetener = document.getElementById("btnDetener");

/* ============================================================
   ESTADO
   ============================================================ */

const robot = new RobotVirtual();

// Puente hacia el visor 3D embebido (iframe):
// cada pose calculada por el RobotVirtual se reenvía al iframe.
robot.onPose = (pose) => {

  const frame = document.getElementById("robot3DFrame");

  if (frame && frame.contentWindow) {

    frame.contentWindow.postMessage(
      { tipo: "robotPose", pose },
      window.location.origin
    );

  }

};

let interprete = null;

let modoPaso = false;

let resolvePaso = null;

/* ============================================================
   CONSOLA DIDÁCTICA
   ============================================================ */

function log(mensaje) {
  if (!consola) return;

  const linea = document.createElement("div");

  linea.className = "console-line";

  linea.textContent = mensaje;

  consola.appendChild(linea);

  consola.scrollTop = consola.scrollHeight;
}

function limpiarConsola() {
  if (consola) consola.innerHTML = "";

  log(">> Entorno listo. Escribe tu script y presiona ▶ Ejecutar.");
}

/* ============================================================
   WORKSPACE (tabla de variables)
   ============================================================ */

function actualizarWorkspace(snapshot) {
  if (!workspaceTabla) return;

  workspaceTabla.innerHTML = "";

  if (!snapshot || snapshot.length === 0) {
    const fila = document.createElement("tr");

    fila.innerHTML = `<td colspan="2" style="color:#999">— sin variables —</td>`;

    workspaceTabla.appendChild(fila);

    return;
  }

  snapshot.forEach(({ nombre, valor }) => {
    const fila = document.createElement("tr");

    const td1 = document.createElement("td");

    const td2 = document.createElement("td");

    td1.textContent = nombre;

    td2.textContent =
      typeof valor === "object" ? JSON.stringify(valor) : String(valor);

    fila.appendChild(td1);

    fila.appendChild(td2);

    workspaceTabla.appendChild(fila);
  });
}

/* ============================================================
   PASO A PASO (modo didáctico)
   ============================================================ */

function esperarPaso(n, nodo) {
  log(`⏸ Paso ${n}: ${nodo.tipo}`);

  return new Promise((resolve) => {
    resolvePaso = resolve;
  });
}

function avanzarPaso() {
  if (resolvePaso) {
    const r = resolvePaso;

    resolvePaso = null;

    r();
  }
}

/* ============================================================
   EJECUCIÓN
   ============================================================ */

async function ejecutar() {
  if (!editor) return;

  const codigo = editor.value;

  if (!codigo.trim()) {
    log("⚠ No hay código para ejecutar.");

    return;
  }

  // Cancelar intérprete anterior si existía
  if (interprete) interprete.detener();

  interprete = new Interprete({
    log,

    robot,

    esperarPaso: modoPaso ? esperarPaso : null,
  });

  log("▶ Ejecutando script...");

  try {
    const snapshot = await interprete.ejecutar(codigo);

    actualizarWorkspace(snapshot);

    log(
      modoPaso ? "⏹ Script completado (paso a paso)." : "✅ Script finalizado.",
    );
  } catch (error) {
    log("❌ Error: " + error.message);

    console.error(error);
  }
}

/* ============================================================
   LISTA DE ARCHIVOS DEL ESTUDIANTE (panel izquierdo)
   ============================================================ */

function actualizarTituloEditor(nombre) {

  const titulo = document.querySelector(".editor-title");

  if (titulo) titulo.textContent = nombre;

}

async function refrescarListaArchivos() {

  const lista = document.getElementById("matlabFileList");

  if (!lista) return;

  const archivos = await listarArchivos();

  lista.innerHTML = "";

  if (archivos.length === 0) {

    const li = document.createElement("li");

    li.textContent = "— sin archivos —";

    li.style.color = "#999";

    lista.appendChild(li);

    return;

  }

  archivos.forEach((archivo) => {

    const li = document.createElement("li");

    li.textContent = "📄 " + archivo.nombre;

    li.style.cursor = "pointer";

    // Abrir al hacer clic
    li.addEventListener("click", () => {

      const abierto = abrirArchivo(archivo.id);

      if (abierto && editor) {

        editor.value = abierto.contenido;

        actualizarTituloEditor(abierto.nombre);

        log(`📂 Abierto: ${abierto.nombre}`);

      }

    });

    // Botón eliminar (click derecho o doble clic en la ✕)
    li.addEventListener("contextmenu", async (e) => {

      e.preventDefault();

      if (!confirm(`¿Eliminar ${archivo.nombre}?`)) return;

      const ok = await eliminarArchivo(archivo.id);

      log(ok ? `🗑 Eliminado: ${archivo.nombre}` : "⚠ No se pudo eliminar.");

      await refrescarListaArchivos();

    });

    lista.appendChild(li);

  });

}

/* ============================================================
   RIBBON
   ============================================================ */

function conectarRibbon() {
  if (btnEjecutar)
    btnEjecutar.addEventListener("click", () => {
      modoPaso = false;

      ejecutar();
    });

  if (btnDetener)
    btnDetener.addEventListener("click", () => {
      if (interprete) interprete.detener();

      avanzarPaso(); // liberar promesa pendiente

      log("■ Ejecución detenida por el usuario.");
    });

  const btnPaso = document.getElementById("btnPasoAPaso");

  if (btnPaso)
    btnPaso.addEventListener("click", () => {
      modoPaso = true;

      ejecutar();
    });

  const btnSiguiente = document.getElementById("btnSiguientePaso");

  if (btnSiguiente) btnSiguiente.addEventListener("click", avanzarPaso);

  const btnLimpiar = document.getElementById("btnLimpiarConsola");

  if (btnLimpiar) btnLimpiar.addEventListener("click", limpiarConsola);

  const btnEjemplo = document.getElementById("btnEjemplo");

  if (btnEjemplo)
    btnEjemplo.addEventListener("click", () => {
      if (editor) editor.value = CODIGO_EJEMPLO;
    });

  /* --- ARCHIVOS: Nuevo / Guardar / Abrir / Subir --- */

  const btnNuevo = document.getElementById("btnNuevo");

  if (btnNuevo)
    btnNuevo.addEventListener("click", async () => {

      const nombre = prompt("Nombre del nuevo archivo:", "nuevo_script.m");

      if (!nombre) return;

      const creado = await crearArchivo(nombre, "% Nuevo script\n\n");

      if (creado) {

        if (editor) editor.value = creado.contenido;

        actualizarTituloEditor(creado.nombre);

        await refrescarListaArchivos();

        log(`📄 Archivo creado: ${creado.nombre}`);

      } else {

        log("⚠ No se pudo crear el archivo (¿sesión expirada?).");

      }

    });

  const btnGuardar = document.getElementById("btnGuardar");

  if (btnGuardar)
    btnGuardar.addEventListener("click", async () => {

      if (!editor) return;

      const ok = await guardarArchivo(editor.value);

      log(ok ? "💾 Script guardado en tu cuenta." : "⚠ Error al guardar.");

    });

  const btnAbrir = document.getElementById("btnAbrir");

  if (btnAbrir)
    btnAbrir.addEventListener("click", async () => {

      await refrescarListaArchivos();

      log("📂 Revisa tu lista de archivos en el panel izquierdo.");

    });

  const btnSubir = document.getElementById("btnSubirArchivo");

  const inputArchivo = document.getElementById("matlabFileInput");

  if (btnSubir && inputArchivo) {

    btnSubir.addEventListener("click", () => inputArchivo.click());

    inputArchivo.addEventListener("change", async () => {

      const file = inputArchivo.files[0];

      if (!file) return;

      try {

        const importado = await importarArchivo(file);

        if (importado) {

          if (editor) editor.value = importado.contenido;

          actualizarTituloEditor(importado.nombre);

          await refrescarListaArchivos();

          log(`📥 Archivo importado: ${importado.nombre}`);

        }

      } catch (error) {

        log("⚠ " + error.message);

      }

      inputArchivo.value = ""; // permitir volver a subir el mismo archivo

    });

  }

  // Toggle visor 3D: amplia el editor cuando está oculto
  const btnToggle = document.getElementById("btnToggleViewer");

  const workspaceEl = document.querySelector(".matlab-workspace");

  if (btnToggle && workspaceEl) {

    btnToggle.addEventListener("click", () => {

      workspaceEl.classList.toggle("viewer-oculto");

      btnToggle.textContent = workspaceEl.classList.contains("viewer-oculto")
        ? "▶ Abrir visor"
        : "◀ ▶";

    });

  }
}

/* ============================================================
   SCRIPT DE EJEMPLO DIDÁCTICO
   ============================================================ */

const CODIGO_EJEMPLO = `% Ejemplo: mover el robot en cuadrado
% Autor: tu nombre aqui

magician.init()
magician.home()

x = 100;
y = 50;

for i = 1:4
    magician.ptp(x, y, 30, 0)
    magician.ptp(x, -y, 30, 0)
    magician.ptp(-x, -y, 30, 0)
    magician.ptp(-x, y, 30, 0)
end

magician.gripper(80)
disp("Cuadrado completado!")
magician.home()`;

/* ============================================================
   INICIO
   ============================================================ */

document.addEventListener("DOMContentLoaded", async () => {
  limpiarConsola();

  conectarRibbon();

  actualizarWorkspace([]);

  // Esperar sesión y cargar los archivos del estudiante
  const uid = await esperarSesion();

  if (uid) {

    await refrescarListaArchivos();

    log("📚 Tus archivos .m se cargaron desde tu cuenta.");

  } else {

    log("⚠ Sin sesión: los archivos no se guardarán.");

  }

  log("💡 Sugerencia: pulsa 'Ejemplo' para cargar un script de prueba.");

  // Marcar el botón de paso a paso si existe
  const btnPaso = document.getElementById("btnPasoAPaso");

  if (btnPaso) btnPaso.title = "Ejecuta una instrucción a la vez";

  const btnSig = document.getElementById("btnSiguientePaso");

  if (btnSig) btnSig.title = "Avanza a la siguiente instrucción";
});
