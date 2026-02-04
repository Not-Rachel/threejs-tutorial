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
const carMesh = new THREE.Mesh(
  new THREE.ConeGeometry(0.5, 1.0, 32, 8).rotateX(Math.PI / 2),
  new THREE.MeshNormalMaterial(),
);
carMesh.matrixAutoUpdate = false; // let Yuka handle all animations
scene.add(carMesh);

const car = new YUKA.Vehicle();
car.setRenderComponent(carMesh, sync);

function sync(entity, renderComponent) {
  renderComponent.matrix.copy(entity.worldMatrix);
}

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

//Follow
car.position.copy(path.current());

const followPathBehavior = new YUKA.FollowPathBehavior(path, 0.5); //When vehical should change direction smoothly
car.steering.add(followPathBehavior);

const entityManager = new YUKA.EntityManager();
entityManager.add(car);

const position = [];

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
