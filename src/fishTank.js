import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import * as YUKA from "yuka";
import * as dat from "dat.gui";
import side from "./assets/stars.jpg";
import { add } from "three/tsl";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import fishModel from "./assets/scene.gltf?url";

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

renderer.setClearColor(0xffffff, 0.0); //transparent
renderer.setSize(sizes.width, sizes.height);
renderer.render(scene, camera);
renderer.shadowMap.enabled = true;

function sync(entity, renderComponent) {
  renderComponent.matrix.copy(entity.worldMatrix);
}

const fish = new YUKA.Vehicle();
fish.maxSpeed = 6;

//Model
const loader = new GLTFLoader();
loader.load(fishModel, function (glb) {
  const model = glb.scene;
  //   model.scale.set(10, 10, 10);
  //   model.position.y = 5;
  model.matrixAutoUpdate = false;
  fish.setRenderComponent(model, sync);
  fish.scale = new YUKA.Vector3(10, 10, 10);
  fish.position = new YUKA.Vector3(0, 0, 0);

  scene.add(model);
});

// AI
// const carMesh = new THREE.Mesh(
//   new THREE.ConeGeometry(0.5, 1.0, 32, 8).rotateX(Math.PI / 2),
//   new THREE.MeshNormalMaterial(),
// );
// carMesh.matrixAutoUpdate = false; // let Yuka handle all animations
// scene.add(carMesh);

//Target
const targetMesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.25, 32, 32),
  new THREE.MeshBasicMaterial({ color: "#b9df4a" }),
);
targetMesh.matrixAutoUpdate = false;
scene.add(targetMesh);
//Target
// const evilMesh = new THREE.Mesh(
//   new THREE.SphereGeometry(0.5, 3, 2),
//   new THREE.MeshBasicMaterial({ color: "#ff5e28" }),
// );
// evilMesh.matrixAutoUpdate = false;
// scene.add(evilMesh);

//Moving Entity

const target = new YUKA.GameEntity();
target.setRenderComponent(targetMesh, sync);

// const evil = new YUKA.Vehicle();
// evil.setRenderComponent(evilMesh, sync);
// evil.maxSpeed = 9;

// const planeMesh = new THREE.Mesh(
//   new THREE.PlaneGeometry(20, 20),
//   new THREE.MeshBasicMaterial({ color: "#362f2f" }),
// );
// planeMesh.rotateX(-Math.PI / 2);
// planeMesh.name = "plane";
// scene.add(planeMesh);

const tankMesh = new THREE.Mesh(
  new THREE.BoxGeometry(30, 10, 30),
  new THREE.MeshStandardMaterial({
    color: "#3294d5",
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
  }),
);
scene.add(tankMesh);

// Create tank walls as obstacles
const tankHalfWidth = 15;
const tankHalfHeight = 5;
const tankHalfDepth = 15;

const boxGeo = new THREE.BoxGeometry(30, 0.1, 30);
boxGeo.computeBoundingSphere();
const obstacleMesh = new THREE.Mesh(
  boxGeo,
  new THREE.MeshBasicMaterial({ color: "#9e4028", wireframe: true }),
);
scene.add(obstacleMesh);

const obstacle = new YUKA.GameEntity();
obstacle.boundingRadius = boxGeo.boundingSphere.radius;

const walls = [];

// Front wall
const frontWall = new YUKA.GameEntity();
frontWall.boundingRadius = boxGeo.boundingSphere.radius;
walls.push(frontWall);

// Back wall
const backWall = new YUKA.GameEntity();
backWall.position = new YUKA.Vector3(0, tankHalfHeight, -tankHalfDepth);
backWall.radius = 2;
walls.push(backWall);

// Left wall
const leftWall = new YUKA.GameEntity();
leftWall.position = new YUKA.Vector3(-tankHalfWidth, tankHalfHeight, 0);
leftWall.radius = 2;
walls.push(leftWall);

// Right wall
const rightWall = new YUKA.GameEntity();
rightWall.position = new YUKA.Vector3(tankHalfWidth, tankHalfHeight, 0);
rightWall.radius = 2;
walls.push(rightWall);

const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

window.addEventListener("click", (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersections = raycaster.intersectObjects(scene.children);

  intersections.forEach((intersection) => {
    if (intersection.object.name === "plane") {
      evilMesh.position.set(intersection.point.x, 0, intersection.point.z);
      evil.position.set(intersection.point.x, 0, intersection.point.z);
    }
  });
});

setInterval(function () {
  target.position.set(
    Math.random() * 20 - 10,
    Math.random() * 5,
    Math.random() * 20 - 10,
  );
}, 5000);
const time = new YUKA.Time();

//Seek behavior
const seekBehavior = new YUKA.SeekBehavior(target.position, 2, 1);
// car.steering.add(seekBehavior);
//Pursuit
// const pursuitBehavior = new YUKA.PursuitBehavior(evil);
// evil.steering.add(pursuitBehavior);

const evaderTarget = new YUKA.Vector3();
const seekBehavior2 = new YUKA.SeekBehavior(target.position);
// evil.steering.add(seekBehavior2);

//Wander Behavior
const wanderBehavior = new YUKA.WanderBehavior();
wanderBehavior.jitter = 5;
fish.steering.add(wanderBehavior);

// Obstacle Avoidance Behavior
// const obstacleAvoidanceBehavior = new YUKA.ObstacleAvoidanceBehavior(walls);
// fish.steering.add(obstacleAvoidanceBehavior);

//Flee behavior
// const fleeBehavior = new YUKA.FleeBehavior(evil.position, 4);
// car.steering.add(fleeBehavior);
const entityManager = new YUKA.EntityManager();
entityManager.add(fish);
entityManager.add(target);
// entityManager.add(evil);

// for (let i = 0; i < 50; i++) {
//   // AI
//   const vehicalMesh = new THREE.Mesh(
//     new THREE.ConeGeometry(0.5, 1.0, 32, 8).rotateX(Math.PI / 2),
//     new THREE.MeshNormalMaterial(),
//   );
//   vehicalMesh.matrixAutoUpdate = false; // let Yuka handle all animations
//   scene.add(vehicalMesh);
//   //Moving Entity
//   const vehical = new YUKA.Vehicle();
//   vehical.setRenderComponent(vehicalMesh, sync);
//   vehical.maxSpeed = Math.random() * 6 + 2;
//   vehical.steering.add(wanderBehavior);

//   entityManager.add(vehical);
// }

const spotlight = new THREE.SpotLight(0xfffffff);
spotlight.intensity = 10000;
spotlight.angle = 0.2;
spotlight.penumbra = 1;
spotlight.position.set(-50, 50, 0);
spotlight.castShadow = true;
scene.add(spotlight);
const spotlight2 = new THREE.SpotLight("#bc89ff");
spotlight2.intensity = 10000;
spotlight2.angle = 0.2;
spotlight2.penumbra = 1;
spotlight2.position.set(50, -50, 10);
spotlight2.castShadow = true;
scene.add(spotlight2);

const backlight = new THREE.PointLight("#00ff99", 1000);
backlight.position.set(-20, -20, -20);
const backlight2 = new THREE.PointLight("#ff77f4", 1000);
backlight2.position.set(20, 20, -20);
scene.add(backlight2);
const backlight3 = new THREE.PointLight("#6b2cff", 1000);
backlight3.position.set(0, -20, 10);
scene.add(backlight3);

const gui = new dat.GUI();

window.addEventListener("resize", () => {
  //update size
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
});

const loop = () => {
  const delta = time.update().getDelta();
  entityManager.update(delta);
  renderer.render(scene, camera);
  window.requestAnimationFrame(loop);
};

loop();
