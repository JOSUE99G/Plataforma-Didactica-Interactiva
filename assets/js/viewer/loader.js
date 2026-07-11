import * as THREE from "../../three/build/three.module.js";

import { STLLoader } from "../../three/examples/jsm/loaders/STLLoader.js";

import { scene } from "./scene.js";

import { camera } from "./camera.js";

import { orbit } from "./controls.js";

import { iniciarTransform } from "./transform.js";

export let robot = null;

const material = new THREE.MeshPhysicalMaterial({

    color:0x3f8cff,

    metalness:0.15,

    roughness:0.28,

    clearcoat:0.4,

    clearcoatRoughness:0.2

});

const loader = new STLLoader();

loader.load(

    "assets/models/MagicianLite.stl",

    function(geometry){

        console.log("STL cargado");

        geometry.computeBoundingBox();

        geometry.center();

        robot = new THREE.Mesh(

            geometry,

            material

        );

        robot.rotation.x = -Math.PI/2;

        robot.castShadow = true;

        robot.receiveShadow = true;

        scene.add(robot);

        iniciarTransform(robot);

        const box = new THREE.Box3().setFromObject(robot);

        const size = box.getSize(new THREE.Vector3());

        const center = box.getCenter(new THREE.Vector3());

        const max = Math.max(

            size.x,

            size.y,

            size.z

        );

        const distancia = max * 2.5;

        camera.position.set(

            distancia,

            distancia*0.8,

            distancia

        );

        orbit.target.copy(center);

        orbit.update();

        console.log(size);

    },

    function(xhr){

        console.log(

            "Cargando",

            (xhr.loaded/xhr.total*100).toFixed(0),

            "%"

        );

    },

    function(error){

        console.error(error);

    }

);

export { material };
