import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import * as YUKA from "yuka";
import * as dat from "dat.gui";
import side from "./assets/stars.jpg";
import { add } from "three/tsl";

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
// orbit.enablePan = false;
// orbit.autoRotate = true;
// orbit.enableRotate = false;

scene.add(new THREE.GridHelper(20, 20));
scene.add(camera);

renderer.setClearColor(0xffffff, 0.0); //transparent
renderer.setSize(sizes.width, sizes.height);
renderer.render(scene, camera);
renderer.shadowMap.enabled = true;

function sync(entity, renderComponent) {
  renderComponent.matrix.copy(entity.worldMatrix);
}

// AI
const carMesh = new THREE.Mesh(
  new THREE.ConeGeometry(0.5, 1.0, 32, 8).rotateX(Math.PI / 2),
  new THREE.MeshNormalMaterial(),
);
carMesh.matrixAutoUpdate = false; // let Yuka handle all animations
scene.add(carMesh);

//Target
const targetMesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.25, 32, 32),
  new THREE.MeshBasicMaterial({ color: "#b9df4a" }),
);
targetMesh.matrixAutoUpdate = false;
scene.add(targetMesh);
//Target
const evilMesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.5, 3, 2),
  new THREE.MeshBasicMaterial({ color: "#ff5e28" }),
);
evilMesh.matrixAutoUpdate = false;
scene.add(evilMesh);

//Moving Entity
const car = new YUKA.Vehicle();
car.setRenderComponent(carMesh, sync);
car.maxSpeed = 6;

const target = new YUKA.GameEntity();
target.setRenderComponent(targetMesh, sync);

const evil = new YUKA.Vehicle();
evil.setRenderComponent(evilMesh, sync);
evil.maxSpeed = 9;

const planeMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.MeshBasicMaterial({ color: "#362f2f" }),
);
planeMesh.rotateX(-Math.PI / 2);
planeMesh.name = "plane";
scene.add(planeMesh);

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
car.steering.add(seekBehavior);
//Pursuit
const pursuitBehavior = new YUKA.PursuitBehavior(evil);
evil.steering.add(pursuitBehavior);

const evaderTarget = new YUKA.Vector3();
const seekBehavior2 = new YUKA.SeekBehavior(target.position);
evil.steering.add(seekBehavior2);

//Wander Behavior
const wanderBehavior = new YUKA.WanderBehavior(7);
// car.steering.add(wanderBehavior);

//Flee behavior
const fleeBehavior = new YUKA.FleeBehavior(evil.position, 4);
car.steering.add(fleeBehavior);
const entityManager = new YUKA.EntityManager();
entityManager.add(car);
entityManager.add(target);
entityManager.add(evil);

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
