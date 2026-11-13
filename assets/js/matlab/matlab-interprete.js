/* ============================================================
   Intérprete del subconjunto didáctico de MATLAB
   - Ejecuta el árbol del parser sobre un entorno de variables
   - Soporta ejecución normal y PASO A PASO (para modo didáctico)
   - Registra el workspace para la tabla de variables
   ============================================================ */

import { parsear } from "./matlab-parser.js";

/* ============================================================
   ENTORNO
   ============================================================ */

/**
 * Entorno de variables (workspace del estudiante)
 */
export class Entorno {
  constructor() {
    this.variables = new Map();
  }

  obtener(nombre) {
    if (!this.variables.has(nombre)) {
      throw new Error(`Variable o función desconocida: ${nombre}`);
    }

    return this.variables.get(nombre);
  }

  definir(nombre, valor) {
    this.variables.set(nombre, valor);
  }

  existe(nombre) {
    return this.variables.has(nombre);
  }

  /**
   * Devuelve el workspace como array [{nombre, valor}]
   */
  snapshot() {
    return [...this.variables.entries()].map(([nombre, valor]) => ({
      nombre,

      valor: typeof valor === "number" ? +valor.toFixed(4) : valor,
    }));
  }
}

/* ============================================================
   INTÉRPRETE
   ============================================================ */

export class Interprete {
  /**
   * @param {Object} opciones
   *   - log: función para escribir en la consola didáctica
   *   - robot: objeto con métodos init/home/ptp/gripper
   *   - esperarPaso: función async opcional; si existe, el
   *     intérprete se detiene tras cada instrucción (paso a paso)
   */
  constructor({ log = () => {}, robot = null, esperarPaso = null } = {}) {
    this.log = log;

    this.robot = robot;

    this.esperarPaso = esperarPaso;

    this.entorno = new Entorno();

    this.detenido = false;

    this.paso = 0;
  }

  detener() {
    this.detenido = true;
  }

  async ejecutar(codigo) {
    this.detenido = false;

    this.paso = 0;

    const nodos = parsear(codigo);

    for (const nodo of nodos) {
      await this.ejecutarNodo(nodo);

      if (this.detenido) break;
    }

    return this.entorno.snapshot();
  }

  /* ---------------------------------------------------------
       Ejecución de nodos
       --------------------------------------------------------- */

  async ejecutarNodo(nodo) {
    if (this.detenido) return;

    this.paso++;

    // Modo paso a paso: pausa tras cada instrucción ejecutada
    if (this.esperarPaso) {
      await this.esperarPaso(this.paso, nodo);

      if (this.detenido) return;
    }

    switch (nodo.tipo) {
      case "asignacion":
        this.entorno.definir(nodo.nombre, await this.evaluar(nodo.valor));

        break;

      case "expresion":
        await this.evaluar(nodo.expr);

        break;

      case "for":
        await this.ejecutarFor(nodo);

        break;

      case "while":
        await this.ejecutarWhile(nodo);

        break;

      case "if":
        await this.ejecutarIf(nodo);

        break;

      case "vacia":

      default:
        break;
    }
  }

  async ejecutarFor(nodo) {
    const desde = await this.evaluar(nodo.desde);

    const hasta = await this.evaluar(nodo.hasta);

    for (let i = desde; i <= hasta; i++) {
      if (this.detenido) return;

      this.entorno.definir(nodo.variable, i);

      for (const ins of nodo.cuerpo) {
        await this.ejecutarNodo(ins);

        if (this.detenido) return;
      }
    }
  }

  async ejecutarWhile(nodo) {
    let guardia = 0;

    while (await this.evaluar(nodo.cond)) {
      if (this.detenido) return;

      if (++guardia > 10000) {
        this.log("⚠ Bucle while detenido: más de 10000 iteraciones.");

        break;
      }

      for (const ins of nodo.cuerpo) {
        await this.ejecutarNodo(ins);

        if (this.detenido) return;
      }
    }
  }

  async ejecutarIf(nodo) {
    const cond = await this.evaluar(nodo.cond);

    const rama = cond ? nodo.entonces.entonces : nodo.entonces.sino;

    for (const ins of rama) {
      await this.ejecutarNodo(ins);

      if (this.detenido) return;
    }
  }

  /* ---------------------------------------------------------
       Evaluación de expresiones
       --------------------------------------------------------- */

  async evaluar(nodo) {
    switch (nodo.tipo) {
      case "numero":
        return nodo.valor;

      case "string":
        return nodo.valor;

      case "variable":
        return this.entorno.obtener(nodo.nombre);

      case "unario":
        return -(await this.evaluar(nodo.operando));

      case "binop":
        return this.evaluarBinop(nodo);

      case "llamada":
        return await this.evaluarLlamada(nodo);

      default:
        throw new Error(`Nodo desconocido: ${nodo.tipo}`);
    }
  }

  evaluarBinop(nodo) {
    // binop es síncrono: evaluar() devuelve promesas solo en llamadas
    const resolver = (v) => (v && typeof v.then === "function" ? undefined : v);

    const izq = nodo.izq;

    const der = nodo.der;

    // Como evaluar puede devolver promesa, manejar de forma async interna
    return Promise.all([this.evaluar(izq), this.evaluar(der)]).then(
      ([a, b]) => {
        switch (nodo.op) {
          case "+":
            return typeof a === "string" || typeof b === "string"
              ? String(a) + String(b)
              : a + b;

          case "-":
            return a - b;

          case "*":
            return a * b;

          case "/":
            return b === 0 ? (this.log("⚠ División por cero"), NaN) : a / b;

          case "^":
            return Math.pow(a, b);

          case "<":
            return a < b;

          case ">":
            return a > b;

          case "<=":
            return a <= b;

          case ">=":
            return a >= b;

          case "==":
            return a === b || a == b;

          case "!=":
            return a != b;

          default:
            throw new Error(`Operador desconocido: ${nodo.op}`);
        }
      },
    );
  }

  async evaluarLlamada(nodo) {
    const nombre = nodo.nombre;

    const args = [];

    for (const a of nodo.args) {
      args.push(await this.evaluar(a));
    }

    /* --- Comandos del robot --- */

    if (nombre.startsWith("magician.")) {
      const metodo = nombre.split(".")[1];

      return await this.llamarRobot(metodo, args, nodo.linea);
    }

    /* --- Funciones nativas --- */

    switch (nombre) {
      case "disp":
        this.log(String(args[0]));

        return undefined;

      case "fprintf":
        this.log(args.map(String).join(" "));

        return undefined;

      case "pause":
        await new Promise((r) =>
          setTimeout(r, Math.min(args[0] || 0, 5) * 1000),
        );

        return undefined;

      case "sqrt":
        return Math.sqrt(args[0]);

      case "sin":
        return Math.sin(args[0]);

      case "cos":
        return Math.cos(args[0]);

      case "tan":
        return Math.tan(args[0]);

      case "abs":
        return Math.abs(args[0]);

      case "round":
        return Math.round(args[0]);

      case "floor":
        return Math.floor(args[0]);

      case "ceil":
        return Math.ceil(args[0]);

      case "mod":
        return args[0] % args[1];

      case "min":
        return Math.min(...args);

      case "max":
        return Math.max(...args);

      case "length":
        return args[0] != null ? String(args[0]).length : 0;

      case "zeros":
        return Array(args[0] || 1).fill(0);

      case "ones":
        return Array(args[0] || 1).fill(1);

      case "true":
        return true;

      case "false":
        return false;

      default:
        throw new Error(
          `Función desconocida: ${nombre} (línea ${nodo.linea || "?"})`,
        );
    }
  }

  async llamarRobot(metodo, args, linea) {
    if (!this.robot) {
      this.log("⚠ El robot no está disponible.");

      return undefined;
    }

    switch (metodo) {
      case "init":
        this.log("🤖 Robot inicializado (Dobot Magician Lite virtual).");

        if (this.robot.init) await this.robot.init();

        return undefined;

      case "home":
        this.log("🏠 Robot en posición HOME.");

        if (this.robot.home) await this.robot.home();

        return undefined;

      case "ptp":
        this.log(
          `➡ PTP → X:${args[0]} Y:${args[1]} Z:${args[2]} R:${args[3] ?? 0}`,
        );

        if (this.robot.ptp) await this.robot.ptp(...args);

        return undefined;

      case "gripper":
        this.log(`🦾 Garra al ${args[0]}%`);

        if (this.robot.gripper) await this.robot.gripper(args[0]);

        return undefined;

      default:
        this.log(
          `⚠ Comando desconocido: magician.${metodo} (línea ${linea || "?"})`,
        );

        return undefined;
    }
  }
}
