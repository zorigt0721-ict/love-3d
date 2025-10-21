import * as THREE from 'https://cdn.skypack.dev/three@0.158.0';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.158.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.158.0/examples/jsm/controls/OrbitControls.js';
import { FontLoader } from 'https://cdn.skypack.dev/three@0.158.0/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'https://cdn.skypack.dev/three@0.158.0/examples/jsm/geometries/TextGeometry.js';
import gsap from 'https://cdn.skypack.dev/gsap@3.12.5';
import ScrollTrigger from 'https://cdn.skypack.dev/gsap@3.12.5/ScrollTrigger.js';

gsap.registerPlugin(ScrollTrigger);

// Canvas & renderer setup
const canvas = document.getElementById('love-canvas');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;

// Scene & camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.2, 6);

// Orbit controls (no panning for focus on story)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.maxPolarAngle = Math.PI * 0.85;
controls.minDistance = 1.5;
controls.maxDistance = 8;

// Romantic lighting setup
const hemiLight = new THREE.HemisphereLight(0xffb4f5, 0x0b0e14, 0.6);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xff7ab2, 1.1);
dirLight.position.set(3, 5, 2);
dirLight.castShadow = false;
scene.add(dirLight);

// Heart centerpiece
const heartGroup = new THREE.Group();
scene.add(heartGroup);

const standardMaterial = new THREE.MeshStandardMaterial({
  color: 0xff6ba0,
  metalness: 0.1,
  roughness: 0.35,
  emissive: 0x360728,
  emissiveIntensity: 0.4,
});

function createFallbackHeart() {
  // Extrude a simple 2D heart shape into 3D geometry
  const x = 0;
  const y = 0;
  const heartShape = new THREE.Shape();
  heartShape.moveTo(x + 0, y + 0.5);
  heartShape.bezierCurveTo(x + 0, y + 0.5, x - 0.35, y + 0.95, x - 0.7, y + 0.5);
  heartShape.bezierCurveTo(x - 1.4, y - 0.3, x + 0, y - 1.1, x + 0, y - 1.6);
  heartShape.bezierCurveTo(x + 0, y - 1.1, x + 1.4, y - 0.3, x + 0.7, y + 0.5);
  heartShape.bezierCurveTo(x + 0.35, y + 0.95, x + 0, y + 0.5, x + 0, y + 0.5);

  const extrudeSettings = {
    steps: 32,
    depth: 0.6,
    bevelEnabled: true,
    bevelThickness: 0.12,
    bevelSize: 0.2,
    bevelSegments: 10,
  };

  const geometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
  geometry.center();

  const heartMesh = new THREE.Mesh(geometry, standardMaterial);
  heartMesh.castShadow = false;
  heartMesh.receiveShadow = false;
  heartMesh.scale.set(1.6, 1.6, 1.6);
  heartGroup.add(heartMesh);
}

function loadHeartModel() {
  return new Promise((resolve) => {
    const loader = new GLTFLoader();
    loader.load(
      '/public/heart.glb',
      (gltf) => {
        const model = gltf.scene;
        model.traverse((child) => {
          if (child.isMesh) {
            child.material = standardMaterial;
            child.castShadow = false;
            child.receiveShadow = false;
          }
        });
        model.scale.set(1.7, 1.7, 1.7);
        model.rotation.y = Math.PI;
        heartGroup.add(model);
        resolve(true);
      },
      undefined,
      () => {
        // Fallback to procedural heart if loading fails
        createFallbackHeart();
        resolve(false);
      }
    );
  });
}

async function initHeart() {
  const loaded = await loadHeartModel();
  if (!loaded) {
    console.info('Using fallback heart geometry.');
  }
}

initHeart();

// Optional floating text when font is available
const fontLoader = new FontLoader();
fontLoader.load(
  '/public/font/Inter-Bold.typeface.json',
  (font) => {
    const textGeometry = new TextGeometry('forever', {
      font,
      size: 0.35,
      height: 0.1,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.02,
      bevelSegments: 3,
    });
    textGeometry.center();

    const textMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.2,
      roughness: 0.5,
      emissive: 0x170520,
      emissiveIntensity: 0.6,
    });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.set(0, -1.6, 0);
    textMesh.rotation.x = -0.15;
    heartGroup.add(textMesh);
  },
  undefined,
  () => {
    console.info('Font not found, skipping floating text.');
  }
);

// Floating bokeh spheres
const bokehGroup = new THREE.Group();
scene.add(bokehGroup);

const bubbleMaterial = new THREE.MeshStandardMaterial({
  color: 0xf8aee2,
  transparent: true,
  opacity: 0.28,
  roughness: 0.15,
  metalness: 0,
});

const bubbleGeometry = new THREE.IcosahedronGeometry(0.18, 1);
for (let i = 0; i < 60; i += 1) {
  const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial.clone());
  const radius = 4 + Math.random() * 3;
  const angle = Math.random() * Math.PI * 2;
  const height = -1 + Math.random() * 4;
  bubble.position.set(
    Math.cos(angle) * radius,
    height,
    Math.sin(angle) * radius
  );
  const scale = 0.6 + Math.random() * 1.2;
  bubble.scale.setScalar(scale);
  bubble.material.opacity = 0.18 + Math.random() * 0.2;
  bokehGroup.add(bubble);
}

// Ambient fog for depth
scene.fog = new THREE.FogExp2(0x070910, 0.05);

// Camera story beats
const beats = [
  {
    position: { x: 0, y: 1.2, z: 6 },
    target: { x: 0, y: 0.6, z: 0 },
  },
  {
    position: { x: 3.2, y: 1.5, z: 4.5 },
    target: { x: 0.2, y: 0.8, z: 0 },
  },
  {
    position: { x: -2.4, y: 2.1, z: 3.5 },
    target: { x: 0, y: 1.1, z: 0 },
  },
  {
    position: { x: 0.3, y: 1.8, z: 2.8 },
    target: { x: 0, y: 0.9, z: 0 },
  },
];

const timeline = gsap.timeline({
  scrollTrigger: {
    trigger: '.scroll-container',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 1.2,
  },
});

beats.forEach((beat, index) => {
  timeline.to(
    camera.position,
    {
      x: beat.position.x,
      y: beat.position.y,
      z: beat.position.z,
      duration: 1,
      ease: 'power2.inOut',
    },
    index
  );
  timeline.to(
    controls.target,
    {
      x: beat.target.x,
      y: beat.target.y,
      z: beat.target.z,
      duration: 1,
      ease: 'power2.inOut',
      onUpdate: () => controls.update(),
    },
    index
  );
});

timeline.to(
  bokehGroup.rotation,
  {
    y: `+=${Math.PI * 2}`,
    ease: 'none',
    duration: beats.length,
  },
  0
);

// Finale heart pulse when reaching the last section
ScrollTrigger.create({
  trigger: '.panel--finale',
  start: 'top center',
  onEnter: () => {
    gsap.to(heartGroup.scale, {
      x: 1.15,
      y: 1.15,
      z: 1.15,
      duration: 1.2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
  },
});

// Idle animation parameters
const clock = new THREE.Clock();

function tick() {
  const elapsed = clock.getElapsedTime();

  heartGroup.rotation.y += 0.0015;
  heartGroup.position.y = Math.sin(elapsed * 0.6) * 0.08;

  bokehGroup.children.forEach((bubble, i) => {
    const floatSpeed = 0.4 + (i % 5) * 0.05;
    bubble.position.y += Math.sin(elapsed * floatSpeed + i) * 0.0008;
    bubble.rotation.y += 0.002;
  });

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);

// Handle resizing
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Share button functionality
const shareButton = document.getElementById('share-btn');
if (shareButton) {
  shareButton.addEventListener('click', async () => {
    const shareData = {
      title: '3D Love Journey',
      text: 'Float through our memories in this Noomo-inspired 3D love story.',
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.warn('Share cancelled or failed', error);
      }
    } else {
      window.alert('Sharing is not supported on this device, but the love still is!');
    }
  });
}
