/* ============================================================
   Parser del subconjunto didáctico de MATLAB
   Soporta:
     - Asignaciones:  x = 150;  nombre = "texto"
     - Expresiones:   + - * / ( ) ^, sin cos sqrt etc.
     - Comandos:      magician.ptp(x,y,z,r), magician.gripper(60),
                      magician.home(), magician.init()
     - Control:       for i = 1:n ... end | if cond ... else ... end
                      while cond ... end
     - Nativas:       disp(...), fprintf(...), pause(n)
     - Comentarios:   % hasta fin de línea
   Produce un ÁRBOL (array de nodos) que el intérprete evalúa.
   ============================================================ */

/* ============================================================
   TOKENIZADOR
   ============================================================ */

const PALABRAS_CLAVE = new Set([
  "for",
  "while",
  "if",
  "else",
  "elseif",
  "end",
  "disp",
  "fprintf",
  "pause",
  "true",
  "false",
  "sqrt",
  "sin",
  "cos",
  "tan",
  "abs",
  "round",
  "floor",
  "ceil",
  "mod",
  "min",
  "max",
  "length",
  "zeros",
  "ones",
]);

/**
 * Convierte el código fuente en una lista de tokens.
 * @param {string} codigo
 * @returns {Array<Object>} tokens
 */
export function tokenizar(codigo) {
  const tokens = [];

  const lineas = codigo.split("\n");

  lineas.forEach((linea, idx) => {
    // Eliminar comentario (% ... )
    const sinComentario = linea.replace(/%.*$/, "");

    // Tokenizar con regex: números, identificadores con punto,
    // strings, operadores y paréntesis
    const regex =
      /(\d+\.?\d*)|([A-Za-z_][A-Za-z0-9_.]*)|("[^"]*"|'[^']*')|(\*\*|\^|[+\-*/=<>!&|(),;:])/g;

    let m;

    while ((m = regex.exec(sinComentario)) !== null) {
      if (m[1]) {
        tokens.push({
          tipo: "numero",
          valor: parseFloat(m[1]),
          linea: idx + 1,
        });
      } else if (m[2]) {
        tokens.push({ tipo: "ident", valor: m[2], linea: idx + 1 });
      } else if (m[3]) {
        tokens.push({
          tipo: "string",
          valor: m[3].slice(1, -1),
          linea: idx + 1,
        });
      } else if (m[4]) {
        tokens.push({ tipo: "op", valor: m[4], linea: idx + 1 });
      }
    }

    tokens.push({ tipo: "salto", valor: "\n", linea: idx + 1 });
  });

  return tokens;
}

/* ============================================================
   PARSER (descendente recursivo simple)
   ============================================================ */

/**
 * Parsea la lista de tokens en un árbol de instrucciones.
 * @param {string} codigo
 * @returns {Array<Object>} nodos
 */
export function parsear(codigo) {
  const tokens = tokenizar(codigo);

  let pos = 0;

  function peek() {
    return tokens[pos] || { tipo: "eof" };
  }

  function siguiente() {
    return tokens[pos++];
  }

  function saltarSaltos() {
    while (peek().tipo === "salto") pos++;
  }

  function esperarOp(valor) {
    const t = peek();

    if (t.tipo === "op" && t.valor === valor) {
      pos++;

      return true;
    }

    return false;
  }

  function esperarIdent(valor) {
    const t = peek();

    if (t.tipo === "ident" && t.valor === valor) {
      pos++;

      return true;
    }

    return false;
  }

  /* --- Expresiones (precedencia simple: ^ > */ /* * / > + - > comparación) --- */

  function parseExpresion() {
    return parseComparacion();
  }

  function parseComparacion() {
    let izq = parseSuma();

    while (
      ["<", ">", "==", "!=", "<=", ">="].some((v) => {
        // operadores de dos chars
        if (v.length === 2) {
          return (
            peek().tipo === "op" &&
            peek().valor === v[0] &&
            tokens[pos + 1] &&
            tokens[pos + 1].tipo === "op" &&
            tokens[pos + 1].valor === v[1]
          );
        }

        return peek().tipo === "op" && peek().valor === v;
      })
    ) {
      let op;

      const t = peek();

      if (
        (t.valor === "<" || t.valor === ">") &&
        tokens[pos + 1] &&
        tokens[pos + 1].valor === "="
      ) {
        op = t.valor + "=";

        pos += 2;
      } else if (t.valor === "!" || t.valor === "=") {
        if (tokens[pos + 1] && tokens[pos + 1].valor === "=") {
          op = t.valor + "=";

          pos += 2;
        } else {
          op = t.valor;
          pos++;
        }
      } else {
        op = t.valor;

        pos++;
      }

      const der = parseSuma();

      izq = { tipo: "binop", op, izq, der };
    }

    return izq;
  }

  function parseSuma() {
    let izq = parseMultiplicacion();

    while (
      peek().tipo === "op" &&
      (peek().valor === "+" || peek().valor === "-")
    ) {
      const op = siguiente().valor;

      const der = parseMultiplicacion();

      izq = { tipo: "binop", op, izq, der };
    }

    return izq;
  }

  function parseMultiplicacion() {
    let izq = parsePotencia();

    while (
      peek().tipo === "op" &&
      (peek().valor === "*" || peek().valor === "/")
    ) {
      const op = siguiente().valor;

      const der = parsePotencia();

      izq = { tipo: "binop", op, izq, der };
    }

    return izq;
  }

  function parsePotencia() {
    const base = parseUnario();

    if (
      peek().tipo === "op" &&
      (peek().valor === "^" || peek().valor === "**")
    ) {
      pos++;

      const exp = parsePotencia(); // asociativo por la derecha

      return { tipo: "binop", op: "^", izq: base, der: exp };
    }

    return base;
  }

  function parseUnario() {
    if (peek().tipo === "op" && peek().valor === "-") {
      pos++;

      return { tipo: "unario", op: "-", operando: parseUnario() };
    }

    return parseAtom();
  }

  function parseAtom() {
    const t = peek();

    if (t.tipo === "numero") {
      pos++;

      return { tipo: "numero", valor: t.valor };
    }

    if (t.tipo === "string") {
      pos++;

      return { tipo: "string", valor: t.valor };
    }

    if (t.tipo === "ident") {
      pos++;

      // Llamada: ident ( args )
      if (peek().tipo === "op" && peek().valor === "(") {
        pos++;

        const args = [];

        if (!(peek().tipo === "op" && peek().valor === ")")) {
          args.push(parseExpresion());

          while (esperarOp(",")) {
            args.push(parseExpresion());
          }
        }

        esperarOp(")");

        return { tipo: "llamada", nombre: t.valor, args, linea: t.linea };
      }

      return { tipo: "variable", nombre: t.valor };
    }

    if (t.tipo === "op" && t.valor === "(") {
      pos++;

      const e = parseExpresion();

      esperarOp(")");

      return e;
    }

    pos++; // consumir token desconocido para no ciclar

    return { tipo: "numero", valor: 0 };
  }

  /* --- Instrucciones --- */

  function parseInstruccion() {
    saltarSaltos();

    const t = peek();

    if (t.tipo !== "ident") {
      if (t.tipo === "eof") return null;

      pos++;

      return { tipo: "vacia" };
    }

    // for i = a:b ... end
    if (t.valor === "for") {
      pos++;

      const varName = siguiente().valor;

      esperarOp("=");

      const desde = parseExpresion();

      esperarOp(":");

      const hasta = parseExpresion();

      const cuerpo = parseBloque("end");

      return { tipo: "for", variable: varName, desde, hasta, cuerpo };
    }

    // while cond ... end
    if (t.valor === "while") {
      pos++;

      const cond = parseExpresion();

      const cuerpo = parseBloque("end");

      return { tipo: "while", cond, cuerpo };
    }

    // if cond ... [else ...] end
    if (t.valor === "if") {
      pos++;

      const cond = parseExpresion();

      const entonces = parseBloqueConElse();

      return { tipo: "if", cond, entonces };
    }

    // Asignación: ident = expresion
    if (
      peek().tipo === "ident" &&
      tokens[pos + 1] &&
      tokens[pos + 1].tipo === "op" &&
      tokens[pos + 1].valor === "="
    ) {
      const nombre = siguiente().valor;

      pos++; // '='

      const valor = parseExpresion();

      // Comando del robot: objeto.metodo(args) como expresión
      return { tipo: "asignacion", nombre, valor };
    }

    // Expresión suelta (llamada, disp, etc.)
    const expr = parseExpresion();

    return { tipo: "expresion", expr };
  }

  function parseBloque(palabraFinal) {
    const cuerpo = [];

    saltarSaltos();

    while (
      !(peek().tipo === "ident" && peek().valor === palabraFinal) &&
      peek().tipo !== "eof"
    ) {
      const ins = parseInstruccion();

      if (ins) cuerpo.push(ins);

      saltarSaltos();
    }

    esperarIdent(palabraFinal);

    return cuerpo;
  }

  function parseBloqueConElse() {
    const entonces = [];

    let sino = [];

    saltarSaltos();

    while (peek().tipo !== "eof") {
      if (peek().tipo === "ident" && peek().valor === "end") {
        pos++;

        break;
      }

      if (peek().tipo === "ident" && peek().valor === "else") {
        pos++;

        sino = parseBloque("end");

        break;
      }

      const ins = parseInstruccion();

      if (ins) entonces.push(ins);

      saltarSaltos();
    }

    return { entonces, sino };
  }

  /* --- Programa completo --- */

  const nodos = [];

  saltarSaltos();

  while (peek().tipo !== "eof") {
    const ins = parseInstruccion();

    if (ins) nodos.push(ins);

    saltarSaltos();
  }

  return nodos;
}
