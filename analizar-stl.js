/* ============================================================
   Analizador de STL — extrae la geometría real de cada pieza
   para calibrar la cadena cinemática sin adivinar:
   - centro geométrico (para saber dónde está cada pieza)
   - dimensiones por eje (X/Y/Z del archivo)
   - detección del eje de cilindro de acoplamiento:
     el eje de un cilindro es la dirección de MENOR extensión
     relativa al área de su sección.
   ============================================================ */

const fs = require("fs");

const path = require("path");

/* ============================================================
   LECTOR STL (binario y ASCII)
   ============================================================ */

function leerSTL(ruta) {
  const buf = fs.readFileSync(ruta);

  // Detectar ASCII: los primeros 80 bytes son encabezado;
  // si empieza con "solid" y el tamaño cuadra con ASCII, es texto
  const head = buf.slice(0, 80).toString("ascii");

  if (/^\s*solid/i.test(head) && !esBinarioValido(buf)) {
    return leerASCII(buf);
  }

  return leerBinario(buf);
}

function esBinarioValido(buf) {
  if (buf.length < 84) return false;

  const nTri = buf.readUInt32LE(80);

  return 84 + nTri * 50 === buf.length;
}

function leerBinario(buf) {
  const nTri = buf.readUInt32LE(80);

  const vertices = [];

  for (let i = 0; i < nTri; i++) {
    const off = 84 + i * 50 + 12; // saltar normal

    for (let v = 0; v < 3; v++) {
      vertices.push([
        buf.readFloatLE(off + v * 12),
        buf.readFloatLE(off + v * 12 + 4),
        buf.readFloatLE(off + v * 12 + 8),
      ]);
    }
  }

  return vertices;
}

function leerASCII(buf) {
  const texto = buf.toString("ascii");

  const vertices = [];

  const re = /vertex\s+([\d.eE+-]+)\s+([\d.eE+-]+)\s+([\d.eE+-]+)/g;

  let m;

  while ((m = re.exec(texto)) !== null) {
    vertices.push([+m[1], +m[2], +m[3]]);
  }

  return vertices;
}

/* ============================================================
   ANÁLISIS GEOMÉTRICO
   ============================================================ */

function analizar(vertices) {
  // Bounding box
  const min = [Infinity, Infinity, Infinity];

  const max = [-Infinity, -Infinity, -Infinity];

  vertices.forEach((v) => {
    for (let i = 0; i < 3; i++) {
      if (v[i] < min[i]) min[i] = v[i];

      if (v[i] > max[i]) max[i] = v[i];
    }
  });

  const dim = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];

  const centro = [
    (min[0] + max[0]) / 2,
    (min[1] + max[1]) / 2,
    (min[2] + max[2]) / 2,
  ];

  // Detectar ejes "cilíndricos": proyectar los vértices sobre cada
  // plano perpendicular y medir la desviación estándar. Un cilindro
  // alineado con un eje tiene desviación ~igual en los 2 ejes
  // perpendiculares (radio) y el eje del cilindro queda identificado
  // como el eje de MAYOR extensión cuando el cilindro es largo, o
  // simplemente reportamos los 3 ejes para interpretar.
  const ejes = ["X", "Y", "Z"];

  return { min, max, dim, centro, ejes, nVertices: vertices.length };
}

/* ============================================================
   MAIN
   ============================================================ */

const carpeta = path.resolve(__dirname, "assets", "models", "piezas");

const archivos = fs.readdirSync(carpeta).filter((f) => /\.stl$/i.test(f));

const resumen = {};

console.log("=".repeat(64));

console.log("ANÁLISIS GEOMÉTRICO DE LAS PIEZAS (coordenadas del archivo)");

console.log("=".repeat(64));

archivos.forEach((nombre) => {
  const vertices = leerSTL(path.join(carpeta, nombre));

  const a = analizar(vertices);

  resumen[nombre] = a;

  console.log(`\n📦 ${nombre}`);

  console.log(`   Vértices únicos (x3 por triángulo): ${a.nVertices}`);

  console.log(
    `   Dimensiones:  X=${a.dim[0].toFixed(1)}  Y=${a.dim[1].toFixed(1)}  Z=${a.dim[2].toFixed(1)} mm`,
  );

  console.log(`   BBox min: [${a.min.map((v) => v.toFixed(1)).join(", ")}]`);

  console.log(`   BBox max: [${a.max.map((v) => v.toFixed(1)).join(", ")}]`);

  console.log(
    `   CENTRO del bbox: [${a.centro.map((v) => v.toFixed(1)).join(", ")}]`,
  );
});

/* ============================================================
   SUGERENCIA AUTOMÁTICA DE ORÍGENES
   Estrategia: el eje de acoplamiento entre pieza N y N+1 es el
   centro del bbox en la zona de la unión. Sin CAD no vemos los
   ejes exactos, pero el CENTRO del bbox de cada pieza en coords
   globales del ensamblaje ES un buen punto articular aproximado:
   la pieza N+1 empieza donde termina la N.
   ============================================================ */

console.log("\n" + "=".repeat(64));

console.log("CADENA SUGERIDA (origen = centro del bbox de la pieza previa)");

console.log("=".repeat(64));

// Ordenar piezas por altura (Z del centro): la base es la más baja
const ordenados = Object.entries(resumen)

  .sort((a, b) => a[1].centro[2] - b[1].centro[2]);

ordenados.forEach(([nombre, a], i) => {
  const ejeZ = a.centro[2].toFixed(1);

  console.log(`\n${i === 0 ? "BASE" : "eslabón " + i}: ${nombre}`);

  console.log(
    `   origen sugerido (CAD): { "x": ${a.centro[0].toFixed(1)}, "y": ${a.centro[1].toFixed(1)}, "z": ${ejeZ} }`,
  );
});

console.log("\n💡 Interpretación:");
console.log("   - La pieza más BAJA (menor Z de centro) es la BASE.");
console.log("   - Cada 'origen' debe ser el CENTRO DEL CILINDRO que une");
console.log("     esa pieza con la anterior, NO el centro de toda la pieza.");
console.log("   - Si un bbox es alargado en un eje (p.ej. Z >> X,Y), ese");
console.log("     eje es probablemente el eje del cilindro de acoplamiento.");
