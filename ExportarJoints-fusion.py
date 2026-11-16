# ============================================================
# Exportador de Joints de Fusion 360 → rig JSON de la plataforma
#
# INSTRUCCIONES DE USO EN FUSION 360:
# 1. Abre el ensamblaje con los joints ya creados
# 2. pestaña UTILIDADES → Complementos (Add-ins) → Scripts y complementos
# 3. "+" → Crear → Script Python → nombre: ExportarJoints
# 4. Reemplaza el contenido del script generado por ESTE archivo
# 5. Ejecuta (▶). Se abre un diálogo para guardar "rig-brazo.json"
# 6. Guarda el JSON en: assets/models/rig-brazo.json de la plataforma
#
# Lo que exporta por cada joint de revolución (rotación):
#   - id (nombre del componente hijo)
#   - origen (posición del eje del joint en coords del ensamblaje, mm)
#   - eje de giro (x/y/z en el marco del ensamblaje)
#   - rango (límites máx/mín que definiste en el joint)
#
# Autor: generado para la Plataforma Didáctica Interactiva
# ============================================================

import adsk.core, adsk.fusion, traceback
import json
import math

# ============================================================
# Helper de unidades: Fusion trabaja internamente en cm -> mm
# (global para que _procesar_joint pueda usarla)
# ============================================================

def a_mm(valor):
    return round(valor * 10.0, 1)

def run(context):
    ui = None
    try:
        app = adsk.core.Application.get()
        ui = app.userInterface

        design = adsk.fusion.Design.cast(app.activeProduct)
        if not design:
            ui.messageBox("Abre un documento de diseño (ensamblaje) primero.")
            return

        root = design.rootComponent

        # --- Diálogo para guardar ---
        dlg = ui.createFileDialog()
        dlg.title = "Guardar configuración del rig"
        dlg.initialFilename = "rig-brazo.json"
        dlg.filter = "JSON (*.json)"
        if dlg.showSave() != adsk.core.DialogResults.DialogOK:
            return
        ruta = dlg.filename

        eslabones = []

        log = []

        # --- Recorrer joints del ensamblaje ---
        log.append("As-built joints: " + str(root.asBuiltJoints.count))

        for joint in root.asBuiltJoints:
            _procesar_joint(joint, eslabones, design, log)

        log.append("Joints regulares: " + str(root.joints.count))

        for joint in root.joints:
            _procesar_joint(joint, eslabones, design, log)

        if not eslabones:
            # Diagnóstico completo para entender qué hay en el modelo
            ui.messageBox(
                "No se exportó ningún eslabón.\n\n"
                "DIAGNÓSTICO:\n"
                + "\n".join(log)
                + "\n\nTIP: si tus uniones son 'Rigidas' o de otro tipo,\n"
                "cámbialas a 'Revolución' (clic derecho sobre la unión →\n"
                "Editar unión → Tipo: Revolución)."
            )
            return

        # El efector es el eslabón cuyo hijo no es padre de nadie:
        # simplificación: el último de la cadena
        efector_id = eslabones[-1]["id"]

        rig = {
            "_ayuda": "Generado automáticamente por ExportarJoints.py desde Fusion 360. Coordenadas en mm, marco del ensamblaje.",
            "efector": efector_id,
            "eslabones": eslabones
        }

        with open(ruta, "w") as f:
            json.dump(rig, f, indent=2, ensure_ascii=False)

        ui.messageBox(
            "✅ Configuración exportada:\n" + ruta +
            "\n\n" + "\n".join(log) +
            "\n\nCópiala en: assets/models/rig-brazo.json\n"
            "y recarga el visor 3D de la plataforma."
        )

    except:
        if ui:
            ui.messageBox("Error:\n{}".format(traceback.format_exc()))

# ------------------------------------------------------------
# Procesar un joint individual (solo revolución, con diagnóstico)
# ------------------------------------------------------------
def _procesar_joint(joint, eslabones, design, log):

    try:
        esRevolucion = (
            joint.jointMotion.jointType == adsk.fusion.JointTypes.RevoluteJointType
        )

        if not esRevolucion:
            return

        motion = adsk.fusion.RevoluteJointMotion.cast(joint.jointMotion)

        # Geometría de la unión: puede venir en geometryOrOriginOne
        # O geometryOrOriginTwo — probar ambas.
        origen3d = None

        eje_vec = None

        for attr in ("geometryOrOriginOne", "geometryOrOriginTwo"):

            try:

                geo = getattr(joint, attr)

                g = adsk.fusion.JointGeometry.cast(geo)

                if not g:
                    continue

                if g.origin:
                    origen3d = {
                        "x": a_mm(g.origin.x),
                        "y": a_mm(g.origin.y),
                        "z": a_mm(g.origin.z),
                    }

                if g.axis:
                    eje_vec = {
                        "x": round(g.axis.x, 3),
                        "y": round(g.axis.y, 3),
                        "z": round(g.axis.z, 3),
                    }

                if origen3d and eje_vec:
                    break

            except:
                continue

        # Eje dominante
        if eje_vec:
            ejes = {
                "x": abs(eje_vec.get("x", 0)),
                "y": abs(eje_vec.get("y", 0)),
                "z": abs(eje_vec.get("z", 0)),
            }

            eje_dominante = max(ejes, key=ejes.get)

        else:
            eje_dominante = "y"

        # Límites definidos en Fusion
        rango = [-180, 180]

        try:
            if motion.rotationLimitsEnabled:
                rango = [
                    round(math.degrees(motion.rotationLimits.minimum), 0),
                    round(math.degrees(motion.rotationLimits.maximum), 0),
                ]
        except:
            pass

        # Nombre del componente hijo (respaldos múltiples)
        id_hijo = None

        try:
            if joint.occurrences and joint.occurrences.count > 0:
                id_hijo = joint.occurrences.item(
                    joint.occurrences.count - 1
                ).component.name
        except:
            pass

        if not id_hijo:
            try:
                if joint.occurrenceTwo:
                    id_hijo = joint.occurrenceTwo.component.name
            except:
                pass

        if not id_hijo:
            try:
                if joint.occurrenceOne:
                    id_hijo = joint.occurrenceOne.component.name
            except:
                pass

        if not id_hijo:
            id_hijo = "eslabon_" + str(len(eslabones) + 1)

        # Normalizar para que coincida con los STL
        id_limpio = (
            id_hijo.split(" ")[0]
            .split(":")[0]
            .lower()
            .replace("1", "")
            .replace("2", "")
        )

        log.append(
            f"  OK {id_hijo} -> id='{id_limpio}' eje={eje_dominante} "
            f"rango={rango} origen={origen3d}"
        )

        eslabones.append({
            "id": id_limpio,
            "stl": "assets/models/piezas/" + id_limpio + ".stl",
            "padre": eslabones[-1]["id"] if eslabones else None,
            "eje": eje_dominante,
            "rango": rango,
            "origen": origen3d or {"x": 0, "y": 0, "z": 0},
        })

    except:
        log.append("  OMITIDO: " + traceback.format_exc().splitlines()[-1])

# ------------------------------------------------------------
# (helper a_mm definido arriba, global)
# ------------------------------------------------------------
