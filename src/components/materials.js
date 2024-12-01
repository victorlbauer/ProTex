import { MeshPhysicalMaterial, Color } from 'three';
import { CustomVertexShader, CustomFragmentShader } from "./customshader";
import CustomShaderMaterial from 'three-custom-shader-material/vanilla';

export const StandardMaterial = new MeshPhysicalMaterial({
    color: 0xFFFFFF,
    metalness: 1.0,
    roughness: 1.0
});

export const CustomMaterial = new CustomShaderMaterial({
    baseMaterial: MeshPhysicalMaterial,
    uniforms: {
        u_seed: { value: 42.0 },
        
        u_paintColor: { type: 'v3', value: new Color(0xE79C1C) },
        u_paintWorn: { value: 1.0 },
        u_paintLayer: { value: 1.0 },

        u_metalColor: { type: 'v3', value: new Color(0x808080) },
        u_metalRoughness: { value: 1.0 },

        u_rustColor: { type: 'v3', value: new Color(0x654F45) },
        u_rustLayer: { value: 0.25 }
    },
    vertexShader: CustomVertexShader,
    fragmentShader: CustomFragmentShader
});