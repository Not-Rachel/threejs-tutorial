import * as THREE from "three";
import { OrbitControls, ShaderPass } from "three/examples/jsm/Addons.js";
import * as dat from "dat.gui";
import * as CANNON from "cannon-es";
import { BlueDitheringPass } from "./BlueDitheringPass";
import {
  EffectComposer,
  RenderPass,
  AfterimagePass,
} from "three/examples/jsm/Addons.js";
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const scene = new THREE.Scene();
const canvas = document.querySelector(".webgl");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });

const camera = new THREE.PerspectiveCamera(
  45,
  sizes.width / sizes.height,
  0.1,
  1000,
);

camera.position.z = 20;
camera.position.y = 30;
camera.position.x = -20;
const orbit = new OrbitControls(camera, renderer.domElement);
scene.add(camera);

//Add world
const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.81, 0),
});
const timeStep = 1 / 30;

renderer.setClearColor(0xffffff, 0.0); //transparent
renderer.setSize(sizes.width, sizes.height);
renderer.render(scene, camera);
renderer.shadowMap.enabled = true;
renderer.debug.checkShaderErrors = true;

//Post Proc First render pass
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
// composer.addPass(new RenderPixelatedPass(4, scene, camera));
// composer.addPass(new AfterimagePass(0.8));

// const VS = `
// varying vec2 vUv;
// void main(){
//   gl_Position = projectionMatrix * modelViewMatrix  * vec4(position, 1.0);
//   vUv = uv;
// }
// `;

// const FS = `
// #include <common>

// uniform sampler2D tDiffuse;
// uniform sampler2D bluenoise;
// uniform vec2 u_resolution;
// uniform vec3 tint;
// uniform vec3 high_tint;
// uniform vec3 low_tint;
// uniform float lowThreshold;
// uniform float highThreshold;

// varying vec2 vUv;

// void main() {
//     vec2 st = gl_FragCoord.xy / u_resolution;
//     vec4 noise = texture2D(bluenoise, st);

//     vec4 diffuse = texture2D(tDiffuse, vUv);
//     float luma = dot(diffuse.rgb, vec3(0.299, 0.587, 0.114)); //Convert to greyscale

//     float threshold = texture2D(bluenoise, fract(gl_FragCoord.xy / 64.0)).r;
//     float low  = threshold * lowThreshold;
//     float high = threshold + highThreshold;

//     vec3 result =
//     (luma < low)  ? low_tint :
//     (luma < high) ? tint :
//                     high_tint;

//     gl_FragColor = vec4(result,1.0);
// }`;

// const tex = new THREE.TextureLoader().load(bluenoise64);
// tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
// tex.minFilter = THREE.LinearFilter;
// tex.magFilter = THREE.LinearFilter;

// const Shader = {
//   uniforms: {
//     u_resolution: {
//       type: "v2",
//       value: new THREE.Vector2(
//         window.innerWidth,
//         window.innerHeight,
//       ).multiplyScalar(window.devicePixelRatio),
//     },
//     tint: { value: new THREE.Color("#61cf9a") },
//     high_tint: { value: new THREE.Color(0xffffff) },
//     low_tint: { value: new THREE.Color(0x0) },
//     lowThreshold: { value: 0.33 },
//     highThreshold: { value: 0.05 },
//     bluenoise: { value: tex },
//     tDiffuse: { value: null }, //Texture is replaced with the scene
//   },
//   vertexShader: VS,
//   fragmentShader: FS,
// };

// const shaderPass = new ShaderPass(Shader);
composer.addPass(new BlueDitheringPass("#f9ffd5", "#cbd5a8", "#4b0515"));
composer.addPass(new AfterimagePass(0.7));

//Sphere
const sphereGeo = new THREE.SphereGeometry(3, 32, 32);
const sphereMat = new THREE.MeshStandardMaterial({
  color: "#0e695e",
  roughness: 0.2,
});
const sphere = new THREE.Mesh(sphereGeo, sphereMat);
sphere.castShadow = true;

//Sphere body
const spherePhyMat = new CANNON.Material();
const sphereBody = new CANNON.Body({
  shape: new CANNON.Sphere(3),
  mass: 1,
  type: CANNON.Body.DYNAMIC,
  material: spherePhyMat,
});
sphereBody.linearDamping = 0.31;
sphereBody.position.set(0, 20, 0);
world.addBody(sphereBody);

//Box
const boxGeo = new THREE.BoxGeometry(2, 2, 2);
const boxMat = new THREE.MeshStandardMaterial({
  color: "#f4ced8",
  roughness: 0.1,
});
const box = new THREE.Mesh(boxGeo, boxMat);
box.castShadow = true;
box.receiveShadow = true;
scene.add(box);

//box body
const boxPhysMat = new CANNON.Material();
const boxBody = new CANNON.Body({
  shape: new CANNON.Box(new CANNON.Vec3(1, 1, 1)),
  mass: 2,
  type: CANNON.Body.DYNAMIC,
  position: new CANNON.Vec3(1, 15, 0),
  material: boxPhysMat,
});
// boxBody.position.set(0, 15, 0);
boxBody.angularVelocity.set(1, 5, 1);
boxBody.angularDamping = 0.3;
world.addBody(boxBody);

//Plane
const planeGeo = new THREE.PlaneGeometry(24, 24, 3, 3);
const planeMat = new THREE.MeshStandardMaterial({
  color: 0xb55042,
  side: THREE.DoubleSide,
});
const plane = new THREE.Mesh(planeGeo, planeMat);
plane.receiveShadow = true;
scene.add(sphere, plane);
// plane.rotation.x = -0.5 * Math.PI;

//Ground body
const groundPhysMat = new CANNON.Material();
const groundBody = new CANNON.Body({
  shape: new CANNON.Box(new CANNON.Vec3(12, 12, 0.1)),
  material: groundPhysMat,
  type: CANNON.Body.STATIC,
});
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(groundBody);

// Make interaction, slippery
const groundBodyContactMat = new CANNON.ContactMaterial(
  groundPhysMat,
  boxPhysMat,
  { friction: 0.001 },
);
const groundSphereContactMat = new CANNON.ContactMaterial(
  groundPhysMat,
  spherePhyMat,
  { restitution: 0.95, contactEquationStiffness: 1000 },
);
world.addContactMaterial(groundBodyContactMat);
world.addContactMaterial(groundSphereContactMat);

//FOG
scene.fog = new THREE.FogExp2(0x0f1f21, 0.01);

//LIGHTS
const spotlight = new THREE.SpotLight(0xfffffff, 10000);
spotlight.angle = 0.2;
spotlight.penumbra = 1;
spotlight.position.set(-50, 50, 0);
spotlight.castShadow = true;
scene.add(spotlight);

const backlight = new THREE.PointLight(0xf55742, 1, 100);
backlight.position.set(-10, -10, -10);
backlight.intensity = 100;
scene.add(backlight);

//Gui

var obj = {
  reset: function () {
    sphereBody.position.set(0, 5, 0);
    sphereBody.velocity.set(0, 0, 0);
    boxBody.position.set(0.5, 15, 0);
    boxBody.velocity.set(0.0, 0.0, 0.0);
  },
};
// const gui = new dat.GUI();
// const options = {
//   height: 5,
//   color: 0xffffff,
//   sphereColor: "#61cf9a",
// };
// gui.add(obj, "reset");
// gui.add(options, "sphereColor");
// gui.add(options, "color").onChange((e) => {
//   const color = new THREE.Color(e);
//   console.log({ color });
//   Shader.uniforms.tint.value = new THREE.Color(e);
// });
// gui.add(options, "height").onChange((e) => {
//   sphereBody.position.y = e;
// });

const gui = new dat.GUI();
const options = {
  highcolor: "#ffffff",
  midcolor: "#61cf9a",
  lowcolor: "#000000",
  lowThreshold: 0.33,
  highThreshold: 0.05,
};

gui.addColor(options, "highcolor").onChange(function (e) {
  shaderPass.uniforms.high_tint.value = new THREE.Color(e);
});
gui.addColor(options, "midcolor").onChange(function (e) {
  shaderPass.uniforms.tint.value = new THREE.Color(e);
});
gui.addColor(options, "lowcolor").onChange(function (e) {
  shaderPass.uniforms.low_tint.value = new THREE.Color(e);
});

gui.add(options, "lowThreshold", 0, 1).onChange(function (e) {
  //   Shader.uniforms.lowThreshold.value = e;
  shaderPass.uniforms.lowThreshold.value = e;
});

gui.add(options, "highThreshold", 0, 1).onChange(function (e) {
  //   Shader.uniforms.highThreshold.value = e;
  shaderPass.uniforms.highThreshold.value = e;
});

gui.add(obj, "reset");

// Post Processing

window.addEventListener("resize", () => {
  //update size
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
});

const loop = () => {
  world.step(timeStep);
  //Fuse mesh with physics body
  plane.position.copy(groundBody.position);
  plane.quaternion.copy(groundBody.quaternion);

  sphere.position.copy(sphereBody.position);
  sphere.quaternion.copy(sphereBody.quaternion);

  box.position.copy(boxBody.position);
  box.quaternion.copy(boxBody.quaternion);

  //   renderer.render(scene, camera);
  composer.render([]); // Render through effect composer
  window.requestAnimationFrame(loop);
};

loop();
