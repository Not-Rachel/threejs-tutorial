import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import * as dat from "dat.gui";
import * as CANNON from "cannon-es";
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

//Sphere
const sphereGeo = new THREE.SphereGeometry(3, 32, 32);
const sphereMat = new THREE.MeshStandardMaterial({
  color: "#61cf9a",
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
  color: "#ce093a",
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
const gridHelper = new THREE.GridHelper(24);
scene.add(sphere, plane, gridHelper);
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

scene.fog = new THREE.FogExp2(0x0f1f21, 0.01);

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
// //Gui
const gui = new dat.GUI();
const options = {
  height: 5,
};

var obj = {
  reset: function () {
    sphereBody.position = new CANNON.Vec3(0, 5, 0);
    sphereBody.velocity = new CANNON.Vec3(0, 0, 0);
    boxBody.position = new CANNON.Vec3(0.5, 15, 0);
    // sphereBody.position= new CANNON.Vec3(0, 5, 0);
    // boxBody.position.set(0, 15, 0);
  },
};

gui.add(obj, "reset");

// gui.addColor(options, "sphereColor").onChange(function (e) {
//   sphere.material.color.set(e);
// });
// gui.add(options, "wireframe").onChange((e) => {
//   sphere.material.wireframe = e;
// });
gui.add(options, "height").onChange((e) => {
  sphereBody.position.y = e;
});
// gui.add(options, "angle").onChange((e) => {
//   spotlight.angle = e;
// });
// gui.add(options, "intensity").onChange((e) => {
//   spotlight.intensity = e;
// });
// gui.add(options, "penumbra").onChange((e) => {
//   spotlight.penumbra = e;
// });

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

  renderer.render(scene, camera);
  window.requestAnimationFrame(loop);
  //   slHelper.update();
};

loop();
