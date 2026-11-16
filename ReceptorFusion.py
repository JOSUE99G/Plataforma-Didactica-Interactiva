# ============================================================
#  Add-in receptor para Fusion 360
#  Plataforma Didáctica Interactiva — Gemelo digital del brazo
#
#  QUÉ HACE:
#  Lee un archivo "puente" (comandos-robot.json) cada 300 ms y
#  mueve los joints de revolución del ensamblaje según los ángulos
#  que envía la plataforma (laboratorio MATLAB virtual).
#
#  INSTALACIÓN (una sola vez):
#  1. Fusion 360 → UTILIDADES → Scripts y complementos
#  2. Pestaña "Complementos" (Add-ins) → + (Crear) → Tipo: Add-in
#     Nombre: ReceptorPlataforma
# 3. Abrir la carpeta del add-in y REEMPLAZAR el contenido de
#     ReceptorPlataforma.py por ESTE archivo
#  4. En la misma ventana, seleccionarlo y pulsar ▶ Ejecutar
#  5. Dejarlo corriendo mientras se usa la plataforma
#
#  CONFIGURAR LA RUTA DEL PUENTE (ver PONTE abajo): debe apuntar a
#  la carpeta del proyecto de la plataforma.
# ============================================================

import adsk.core, adsk.fusion, traceback
import json
import os
import time
import threading

# ============================================================
# PONTE: ruta del archivo de comandos (editar según instalación)
# Ejemplo Windows:
#   C:/Users/USER/Desktop/Plataforma-Didactica-Interactiva/comandos-robot.json
# ============================================================

RUTA_PUENTE = os.path.join(
    os.path.expanduser("~"),
    "Desktop",
    "Plataforma-Didactica-Interactiva",
    "comandos-robot.json",
)

INTERVALO_MS = 300  # frecuencia de sondeo

# ============================================================
# ESTADO GLOBAL DEL ADD-IN
# ============================================================

_app = None

_ui = None

_ejecutando = False

_hilo = None

_ultimo_hash = None


# ============================================================
# LECTURA DEL ARCHIVO PUENTE
# ============================================================

def leer_comandos():
    """Lee y parsea el archivo puente. Devuelve dict o None."""

    try:

        if not os.path.exists(RUTA_PUENTE):

            return None

        with open(RUTA_PUENTE, "r") as f:

            contenido = f.read()

        if not contenido.strip():

            return None

        return json.loads(contenido)

    except Exception:

        return None


# ============================================================
# APLICAR ÁNGULOS A LOS JOINTS
# ============================================================

def aplicar_comandos(comandos):

    """Mueve los joints de revolución del ensamblaje raíz."""

    design = adsk.fusion.Design.cast(_app.activeProduct)

    if not design:

        return

    root = design.rootComponent

    # Recopilar todos los joints de revolución disponibles
    joints_rev = []

    for j in root.joints:

        try:

            if j.jointMotion.jointType == adsk.fusion.JointTypes.RevoluteJointType:

                joints_rev.append(j)

        except:

            pass

    for j in root.asBuiltJoints:

        try:

            if j.jointMotion.jointType == adsk.fusion.JointTypes.RevoluteJointType:

                joints_rev.append(j)

        except:

            pass

    if not joints_rev:

        return

    # Ordenar por posición Y del origen (de abajo hacia arriba):
    # esto aproxima la cadena cinemática base -> ... -> efector
    # sin depender de nombres.
    def altura(j):

        try:

            g = j.geometryOrOriginOne

            g = adsk.fusion.JointGeometry.cast(g)

            if g and g.origin:

                return g.origin.z   # Fusion internamente Z es... ver nota

        except:

            pass

        return 0

    joints_rev.sort(key=altura)

    # Aplicar ángulos: comandos = { "j1": deg, "j2": deg, ... }
    for i, j in enumerate(joints_rev):

        clave = "j" + str(i + 1)

        if clave not in comandos:

            continue

        try:

            motion = adsk.fusion.RevoluteJointMotion.cast(j.jointMotion)

            if not motion:

                continue

            angulo_rad = math.radians(float(comandos[clave]))

            # Respetar límites definidos en Fusion (no forzar)
            if motion.rotationLimitsEnabled:

                lim_min = motion.rotationLimits.minimum

                lim_max = motion.rotationLimits.maximum

                angulo_rad = max(lim_min, min(lim_max, angulo_rad))

            motion.rotationValue = angulo_rad

        except:

            # Puede fallar por límites o contexto; ignorar silenciosamente
            pass


# ============================================================
# BUCLE DE SONDEO (hilo aparte para no congelar Fusion)
# ============================================================

def bucle():

    global _ultimo_hash

    while _ejecutando:

        try:

            comandos = leer_comandos()

            if comandos:

                # Solo aplicar si cambió (evitar trabajo innecesario)
                h = json.dumps(comandos, sort_keys=True)

                if h != _ultimo_hash:

                    _ultimo_hash = h

                    # Fusion API no es thread-safe: usar invoke
                    try:

                        _app.invoke(adsk.core.CommandEventHandler.cast(lambda a: None))

                    except:

                        pass

                    aplicar_comandos(comandos)

        except Exception:

            pass

        time.sleep(INTERVALO_MS / 1000.0)


# ============================================================
# CICLO DE VIDA DEL ADD-IN
# ============================================================

def run(context):

    global _app, _ui, _ejecutando, _hilo

    try:

        _app = adsk.core.Application.get()

        _ui = _app.userInterface

        # Verificar archivo puente al iniciar
        if not os.path.exists(RUTA_PUENTE):

            _ui.messageBox(
                "⚠ No existe el archivo puente:\n" + RUTA_PUENTE +
                "\n\nCréalo desde la plataforma (ejecuta un script en el "
                "laboratorio MATLAB) o ajusta RUTA_PUENTE en este add-in."
            )

        _ejecutando = True

        _hilo = threading.Thread(target=bucle, daemon=True)

        _hilo.start()

        _ui.messageBox(
            "✅ Receptor de la plataforma ACTIVO\n\n"
            "Leyendo: " + RUTA_PUENTE + "\n"
            "Frecuencia: cada " + str(INTERVALO_MS) + " ms\n\n"
            "Deja esta ventana abierta. Para detener: Scripts y "
            "complementos → Detener."
        )

    except:

        if _ui:

            _ui.messageBox("Error al iniciar:\n" + traceback.format_exc())


def stop(context):

    global _ejecutando

    _ejecutando = False

    if _ui:

        _ui.messageBox("Receptor detenido.")
