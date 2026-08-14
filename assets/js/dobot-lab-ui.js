document.addEventListener("DOMContentLoaded", () => {

    const editor = document.getElementById("pythonEditor");

    const lineNumbers = document.getElementById("lineNumbers");

    const consoleOutput = document.getElementById("consoleOutput");

    const speedSlider = document.getElementById("speedSlider");

    const speedValue = document.getElementById("speedValue");


    /* ==========================================
       CONSOLA
    ========================================== */

    function consoleMessage(message) {

        const line = document.createElement("div");

        line.className = "console-line";

        line.innerHTML = `
            <span class="console-prefix">></span>
            ${message}
        `;

        consoleOutput.appendChild(line);

        consoleOutput.scrollTop =
            consoleOutput.scrollHeight;
    }


    /* ==========================================
       NÚMEROS DE LÍNEA
    ========================================== */

    function updateLineNumbers() {

        const lines = editor.value.split("\n").length;

        let numbers = "";

        for (let i = 1; i <= lines; i++) {

            numbers += i + "<br>";

        }

        lineNumbers.innerHTML = numbers;
    }


    editor.addEventListener("input", updateLineNumbers);

    editor.addEventListener("scroll", () => {

        lineNumbers.scrollTop = editor.scrollTop;

    });


    updateLineNumbers();


    /* ==========================================
       VELOCIDAD
    ========================================== */

    speedSlider.addEventListener("input", () => {

        speedValue.textContent =
            speedSlider.value + "%";

    });


    /* ==========================================
       GENERAR CÓDIGO PTP
    ========================================== */

    document
        .getElementById("generateCodeBtn")
        .addEventListener("click", () => {

            const x =
                document.getElementById("coordX").value;

            const y =
                document.getElementById("coordY").value;

            const z =
                document.getElementById("coordZ").value;

            const r =
                document.getElementById("coordR").value;


            const code =
`# Movimiento punto a punto

from DobotEDU import *

magician.ptp(
    mode=0,
    x=${x},
    y=${y},
    z=${z},
    r=${r}
)`;


            editor.value = code;

            updateLineNumbers();

            consoleMessage(
                "Código PTP generado correctamente."
            );

        });


    /* ==========================================
       COPIAR CÓDIGO
    ========================================== */

    document
        .getElementById("copyCodeBtn")
        .addEventListener("click", async () => {

            try {

                await navigator.clipboard.writeText(
                    editor.value
                );

                consoleMessage(
                    "Código copiado al portapapeles."
                );

            } catch (error) {

                consoleMessage(
                    "No se pudo copiar el código."
                );

            }

        });


    /* ==========================================
       NUEVO
    ========================================== */

    document
        .getElementById("newCodeBtn")
        .addEventListener("click", () => {

            editor.value =
`# Nuevo programa

from DobotEDU import *

`;

            updateLineNumbers();

            consoleMessage(
                "Nuevo programa creado."
            );

        });


    /* ==========================================
       EJECUTAR
    ========================================== */

    document
        .getElementById("executeCodeBtn")
        .addEventListener("click", () => {

            consoleMessage(
                "Modo de prueba: todavía no existe conexión con el robot."
            );

            consoleMessage(
                "El código será ejecutado por Python en una etapa posterior."
            );

        });


    /* ==========================================
       LIMPIAR CONSOLA
    ========================================== */

    document
        .getElementById("clearConsoleBtn")
        .addEventListener("click", () => {

            consoleOutput.innerHTML = "";

        });


    /* ==========================================
       BOTÓN CONECTAR
    ========================================== */

    document
        .getElementById("connectRobotBtn")
        .addEventListener("click", () => {

            consoleMessage(
                "La conexión serial será implementada en la siguiente etapa."
            );

        });


    /* ==========================================
       MOVIMIENTO MANUAL
    ========================================== */

    document
        .querySelectorAll(".jog-controls button")
        .forEach(button => {

            button.addEventListener("click", () => {

                const axis =
                    button.dataset.axis;

                const direction =
                    button.dataset.direction;

                consoleMessage(
                    `Movimiento manual solicitado: ${axis.toUpperCase()} ${direction}`
                );

            });

        });


    /* ==========================================
       COMANDOS
    ========================================== */

    document
        .querySelectorAll(".command-btn")
        .forEach(button => {

            button.addEventListener("click", () => {

                const command =
                    button.dataset.command;

                consoleMessage(
                    `Comando seleccionado: ${command}`
                );

            });

        });


    /* ==========================================
       HERRAMIENTAS
    ========================================== */

    document
        .querySelectorAll(".tool-btn")
        .forEach(button => {

            button.addEventListener("click", () => {

                document
                    .querySelectorAll(".tool-btn")
                    .forEach(btn =>
                        btn.classList.remove("active")
                    );

                button.classList.add("active");

                consoleMessage(
                    `Herramienta seleccionada: ${button.textContent.trim()}`
                );

            });

        });


    document
        .getElementById("toolOpenBtn")
        .addEventListener("click", () => {

            consoleMessage(
                "Orden de apertura de herramienta preparada."
            );

        });


    document
        .getElementById("toolCloseBtn")
        .addEventListener("click", () => {

            consoleMessage(
                "Orden de cierre de herramienta preparada."
            );

        });


});