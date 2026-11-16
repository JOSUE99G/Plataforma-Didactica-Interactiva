const datos = JSON.parse(
  require("fs").readFileSync("assets/models/rig-brazo.json", "utf8"),
);

console.log("JSON VÁLIDO ✓");

console.log("Efector:", datos.efector);

datos.eslabones.forEach((e) => console.log(" -", e.id, "->", e.stl));
