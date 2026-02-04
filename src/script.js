import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import * as dat from "dat.gui";
import side from "./assets/stars.jpg";
import cloud from "./assets/cloud.jpg";

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
// orbit.update();
const orbit = new OrbitControls(camera, renderer.domElement);

scene.add(camera);

renderer.setClearColor(0xffffff, 1); //transparent
renderer.setSize(sizes.width, sizes.height);
renderer.render(scene, camera);
renderer.shadowMap.enabled = true;

//Load background
const textureLoader = new THREE.TextureLoader();
const cubeTextureLoader = new THREE.CubeTextureLoader();
// scene.background = textureLoader.load(cloud);
scene.background = cubeTextureLoader.load([side, side, side, side, side, side]);

const boxGeo = new THREE.BoxGeometry(4, 4, 4);
const boxMat = new THREE.MeshStandardMaterial({
  map: textureLoader.load(cloud),
});
const box = new THREE.Mesh(boxGeo, boxMat);
box.position.set(4, 2.01, 4);
scene.add(box);

//Sphere
const sphereGeo = new THREE.SphereGeometry(3, 32, 32);
const sphereMat = new THREE.MeshStandardMaterial({
  color: "#61cf9a",
  roughness: 0.2,
});
const sphere = new THREE.Mesh(sphereGeo, sphereMat);
sphere.position.y = 5;
sphere.castShadow = true;

//Sphere with Shaders
const sphere2Geo = new THREE.SphereGeometry(2, 32, 32);
const sphere2Mat = new THREE.ShaderMaterial({
  vertexShader:
    "void main(){ gl_Position = projectionMatrix * modelViewMatrix  * vec4(position, 1.0); }",
  fragmentShader: " void main(){gl_FragColor = vec4(1.0,0.5,0.71,1.0);}",
});
const sphere2 = new THREE.Mesh(sphere2Geo, sphere2Mat);
sphere2.position.set(-5, 3, -5);
scene.add(sphere2);

//Plane
const planeGeo = new THREE.PlaneGeometry(24, 24, 3, 3);
const planeMat = new THREE.MeshStandardMaterial({
  color: 0xb55042,
  side: THREE.DoubleSide,
});
const plane = new THREE.Mesh(planeGeo, planeMat);
plane.receiveShadow = true;

const gridHelper = new THREE.GridHelper(24);

scene.add(sphere, plane, gridHelper);
plane.rotation.x = -0.5 * Math.PI;

scene.fog = new THREE.FogExp2(0x0f1f21, 0.01);

const spotlight = new THREE.SpotLight(0xfffffff);
spotlight.intensity = 10000;
spotlight.angle = 0.2;
spotlight.penumbra = 1;
spotlight.position.set(-50, 50, 0);
spotlight.castShadow = true;
const slHelper = new THREE.SpotLightHelper(spotlight);
scene.add(spotlight, slHelper);

const backlight = new THREE.PointLight(0xf55742, 1, 100);
backlight.position.set(-10, -10, -10);
backlight.intensity = 100;
scene.add(backlight);
//Gui
const gui = new dat.GUI();
const options = {
  sphereColor: "#61cf9a",
  wireframe: false,
  height: 5,
  angle: 0.2,
  intensity: 10000,
  penumbra: 1,
};

gui.addColor(options, "sphereColor").onChange(function (e) {
  sphere.material.color.set(e);
});
gui.add(options, "wireframe").onChange((e) => {
  sphere.material.wireframe = e;
});
gui.add(options, "height").onChange((e) => {
  sphere.position.y = e;
});
gui.add(options, "angle").onChange((e) => {
  spotlight.angle = e;
});
gui.add(options, "intensity").onChange((e) => {
  spotlight.intensity = e;
});
gui.add(options, "penumbra").onChange((e) => {
  spotlight.penumbra = e;
});

window.addEventListener("resize", () => {
  //update size
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
});

const loop = () => {
  renderer.render(scene, camera);
  window.requestAnimationFrame(loop);
  slHelper.update();
};

loop();
