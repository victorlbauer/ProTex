import { GUI } from 'three/addons/libs/lil-gui.module.min.js'

export const UI = {
    scene: null,
    instance: null,

    Init: function(scene) {
        console.info("Initializing UI.");

        this.scene = scene;
        this.instance = new GUI();
        
        this.OpenSceneFolder();
        this.OpenMeshFolder();
        this.OpenProceduralFolder();

        console.info("UI initialized successfully.");
    },

    OpenSceneFolder: function() {
        let sceneSettigs = {
            hdri: ['None'],
            lights: true
        };

        let sceneFolder = this.instance.addFolder('Scene');

        let hrdi = sceneFolder.add(sceneSettigs, 'hdri', ['None', 'Metro', 'Workshop', 'Overcast']).name('HDRI');
        let lights = sceneFolder.add(sceneSettigs, 'lights').name('Lights');

        RegisterCallback(hrdi, (value) => this.scene.LoadBackground(value));
        RegisterCallback(lights, (value) => this.scene.ToggleLights(value));

        sceneFolder.open();
    },

    OpenMeshFolder: function() {
        let meshSettings = {
            model: ['Sphere']
        };
        
        let meshFolder = this.instance.addFolder('Mesh');
        let models = meshFolder.add(meshSettings, 'model', ['Sphere', 'Cube', 'Cylinder', 'Torus', 'Mesh']).name('Model');

        RegisterCallback(models, (value) => this.scene.LoadModel(value));

        meshFolder.open();
    },

    OpenProceduralFolder: function() {
        let proceduralSettings = {
            enabled: false,
            materials: ['Painted Rusty Metal'],
            generate: function() {}
        };

        let proceduralFolder = this.instance.addFolder('Procedural');

        let enabled = proceduralFolder.add(proceduralSettings, 'enabled').name('Enable');
        let materials = proceduralFolder.add(proceduralSettings, 'materials', ['Painted Rusty Metal']).name('Materials');

        RegisterCallback(enabled, (value) => this.scene.LoadProceduralMaterial(value));
        
        // TODO: move this elsewhere
        // ==========================================================
        let paintedRustyMetalSettings = {
            paintingColor: "0xE79C1C",
            paintWorn: 1.0,
            paintLayer: 1.0,

            metalColor: "0x808080",
            metalRoughness: 1.0,

            rustColor: "0x654F45",
            rustLayer: 0.25
        };

        let paintedRustyMetalFolder = proceduralFolder.addFolder('Properties');
        let paintFolder = paintedRustyMetalFolder.addFolder('Painting');
        let metalFolder = paintedRustyMetalFolder.addFolder('Metal');
        let rustFolder = paintedRustyMetalFolder.addFolder('Rust');

        let paintColor = paintFolder.addColor(paintedRustyMetalSettings, 'paintingColor').name('Color');
        let paintWorn = paintFolder.add(paintedRustyMetalSettings, 'paintWorn', 0.0, 1.0).name('Paint Worn');
        let paintLayer = paintFolder.add(paintedRustyMetalSettings, 'paintLayer', 0.0, 1.0).name('Paint Layer');

        let metalColor = metalFolder.addColor(paintedRustyMetalSettings, 'metalColor').name('Color');
        let metalRoughness = metalFolder.add(paintedRustyMetalSettings, 'metalRoughness', 0.0, 1.0).name('Roughness');

        let rustColor = rustFolder.addColor(paintedRustyMetalSettings, 'rustColor').name('Color');
        let rustLayer = rustFolder.add(paintedRustyMetalSettings, 'rustLayer', 0.0, 1.0).name('Rust Layer');

        RegisterCallback(paintColor, (value) => this.scene.materials.custom.uniforms.u_paintColor.value.set(value));
        RegisterCallback(paintWorn, (value) => this.scene.materials.custom.uniforms.u_paintWorn.value = value);
        RegisterCallback(paintLayer, (value) => this.scene.materials.custom.uniforms.u_paintLayer.value = value);

        RegisterCallback(metalColor, (value) => this.scene.materials.custom.uniforms.u_metalColor.value.set(value));
        RegisterCallback(metalRoughness, (value) => this.scene.materials.custom.uniforms.u_metalRoughness.value = value);

        RegisterCallback(rustColor, (value) => this.scene.materials.custom.uniforms.u_rustColor.value.set(value));
        RegisterCallback(rustLayer, (value) => this.scene.materials.custom.uniforms.u_rustLayer.value = value);

        paintedRustyMetalFolder.open();
        paintFolder.open();
        metalFolder.open();
        rustFolder.open();
        // ==========================================================

        proceduralFolder.add(proceduralSettings, 'generate').name('New Seed');
        proceduralSettings.generate = this.scene.GenerateNewSeed;

        proceduralFolder.open();
        
    }
}

function RegisterCallback(widget, callback) {
    widget.onChange(callback);
}

