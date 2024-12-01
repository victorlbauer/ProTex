import * as THREE from "three";
import Stats from 'three/examples/jsm/libs/stats.module'
import { ArcballControls } from "three/examples/jsm/Addons.js";

export const Profiler = Stats();

export const Renderer = {
    instance: null,

    scene: null,
    camera: null,
    controls: null,

    Init: function(scene) {
        console.info("Initializing Renderer.");
        
        this.instance = new THREE.WebGLRenderer({ antialias: true});
        
        this.instance.setSize(window.innerWidth, window.innerHeight);
        this.instance.shadowMap.enabled = true;
        this.instance.shadowMap.type = THREE.PCFSoftShadowMap;
        this.instance.toneMapping = THREE.ACESFilmicToneMapping;
        this.instance.toneMappingExposure = 1.0;
        this.instance.gammaFactor = 2.2;
        this.instance.gammaOutput = true;
        
        document.body.appendChild(this.instance.domElement);
        document.body.appendChild(Profiler.domElement);

        this.scene = scene.instance;

        this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 ); 
        this.camera.position.z = 2;

        this.controls = new ArcballControls(this.camera, this.instance.domElement, this.scene);
        this.controls.enablePan = false;
        this.controls.enableZoom = false;
        this.controls.wMax = 5.0;
        this.controls.setGizmosVisible(false);

        this.instance.setAnimationLoop(Render);
        window.addEventListener('resize', OnWindowResize, false);

        console.info("Renderer initialized successfully.");
    }
}

function Render() {
    Renderer.instance.render(Renderer.scene, Renderer.camera);
    Profiler.update();
}

function OnWindowResize() {
    let width = window.innerWidth;
    let height = window.innerHeight;

    Renderer.camera.aspect = width / height;
    Renderer.camera.updateProjectionMatrix();

    Renderer.instance.setSize(width, height);
    Renderer.instance.render(Renderer.scene, Renderer.camera);
}