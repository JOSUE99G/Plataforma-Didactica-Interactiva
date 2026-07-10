//======================================================
// IMPORTAR THREE.JS
//======================================================

import * as THREE from "../three/build/three.module.js";

import { OrbitControls } from "../three/examples/jsm/controls/OrbitControls.js";

import { STLLoader } from "../three/examples/jsm/loaders/STLLoader.js";
console.log("========== VISOR 3D ==========");

//======================================================
// CONTENEDOR
//======================================================

const viewer = document.getElementById("viewer3D");

if (!viewer) {

    console.error("No existe el div #viewer3D");

    throw new Error("viewer3D no encontrado");

}

console.log("Viewer encontrado");

console.log("Ancho:", viewer.clientWidth);

console.log("Alto:", viewer.clientHeight);

//======================================================
// ESCENA
//======================================================

const scene = new THREE.Scene();

scene.background = new THREE.Color(0xf2f5fa);

//======================================================
// CAMARA
//======================================================

const camera = new THREE.PerspectiveCamera(

45,

viewer.clientWidth / viewer.clientHeight,

0.1,

5000

);

camera.position.set(300,250,300);

//======================================================
// RENDER
//======================================================

const renderer = new THREE.WebGLRenderer({

antialias:true

});

renderer.setSize(

viewer.clientWidth,

viewer.clientHeight

);

renderer.setPixelRatio(window.devicePixelRatio);

viewer.appendChild(renderer.domElement);

//======================================================
// CONTROLES
//======================================================

const controls = new OrbitControls(

camera,

renderer.domElement

);

controls.enableDamping = true;

controls.dampingFactor = 0.05;

//======================================================
// LUCES
//======================================================

const ambient = new THREE.AmbientLight(

0xffffff,

2

);

scene.add(ambient);

const directional = new THREE.DirectionalLight(

0xffffff,

2

);

directional.position.set(200,300,200);

scene.add(directional);

//======================================================
// CUADRICULA
//======================================================

const grid = new THREE.GridHelper(
    150,
    30,
    0x555555,
    0x999999
);

scene.add(grid);

//======================================================
// EJES
//======================================================

const axes = new THREE.AxesHelper(

120

);

scene.add(axes);

//======================================================
// MATERIAL
//======================================================

const material = new THREE.MeshStandardMaterial({

color:0x1976d2,

metalness:0.2,

roughness:0.5

});

//======================================================
// CARGAR STL
//======================================================

let robot = null;

const loader = new STLLoader();

loader.load(

    "assets/models/MagicianLite.stl",

    function (geometry) {

        console.log("STL cargado correctamente");

        geometry.computeBoundingBox();

        console.log(geometry.boundingBox);

        geometry.center();

        robot = new THREE.Mesh(geometry, material);

        robot.rotation.x = -Math.PI / 2;

        // Escala temporal
        robot.scale.set(100,100,100);

        scene.add(robot);

        const box = new THREE.BoxHelper(robot, 0xff0000);

        scene.add(box);

        camera.position.set(120,120,120);

        camera.lookAt(0,0,0);

        controls.target.set(0,0,0);

        controls.update();

        console.log(robot);

    },

function(xhr){

    console.log(

        "Cargando STL:",

        (xhr.loaded / xhr.total * 100).toFixed(0),

        "%"

    );

},

function(error){

    console.error(error);

    alert("No se pudo cargar MagicianLite.stl");

}

);

//======================================================
// BOTONES
//======================================================

document.getElementById("frontView").onclick = ()=>{

    camera.position.set(0,0,300);

};

document.getElementById("topView").onclick = ()=>{

    camera.position.set(0,300,0);

};

document.getElementById("sideView").onclick = ()=>{

    camera.position.set(300,0,0);

};

document.getElementById("isoView").onclick = ()=>{

    camera.position.set(300,250,300);

};

//======================================================
// CHECKBOXES
//======================================================

document.getElementById("gridCheck").addEventListener("change",(e)=>{

    grid.visible = e.target.checked;

});

document.getElementById("axisCheck").addEventListener("change",(e)=>{

    axes.visible = e.target.checked;

});

document.getElementById("wireframeCheck").addEventListener("change",(e)=>{

    material.wireframe = e.target.checked;

});

document.getElementById("transparentCheck").addEventListener("change",(e)=>{

    material.transparent = e.target.checked;

    material.opacity = e.target.checked ? 0.35 : 1;

});

//======================================================
// REDIMENSIONAR
//======================================================

window.addEventListener("resize",()=>{

    camera.aspect = viewer.clientWidth / viewer.clientHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(

        viewer.clientWidth,

        viewer.clientHeight

    );

});

//======================================================
// ANIMACION
//======================================================

function animate(){

    requestAnimationFrame(animate);

    controls.update();

    renderer.render(scene,camera);

}

animate();