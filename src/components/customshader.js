export const CustomVertexShader = `
    varying vec3 localPosition;

    void main() 
    {
        csm_PositionRaw = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        localPosition = position;
    }
`;

export const CustomFragmentShader = `
    varying vec3 localPosition;

    uniform float u_seed;

    // Painting
    uniform vec3 u_paintColor;
    uniform float u_paintWorn;
    uniform float u_paintLayer;

    // Metal
    uniform vec3 u_metalColor;
    uniform float u_metalRoughness;

    // Rust
    uniform vec3 u_rustColor;
    uniform float u_rustLayer;

    vec4 permute(vec4 x) 
    { 
        return mod(((x*34.0)+1.0)*x, 289.0); 
    }

    vec4 taylorInvSqrt(vec4 r) 
    { 
        return 1.79284291400159 - 0.85373472095314 * r; 
    }
    
    // Reference - Simplex Noise 3D (https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83)
    float noise(vec3 v)
    { 
        const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

        // First corner
        vec3 i = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);

        // Other corners
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );
 
        vec3 x1 = x0 - i1 + 1.0 * C.xxx;
        vec3 x2 = x0 - i2 + 2.0 * C.xxx;
        vec3 x3 = x0 - 1. + 3.0 * C.xxx;

        // Permutations
        i = mod(i + u_seed, 289.0 ); 
        
        vec4 p = permute(permute(permute(
                  i.z + vec4(0.0, i1.z, i2.z, 1.0))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0)) 
                + i.x + vec4(0.0, i1.x, i2.x, 1.0));

        // Gradients
        // ( N*N points uniformly over a square, mapped onto an octahedron.)
        float n_ = 1.0 / 7.0; // N=7
        vec3  ns = n_ * D.wyz - D.xzx;

        vec4 j = p - 49.0 * floor(p * ns.z *ns.z); // mod(p,N*N)

        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ ); // mod(j,N)

        vec4 x = x_ * ns.x + ns.yyyy;
        vec4 y = y_ * ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);

        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);

        vec4 s0 = floor(b0) * 2.0 + 1.0;
        vec4 s1 = floor(b1) * 2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));

        vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww ;

        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);

        //Normalise gradients
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;

        // Mix final noise value
        vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
        m = m * m;

        return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
    }

    float mask(float value, float threshold, float range)
    {
        if (value > threshold + range) 
            return 1.0;
        
        if (value < threshold - range)
            return 0.0;
    
        return (value - (threshold - range)) / (2.0 * range);
    }

    float fbm(vec3 pos, float scale, float persistence, float lacunarity, float expo, float height, int octaves)
    {
        float amplitude = 1.0;
        float frequency = 1.0;
        float normalization = 0.0;
        float total = 0.0;
        
        pos *= scale;

        for(int i = 0; i < octaves; i++)
        {
            float noiseValue = noise(pos * frequency) * 0.5 + 0.5;
            total += noiseValue * amplitude;
            normalization += amplitude;
            amplitude *= pow(2.0, -persistence);
            frequency *= lacunarity;
        }

        total /= normalization;

        return pow(total, expo) * height;
    }

    vec3 fbmNormal(vec3 pos, float scale, float persistence, float lacunarity, float expo, float height, int octaves)
    {
        float eps = 0.001f;
        vec3 epsX = vec3(eps, 0.0f, 0.0f);
        vec3 epsY = vec3(0.0f, eps, 0.0f);
        vec3 epsZ = vec3(0.0f, 0.0f, eps);

        float p1 = fbm(pos + epsX, scale, persistence, lacunarity, expo, height, octaves);
        float p2 = fbm(pos + epsY, scale, persistence, lacunarity, expo, height, octaves);
        float p3 = fbm(pos + epsZ, scale, persistence, lacunarity, expo, height, octaves);
        float p4 = fbm(pos - epsX, scale, persistence, lacunarity, expo, height, octaves);
        float p5 = fbm(pos - epsY, scale, persistence, lacunarity, expo, height, octaves);
        float p6 = fbm(pos - epsZ, scale, persistence, lacunarity, expo, height, octaves);

        float dx = p1 - p4;
        float dy = p2 - p5;
        float dz = p3 - p6;

        vec4 normal = normalize(-vec4(dx, dy, dz, eps));

        return normal.xyz;
    }

    void main() {
        vec3 p = localPosition;
    
        // =================== PAINT ====================
        // Domain Warping
        float p1 = fbm(p, 4.0, 0.7, 2.5, 1.0, 1.0, 8);
        float p2 = fbm(p, 2.0, 0.5, 2.5, 1.0, 1.5, 1);
        float p3 = fbm(p, 8.0, 1.0, 2.5, 1.0, 1.0, 4);
        float paintNoise = fbm(vec3(p1, p2, p3), 1.0, 0.5, 2.0, 1.0, 1.0, 8);

        vec3 paintColor = u_paintColor;
        vec3 paintWorn = u_paintColor * paintNoise;
        
        float paintMaskNoise = fbm(p, 2.0, 0.7, 2.0, .9, 1.0, 8);
        float paintMask = mask(paintMaskNoise, 1.0 - u_paintLayer, 0.05);

        vec4 paintDiffuse = vec4(mix(paintColor, paintWorn, u_paintWorn), 1.0);
        float paintRoughness = 0.7;
        float paintMetalness = 0.0;
        vec3 paintNormal = fbmNormal(vec3(p1, p2, p3), 1.0, 0.5, 2.0, 1.0, 1.0, 2);
        paintNormal = mix(csm_FragNormal, paintNormal * u_paintWorn, 0.2);
        // ==============================================

        // =================== METAL ====================
        // Fractal Brownian Motion
        float metalNoise = fbm(p, 1.0, 0.7, 2.5, 1.0, u_metalRoughness, 8);
        
        vec4 metalDiffuse = vec4(mix(u_metalColor, u_rustColor, u_rustLayer), 1.0);
        float metalRoughness = metalNoise;
        float metalMetalness = 1.0;
        vec3 metalNormal = csm_FragNormal;
        // ==============================================
        
        // ==================== RUST ====================
        float rustNoise = fbm(p, 7.0, 1.0, 3.5, .5, 1.0, 4);
        float rustMask = mask(rustNoise, 1.0 - u_rustLayer, 0.1);

        vec4 rustDiffuse = vec4(u_rustColor, 1.0);
        float rustRoughness = 0.7;
        float rustMetalness = 1.0;
        vec3 rustNormal = fbmNormal(p, 7.0, 1.0, 3.5, .5, 1.0, 4);
        rustNormal = mix(csm_FragNormal, rustNormal, 0.2);

        // ==============================================
        csm_DiffuseColor = paintMask * paintDiffuse   + (1.0 - paintMask) * (rustMask * rustDiffuse   + (1.0 - rustMask) * metalDiffuse);
        csm_Roughness    = paintMask * paintRoughness + (1.0 - paintMask) * (rustMask * rustRoughness + (1.0 - rustMask) * metalRoughness);
        csm_Metalness    = paintMask * paintMetalness + (1.0 - paintMask) * (rustMask * rustMetalness + (1.0 - rustMask) * metalMetalness);
        csm_FragNormal   = paintMask * paintNormal    + (1.0 - paintMask) * (rustMask * rustNormal    + (1.0 - rustMask) * metalNormal);
    }
`;