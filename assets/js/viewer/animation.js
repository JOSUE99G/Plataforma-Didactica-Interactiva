import { renderer } from "./renderer.js";

import { scene } from "./scene.js";

import { camera } from "./camera.js";

import { orbit } from "./controls.js";

import { transform } from "./transform.js";

export function animate(){

    requestAnimationFrame(animate);

    orbit.update();

    if(transform){

        transform.update();

    }

    renderer.render(

        scene,

        camera

    );

}