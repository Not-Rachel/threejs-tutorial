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

camera.position.z = 10;
// camera.position.x = -20;
const orbit = new OrbitControls(camera, renderer.domElement);

scene.add(camera);

//Add world
const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.81, 0),
});
const timeStep = 1 / 60;

renderer.setClearColor(0xffffff, 0.0); //transparent
renderer.setSize(sizes.width, sizes.height);
renderer.render(scene, camera);
renderer.shadowMap.enabled = true;

// Constraints
const size = 0.1;
const space = 0.2;
const mass = 1;
const col = 20;
const row = 20;
// const geo = new THREE.BoxGeometry(size * 2, size * 2, size * 2);
const sphereGeo = new THREE.SphereGeometry(size);
const mat = new THREE.MeshStandardMaterial({ color: "#64b8c3" });

const meshes = [];
const bodies = [];

const shape = new CANNON.Particle();
const particles = {};

let previous;
for (let i = 0; i < row; i++) {
  for (let j = 0; j < col; j++) {
    const particle = new CANNON.Body({
      mass,
      shape,
      position: new CANNON.Vec3(
        -(i - col * 0.5) * space,
        4,
        (j - row * 0.5) * space,
      ),
    });
    particles[`${i} ${j}`] = particle;
    world.addBody(particle);
    bodies.push(particle);

    const mesh = new THREE.Mesh(sphereGeo, mat);
    scene.add(mesh);
    meshes.push(mesh);

    // //Constraints!
    // if (previous) {
    //   const lockConstraint = new CANNON.LockConstraint(body, previous);
    //   world.addConstraint(lockConstraint);
    // }
    // a = particles[`${i - 1} ${j - 1}`];
    // b = particle;

    if (i !== 0) {
      //connect to top
      const top = particles[`${i - 1} ${j}`];
      world.addConstraint(new CANNON.DistanceConstraint(particle, top));
    }
    if (j !== 0) {
      //connect to left
      const left = particles[`${i} ${j - 1}`];
      world.addConstraint(new CANNON.DistanceConstraint(particle, left));
    }

    // const distanceConstraint = new CANNON.DistanceConstraint(a, b);

    // previous = body;
  }
}
// for (let i = 0; i < N; i++) {
//   const mesh = new THREE.Mesh(geo, mat);
//   const body = new CANNON.Body({
//     shape,
//     mass,
//     position: new CANNON.Vec3(-(N - i - N / 2) * (size * 2 + space * 2), 3, 0),
//   });

//   world.addBody(body);
//   scene.add(mesh);

//   meshes.push(mesh);
//   bodies.push(body);

//   //Constraints!
//   if (previous) {
//     const lockConstraint = new CANNON.LockConstraint(body, previous);
//     world.addConstraint(lockConstraint);
//   }

//   previous = body;
// }

//Static
const sphere = new CANNON.Body({
  mass: 0,
  shape: new CANNON.Sphere(1.5),
  position: new CANNON.Vec3(0, 0, 0),
});
const leftMesh = new THREE.Mesh(new THREE.SphereGeometry(1.5, 50, 50), mat);
scene.add(leftMesh);
world.addBody(sphere);
bodies.push(sphere);
meshes.push(leftMesh);

// const rightBody = new CANNON.Body({
//   mass: 0,
//   shape,
//   position: new CANNON.Vec3(-(N / 2) * (size * 2 + space * 2), 0, 0),
// });
// const rightMesh = new THREE.Mesh(geo, mat);
// scene.add(rightMesh);
// world.addBody(rightBody);

// bodies.push(rightBody);
// meshes.push(rightMesh);

scene.fog = new THREE.FogExp2(0x0f1f21, 0.01);

const spotlight = new THREE.SpotLight(0xfffffff, 10000);
spotlight.angle = 0.2;
spotlight.penumbra = 1;
spotlight.position.set(-50, 50, 0);
spotlight.castShadow = true;
scene.add(spotlight);

const ambient = new THREE.AmbientLight("#8a8b4b", 1);
scene.add(ambient);

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

gui.add(options, "height").onChange((e) => {
  sphereBody.position.y = e;
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

  for (let i = 0; i < bodies.length; i++) {
    meshes[i].position.copy(bodies[i].position);
    meshes[i].quaternion.copy(bodies[i].quaternion);
  }

  renderer.render(scene, camera);
  window.requestAnimationFrame(loop);
  //   slHelper.update();
};

loop();
