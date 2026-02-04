import * as THREE from "three";
import { ShaderPass } from "three/examples/jsm/Addons.js";
import bluenoise64 from "./assets/HDR_L_2.png";

export class BlueDitheringPass extends ShaderPass {
  constructor(highTint = 0xffffff, midTint = "#61cf9a", lowTint = 0x0) {
    const VS = `
      varying vec2 vUv;
      void main(){
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        vUv = uv;
      }
    `;

    const FS = `
      #include <common>
      
      uniform sampler2D tDiffuse;
      uniform sampler2D bluenoise;
      uniform vec2 u_resolution;
      uniform vec3 tint;
      uniform vec3 high_tint;
      uniform vec3 low_tint;
      uniform float lowThreshold;
      uniform float highThreshold;
      uniform float bluenoiseSize;
      
      varying vec2 vUv;
      
      void main() {
        vec2 st = gl_FragCoord.xy / u_resolution;
        vec4 noise = texture2D(bluenoise, st);

        vec4 diffuse = texture2D(tDiffuse, vUv);
        float luma = dot(diffuse.rgb, vec3(0.299, 0.587, 0.114)); //Convert to greyscale

        float threshold = texture2D(bluenoise, fract(gl_FragCoord.xy / bluenoiseSize)).r;
        float low  = threshold * lowThreshold;
        float high = threshold + highThreshold;

        vec3 result =
        (luma < low)  ? low_tint :
        (luma < high) ? tint :
                        high_tint;

        gl_FragColor = vec4(result,1.0);
      }
    `;

    const tex = new THREE.TextureLoader().load(bluenoise64);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;

    console.log(tex.width, tex.height);

    const Shader = {
      uniforms: {
        u_resolution: {
          type: "v2",
          value: new THREE.Vector2(
            window.innerWidth,
            window.innerHeight,
          ).multiplyScalar(window.devicePixelRatio),
        },
        tint: { value: new THREE.Color(midTint) },
        high_tint: { value: new THREE.Color(highTint) },
        low_tint: { value: new THREE.Color(lowTint) },
        lowThreshold: { value: 0.2 },
        highThreshold: { value: 0.6 },
        bluenoise: { value: tex },
        bluenoiseSize: { value: 64.0 },
        tDiffuse: { value: null },
      },
      vertexShader: VS,
      fragmentShader: FS,
    };

    super(Shader);
    this.highTint = highTint;
    this.midTint = midTint;
    this.lowTint = lowTint;
  }
}
