/* ============================================================
   MODO LOCAL (laboratorio sin internet)
   Reemplaza Firebase por un backend propio ejecutado en la PC
   del laboratorio (Node.js). Misma API que firebase-config.js:
   expone `firebase.auth()` mínimo y `db` con la API que usa la
   plataforma (collection/doc/get/set/add/delete/orderBy).
   ============================================================ */

/* ============================================================
   ALMACÉN LOCAL (localStorage como respaldo en el navegador)
   En modo local-real, las peticiones van al servidor Node.
   ============================================================ */

const API_BASE = window.PLATAFORMA_API_URL || "http://localhost:3000/api";

let usuarioLocal = null;

/* ============================================================
   AUTENTICACIÓN LOCAL
   ============================================================ */

const authLocal = {
  currentUser: null,

  onAuthStateChanged(callback) {
    // Restaurar sesión guardada
    if (!usuarioLocal) {
      try {
        usuarioLocal = JSON.parse(
          localStorage.getItem("sesionLocal") || "null",
        );
      } catch (e) {
        usuarioLocal = null;
      }
    }

    this.currentUser = usuarioLocal;

    // Notificar de inmediato (Firebase lo hace async; aquí igual)
    setTimeout(() => callback(usuarioLocal), 0);

    this._callbacks = this._callbacks || [];

    this._callbacks.push(callback);
  },

  async signInWithEmailAndPassword(correo, password) {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({ correo, password }),
    });

    if (!res.ok) throw new Error("Credenciales inválidas");

    const data = await res.json();

    usuarioLocal = data.usuario;

    localStorage.setItem("sesionLocal", JSON.stringify(usuarioLocal));

    this.currentUser = usuarioLocal;

    this._notificar();

    return { user: usuarioLocal };
  },

  async createUserWithEmailAndPassword(correo, password) {
    const res = await fetch(`${API_BASE}/registro`, {
      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({ correo, password }),
    });

    if (!res.ok) throw new Error("No se pudo crear la cuenta");

    const data = await res.json();

    usuarioLocal = data.usuario;

    localStorage.setItem("sesionLocal", JSON.stringify(usuarioLocal));

    this.currentUser = usuarioLocal;

    this._notificar();

    return { user: usuarioLocal };
  },

  async signOut() {
    usuarioLocal = null;

    localStorage.removeItem("sesionLocal");

    this.currentUser = null;

    this._notificar();
  },

  _notificar() {
    (this._callbacks || []).forEach((cb) => cb(this.currentUser));
  },
};

/* ============================================================
   FIRESTORE LOCAL (subset de la API usada por la plataforma)
   ============================================================ */

class DocRefLocal {
  constructor(ruta, id) {
    this.ruta = ruta;

    this.id = id;
  }

  async get() {
    const res = await fetch(`${API_BASE}/doc/${this.ruta}/${this.id}`);

    const data = await res.json();

    return {
      exists: !!data.existe,

      data: () => data.datos || {},
    };
  }

  async set(datos, opts) {
    await fetch(`${API_BASE}/doc/${this.ruta}/${this.id}`, {
      method: "PUT",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify(datos),
    });
  }

  async delete() {
    await fetch(`${API_BASE}/doc/${this.ruta}/${this.id}`, {
      method: "DELETE",
    });
  }
}

class ColRefLocal {
  constructor(ruta) {
    this.ruta = ruta;
  }

  doc(id) {
    return new DocRefLocal(this.ruta, id);
  }

  async add(datos) {
    const res = await fetch(`${API_BASE}/add/${this.ruta}`, {
      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify(datos),
    });

    const data = await res.json();

    return { id: data.id };
  }

  async get() {
    const res = await fetch(`${API_BASE}/lista/${this.ruta}`);

    const data = await res.json();

    return {
      docs: (data.docs || []).map((d) => ({
        id: d.id,

        data: () => d.datos,
      })),

      forEach: (cb) =>
        (data.docs || []).forEach((d) =>
          cb({
            id: d.id,

            data: () => d.datos,
          }),
        ),
    };
  }

  orderBy(campo) {
    return this;
  } // el servidor ya ordena por defecto
}

const dbLocal = {
  collection(ruta) {
    return new ColRefLocal(ruta);
  },

  doc(ruta) {
    const partes = ruta.split("/");

    return new DocRefLocal(
      partes.slice(0, -1).join("/"),
      partes[partes.length - 1],
    );
  },
};

/* ============================================================
   OBJETO COMPATIBLE: se asigna a window.firebase si no existe
   ============================================================ */

window.firebaseModoLocal = {
  apps: [1], // para el guard de inicialización

  auth: () => authLocal,

  firestore: () => dbLocal,

  firestore_: {
    FieldValue: {
      serverTimestamp: () => new Date().toISOString(),
    },
  },

  GoogleAuthProvider: function () {},
};

/* ============================================================
   DETECCIÓN AUTOMÁTICA DE MODO
   ============================================================ */

/**
 * Devuelve true si el laboratorio opera en modo local
 * (el servidor Node responde en /api/ping).
 */
export async function detectarModoLocal() {
  try {
    const res = await fetch(`${API_BASE}/ping`, { method: "GET" });

    return res.ok;
  } catch (e) {
    return false;
  }
}
