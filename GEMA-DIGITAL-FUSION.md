# 🔗 Gemelo digital: Plataforma ↔ Fusion 360 (Opción A)

La animación articulada del brazo ahora la ejecuta **Fusion 360** (tu ensamblaje con joints y límites reales), controlada desde la plataforma. El visor web queda como explorador del modelo + subida de STL propios.

## 🏗️ Arquitectura

```
┌──────────────────────────┐
│ Plataforma (navegador)   │
│ MATLAB virtual:          │
│  magician.ptp(100,50,30) │
└────────────┬─────────────┘
             │ POST /api/comandos-robot
             ▼
┌──────────────────────────┐
│ servidor-laboratorio.js  │
│ escribe comandos-robot   │
└────────────┬─────────────┘
             │ comandos-robot.json (archivo puente)
             ▼
┌──────────────────────────┐
│ Fusion 360 + ReceptorFusion│
│ mueve los joints reales   │
└──────────────────────────┘
```

## 📦 Instalación (una vez, 10 minutos)

### 1. Add-in receptor en Fusion

1. Copia `ReceptorFusion.py` del proyecto
2. Fusion → **UTILIDADES → Scripts y complementos** → pestaña **Complementos** → **+** → Crear → Tipo: **Add-in** → Nombre: `ReceptorPlataforma`
3. Botón **"Detalles"** → abre la carpeta → reemplaza el `.py` por `ReceptorFusion.py`
4. Selecciónalo → **▶ Ejecutar** (dejar corriendo; aparece "✅ Receptor ACTIVO")

**⚠️ Configurar la ruta:** abre el `.py` y ajusta `RUTA_PUENTE` a la ruta absoluta de `comandos-robot.json` de tu instalación:

```python
RUTA_PUENTE = "C:/Users/USER/Desktop/Plataforma-Didactica-Interactiva/comandos-robot.json"
```

### 2. Servidor local

```bash
node servidor-laboratorio.js
```

(ya lo tienes — solo reinícialo para activar el endpoint nuevo)

### 3. Abrir el ensamblaje en Fusion

Con el add-in corriendo y el ensamblaje abierto, está listo.

## 🎬 Flujo de uso en clase

1. Enciende el servidor + Fusion con el add-in activo
2. Estudiante entra a la plataforma → **Simulación MATLAB**
3. Escribe: `magician.init()` → `magician.ptp(100, 50, 30, 0)`
4. El intérprete calcula los ángulos → POST al servidor → archivo puente → **Fusion mueve los joints de tu CAD real**
5. El estudiante ve el brazo moverse con la cinemática exacta del diseño

## 📐 Para el MATLAB virtual

Los comandos se mapean así (orden de la cadena):

- `j1` = base · `j2` = hombro · `j3` = codo · `j4` = muñeca · `j5` = griper

El add-in ordena los joints por altura automáticamente, así que `j1` siempre es el más bajo (base) — no depende de nombres.

## 🔬 Para defender en la tesis

> "Se implementó una arquitectura de gemelo digital en la que el modelo CAD paramétrico (Fusion 360) actúa como motor de simulación física, alimentado por un puente de comandos generado por la plataforma didáctica. Esto garantiza fidelidad cinemática total (joints, límites mecánicos y jerarquía definidos en el diseño) eliminando la duplicación de modelos."

## ⚠️ Limitaciones conocidas

- Requiere Fusion abierto en la PC del laboratorio (no corre en GitHub Pages — es el precio de la fidelidad; en modo nube la plataforma sigue funcionando, solo sin animación 3D articulada)
- El mapeo j1..j5 asume cadena simple; para robots paralelos (MG400) haría falta mapeo dedicado
