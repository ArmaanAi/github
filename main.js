import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// --- Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x00050a);
scene.fog = new THREE.FogExp2(0x00050a, 0.015);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.y = 1.6;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ReinhardToneMapping;
document.body.appendChild(renderer.domElement);

// --- Post-Processing ---
const renderScene = new RenderPass(scene, camera);

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.2;
bloomPass.strength = 1.2;
bloomPass.radius = 0.5;

const outputPass = new OutputPass();

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);
composer.addPass(outputPass);

// --- Controls ---
const controls = new PointerLockControls(camera, document.body);

const startButton = document.getElementById('start-button');
const storyOverlay = document.getElementById('story-overlay');
const instructions = document.getElementById('instructions');

startButton.addEventListener('click', () => {
    controls.lock();
});

controls.addEventListener('lock', () => {
    storyOverlay.style.display = 'none';
    instructions.style.display = 'block';
});

controls.addEventListener('unlock', () => {
    storyOverlay.style.display = 'flex';
    instructions.style.display = 'none';
});

scene.add(controls.object);

const moveState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    canJump: false
};

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

const onKeyDown = (event) => {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveState.forward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveState.left = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveState.backward = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveState.right = true;
            break;
        case 'Space':
            if (moveState.canJump === true) velocity.y += 30;
            moveState.canJump = false;
            break;
    }
};

const onKeyUp = (event) => {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveState.forward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveState.left = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveState.backward = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveState.right = false;
            break;
    }
};

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0x0a0a20, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0x00ffff, 2, 100);
pointLight.position.set(0, 10, 0);
scene.add(pointLight);

// --- Environment ---
// Floor Grid
const gridHelper = new THREE.GridHelper(1000, 100, 0x00ffff, 0x002222);
scene.add(gridHelper);

// Neon Pillars
const pillarGeometry = new THREE.BoxGeometry(1, 10, 1);
const pillarMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });

for (let i = 0; i < 50; i++) {
    const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
    pillar.position.x = (Math.random() - 0.5) * 200;
    pillar.position.z = (Math.random() - 0.5) * 200;
    pillar.position.y = 5;
    scene.add(pillar);

    // Add a light to some pillars
    if (Math.random() > 0.8) {
        const pLight = new THREE.PointLight(0xff00ff, 1, 20);
        pLight.position.copy(pillar.position);
        pLight.position.y = 10;
        scene.add(pLight);
    }
}

// Power Cores (Cubes)
const coreGeometry = new THREE.BoxGeometry(1, 1, 1);
const coreMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff });

for (let i = 0; i < 10; i++) {
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.position.x = (Math.random() - 0.5) * 150;
    core.position.z = (Math.random() - 0.5) * 150;
    core.position.y = 1;
    core.userData.isCore = true;
    scene.add(core);
}

// --- Handle Resize ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

// --- Animation Loop ---
let prevTime = performance.now();
function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    if (controls.isLocked === true) {
        const delta = (time - prevTime) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= 9.8 * 8.0 * delta;

        direction.z = Number(moveState.forward) - Number(moveState.backward);
        direction.x = Number(moveState.right) - Number(moveState.left);
        direction.normalize();

        if (moveState.forward || moveState.backward) velocity.z -= direction.z * 400.0 * delta;
        if (moveState.left || moveState.right) velocity.x -= direction.x * 400.0 * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);

        controls.object.position.y += (velocity.y * delta);

        if (controls.object.position.y < 1.6) {
            velocity.y = 0;
            controls.object.position.y = 1.6;
            moveState.canJump = true;
        }

        // Rotate cores
        scene.traverse((child) => {
            if (child.userData.isCore) {
                child.rotation.x += 0.01;
                child.rotation.y += 0.01;
            }
        });
    }

    prevTime = time;
    composer.render();
}
animate();
