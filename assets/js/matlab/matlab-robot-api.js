/* ============================================================
   API del robot virtual para el intérprete MATLAB
   Traduce comandos magician.* a ángulos del rig 3D del visor.
   Modo sin 3D: solo registra el estado (consola).
   ============================================================ */

/* Coordenadas HOME aproximadas del Magician Lite (mm) */
const HOME = { base: 0, hombro: 20, codo: -45, muneca: 0, garra: 50 };

export class RobotVirtual {
  constructor() {
    this.pos = { ...HOME };

    this.conectado = false;

    this.rig = null; // rig 3D opcional (del visor)

    this.escena = null; // THREE.Scene opcional

    this.trazas = []; // historial de poses del efector

    this.onPose = null; // callback para actualizar UI
  }

  /**
   * Conecta el rig 3D (mismo rig del visor de articulaciones)
   * @param {Object} rigAPI - { aplicarAngulos, obtenerPoseEfector }
   */
  conectarRig(rigAPI) {
    this.rigAPI = rigAPI;

    this.conectado = true;
  }

  /**
   * Convierte coordenadas cartesianas (X,Y,Z) a ángulos aproximados
   * con un modelo de 2 eslabones simplificado del Magician Lite.
   * Didáctico: el estudiante ve cómo X,Y,Z se traducen a articulaciones.
   */
  cartesianoAAngulos(x, y, z) {
    const L1 = 85; // eslabón hombro-codo (mm)
    const L2 = 70; // eslabón codo-muñeca (mm)

    const r = Math.sqrt(x * x + y * y); // alcance horizontal

    const d = Math.min(Math.sqrt(r * r + z * z), L1 + L2 - 1);

    // Ley de cosenos para el ángulo del codo
    const cosCodo = (L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2);

    const angCodo =
      (-Math.acos(Math.max(-1, Math.min(1, cosCodo))) * 180) / Math.PI;

    // Ángulo del hombro respecto al plano
    const cosHombroAux = (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d);

    const phi = Math.acos(Math.max(-1, Math.min(1, cosHombroAux)));

    const theta = (Math.atan2(z, r) * 180) / Math.PI;

    const angHombro = 20 + (phi + (theta * Math.PI) / 180) * 0; // simplificación
    // Usamos directamente elevación + ajuste
    const hombro = Math.max(
      -15,
      Math.min(85, (theta + (phi * 180) / Math.PI) / 1.4),
    );

    const base = (Math.atan2(y, x) * 180) / Math.PI;

    return {
      base: +base.toFixed(1),
      hombro: +hombro.toFixed(1),
      codo: Math.max(-95, angCodo),
      muneca: 0,
    };
  }

  /* ---------------------------------------------------------
       Comandos que expone al intérprete
       --------------------------------------------------------- */

  async init() {
    this.conectado = true;

    this.pos = { ...HOME };

    this.aplicar();
  }

  async home() {
    this.pos = { ...HOME };

    this.aplicar();

    await this.animarEspera();
  }

  /**
   * Movimiento punto a punto: recibe (modo?, x, y, z, r?)
   * Acepta ambas firmas: ptp(x,y,z,r) o ptp(0,x,y,z,r)
   */
  async ptp(a, b, c, d, e) {
    let x, y, z, r;

    if (e !== undefined) {
      [x, y, z, r] = [b, c, d, e];
    } else {
      [x, y, z, r] = [a, b, c, d];
    }

    const ang = this.cartesianoAAngulos(x || 0, y || 0, z || 0);

    this.pos = { ...ang, garra: this.pos.garra };

    this.registrarTraza(x || 0, y || 0, z || 0);

    this.aplicar();

    await this.animarEspera();
  }

  async gripper(pct) {
    this.pos.garra = Math.max(0, Math.min(100, pct || 0));

    this.aplicar();
  }

  /* ---------------------------------------------------------
       Internos
       --------------------------------------------------------- */

    aplicar() {
    if (this.rigAPI) {
      this.rigAPI.aplicarAngulos(this.pos);
    }

    // PUBLICAR AL PUENTE FUSION 360:
    // envía los ángulos al servidor local, que los expone para el
    // add-in ReceptorFusion (o los escribe en comandos-robot.json).
    this.publicarAlPuente();

    // Avisar a la UI (y al iframe del visor, vía matlab-app) de la nueva pose
    if (this.onPose) {
      this.onPose(this.pos);
    }
  }

  publicarAlPuente() {
    // Mapear articulaciones del brazo a j1..j5 (orden de la cadena)
    const comandos = {
      j1: this.pos.base || 0,
      j2: this.pos.hombro || 0,
      j3: this.pos.codo || 0,
      j4: this.pos.muneca || 0,
      j5: this.pos.garra || 0,
    };

    fetch("http://localhost:3000/api/comandos-robot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(comandos),
    }).catch(() => {
      // Sin servidor local: modo nube, no pasa nada
    });
  }

  registrarTraza(x, y, z) {
    this.trazas.push({ x, y, z });

    if (this.trazas.length > 200) this.trazas.shift();
  }

  animarEspera() {
    // Pequeña pausa para que el movimiento se perciba en el 3D
    return new Promise((r) => setTimeout(r, 400));
  }
}
