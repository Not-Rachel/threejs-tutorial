import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import * as dat from "dat.gui";
import star from "./assets/star.jpg";
import cloud from "./assets/cloud.jpg";

// import vertexShader from "./shaders/vs.vert";
// import fragmentShader from "./shaders/fs.frag";

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

camera.position.z = 10;
camera.position.y = 15;
camera.position.x = -10;
// orbit.update();
const orbit = new OrbitControls(camera, renderer.domElement);

scene.add(camera);

renderer.setClearColor(0xffffff, 0.0); //transparent
renderer.setSize(sizes.width, sizes.height);
renderer.render(scene, camera);
renderer.shadowMap.enabled = true;

//Shaders
const uniforms = {
  u_time: { type: "f", value: 0.0 },
  u_resolution: {
    type: "v2",
    value: new THREE.Vector2(
      window.innerWidth,
      window.innerHeight,
    ).multiplyScalar(window.devicePixelRatio),
  },
  u_mouse: { type: "v2", value: new THREE.Vector2(0.0, 0.0) },
  image: { type: "t", value: new THREE.TextureLoader().load(cloud) },
};

window.addEventListener("mousemove", function (e) {
  uniforms.u_mouse.value.set(
    e.screenX / this.window.innerWidth,
    1 - e.screenY / this.window.innerWidth,
  );
});
const vertexShader = `
uniform float u_time;
varying vec2 vUv;
void main(){
  // vUv = uv; // How to get the texture on the plane
  // float newX = cos(position.x * u_time) * 2.0 * cos(position.y * u_time);
  // vec3 newPosition = vec3(newX, position.y, position.z);
  gl_Position = projectionMatrix * modelViewMatrix  * vec4(position, 1.0);
}`;
const fragmentShader = `
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform sampler2D image;
varying vec2 vUv;
void main(){
  vec2 st = gl_FragCoord.xy / u_resolution;
  vec4 texture = texture2D(image, st);
  gl_FragColor = vec4(0.55,0.33,0.89, 1.0);
}`;
// //Plane
// const planeGeo = new THREE.PlaneGeometry(15, 15, 128, 128);
// const planeMat = new THREE.ShaderMaterial({
//   wireframe: false,
//   vertexShader: vertexShader,
//   fragmentShader: fragmentShader,
//   uniforms: uniforms,
// });
// const plane = new THREE.Mesh(planeGeo, planeMat);
// plane.receiveShadow = true;
// scene.add(plane);
// plane.rotation.x = -0.5 * Math.PI;

// const GRASS_BLADES = 1024;
// const GRASS_BLADE_VERRTICES = 15;

// function CreateTileGeometry(grass_x, grass_y){
//   for (let i = 0; i < grass_x; i++){
//     const x = (i/grass_y) - 0.5;
//     for (let j = 0; j < grass_x; i++){
//       const y = (j/grass_y) - 0.5;

//     }

//   }

// }

scene.fog = new THREE.FogExp2(0x0f1f21, 0.01);

const spotlight = new THREE.SpotLight(0xfffffff);
spotlight.intensity = 10000;
spotlight.angle = 0.2;
spotlight.penumbra = 1;
spotlight.position.set(-50, 50, 0);
spotlight.castShadow = true;
scene.add(spotlight);

const backlight = new THREE.PointLight(0xf55742, 1, 100);
backlight.position.set(-10, -10, -10);
backlight.intensity = 100;
scene.add(backlight);

window.addEventListener("resize", () => {
  //update size
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
});

const clock = new THREE.Clock();
const loop = () => {
  uniforms.u_time.value = clock.getElapsedTime();
  renderer.render(scene, camera);
  window.requestAnimationFrame(loop);
};

loop();
