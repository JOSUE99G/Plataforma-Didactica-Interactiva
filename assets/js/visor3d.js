//======================================================
// IMPORTAR THREE.JS
//======================================================

import * as THREE from "../three/build/three.module.js";

import { OrbitControls } from "../three/examples/jsm/controls/OrbitControls.js";

import { STLLoader } from "../three/examples/jsm/loaders/STLLoader.js";
console.log("========== VISOR 3D ==========");

import { TransformControls } from "../three/examples/jsm/controls/TransformControls.js";

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

camera.position.set(
350,
250,
350
);

camera.lookAt(0,0,0);

//======================================================
// RENDER
//======================================================

const renderer = new THREE.WebGLRenderer({

antialias:true

});

renderer.shadowMap.enabled = true;

renderer.shadowMap.type = THREE.PCFSoftShadowMap;

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

//========================================
// CONTROLES DE TRANSFORMACIÓN
//========================================

const transform = new TransformControls(
    camera,
    renderer.domElement
);

scene.add(transform);

controls.minDistance = 20;

controls.maxDistance = 3000;

controls.maxPolarAngle = Math.PI;

controls.screenSpacePanning = true;

controls.dampingFactor = 0.05;

//========================================
// LUCES
//========================================

// Luz ambiente
const ambient = new THREE.AmbientLight(
    0xffffff,
    1
);

scene.add(ambient);


// Luz principal
const sun = new THREE.DirectionalLight(
    0xffffff,
    2.5
);

sun.position.set(250,300,200);

// ← AQUÍ VAN ESTAS LÍNEAS

sun.castShadow = true;

sun.shadow.mapSize.width = 4096;

sun.shadow.mapSize.height = 4096;

sun.shadow.camera.left = -800;

sun.shadow.camera.right = 800;

sun.shadow.camera.top = 800;

sun.shadow.camera.bottom = -800;

sun.shadow.bias = -0.0001;

scene.add(sun);


// Luz de relleno
const fill = new THREE.DirectionalLight(
    0xffffff,
    1
);

fill.position.set(-200,100,-150);

scene.add(fill);


// Luz trasera
const back = new THREE.DirectionalLight(
    0xffffff,
    0.6
);

back.position.set(0,150,-250);

scene.add(back);

//========================================
// SUELO
//========================================

const floorGeometry = new THREE.PlaneGeometry(
    5000,
    5000
);

const floorMaterial = new THREE.ShadowMaterial({

    opacity:0.28

});

const floor = new THREE.Mesh(

    floorGeometry,

    floorMaterial

);

floor.rotation.x = -Math.PI/2;

floor.receiveShadow = true;

scene.add(floor);


//========================================
// CUADRÍCULA
//========================================

const grid = new THREE.GridHelper(

    5000,

    100,

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

const material = new THREE.MeshPhysicalMaterial({

    color:0x3f8cff,

    metalness:0.15,

    roughness:0.28,

    clearcoat:0.4,

    clearcoatRoughness:0.2

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

        // Activar sombras
        robot.castShadow = true;
        robot.receiveShadow = true;

        scene.add(robot);

        transform.attach(robot);

        transform.addEventListener("dragging-changed", function(event){

        controls.enabled = !event.value;

        });

        const box = new THREE.Box3().setFromObject(robot);

        const size = box.getSize(new THREE.Vector3());

        const center = box.getCenter(new THREE.Vector3());

        console.log("Tamaño:", size);

        console.log("Centro:", center);

        // Obtener la dimensión mayor
        const maxDimension = Math.max(size.x, size.y, size.z);

        // Distancia automática
        const distance = maxDimension * 2.2;

        // Posicionar la cámara
        camera.position.set(distance, distance * 0.8, distance);

        camera.lookAt(center);

        controls.target.copy(center);

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
// VARIABLES DEL VISOR
//======================================================

let modo = "camara";

let rotando = false;

let mouseAnterior = {

    x:0,

    y:0

};

//======================================================
// FUNCIONES
//======================================================

function activarModoCamara(){

    modo="camara";

    controls.enabled=true;

    console.log("Modo Cámara");

}

function activarModoModelo(){

    modo="modelo";

    controls.enabled=false;

    console.log("Modo Modelo");

}

//======================================================
// BOTONES
//======================================================
document.getElementById("cameraMode").onclick=()=>{

    activarModoCamara();

};

document.getElementById("modelMode").onclick=()=>{

    activarModoModelo();

};

document.getElementById("frontView").onclick = ()=>{

    camera.position.set(0,0,350);

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
// ROTAR MODELO
//======================================================

renderer.domElement.addEventListener("mousedown",(event)=>{

    if(modo!="modelo") return;

    rotando=true;

    mouseAnterior.x=event.clientX;

    mouseAnterior.y=event.clientY;

});

renderer.domElement.addEventListener("mouseup",()=>{

    rotando=false;

});

renderer.domElement.addEventListener("mouseleave",()=>{

    rotando=false;

});

renderer.domElement.addEventListener("mousemove",(event)=>{

    if(!rotando) return;

    if(!robot) return;

    const dx=event.clientX-mouseAnterior.x;

    const dy=event.clientY-mouseAnterior.y;

    robot.rotation.y+=dx*0.01;

    robot.rotation.x+=dy*0.01;

    mouseAnterior.x=event.clientX;

    mouseAnterior.y=event.clientY;

});

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