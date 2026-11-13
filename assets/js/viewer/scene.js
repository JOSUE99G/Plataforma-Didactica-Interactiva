import * as THREE from "../../three/build/three.module.js";

export const scene = new THREE.Scene();

scene.background = new THREE.Color(0xf2f5fa);

export const grid = new THREE.GridHelper(
    500,
    50,
    0x777777,
    0xbbbbbb
);

scene.add(grid);

export const axes = new THREE.AxesHelper(120);

scene.add(axes);

/* ============================================================
   CAMA DE IMPRESIÓN ESTILO SLICER
   Plano + marco de color (verde/rojo) como PrusaSlicer/Cura
   ============================================================ */

// Grupo con toda la cama (fácil de mostrar/ocultar completo)
export const buildPlate = new THREE.Group();

buildPlate.name = "buildPlate";

// --- Superficie de la cama ---
const plateSize = 400;   // mm (área imprimible)
const plateDepth = 6;    // grosor visual del vidrio/placa

const plateGeo = new THREE.BoxGeometry(plateSize, plateDepth, plateSize);

const plateMat = new THREE.MeshStandardMaterial({
    color: 0x2b2f36,        // gris casi negro, típico de PEI
    metalness: 0.35,
    roughness: 0.45
});

const plate = new THREE.Mesh(plateGeo, plateMat);

// Centrada en origen, superficie superior en y=0 (los STL apoyan ahí)
plate.position.y = -plateDepth / 2;

plate.receiveShadow = true;

buildPlate.add(plate);

// --- Marco delantero (rojo, convención slicer: frente de la cama) ---
const frontBarGeo = new THREE.BoxGeometry(plateSize + 10, 12, 8);

const frontBarMat = new THREE.MeshStandardMaterial({
    color: 0xe53935,
    metalness: 0.3,
    roughness: 0.4
});

const frontBar = new THREE.Mesh(frontBarGeo, frontBarMat);

frontBar.position.set(0, -plateDepth / 2, plateSize / 2 + 4);

buildPlate.add(frontBar);

// --- Marco lateral (verde, convención slicer: origen/lado izquierdo) ---
const sideBarGeo = new THREE.BoxGeometry(8, 12, plateSize + 10);

const sideBarMat = new THREE.MeshStandardMaterial({
    color: 0x43a047,
    metalness: 0.3,
    roughness: 0.4
});

const sideBar = new THREE.Mesh(sideBarGeo, sideBarMat);

sideBar.position.set(-plateSize / 2 - 4, -plateDepth / 2, 0);

buildPlate.add(sideBar);

// --- Cuadrícula de la cama (líneas cada 20mm como una impresora real) ---
const plateGrid = new THREE.GridHelper(
    plateSize,
    20,
    0x565b66,
    0x3a3f48
);

plateGrid.position.y = 0.1;   // apenas sobre la superficie para evitar z-fighting

buildPlate.add(plateGrid);

scene.add(buildPlate);

// La cuadrícula original gris se apaga: ahora la cama es la referencia visual
grid.visible = false;