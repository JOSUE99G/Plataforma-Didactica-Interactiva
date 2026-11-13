import "./scene.js";

import "./camera.js";

import "./renderer.js";

import "./lights.js";

import "./controls.js";

import "./loader.js";

import "./transform.js";

import "./ui.js";

import { animate } from "./animation.js";

import { iniciarCheckboxes, iniciarSliderEscala, iniciarZoomCamara, actualizarInfoModelo } from "./tools.js";

import { iniciarSlidersArt, conectarRigAlModelo } from "./panel-articulaciones.js";

import { buildPlate, axes } from "./scene.js";

// El STL carga de forma asíncrona: cuando llegue, inicializamos
// el panel de información y dejamos lista la escala base.
window.addEventListener("robotCargado", (event) => {

    actualizarInfoModelo(event.detail);

    conectarRigAlModelo(event.detail);

});

iniciarSlidersArt();

iniciarCheckboxes(buildPlate, axes);

iniciarSliderEscala();

iniciarZoomCamara();

animate();