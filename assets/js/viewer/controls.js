import { OrbitControls } from "../../three/examples/jsm/controls/OrbitControls.js";

import { camera } from "./camera.js";

import { renderer } from "./renderer.js";

export const orbit = new OrbitControls(

camera,

renderer.domElement

);

orbit.enableDamping = true;

orbit.dampingFactor = 0.05;

orbit.target.set(0,0,0);

orbit.update();