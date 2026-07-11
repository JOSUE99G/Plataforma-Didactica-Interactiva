import { TransformControls } from "../../three/examples/jsm/controls/TransformControls.js";

import { camera } from "./camera.js";
import { renderer } from "./renderer.js";
import { orbit } from "./controls.js";
import { scene } from "./scene.js";

export let transform = null;

export function iniciarTransform(robot){

    transform = new TransformControls(

        camera,
        renderer.domElement

    );

    transform.attach(robot);

    transform.setMode("translate");

    transform.setSpace("world");

    transform.setSize(0.9);

    transform.visible = false;

    transform.addEventListener("dragging-changed",(event)=>{

        orbit.enabled = !event.value;

    });

    scene.add(transform);

}