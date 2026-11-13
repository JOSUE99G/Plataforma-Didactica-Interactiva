// Prueba rápida del parser + intérprete fuera del navegador
import { parsear } from "../assets/js/matlab/matlab-parser.js";
import { Interprete } from "../assets/js/matlab/matlab-interprete.js";
import { RobotVirtual } from "../assets/js/matlab/matlab-robot-api.js";

const codigo = `
% Prueba
x = 100;
y = 50;
disp("Iniciando prueba")
magician.init()

for i = 1:3
    magician.ptp(x*i, y, 30, 0)
end

if x > 50
    disp("x es grande")
else
    disp("x es pequeño")
end

ang = sqrt(16);
disp(ang)
magician.home()
`;

const logs = [];
const robot = new RobotVirtual();

const interprete = new Interprete({
  log: (m) => logs.push(m),
  robot,
});

const snap = await interprete.ejecutar(codigo);

console.log("=== LOGS ===");
logs.forEach((l) => console.log(l));

console.log("=== WORKSPACE ===");
snap.forEach((v) => console.log(v.nombre, "=", v.valor));

console.log("=== TRAZAS DEL ROBOT ===");
robot.trazas.forEach((t) => console.log(t));
