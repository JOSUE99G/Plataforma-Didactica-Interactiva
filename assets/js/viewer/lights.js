import * as THREE from "../../three/build/three.module.js";
import { scene } from "./scene.js";

export const ambient = new THREE.AmbientLight(
    0xffffff,
    1.8
);

scene.add(ambient);

export const sun = new THREE.DirectionalLight(
    0xffffff,
    2
);

sun.position.set(
    250,
    300,
    200
);

sun.castShadow = true;

sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;

scene.add(sun);