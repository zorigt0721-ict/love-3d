import * as THREE from 'https://unpkg.com/three@0.161.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.161.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.161.0/examples/jsm/loaders/GLTFLoader.js';
import { FontLoader } from 'https://unpkg.com/three@0.161.0/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'https://unpkg.com/three@0.161.0/examples/jsm/geometries/TextGeometry.js';
import gsap from 'https://cdn.skypack.dev/gsap@3.12.5';
import ScrollTrigger from 'https://cdn.skypack.dev/gsap@3.12.5/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Scene setup --------------------------------------------------------------
const canvas = document.getElementById('love-canvas');
const scene = new THREE.Scene();
scene.background = null;

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.6, 6);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = false;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 2.5;
controls.maxDistance = 12;
controls.target.set(0, 1.2, 0);
controls.update();

// Lighting ----------------------------------------------------------------
const hemiLight = new THREE.HemisphereLight(0xffbfd0, 0x0b0e14, 0.6);
hemiLight.position.set(0, 5, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffc6de, 1.0);
dirLight.position.set(-3, 5, 4);
dirLight.castShadow = false;
scene.add(dirLight);

// Floating bokeh spheres ---------------------------------------------------
const bubbles = new THREE.Group();
const bubbleMaterial = new THREE.MeshStandardMaterial({
  color: 0xffa9c6,
  transparent: true,
  opacity: 0.45,
  metalness: 0.1,
  roughness: 0.25,
});

for (let i = 0; i < 36; i++) {
  const radius = THREE.MathUtils.randFloat(0.15, 0.45);
  const geometry = new THREE.IcosahedronGeometry(radius, 1);
  const mesh = new THREE.Mesh(geometry, bubbleMaterial.clone());
  mesh.position.set(
    THREE.MathUtils.randFloatSpread(8),
    THREE.MathUtils.randFloat(0.5, 5),
    THREE.MathUtils.randFloatSpread(8)
  );
  mesh.material.opacity = THREE.MathUtils.randFloat(0.25, 0.55);
  mesh.userData = {
    floatOffset: Math.random() * Math.PI * 2,
    floatSpeed: THREE.MathUtils.randFloat(0.3, 0.6),
    rotationSpeed: new THREE.Vector3().setFromSphericalCoords(
      THREE.MathUtils.randFloat(0.01, 0.05),
      Math.random() * Math.PI,
      Math.random() * Math.PI
    ),
    baseY: mesh.position.y,
  };
  bubbles.add(mesh);
}
scene.add(bubbles);

// Heart model --------------------------------------------------------------
const heartGroup = new THREE.Group();
heartGroup.position.set(0, 1.2, 0);
scene.add(heartGroup);

const loader = new GLTFLoader();
loader.load(
  '/public/heart.glb',
  (gltf) => {
    const heart = gltf.scene;
    heart.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: 0xff5a87,
          roughness: 0.35,
          metalness: 0.25,
          emissive: new THREE.Color(0xff2e63),
          emissiveIntensity: 0.12,
        });
        child.castShadow = false;
        child.receiveShadow = false;
      }
    });
    heart.scale.setScalar(1.4);
    heart.position.set(0, 0, 0);
    heartGroup.add(heart);
  },
  undefined,
  () => {
    // Fallback: procedurally extruded heart shape
    const shape = new THREE.Shape();
    const x = 0;
    const y = 0;
    shape.moveTo(x, y + 0.5);
    shape.bezierCurveTo(x - 1.5, y + 2.1, x - 3, y - 0.8, x, y - 1.8);
    shape.bezierCurveTo(x + 3, y - 0.8, x + 1.5, y + 2.1, x, y + 0.5);

    const extrudeSettings = {
      steps: 20,
      depth: 0.6,
      bevelEnabled: true,
      bevelThickness: 0.35,
      bevelSize: 0.25,
      bevelSegments: 10,
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();
    const material = new THREE.MeshStandardMaterial({
      color: 0xff5a87,
      roughness: 0.35,
      metalness: 0.25,
      emissive: new THREE.Color(0xff3b6f),
      emissiveIntensity: 0.1,
    });
    const heartMesh = new THREE.Mesh(geometry, material);
    heartMesh.scale.setScalar(0.8);
    heartMesh.position.set(0, 0, 0);
    heartGroup.add(heartMesh);
  }
);

// Optional: floating 3D text ----------------------------------------------
const fontLoader = new FontLoader();
fontLoader.load(
  '/public/font/Inter-Bold.typeface.json',
  (font) => {
    const geometry = new TextGeometry('LOVE', {
      font,
      size: 0.4,
      height: 0.08,
      curveSegments: 6,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.015,
      bevelSegments: 5,
    });
    geometry.computeBoundingBox();
    geometry.center();

    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.25,
      metalness: 0.4,
      emissive: new THREE.Color(0x1f1f50),
      emissiveIntensity: 0.05,
    });
    const textMesh = new THREE.Mesh(geometry, material);
    textMesh.position.set(0, 1.2, -0.6);
    textMesh.rotation.x = -0.2;
    heartGroup.add(textMesh);
  },
  undefined,
  () => {
    // Font missing; skip silently to keep experience intact.
  }
);

// Scroll-triggered story beats -------------------------------------------
const sections = Array.from(document.querySelectorAll('.panel'));
const cameraPositions = [
  { position: new THREE.Vector3(0, 1.8, 6.2), target: new THREE.Vector3(0, 1.2, 0) },
  { position: new THREE.Vector3(-2.4, 1.6, 4.8), target: new THREE.Vector3(0, 1.4, 0) },
  { position: new THREE.Vector3(2.5, 1.9, 4.3), target: new THREE.Vector3(0, 1.3, 0) },
  { position: new THREE.Vector3(0, 1.5, 3.2), target: new THREE.Vector3(0, 1.3, 0) },
];

const storyTimeline = gsap.timeline({
  scrollTrigger: {
    trigger: document.body,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
  },
});

cameraPositions.forEach((beat, index) => {
  const duration = index === cameraPositions.length - 1 ? 1 : 0.9;
  storyTimeline.to(
    camera.position,
    {
      x: beat.position.x,
      y: beat.position.y,
      z: beat.position.z,
      duration,
      ease: 'power1.inOut',
      onUpdate: () => controls.update(),
    },
    index
  );

  storyTimeline.to(
    controls.target,
    {
      x: beat.target.x,
      y: beat.target.y,
      z: beat.target.z,
      duration,
      ease: 'power1.inOut',
    },
    index
  );

  storyTimeline.to(
    bubbles.rotation,
    {
      y: `+=${Math.PI * 1.2}`,
      duration,
      ease: 'power1.inOut',
    },
    index
  );
});

// Finale heart pulse ------------------------------------------------------
storyTimeline.to(
  heartGroup.scale,
  {
    x: 1.1,
    y: 1.1,
    z: 1.1,
    duration: 0.6,
    ease: 'power1.inOut',
    yoyo: true,
    repeat: -1,
  },
  cameraPositions.length - 1
);

// Responsive handling -----------------------------------------------------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Idle animation loop -----------------------------------------------------
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();

  heartGroup.rotation.y += 0.0025;
  heartGroup.position.y = 1.2 + Math.sin(elapsed * 0.8) * 0.18;

  bubbles.children.forEach((bubble) => {
    const { floatOffset, floatSpeed, rotationSpeed } = bubble.userData;
    const t = elapsed * floatSpeed + floatOffset;
    bubble.position.y = bubble.userData.baseY + Math.sin(t) * 0.9;
    bubble.rotation.x += rotationSpeed.x * 0.01;
    bubble.rotation.y += rotationSpeed.y * 0.01;
    bubble.rotation.z += rotationSpeed.z * 0.01;
  });

  controls.update();
  renderer.render(scene, camera);
}

animate();

// Scroll reveal tweaks -----------------------------------------------------
sections.forEach((section) => {
  gsap.fromTo(
    section.querySelector('.content'),
    { autoAlpha: 0, y: 60 },
    {
      autoAlpha: 1,
      y: 0,
      duration: 1.2,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: section,
        start: 'top 75%',
      },
    }
  );
});

// Share button ------------------------------------------------------------
const shareButton = document.getElementById('share-button');
shareButton?.addEventListener('click', async () => {
  const shareData = {
    title: 'Our 3D Love Journey',
    text: 'Take a stroll through our immersive love story. 💞',
    url: window.location.href,
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (error) {
      console.warn('Share cancelled or failed', error);
    }
  } else {
    alert('Copy this link to share our love: ' + window.location.href);
  }
});

// Accessibility: ensure keyboard focus on sections ------------------------
sections.forEach((section) => {
  section.setAttribute('tabindex', '0');
});
