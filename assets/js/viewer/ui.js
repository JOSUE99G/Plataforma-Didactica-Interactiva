import { scene } from "./scene.js";
import { camera } from "./camera.js";
import { orbit } from "./controls.js";
import { transform } from "./transform.js";

// Helper seguro: los elementos de modo fueron retirados del panel,
// así que todos los accesos verifican existencia antes de usar.
function alHacerClic(id, manejador) {
  const el = document.getElementById(id);

  if (el) el.onclick = manejador;
}

//======================
// CAMARA
//======================

alHacerClic("cameraMode", () => {
  orbit.enabled = true;

  if (transform) {
    transform.detach();
    transform.visible = false;
  }
});

//======================
// MODELO
//======================

alHacerClic("modelMode", () => {
  // El robot ahora se busca por nombre (modo simple o multi)
  const robotActual =
    scene.getObjectByName("robotSimple") ||
    scene.getObjectByName("robotRig") ||
    scene.getObjectByName("rigMulti");

  if (!transform || !robotActual) return;

  orbit.enabled = false;
  transform.attach(robotActual);
  transform.visible = true;
});

//======================
// HERRAMIENTAS
//======================

alHacerClic("moveTool", () => {
  if (transform) transform.setMode("translate");
});

alHacerClic("rotateTool", () => {
  if (transform) transform.setMode("rotate");
});

alHacerClic("scaleTool", () => {
  if (transform) transform.setMode("scale");
});

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