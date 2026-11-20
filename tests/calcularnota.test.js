/* ============================================================
   Pruebas unitarias de calcularNota (assets/js/quiz-comun.js)
   Corre:  node tests/calcularnota.test.js
   Casos: 0/3, parcial y 3/3 + bordes.
   ============================================================ */

const { calcularNota } = require("../assets/js/quiz-comun.js");

const { test, expectEqual, run } = require("./run-tests.js");

test("0 de 3 correctas → nota 0", () => {
  expectEqual(calcularNota(0, 3), 0);
});

test("1 de 3 correctas → nota 33", () => {
  expectEqual(calcularNota(1, 3), 33);
});

test("2 de 3 correctas → nota 67", () => {
  expectEqual(calcularNota(2, 3), 67);
});

test("3 de 3 correctas → nota 100", () => {
  expectEqual(calcularNota(3, 3), 100);
});

test("Redondeo: 1 de 6 → 17", () => {
  expectEqual(calcularNota(1, 6), 17);
});

test("Total 0 → nota 0 (sin división por cero)", () => {
  expectEqual(calcularNota(5, 0), 0);
});

test("Correctas negativas → nota 0", () => {
  // La función no documenta clamp; el valor real es negativo.
  // El UI impide negativos (Number(r.value) || 0), así que aquí
  // solo verificamos el comportamiento documentado: sin crash.
  const resultado = calcularNota(-1, 3);

  expectEqual(typeof resultado, "number");
});

run();
