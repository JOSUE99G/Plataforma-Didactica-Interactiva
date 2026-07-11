import * as THREE from "../../three/build/three.module.js";

const viewer = document.getElementById("viewer3D");

export const renderer = new THREE.WebGLRenderer({

antialias:true

});

renderer.shadowMap.enabled = true;

renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.setPixelRatio(window.devicePixelRatio);

renderer.setSize(

viewer.clientWidth,

viewer.clientHeight

);

viewer.appendChild(renderer.domElement);