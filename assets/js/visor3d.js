import * as THREE from 'https://unpkg.com/three@0.167.1/build/three.module.js';

import { OrbitControls } from 'https://unpkg.com/three@0.167.1/examples/jsm/controls/OrbitControls.js';

import { STLLoader } from 'https://unpkg.com/three@0.167.1/examples/jsm/loaders/STLLoader.js';
//==============================
// ESCENA
//==============================

const scene = new THREE.Scene();

scene.background = new THREE.Color(0xf3f5f8);


//==============================
// CÁMARA
//==============================

const camera = new THREE.PerspectiveCamera(

45,

window.innerWidth/window.innerHeight,

0.1,

5000

);

camera.position.set(300,250,300);


//==============================
// RENDER
//==============================

const renderer = new THREE.WebGLRenderer({

antialias:true

});

const viewer=document.getElementById("viewer3D");

renderer.setSize(

viewer.clientWidth,

viewer.clientHeight

);

renderer.setPixelRatio(window.devicePixelRatio);

viewer.appendChild(renderer.domElement);


//==============================
// CONTROLES
//==============================

const controls=new OrbitControls(

camera,

renderer.domElement

);

controls.enableDamping=true;

controls.dampingFactor=0.05;


//==============================
// LUCES
//==============================

const ambient=new THREE.AmbientLight(

0xffffff,

2

);

scene.add(ambient);

const dir=new THREE.DirectionalLight(

0xffffff,

2

);

dir.position.set(100,200,100);

scene.add(dir);


//==============================
// CUADRÍCULA
//==============================

const grid=new THREE.GridHelper(

500,

50,

0x555555,

0x999999

);

scene.add(grid);


//==============================
// EJES
//==============================

const axes=new THREE.AxesHelper(

120

);

scene.add(axes);


//==============================
// MATERIAL
//==============================

const material=new THREE.MeshStandardMaterial({

color:0x1976d2,

metalness:0.2,

roughness:0.5

});


//==============================
// CARGAR STL
//==============================

let robot;

const loader=new STLLoader();

loader.load(

"assets/models/MagicianLite.stl",

function(geometry){

robot=new THREE.Mesh(

geometry,

material

);

//centrar

geometry.computeBoundingBox();

geometry.center();

robot.rotation.x=-Math.PI/2;

scene.add(robot);

},

undefined,

function(error){

console.error(error);

alert("No se pudo cargar el archivo STL");

}

);


//==============================
// BOTONES
//==============================

document.getElementById("frontView").onclick=()=>{

camera.position.set(0,0,300);

};

document.getElementById("topView").onclick=()=>{

camera.position.set(0,300,0);

};

document.getElementById("sideView").onclick=()=>{

camera.position.set(300,0,0);

};

document.getElementById("isoView").onclick=()=>{

camera.position.set(300,250,300);

};


//==============================
// CHECKBOX
//==============================

document.getElementById("gridCheck").onchange=(e)=>{

grid.visible=e.target.checked;

};

document.getElementById("axisCheck").onchange=(e)=>{

axes.visible=e.target.checked;

};

document.getElementById("wireframeCheck").onchange=(e)=>{

material.wireframe=e.target.checked;

};

document.getElementById("transparentCheck").onchange=(e)=>{

material.transparent=e.target.checked;

material.opacity=e.target.checked?0.4:1;

};


//==============================
// REDIMENSIONAR
//==============================

window.addEventListener("resize",()=>{

camera.aspect=

viewer.clientWidth/viewer.clientHeight;

camera.updateProjectionMatrix();

renderer.setSize(

viewer.clientWidth,

viewer.clientHeight

);

});


//==============================
// ANIMACIÓN
//==============================

function animate(){

requestAnimationFrame(animate);

controls.update();

renderer.render(scene,camera);

}

animate();