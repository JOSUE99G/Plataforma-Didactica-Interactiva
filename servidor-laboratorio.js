/* ============================================================
   Servidor local del laboratorio — Plataforma Didáctica
   Ejecutar:  node servidor-laboratorio.js
   Sirve: la plataforma web en http://localhost:8080
          API REST propia en http://localhost:3000/api
   Sin dependencias externas: solo Node.js puro.
   ============================================================ */

const http = require("http");

const fs = require("fs");

const path = require("path");

const crypto = require("crypto");

/* ============================================================
   CONFIGURACIÓN
   ============================================================ */

const PUERTO_WEB = 8080;

const PUERTO_API = 3000;

const CARPETA_WEB = path.join(__dirname);

const ARCHIVO_DATOS = path.join(__dirname, "datos-laboratorio.json");

/* ============================================================
   ALMACÉN DE DATOS (JSON en disco, respaldado en cada escritura)
   ============================================================ */

let datos = {
  usuarios: {},
  evaluaciones: {},
  archivos: {},
  logros: {},
  clase: {},
};

function cargarDatos() {
  try {
    if (fs.existsSync(ARCHIVO_DATOS)) {
      datos = JSON.parse(fs.readFileSync(ARCHIVO_DATOS, "utf8"));
    }
  } catch (e) {
    console.warn("⚠ No se pudo leer datos-laboratorio.json:", e.message);
  }
}

function guardarDatos() {
  try {
    fs.writeFileSync(ARCHIVO_DATOS, JSON.stringify(datos, null, 2));
  } catch (e) {
    console.error("⚠ No se pudo guardar datos:", e.message);
  }
}

cargarDatos();

/* ============================================================
   UTILIDADES
   ============================================================ */

function hashPassword(contrasena) {
  return crypto.createHash("sha256").update(contrasena).digest("hex");
}

function hashConSesion(correo) {
  return crypto
    .createHash("sha256")
    .update(correo + "sesion")
    .digest("hex");
}

function json(res, codigo, objeto) {
  res.writeHead(codigo, {
    "Content-Type": "application/json",

    "Access-Control-Allow-Origin": "*",

    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",

    "Access-Control-Allow-Headers": "Content-Type",
  });

  res.end(JSON.stringify(objeto));
}

function leerCuerpo(req) {
  return new Promise((resolve) => {
    let cuerpo = "";

    req.on("data", (chunk) => (cuerpo += chunk));

    req.on("end", () => {
      try {
        resolve(JSON.parse(cuerpo || "{}"));
      } catch (e) {
        resolve({});
      }
    });
  });
}

/* Estructura de rutas Firestore-like:
   usuarios/{uid}/evaluaciones/{docId}
   → datos.evaluaciones[uid][docId] = {...}            */

function obtenerColeccion(ruta) {
  const partes = ruta.split("/"); // ["usuarios", uid, "evaluaciones"]

  if (partes[0] === "usuarios" && partes.length === 3) {
    const uid = partes[1];

    const sub = partes[2];

    datos[sub] = datos[sub] || {};

    datos[sub][uid] = datos[sub][uid] || {};

    return datos[sub][uid];
  }

  if (partes[0] === "clase") {
    datos.clase = datos.clase || {};

    return datos.clase;
  }

  return null;
}

/* ============================================================
   API REST
   ============================================================ */

const servidorAPI = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PUERTO_API}`);

  const partes = url.pathname.split("/").filter(Boolean); // ["api", ...]

  // CORS preflight
  if (req.method === "OPTIONS") return json(res, 200, {});

  /* --- Ping: detección de modo local --- */

  if (url.pathname === "/api/ping")
    return json(res, 200, { ok: true, modo: "local" });

  /* --- PUENTE FUSION 360 ---
     POST /api/comandos-robot  { base, hombro, codo, ... }
     GET  /api/comandos-robot  → último comando publicado
     El add-in ReceptorFusion lee aquí y mueve los joints del
     ensamblaje. Si Fusion prefiere archivo, puede también leer
     comandos-robot.json del disco (mismo contenido). */

  if (url.pathname === "/api/comandos-robot") {
    if (req.method === "POST") {
      const cuerpo = await leerCuerpo(req);

      datos.comandosRobot = { ...cuerpo, recibidoEn: Date.now() };

      guardarDatos();

      // Escribir también el archivo puente para el add-in de Fusion
      const rutaPuente = path.join(__dirname, "comandos-robot.json");

      try {
        fs.writeFileSync(rutaPuente, JSON.stringify(datos.comandosRobot, null, 2));
      } catch (e) {
        console.error("No se pudo escribir comandos-robot.json:", e.message);
      }

      return json(res, 200, { ok: true });
    }

    if (req.method === "GET") {
      return json(res, 200, datos.comandosRobot || {});
    }
  }

  /* --- Login / Registro --- */

  if (url.pathname === "/api/login" && req.method === "POST") {
    const { correo, password } = await leerCuerpo(req);

    const uid = hashConSesion(correo);

    const cuenta = datos.usuarios[uid];

    if (!cuenta || cuenta.password !== hashPassword(password)) {
      return json(res, 401, { error: "Credenciales inválidas" });
    }

    return json(res, 200, {
      usuario: { uid, correo, displayName: cuenta.nombre },
    });
  }

  if (url.pathname === "/api/registro" && req.method === "POST") {
    const { correo, password } = await leerCuerpo(req);

    const uid = hashConSesion(correo);

    if (datos.usuarios[uid]) {
      return json(res, 409, { error: "La cuenta ya existe" });
    }

    datos.usuarios[uid] = {
      correo,

      password: hashPassword(password),

      nombre: correo.split("@")[0],
    };

    guardarDatos();

    return json(res, 200, {
      usuario: { uid, correo, displayName: datos.usuarios[uid].nombre },
    });
  }

  /* --- Documentos: /api/doc/{ruta}/{id} --- */

  if (partes[1] === "doc" && partes.length >= 4) {
    const ruta = partes.slice(2, -1).join("/");

    const id = partes[partes.length - 1];

    const coleccion = obtenerColeccion(ruta);

    if (!coleccion) return json(res, 404, { error: "Ruta no soportada" });

    if (req.method === "GET") {
      return json(res, 200, {
        existe: !!coleccion[id],
        datos: coleccion[id] || null,
      });
    }

    if (req.method === "PUT") {
      const cuerpo = await leerCuerpo(req);

      coleccion[id] = { ...(coleccion[id] || {}), ...cuerpo };

      guardarDatos();

      return json(res, 200, { ok: true });
    }

    if (req.method === "DELETE") {
      delete coleccion[id];

      guardarDatos();

      return json(res, 200, { ok: true });
    }
  }

  /* --- Añadir: /api/add/{ruta} --- */

  if (partes[1] === "add" && partes.length === 3 && req.method === "POST") {
    const ruta = partes[2];

    const coleccion = obtenerColeccion(ruta);

    if (!coleccion) return json(res, 404, { error: "Ruta no soportada" });

    const cuerpo = await leerCuerpo(req);

    const id = crypto.randomBytes(8).toString("hex");

    coleccion[id] = cuerpo;

    guardarDatos();

    return json(res, 200, { id });
  }

  /* --- Listar: /api/lista/{ruta} --- */

  if (partes[1] === "lista" && partes.length === 3 && req.method === "GET") {
    const ruta = partes[2];

    const coleccion = obtenerColeccion(ruta);

    if (!coleccion) return json(res, 404, { error: "Ruta no soportada" });

    const docs = Object.entries(coleccion).map(([id, d]) => ({ id, datos: d }));

    return json(res, 200, { docs });
  }

  return json(res, 404, { error: "Endpoint no encontrado" });
});

servidorAPI.listen(PUERTO_API, () => {
  console.log(`\n🧠 API local:     http://localhost:${PUERTO_API}/api`);
});

/* ============================================================
   SERVIDOR WEB (archivos estáticos de la plataforma)
   ============================================================ */

const MIME = {
  ".html": "text/html; charset=utf-8",

  ".css": "text/css",

  ".js": "text/javascript",

  ".json": "application/json",

  ".png": "image/png",

  ".jpg": "image/jpeg",

  ".jpeg": "image/jpeg",

  ".svg": "image/svg+xml",

  ".stl": "application/octet-stream",

  ".pdf": "application/pdf",

  ".ico": "image/x-icon",
};

const servidorWeb = http.createServer((req, res) => {
  let ruta = decodeURIComponent(new URL(req.url, "http://x").pathname);

  if (ruta === "/") ruta = "/index.html";

  const archivo = path.join(CARPETA_WEB, ruta);

  // Seguridad: no salir de la carpeta del proyecto
  if (!archivo.startsWith(CARPETA_WEB)) {
    res.writeHead(403);
    return res.end("Prohibido");
  }

  fs.readFile(archivo, (err, contenido) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });

      return res.end("404 — Página no encontrada");
    }

    res.writeHead(200, {
      "Content-Type": MIME[path.extname(archivo)] || "application/octet-stream",
    });

    res.end(contenido);
  });
});

servidorWeb.listen(PUERTO_WEB, () => {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`  PLATAFORMA DIDÁCTICA — MODO LABORATORIO`);
  console.log(`${"=".repeat(50)}`);
  console.log(`  🌐 Abre en el navegador:  http://localhost:${PUERTO_WEB}`);
  console.log(`  📁 Datos guardados en:    datos-laboratorio.json`);
  console.log(`  🛑 Para detener:          Ctrl + C`);
  console.log(`${"=".repeat(50)}\n`);
});
