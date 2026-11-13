# 🦾 Guía: exportar el Dobot desde Fusion 360 para cinemática real

Tu visor ya soporta **dos modos de rig**:

| Modo     | Entrada                              | Resultado                                                                    |
| -------- | ------------------------------------ | ---------------------------------------------------------------------------- |
| `simple` | 1 STL sólido (el que tenías)         | Aproximación por capas de altura                                             |
| `multi`  | 5 STL individuales (uno por eslabón) | **Cinemática real**: cada pieza rota alrededor de su eje articular verdadero |

El modo `multi` se activa automáticamente si existen los archivos. Así los generas:

## 1. Preparar las piezas en Fusion 360

El robot tiene 5 cuerpos/slmbarls: **base, hombro, codo, muñeca, garra**.

1. Abre tu modelo del Magician Lite.
2. En el navegador (árbol), separa cada eslabón como **componente independiente** (clic derecho → "Crear componentes desde cuerpos").
3. **Lo más importante**: cada componente debe tener su **origen local en el eje de la articulación**:

```
base:    origen en el centro de la base (eje de rotación de la mesa)
hombro:  origen en el eje del hombro (donde conecta con la base)
codo:    origen en el eje del codo (donde conecta con el hombro)
muneca:  origen en el eje de la muñeca
garra:   origen en el eje de la garra
```

> **Truco de Fusion 360:** en cada componente, crea un "joint origin" en el punto de la articulación, o usa "Move Component" → coloca el origen del componente exactamente en el eje del joint.

## 2. Exportar cada pieza como STL

Para cada componente (5 en total):

1. Selecciona el componente en el árbol.
2. Clic derecho → **Guardar como STL / Mesh**.
3. Opciones recomendadas:
   - **Refinamiento: Alto** (o ajuste de desviación 0.05 mm)
   - **Unidades: milímetros** ← crítico, tu visor trabaja en mm
   - **Sistema de coordenadas del componente** (no el del documento) ← esto hace que cada STL venga centrado en su articulación
4. Guarda con estos nombres exactos en `assets/models/piezas/`:

```
base.stl
hombro.stl
codo.stl
muneca.stl
garra.stl
```

## 3. Verificar los orígenes (offsets) en rig-dobot.json

El archivo `assets/models/rig-dobot.json` define la cadena:

```json
{
  "efector": "muneca",
  "eslabones": [
    { "id": "hombro", "padre": "base", "eje": "z", "rango": [-15, 85],
      "origen": { "x": 0, "y": 63, "z": 0 } },
    ...
  ]
}
```

- **`origen`** = distancia desde el pivote del padre hasta el eje de esta articulación (en mm). Mide estos valores en Fusion 360 (herramienta de medición entre los ejes de los joints).
- **`eje`** = eje de rotación de esa articulación en su marco local (`x`, `y` o `z`).
- **`rango`** = límites mecánicos reales del Dobot (ya vienen con los del Magician Lite).
- **`efector`** = qué eslabón se usa para leer la posición de la punta (FK).

Si midiste bien, el robot montado se verá correcto sin ajustes; si alguna pieza aparece desplazada, corrige su `origen` en el JSON (no hace falta reexportar nada).

## 4. Colores didácticos automáticos

Cada eslabón recibe un color para identificarlo en clase:

| Pieza  | Color       |
| ------ | ----------- |
| base   | Gris oscuro |
| hombro | Azul        |
| codo   | Verde       |
| muñeca | Naranja     |
| garra  | Rojo        |

## 5. Integración con la plataforma (ya está lista)

- Los **sliders de articulaciones** (`visualizador.html`) mueven este rig con los rangos reales
- La **pose del efector** se lee del pivote real (FK verdadera, no aproximada)
- El **laboratorio MATLAB** recibe la misma pose vía postMessage
- Si el rig multi no está disponible, cae automáticamente al modo simple con tu STL actual — nada se rompe

## Nota sobre tu STL generado por IA

El STL generado a partir de imagen es un sólido continuo: sirve para el modo simple (visualización estática y escala), pero **no tiene piezas separables**. Para la cinemática real de la tesis, modela las 5 piezas en Fusion (o descarga un modelo CAD del Magician Lite con componentes) y sigue esta guía. Es trabajo de una tarde y convierte tu capítulo de resultados: pasa de "simulación aproximada" a "gemelo digital con cadena cinemática verificable".
