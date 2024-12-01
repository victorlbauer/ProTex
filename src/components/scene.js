import * as THREE from 'three';
import { StandardMaterial, CustomMaterial } from "./materials";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

export const Scene = {
    instance: null,

    hdriTextures: {
        none: null,
        metro: null,
        workshop: null,
        overcast: null
    },

    lights: {
        keyLight: null,
        fillLight: null,
        backLight: null
    },

    models: {
        sphere: null,
        cube: null,
        cylinder: null,
        torus: null,
        mesh: null,

        currentLoaded: null
    },

    materials: {
        standard: null,
        custom: null,
    },

    textures: {
        albedo: null, 
        metallic : null,
        roughness: null,
        normal: null,
        bump: null,
        ao: null
    },

    Init: function() {
        console.info("Initializing Scene.");

        this.instance = new THREE.Scene();

        this.LoadMaterials();
        this.LoadModels();
        this.LoadSpotLights();
        this.LoadHdriTextures();

        console.info("Scene initialized successfully.");
    },

    LoadMaterials: function() {
        this.materials.standard = StandardMaterial;
        this.materials.custom = CustomMaterial;

        this.textures.albedo    = LoadTexture('assets/textures/pbr/painted_metal/metal_albedo.jpg');
        this.textures.metallic  = LoadTexture('assets/textures/pbr/painted_metal/metal_metallic.jpg');
        this.textures.roughness = LoadTexture('assets/textures/pbr/painted_metal/metal_roughness.jpg');
        this.textures.normal    = LoadTexture('assets/textures/pbr/painted_metal/metal_normal.jpg');
        this.textures.bump      = LoadTexture('assets/textures/pbr/painted_metal/metal_bump.jpg');
        this.textures.ao        = LoadTexture('assets/textures/pbr/painted_metal/metal_ao.jpg');

        this.materials.standard.map = this.textures.albedo;
        this.materials.standard.metalnessMap = this.textures.metallic;
        this.materials.standard.roughnessMap = this.textures.roughness;
        this.materials.standard.normalMap = this.textures.normal;
        this.materials.standard.bumpMap = this.textures.bump;
        this.materials.standard.aoMap = this.textures.ao;
    },

    LoadModels: async function() {
        this.models.sphere = new THREE.Mesh(new THREE.SphereGeometry(0.75, 256, 256), this.materials.standard);
        this.models.sphere.geometry.computeVertexNormals();
        this.models.sphere.visible = false;
        
        this.models.cube = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), this.materials.standard);
        this.models.cube.geometry.computeVertexNormals();
        this.models.cube.visible = false;
        
        this.models.cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 1.0, 32.0, 32.0), this.materials.standard);
        this.models.cylinder.geometry.computeVertexNormals();
        this.models.cylinder.visible = false;
        
        this.models.torus = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.3, 64, 128), this.materials.standard);
        this.models.torus.geometry.computeVertexNormals();
        this.models.torus.visible = false;

        this.models.mesh = await LoadSTL(
            'assets/models/stl/bust-of-menelaus.stl', 
            new THREE.Vector3(-0.75, -0.5, -1.0), 
            new THREE.Vector3(0.017, 0.017, 0.017), 
            new THREE.Vector3(-Math.PI/2.0, 0, 0), 
            this.materials.standard
        );
        this.models.mesh.visible = false;
        
        this.models.currentLoaded = this.models.sphere;
        this.models.currentLoaded.visible = true;
        
        this.instance.add(this.models.sphere);
        this.instance.add(this.models.cube);
        this.instance.add(this.models.cylinder);
        this.instance.add(this.models.torus);
        this.instance.add(this.models.mesh);
    },

    LoadHdriTextures: function() {
        this.hdriTextures.none     = new THREE.Color(0x202020);
        this.hdriTextures.metro    = LoadHdri('assets/textures/hdri/metro_noord_2k.hdr');
        this.hdriTextures.workshop = LoadHdri('assets/textures/hdri/industrial_workshop_foundry_2k.hdr');
        this.hdriTextures.overcast = LoadHdri('assets/textures/hdri/overcast_soil_puresky_2k.hdr');
        
        this.instance.background = this.hdriTextures.none;
    },

    LoadSpotLights: function() {
        this.lights.keyLight  = LoadSpotLight(0xFFFFFF, 50.0, new THREE.Vector3(-3, 1, 3));
        this.lights.fillLight = LoadSpotLight(0xFFFFFF, 25.0, new THREE.Vector3(3, 1, 3));
        this.lights.backLight = LoadSpotLight(0xFFFFFF, 10.0, new THREE.Vector3(-3, 1, -3));

        this.lights.keyLight.shadow.camera.target  = this.models.currentLoaded;
        this.lights.fillLight.shadow.camera.target = this.models.currentLoaded;
        this.lights.backLight.shadow.camera.target = this.models.currentLoaded;

        this.instance.add(this.lights.keyLight);
        this.instance.add(this.lights.fillLight);
        this.instance.add(this.lights.backLight);
    },

    LoadBackground: function(name) {
        let texture = null;

        switch(name) {
            case 'None':
                texture = this.hdriTextures.none;
                break;
            case 'Metro':
                texture = this.hdriTextures.metro;
                break;
            case 'Workshop':
                texture = this.hdriTextures.workshop;
                break;
            case 'Overcast':
                texture = this.hdriTextures.overcast;
                break;
        }

        this.instance.background = texture;
        this.instance.environment = texture;
    },

    LoadModel: function(name) {
        let model = null;

        switch(name) {
            case 'Sphere':
                model = this.models.sphere;
                break;
            case 'Cube':
                model = this.models.cube;
                break;
            case 'Cylinder':
                model = this.models.cylinder;
                break;
            case 'Torus':
                model = this.models.torus;
                break;
            case 'Mesh':
                model = this.models.mesh;
                break;
        }

        this.models.currentLoaded.visible = false;
        this.models.currentLoaded = model;
        this.models.currentLoaded.visible = true;
    },

    ToggleLights: function(value) {
        Object.keys(this.lights).forEach(key => {
            var light = this.lights[key];
            light.visible = value;
        });
    },

    LoadProceduralMaterial: function(value) {
        let material = value ? this.materials.custom : this.materials.standard;

        Object.keys(this.models).forEach(key => {
            var model = this.models[key];
            model.material = material;
        });
    },

    GenerateNewSeed: function() {
        CustomMaterial.uniforms.u_seed.value = THREE.MathUtils.randFloat(1.0, 100000.0);
        CustomMaterial.needsUpdate = true;
    }
}

function LoadHdri(path) {
    let loader = new RGBELoader();

    let texture = loader.load(path, function(texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
    });

    return texture;
}

function LoadTexture(path) {
    const materialLoader = new THREE.TextureLoader();

    let texture = materialLoader.load(path, (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
    });

    return texture;
}

function LoadSpotLight(color, intensity, position, model) {
    let light = new THREE.SpotLight(color, intensity);

    light.position.set(position.x, position.y, position.z);
    light.castShadow = true;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 10;
    light.shadow.camera.fov = 30;

    return light;
}

async function LoadSTL(path, position, scale, rotation, material)
{
    return new Promise((resolve, reject) => {
        let loader = new STLLoader();
        
        loader.load(
            path,
            geometry => {
                geometry.scale(scale.x, scale.y, scale.z);
                geometry.translate(position.x, position.y, position.z);
                geometry.rotateX(rotation.x).rotateY(rotation.y).rotateZ(rotation.z);

                let mesh = new THREE.Mesh(geometry, material);
                mesh.receiveShadow = true;
                mesh.castShadow = true;

                resolve(mesh);
            },
            undefined,
            error => reject(error)
        );
    });
}