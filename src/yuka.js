import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import * as YUKA from "yuka";
import * as dat from "dat.gui";
import side from "./assets/stars.jpg";

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

scene.add(new THREE.GridHelper(20, 20));
scene.add(camera);

renderer.setClearColor(0xffffff, 0.0); //transparent
renderer.setSize(sizes.width, sizes.height);
renderer.render(scene, camera);
renderer.shadowMap.enabled = true;

// AI
const carGeo = new THREE.ConeGeometry(0.5, 1.0, 32, 8).rotateX(Math.PI / 2);
carGeo.computeBoundingSphere();

const carMesh = new THREE.Mesh(carGeo, new THREE.MeshNormalMaterial());

carMesh.matrixAutoUpdate = false; // let Yuka handle all animations
scene.add(carMesh);

//Target
const targetMesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.25, 32, 32),
  new THREE.MeshBasicMaterial({ color: "#b9df4a" }),
);
scene.add(targetMesh);

const car = new YUKA.Vehicle();
car.boundingRadius = carGeo.boundingSphere.radius;
car.setRenderComponent(carMesh, sync);
car.maxSpeed = 4;
car.smoother = new YUKA.Smoother(20);

function sync(entity, renderComponent) {
  renderComponent.matrix.copy(entity.worldMatrix);
}

const target = new YUKA.GameEntity();
target.setRenderComponent(targetMesh, sync);
//PATH
const path = new YUKA.Path();
path.add(new YUKA.Vector3(-4, 0, 4));
path.add(new YUKA.Vector3(-6, 0, 0));
path.add(new YUKA.Vector3(-4, 0, -4));
path.add(new YUKA.Vector3(0, 0, 0));
path.add(new YUKA.Vector3(4, 0, -4));
path.add(new YUKA.Vector3(6, 0, 0));
path.add(new YUKA.Vector3(4, 0, 4));
path.add(new YUKA.Vector3(0, 0, 6));
path.loop = true;

//Follow
car.position.copy(path.current());

const followPathBehavior = new YUKA.FollowPathBehavior(path, 0.5); //When vehical should change direction smoothly
car.steering.add(followPathBehavior);

const onPathBehavior = new YUKA.OnPathBehavior(path);
onPathBehavior.radius = 8;
car.steering.add(onPathBehavior);

const entityManager = new YUKA.EntityManager();
entityManager.add(car);
entityManager.add(target);

const boxGeo = new THREE.BoxGeometry(0.5, 2, 0.5, 3, 3, 3);
boxGeo.computeBoundingSphere();
const obstacleMesh = new THREE.Mesh(
  boxGeo,
  new THREE.MeshBasicMaterial({ color: "#9e4028", wireframe: true }),
);
scene.add(obstacleMesh);

const obstacle = new YUKA.GameEntity();
obstacle.boundingRadius = boxGeo.boundingSphere.radius;
//obstacle.setRenderComponent(obstacleMesh);
obstacle.position.copy(obstacleMesh.position);
entityManager.add(obstacle);

const obstacles = [obstacle];

const obstacleAvoidanceBehavior = new YUKA.ObstacleAvoidanceBehavior(obstacles);
car.steering.add(obstacleAvoidanceBehavior);

const position = [];
for (let i = 0; i < path._waypoints.length; i++) {
  const waypoint = path._waypoints[i];
  position.push(waypoint.x, waypoint.y, waypoint.z);
}

const lineGeometery = new THREE.BufferGeometry();
lineGeometery.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(position, 3),
);
const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
const lines = new THREE.LineLoop(lineGeometery, lineMaterial);
scene.add(lines);

const time = new YUKA.Time();

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
