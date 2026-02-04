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

//Plane
const planeMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.MeshBasicMaterial({
    color: 0x31212a,
    side: THREE.DoubleSide,
    visible: false,
  }),
);
planeMesh.rotateX(-Math.PI / 2);
planeMesh.name = "ground";
scene.add(planeMesh);

//Grid Helper
const grid = new THREE.GridHelper(20, 20);
scene.add(grid);

// Hightlight Square
const highlightMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1),
  new THREE.MeshBasicMaterial({
    side: THREE.DoubleSide,
    transparent: true,
  }),
);
highlightMesh.position.set(0.5, 0.0, 0.5);
highlightMesh.rotateX(-Math.PI / 2);

// Raycast to find tile
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
let intersects;
let highlightPos = new THREE.Vector3(0.0, 0.0, 0.0);
let mouseDown = false;
let dragged = false;
let animateSphere;

window.addEventListener("mousedown", (e) => {
  mouseDown = true;
});

window.addEventListener("mousemove", (e) => {
  if (mouseDown) dragged = true;
});

window.addEventListener("mouseup", (e) => {
  mouseDown = false;
});

window.addEventListener("mousemove", function (e) {
  mouse.x = (e.clientX / this.window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / this.window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  intersects = raycaster.intersectObjects(scene.children);
  //   console.log({ mouse });
  intersects.forEach((intersect) => {
    if (intersect.object.name === "ground") {
      //Finds the square position
      highlightPos = new THREE.Vector3()
        .copy(intersect.point)
        .floor()
        .addScalar(0.5);
      highlightMesh.position.set(highlightPos.x, 0.0, highlightPos.z);
    }
  });

  animateSphere = meshes.get(`${highlightPos.x},${highlightPos.z}`);
});
scene.add(highlightMesh);

const meshes = new Map();

window.addEventListener("click", (e) => {
  if (dragged) {
    dragged = false; //End of drag should not count to click
    return;
  }
  if (meshes.has(`${highlightPos.x},${highlightPos.z}`)) return;
  const sphereMesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.45, 0),
    new THREE.MeshBasicMaterial({
      color: 0x20f9a8,
      wireframe: true,
    }),
  );

  sphereMesh.position.set(highlightPos.x, 0.5, highlightPos.z);
  meshes.set(`${highlightPos.x},${highlightPos.z}`, sphereMesh);
  console.log(`${highlightPos.x},${highlightPos.z}`);
  scene.add(sphereMesh);
  animateSphere = sphereMesh;
});

//Lights
const spotlight = new THREE.SpotLight(0xfffffff);
spotlight.intensity = 10000;
spotlight.angle = 0.2;
spotlight.penumbra = 1;
spotlight.position.set(-50, 50, 0);
spotlight.castShadow = true;
scene.add(spotlight);

scene.fog = new THREE.FogExp2(0x0f1f21, 0.01);

const gui = new dat.GUI();

window.addEventListener("resize", () => {
  //update size
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
});

const loop = (time) => {
  if (animateSphere) {
    animateSphere.rotation.y += 0.01;
    animateSphere.rotation.x += 0.01;
    // animateSphere.position.y = 0.5 + 0.25 * Math.abs(Math.sin(time / 1000));
  }
  highlightMesh.material.opacity = 1 + Math.sin(time / 240);
  renderer.render(scene, camera);
  window.requestAnimationFrame(loop);
};
// renderer.setAnimationLoop(loop);
loop();
