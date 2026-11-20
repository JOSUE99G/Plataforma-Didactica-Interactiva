import * as THREE from "../../three/build/three.module.js";

const viewer = document.getElementById("viewer3D");

const aspect = viewer.clientWidth / Math.max(viewer.clientHeight, 1);

export const camera = new THREE.PerspectiveCamera(45, aspect || 1, 0.1, 5000);

camera.position.set(250, 180, 250);

camera.lookAt(0, 0, 0);

// Reajustar aspect cuando el contenedor cambie (rotación de móvil)
window.addEventListener("resize", () => {
  const w = viewer.clientWidth;

  const h = Math.max(viewer.clientHeight, 1);

  if (w > 0 && h > 0) {
    camera.aspect = w / h;

    camera.updateProjectionMatrix();
  }
});
