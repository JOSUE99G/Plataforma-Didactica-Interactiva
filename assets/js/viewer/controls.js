import { OrbitControls } from "../../three/examples/jsm/controls/OrbitControls.js";

import * as THREE from "../../three/build/three.module.js";

import { camera } from "./camera.js";

import { renderer } from "./renderer.js";

export const orbit = new OrbitControls(camera, renderer.domElement);

orbit.enableDamping = true;

orbit.dampingFactor = 0.08;

orbit.target.set(0, 80, 0); // centro del robot, no del suelo

orbit.update();

/* ============================================================
   SOPORTE TÁCTIL (móvil)
   OrbitControls ya soporta 1 dedo = rotar, 2 dedos = zoom/pan.
   Aquí solo se afinan parámetros para que en pantallas chicas
   no sea ni muy rápido ni invada el scroll de la página.
   ============================================================ */

// Rotación táctil algo más lenta (el dedo cubre menos que el mouse)
orbit.rotateSpeed = 0.8;

// Zoom táctil con pinch, sin zoom exagerado por rueda
orbit.zoomSpeed = 0.9;

// Desactivar pan con 2 dedos deslizando (confunde con scroll):
// el pan sigue disponible con click derecho en desktop.
orbit.enablePan = false;

// Asegurar que los gestos no muevan la página
orbit.touches = {
  ONE: THREE.TOUCH.ROTATE,

  TWO: THREE.TOUCH.DOLLY_ROTATE,
};
