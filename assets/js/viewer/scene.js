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