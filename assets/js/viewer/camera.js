import * as THREE from "../../three/build/three.module.js";

const viewer = document.getElementById("viewer3D");

export const camera = new THREE.PerspectiveCamera(

45,

viewer.clientWidth / viewer.clientHeight,

0.1,

5000

);

camera.position.set(250,180,250);

camera.lookAt(0,0,0);