import * as THREE from "../../three/build/three.module.js";

const viewer = document.getElementById("viewer3D");

export const renderer = new THREE.WebGLRenderer({
  antialias: true,

  // En móviles, mejor compatibilidad táctil
  touch: true,
});

renderer.shadowMap.enabled = true;

renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Pixel ratio limitado: los celulares con pantalla de alta densidad
// (devicePixelRatio 3) matan el FPS si renderizan a resolución nativa.
// Cap a 2 = nitidez suficiente y el doble de rendimiento.
const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

renderer.setPixelRatio(pixelRatio);

renderer.setSize(viewer.clientWidth, viewer.clientHeight);

viewer.appendChild(renderer.domElement);

// El canvas no debe bloquear el scroll de la página con gestos
renderer.domElement.style.touchAction = "none";

renderer.domElement.style.display = "block";

renderer.domElement.style.width = "100%";

renderer.domElement.style.height = "100%";

/* ============================================================
   RESIZE ROBUSTO (incluye rotación de celular y cambios de layout)
   ResizeObserver reacciona a cambios de tamaño del CONTENEDOR,
   no solo de la ventana (importante con sidebars responsivas).
   ============================================================ */

function ajustar() {
  const w = viewer.clientWidth;

  const h = viewer.clientHeight;

  if (w === 0 || h === 0) return; // contenedor oculto (pestaña, etc.)

  renderer.setSize(w, h, true);
}

if (typeof ResizeObserver !== "undefined") {
  new ResizeObserver(ajustar).observe(viewer);
}

window.addEventListener("resize", ajustar);

window.addEventListener("orientationchange", () => {
  // En móvil, orientationchange mide antes de re-layout: esperar
  setTimeout(ajustar, 200);
});

ajustar();
