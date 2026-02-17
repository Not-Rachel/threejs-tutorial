import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import * as dat from "dat.gui";
import star from "./assets/star.jpg";
import cloud from "./assets/cloud.jpg";
import vertexShader from "./shaders/vertex.js";
import fragmentShader from "./shaders/fragment.js";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import {
  EffectComposer,
  RenderPass,
  AfterimagePass,
  UnrealBloomPass,
} from "three/examples/jsm/Addons.js";
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
// orbit.update();
const orbit = new OrbitControls(camera, renderer.domElement);
renderer.setClearColor(0x0, 1.0);
renderer.setSize(sizes.width, sizes.height);
renderer.render(scene, camera);
renderer.shadowMap.enabled = true;

scene.add(camera);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.2,
  0.1,
  0.1,
);
composer.addPass(bloomPass);
// composer.addPass(new AfterimagePass(0.7));

//Shaders
const uniforms = {
  u_time: { type: "f", value: 0.0 },
  u_resolution: {
    type: "v2",
    value: new THREE.Vector2(
      window.innerWidth,
      window.innerHeight,
    ).multiplyScalar(window.devicePixelRatio),
  },
  //   u_mouse: { type: "v2", value: new THREE.Vector2(0.0, 0.0) },
  //   image: { type: "t", value: new THREE.TextureLoader().load(cloud) },
};

window.addEventListener("mousemove", function (e) {
  uniforms.u_mouse.value.set(
    e.screenX / this.window.innerWidth,
    1 - e.screenY / this.window.innerWidth,
  );
});

const geo = new THREE.TorusGeometry(2, 0.3, 200, 200);
const material = new CustomShaderMaterial({
  baseMaterial: THREE.MeshStandardMaterial,
  roughness: 0.1,
  color: "#d8afea",
  metalness: 0.6,
  vertexShader: vertexShader,
  fragmentShader: fragmentShader,
  uniforms: uniforms,
});

const mesh = new THREE.Mesh(geo, material);
scene.add(mesh);

const spotlight = new THREE.SpotLight("#54a1bb");
spotlight.intensity = 10000;
spotlight.angle = 0.2;
spotlight.penumbra = 1;
spotlight.position.set(-50, 50, 10);
spotlight.castShadow = true;
scene.add(spotlight);

const pointLight = new THREE.PointLight("#ffffff", 100);
pointLight.position.set(10, 10, 20);
pointLight.castShadow = true;
scene.add(pointLight);

const backlight = new THREE.PointLight(0xf55742, 1, 100);
backlight.position.set(-10, -10, -10);
backlight.intensity = 100;
scene.add(backlight);

// const ambient = new THREE.AmbientLight("#031814", 1.0);
// scene.add(ambient);
const gui = new dat.GUI();

scene.fog = new THREE.FogExp2(0x0f1f21, 0.01);

window.addEventListener("resize", () => {
  //update size
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
});

const clock = new THREE.Clock();
const loop = () => {
  uniforms.u_time.value = clock.getElapsedTime();
  //   renderer.render(scene, camera);
  composer.render([]); // Render through effect composer

  window.requestAnimationFrame(loop);
};

loop();
