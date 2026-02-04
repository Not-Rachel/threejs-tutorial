import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import * as dat from "dat.gui";
import side from "./assets/stars.jpg";
import cloud from "./assets/cloud.jpg";
import * as CANNON from "cannon-es";

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

//Add world
const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.81, 0),
});
const timeStep = 1 / 30;

scene.add(camera);

renderer.setClearColor(0xffffff, 0.0); //transparent
renderer.setSize(sizes.width, sizes.height);
renderer.render(scene, camera);
renderer.shadowMap.enabled = true;

scene.add(new THREE.AxesHelper(20));

// Add object on mouse click
const mouse = new THREE.Vector2();
const intersectionPoint = new THREE.Vector3();
const planeNormal = new THREE.Vector3();
const plane = new THREE.Plane();
const raycaster = new THREE.Raycaster();

window.addEventListener("mousemove", function (e) {
  mouse.x = (e.clientX / this.window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / this.window.innerHeight) * 2 + 1;
  planeNormal.copy(camera.position).normalize();
  plane.setFromNormalAndCoplanarPoint(planeNormal, scene.position);
  raycaster.setFromCamera(mouse, camera);
  raycaster.ray.intersectPlane(plane, intersectionPoint);
});

//Floor
const planeGeo = new THREE.PlaneGeometry(24, 24, 3, 3);
const planeMat = new THREE.MeshStandardMaterial({
  color: 0xb55042,
  side: THREE.DoubleSide,
});
const floor = new THREE.Mesh(planeGeo, planeMat);
floor.receiveShadow = true;
const gridHelper = new THREE.GridHelper(24);
scene.add(floor, gridHelper);

//Ground body
const groundPhysMat = new CANNON.Material();
const groundBody = new CANNON.Body({
  shape: new CANNON.Box(new CANNON.Vec3(12, 12, 0.05)),
  material: groundPhysMat,
  type: CANNON.Body.STATIC,
});
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(groundBody);

const spheres = [];
const bodies = [];
window.addEventListener("click", function (e) {
  //Sphere mesh
  const sphereGeo = new THREE.SphereGeometry(0.5, 30, 30);
  const sphereMat = new THREE.MeshStandardMaterial({
    color: Math.random() * 0xffffff,
    roughness: 0.2,
  });
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  sphere.castShadow = true;
  scene.add(sphere);
  sphere.position.copy(intersectionPoint);

  //Sphere body
  const spherePhyMat = new CANNON.Material();
  const sphereBody = new CANNON.Body({
    shape: new CANNON.Sphere(0.5),
    mass: 1,
    type: CANNON.Body.DYNAMIC,
    material: spherePhyMat,
  });
  sphereBody.linearDamping = 0.31;
  sphereBody.position.copy(intersectionPoint);
  world.addBody(sphereBody);

  // Contact material
  const groundSphereContactMat = new CANNON.ContactMaterial(
    groundPhysMat,
    spherePhyMat,
    { restitution: 0.99, contactEquationStiffness: 1000 },
  );

  world.addContactMaterial(groundSphereContactMat);

  spheres.push(sphere);
  bodies.push(sphereBody);
});

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
  world.step(timeStep);
  //Fuse mesh with physics body
  floor.position.copy(groundBody.position);
  floor.quaternion.copy(groundBody.quaternion);

  for (let i = 0; i < bodies.length; i++) {
    spheres[i].position.copy(bodies[i].position);
    spheres[i].quaternion.copy(bodies[i].quaternion);
  }

  renderer.render(scene, camera);
  window.requestAnimationFrame(loop);
};

loop();
