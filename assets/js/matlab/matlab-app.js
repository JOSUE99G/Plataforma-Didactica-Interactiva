/* ============================================================
   Orquestador del entorno MATLAB didáctico
   Conecta: ribbon, editor, consola, workspace y robot virtual
   ============================================================ */

import { Interprete } from "./matlab-interprete.js";

import { RobotVirtual } from "./matlab-robot-api.js";

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

document.addEventListener("DOMContentLoaded", () => {
  limpiarConsola();

  conectarRibbon();

  actualizarWorkspace([]);

  log("💡 Sugerencia: pulsa 'Ejemplo' para cargar un script de prueba.");

  // Marcar el botón de paso a paso si existe
  const btnPaso = document.getElementById("btnPasoAPaso");

  if (btnPaso) btnPaso.title = "Ejecuta una instrucción a la vez";

  const btnSig = document.getElementById("btnSiguientePaso");

  if (btnSig) btnSig.title = "Avanza a la siguiente instrucción";
});
