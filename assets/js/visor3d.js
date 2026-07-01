// ===============================
// IMPORTAR THREE.JS
// ===============================

import * as THREE from "https://unpkg.com/three@0.165.0/build/three.module.js";

import { OrbitControls } from "https://unpkg.com/three@0.165.0/examples/jsm/controls/OrbitControls.js";

// ===============================
// ESCENA
// ===============================

const scene = new THREE.Scene();

scene.background = new THREE.Color(0xf5f5f5);

// ===============================
// CÁMARA
// ===============================

const camera = new THREE.PerspectiveCamera(

45,

window.innerWidth / 650,

0.1,

1000

);

camera.position.set(250,180,250);

// ===============================
// RENDER
// ===============================

const renderer = new THREE.WebGLRenderer({

antialias:true

});

renderer.setSize(

document.getElementById("viewer3D").clientWidth,

650

);

renderer.shadowMap.enabled=true;

document.getElementById("viewer3D").appendChild(renderer.domElement);

// ===============================
// CONTROLES
// ===============================

const controls = new OrbitControls(

camera,

renderer.domElement

);

controls.enableDamping=true;

controls.dampingFactor=0.05;

// ===============================
// LUCES
// ===============================

const ambientLight = new THREE.AmbientLight(

0xffffff,

1.8

);

scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(

0xffffff,

2

);

directionalLight.position.set(150,300,150);

directionalLight.castShadow=true;

scene.add(directionalLight);

// ===============================
// CUADRÍCULA
// ===============================

const grid = new THREE.GridHelper(

500,

25,

0x444444,

0x999999

);

scene.add(grid);

// ===============================
// EJES XYZ
// ===============================

const axes = new THREE.AxesHelper(

120

);

scene.add(axes);

// ===============================
// PISO
// ===============================

const floor = new THREE.Mesh(

new THREE.PlaneGeometry(500,500),

new THREE.MeshStandardMaterial({

color:0xffffff

})

);

floor.rotation.x=-Math.PI/2;

floor.receiveShadow=true;

scene.add(floor);

// ===============================
// ANIMACIÓN
// ===============================

function animate(){

requestAnimationFrame(animate);

controls.update();

renderer.render(scene,camera);

}

animate();

// ===============================
// RESPONSIVE
// ===============================

window.addEventListener("resize",()=>{

camera.aspect=

document.getElementById("viewer3D").clientWidth/650;

camera.updateProjectionMatrix();

renderer.setSize(

document.getElementById("viewer3D").clientWidth,

650

);

});