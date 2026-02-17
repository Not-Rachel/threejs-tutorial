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

camera.position.z = 5;
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
// const col = 20;
// const row = 20;
// const geo = new THREE.BoxGeometry(size * 2, size * 2, size * 2);
// const sphereGeo = new THREE.SphereGeometry(size);
// const mat = new THREE.MeshStandardMaterial({ color: "#64b8c3" });

const Nx = 15;
const Ny = 15;
const clothSize = 1;
const mass = 1;

const dist = clothSize / Nx;
const shape = new CANNON.Particle();
// const particles = {};
const particles = [];

for (let i = 0; i < Nx + 1; i++) {
  particles.push([]);
  for (let j = 0; j < Ny + 1; j++) {
    const particle = new CANNON.Body({
      mass,
      shape,
      position: new CANNON.Vec3(
        -(i - Nx * 0.5) * dist,
        (j - Ny * 0.5) * dist,
        0,
      ),
    });
    particles[i].push(particle);
    world.addBody(particle);
    if (i !== 0) {
      //connect to top
      const top = particles[i - 1][j];
      world.addConstraint(new CANNON.DistanceConstraint(particle, top));
    }
    if (j !== 0) {
      //connect to left
      const left = particles[i][j - 1];
      world.addConstraint(new CANNON.DistanceConstraint(particle, left));
    }
  }
}

const meshes = [];
const bodies = [];

let previous;

const clothGeo = new THREE.PlaneGeometry(2, 2, Nx, Ny);
const clothMat = new THREE.MeshStandardMaterial({
  side: THREE.DoubleSide,
  wireframe: true,
  color: "#b6e8ee",
});
const clothMesh = new THREE.Mesh(clothGeo, clothMat);
scene.add(clothMesh);
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
    // Reset cloth particles to initial state
    for (let i = 0; i < particles.length; i++) {
      for (let j = 0; j < particles[i].length; j++) {
        particles[i][j].velocity = new CANNON.Vec3(0, 0, 0);
      }
    }
  },
};

gui.add(obj, "reset");

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

  // Update cloth geometry from particle positions
  //   const positions = clothGeo.attributes.position.array;
  //   let index = 0;
  //   for (let i = 0; i < particles.length; i++) {
  //     for (let j = 0; j < particles[i].length; j++) {
  //       const particle = particles[i][j];
  //       positions[index * 3] = particle.position.x;
  //       positions[index * 3 + 1] = particle.position.y;
  //       positions[index * 3 + 2] = particle.position.z;
  //       index++;
  //     }
  //   }
  //   clothGeo.attributes.position.needsUpdate = true;

  //   for (let i = 0; i < bodies.length; i++) {
  //     meshes[i].position.copy(bodies[i].position);
  //     meshes[i].quaternion.copy(bodies[i].quaternion);
  //   }

  renderer.render(scene, camera);
  window.requestAnimationFrame(loop);
  //   slHelper.update();
};

loop();
