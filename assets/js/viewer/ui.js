import { camera } from "./camera.js";
import { orbit } from "./controls.js";
import { transform } from "./transform.js";
import { robot } from "./loader.js";

//======================
// CAMARA
//======================

document.getElementById("cameraMode").onclick = () => {

    orbit.enabled = true;

    if(transform){

        transform.detach();

        transform.visible = false;

    }

};

//======================
// MODELO
//======================

document.getElementById("modelMode").onclick = () => {

    if(!transform || !robot) return;

    orbit.enabled = false;

    transform.attach(robot);

    transform.visible = true;

};

//======================
// HERRAMIENTAS
//======================

document.getElementById("moveTool").onclick = ()=>{

    if(transform) transform.setMode("translate");

};

document.getElementById("rotateTool").onclick = ()=>{

    if(transform) transform.setMode("rotate");

};

document.getElementById("scaleTool").onclick = ()=>{

    if(transform) transform.setMode("scale");

};

//======================
// VISTAS
//======================

function moverCamara(x,y,z){

    camera.position.set(x,y,z);

    orbit.update();

}

document.getElementById("frontView").onclick = ()=>{

    moverCamara(250,0,0);

};

document.getElementById("sideView").onclick = ()=>{

    moverCamara(0,0,250);

};

document.getElementById("topView").onclick = ()=>{

    moverCamara(0,250,0);

};

document.getElementById("isoView").onclick = ()=>{

    moverCamara(250,180,250);

};

document.getElementById("resetView").onclick = ()=>{

    moverCamara(250,180,250);

};