/**
 * Runner de pruebas mínimo — Node puro, cero dependencias.
 * Corre con:  node tests/run-tests.js
 * Diseñado para poder sustituirlo por Vitest si el proyecto
 * migra a Node toolchain sin cambiar los casos de prueba.
 */

const casos = [];

/**
 * Define un caso de prueba: test("nombre", () => { ... })
 */
function test(nombre, fn) {
  casos.push({ nombre, fn });
}

/**
 * Aserción de igualdad profunda simple.
 */
function expectEqual(real, esperado, mensaje = "") {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);

  if (!ok) {
    throw new Error(
      `Esperado ${JSON.stringify(esperado)} pero obtuve ${JSON.stringify(real)}. ${mensaje}`,
    );
  }
}

/**
 * Ejecuta todos los casos y reporta.
 */
function run() {
  let pasados = 0;

  let fallidos = 0;

  console.log("=".repeat(56));
  console.log("  PRUEBAS UNITARIAS — Plataforma Didáctica");
  console.log("=".repeat(56));

  casos.forEach(({ nombre, fn }) => {
    try {
      fn();

      pasados++;

      console.log(`  ✅ ${nombre}`);
    } catch (error) {
      fallidos++;

      console.log(`  ❌ ${nombre}`);
      console.log(`     ${error.message}`);
    }
  });

  console.log("-".repeat(56));
  console.log(
    `  ${pasados} pasados · ${fallidos} fallidos · ${casos.length} total`,
  );
  console.log("=".repeat(56));

  process.exitCode = fallidos > 0 ? 1 : 0;
}

module.exports = { test, expectEqual, run };
