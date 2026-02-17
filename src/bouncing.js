import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import * as dat from "dat.gui";
import * as CANNON from "cannon-es";
import side from "./assets/stars.jpg";
import cloud from "./assets/cloud.jpg";
import { EXRLoader } from "three/examples/jsm/Addons.js";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
// import checkers from "./assets/textures/textures/checkered_pavement_tiles_4k.gltf?url";
import displaceTex from "./assets/textures/checkers/checkered_pavement_tiles_disp_4k.png?url";
import normalTex from "./assets/textures/checkers/checkered_pavement_tiles_nor_gl_4k.exr?url";
import diffTex from "./assets/textures/checkers/checkered_pavement_tiles_diff_4k.jpg?url";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import fishModel from "./assets/scene.gltf?url";

const BACKGROUND_COLOR = "#9ba6ac";
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

renderer.setClearColor(BACKGROUND_COLOR, 1.0); //transparent
renderer.setSize(sizes.width, sizes.height);
renderer.render(scene, camera);
renderer.shadowMap.enabled = true;

const loader = new GLTFLoader();
loader.load(fishModel, function (glb) {
  const model = glb.scene;
  model.scale.set(520, 500, 500);
  model.position.y = 30;
  model.position.x = 100;
  model.rotation.y = -90;
  scene.add(model);
});

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
  position: new CANNON.Vec3(1, 30, 5),
  material: boxPhysMat,
});
// boxBody.position.set(0, 15, 0);
boxBody.angularVelocity.set(1, 5, 1);
boxBody.angularDamping = 0.3;
world.addBody(boxBody);

//Plane
const planeGeo = new THREE.CircleGeometry(100, 512);
const planeMat = new THREE.MeshStandardMaterial({
  color: "#f1d4d0",
  side: THREE.DoubleSide,
});
const textureLoader = new THREE.TextureLoader();
const exrLoader = new EXRLoader();
const texture = textureLoader.load(diffTex);
texture.repeat.set(5, 5);
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
planeMat.map = texture;
// planeMat.roughnessMap = roughnessTexture;

//Floor
const plane = new THREE.Mesh(planeGeo, planeMat);
plane.receiveShadow = true;
scene.add(plane);
//Ground body
const groundPhysMat = new CANNON.Material();
const groundBody = new CANNON.Body({
  shape: new CANNON.Plane(),
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

//Sphere
const sphereGeo = new THREE.SphereGeometry(3, 32, 32);
const sphereMat = new THREE.MeshStandardMaterial({
  color: "#61cf9a",
  roughness: 0.2,
});
const sphere = new THREE.Mesh(sphereGeo, sphereMat);
sphere.castShadow = true;
scene.add(sphere);
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

const groundSphereContactMat = new CANNON.ContactMaterial(
  groundPhysMat,
  spherePhyMat,
  { restitution: 1.5 },
);

world.addContactMaterial(groundBodyContactMat);
world.addContactMaterial(groundSphereContactMat);

scene.fog = new THREE.FogExp2("#9ba6ac", 0.007);

const spotlight = new THREE.SpotLight("#fff0bd", 10000);
spotlight.angle = 0.5;
spotlight.penumbra = 1;
spotlight.position.set(25, 25, 0);
spotlight.castShadow = true;
scene.add(spotlight);

const lightMesh = new THREE.Mesh(
  new THREE.SphereGeometry(1),
  new THREE.MeshStandardMaterial({
    color: "#fff0bd",
    emissive: "#fff0bd",
  }),
);
lightMesh.position.x = spotlight.position.x;
lightMesh.position.y = spotlight.position.y;
lightMesh.position.z = spotlight.position.z;
scene.add(lightMesh);

scene.add(new THREE.AmbientLight("#4f7b7d", 0.7));

//Raymarching
const uniforms = {
  u_time: { type: "f", value: 0.0 },
  u_eps: { value: 0.001 }, //Tolerance
  u_maxDistance: { value: 1000 },
  u_maxSteps: { value: 100 },

  u_clearColor: { value: THREE.Color(BACKGROUND_COLOR) },
  u_cam_pos: { value: camera.position },
  u_camToWorldMat: { value: camera.matrixWorld },
  u_camInvProjMat: { value: camera.projectionMatrixInverse },
};

const glsl = (x) => x[0];
const vertexShader = glsl`
out vec2 vUv;

void main(){
  vec2 worldPos = modelViewMatrix * vec4(position,1.0);
  vec3 viewDir = normalize(-worldPos.xyz);

  gl_Position = projectionMatrix * worldPos;

  vUv = uv;
}
`;
const fragmentShader = glsl`
  in vec2 vUv;

  uniform vec3 clearColor;

  uniform float u_eps;
  uniform float u_maxDistance;
  uniform int u_maxSteps;

  uniform vec3 u_cam_pos;
  uniform mat4 u_camToWorldMat;
  uniform mat4 u_camInvProjMat;
  uniform float u_time;

  float smin(float a, float b, float k){
    float h = clamp(0.5+ 0.5*(b-a)/k, 0.0,1.0);
    return mix(b,a,h)-k*h*(1.0-h);
  }

  float scene(vec3 p){
    float sphere1Distance = distance(p, vec3(cos(u_time),sin(u_time),0))-1.;
    float sphere2Distance = distance(p, vec3(sin(u_time),cos(u_time),0))-0.75;
    return smin ( sphere1Distance,, sphere2Distance, 0.5);
  }

  float rayMarch(vec3 ro, vec3 rd){
    float dist = 0.;
    float closestDistance;
    vec3 position;

    for (int i = 0; i < u_maxSteps; i++){
      position = ro + dist * rd; //New Position
      closestDistance = scene(position);//new scene distance

      if (closestDistance < u_eps || dist >= u_maxDistance) break;
      dist+=closestDistance;
    }
    return dist;
  }

`;

const rayMarchPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(),
  new CustomShaderMaterial({
    baseMaterial: THREE.MeshStandardMaterial,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: uniforms,
  }),
);
const width =
  camera.near *
  Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) *
  camera.aspect *
  2;
const height = width / camera.aspect;
rayMarchPlane.scale.set(width, height, 1);

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
