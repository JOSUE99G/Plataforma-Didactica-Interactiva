# 🖥️ Despliegue en el Laboratorio (sin internet)

La plataforma tiene **dos modos de operación con detección automática**:

| Modo               | Cuándo se activa                         | Dónde viven los datos                     |
| ------------------ | ---------------------------------------- | ----------------------------------------- |
| ☁️ **Nube**        | El servidor local no responde            | Firebase (como siempre)                   |
| 🏠 **Laboratorio** | `servidor-laboratorio.js` está corriendo | Archivo `datos-laboratorio.json` en la PC |

Al abrir la página, `firebase-config.js` hace un "ping" al servidor local (1.5s de timeout). Si responde → modo laboratorio; si no → modo nube. **No hay que configurar nada**: el mismo código funciona en ambos escenarios.

## 🚀 Puesta en marcha en el laboratorio (3 pasos)

1. **Copiar el proyecto** a la PC del laboratorio (pendrive o `git clone`).
2. **Instalar Node.js** una sola vez (viene con instalador para Windows: https://nodejs.org).
3. **Ejecutar:**

```bash
node servidor-laboratorio.js
```

Salida esperada:

```
==================================================
  PLATAFORMA DIDÁCTICA — MODO LABORATORIO
==================================================
  🌐 Abre en el navegador:  http://localhost:8080
  📁 Datos guardados en:    datos-laboratorio.json
```

Los estudiantes abren `http://localhost:8080` en cualquier navegador de la red del laboratorio (o `http://IP-DE-LA-PC:8080` desde otras máquinas).

## 👨‍🏫 Control del docente

**1. Administrar cuentas** — el docente edita `datos-laboratorio.json` (o puede pedir a los estudiantes registrarse desde la pantalla de login normal, que también funciona en modo local).

**2. Ver el progreso de todos** — la página `docente.html` sigue funcionando en modo local: lee la colección `clase` (que en local vive en el JSON).

**3. Respaldar la clase completa** — copiar `datos-laboratorio.json` = copia de seguridad total (notas, archivos .m, insignias). Se puede llevar en un pendrive, restaurar, o abrir con Excel.

**4. Restablecer un semestre** — borrar el archivo y la plataforma inicia limpia.

**5. Control de acceso físico** — como todo corre en la PC del laboratorio, el docente controla quién tiene cuenta: se dan de alta manualmente o se desactivan editando el JSON.

## 🔐 Recomendación de seguridad para la versión local

El servidor actual usa hash SHA-256 simple (didáctico, suficiente para un laboratorio cerrado). Si el docente quiere más rigor, el siguiente paso sería:

- Sustituir el hash por `crypto.scrypt` (está en Node, sin dependencias)
- Agregar un endpoint `/api/crear-usuario-docente` con contraseña maestra
- Servir por HTTPS local con certificado autofirmado

## 📦 Doble despliegue (lo mejor de ambos mundos)

Puedes mantener **ambos despliegues con el mismo código**:

- **GitHub Pages** → demo pública para la tesis, con Firebase (los datos van a la nube)
- **Laboratorio** → uso real con estudiantes, servidor local, datos en la PC del docente

La detección automática hace que el mismo `index.html` funcione en ambos sin cambios.

## ⚠️ Nota sobre el modo embebido del visor

En modo laboratorio, los módulos ES (`import/export`) funcionan igual (el servidor Node sirve los archivos con el MIME correcto — ya configurado en `servidor-laboratorio.js`).
