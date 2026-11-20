import { renderer } from "./renderer.js";

import { scene } from "./scene.js";

import { camera } from "./camera.js";

import { orbit } from "./controls.js";

import { transform } from "./transform.js";

let oculto = false;

// PAUSA EN SEGUNDO PLANO: en móvil ahorra batería y evita que el
// navegador mate el rAF al regresar. VisibilityChange API.
document.addEventListener("visibilitychange", () => {

    oculto = document.hidden;

});

export function animate(){

    requestAnimationFrame(animate);

    if (oculto) return;   // no renderizar si la pestaña no está visible

    orbit.update();

    if (transform){

        transform.update();

    }

    renderer.render(

        scene,

        camera

    );

}