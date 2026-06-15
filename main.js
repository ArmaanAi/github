import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// --- Detect Mobile ---
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

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
const pcInstructions = document.getElementById('pc-instructions');
const mobileInstructions = document.getElementById('mobile-instructions');
const joystickContainer = document.getElementById('joystick-container');
const joystick = document.getElementById('joystick');

const moveState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    canJump: false
};

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

startButton.addEventListener('click', () => {
    if (isMobile) {
        storyOverlay.style.display = 'none';
        instructions.style.display = 'block';
        pcInstructions.style.display = 'none';
        mobileInstructions.style.display = 'block';
        joystickContainer.style.display = 'block';
    } else {
        controls.lock();
    }
});

controls.addEventListener('lock', () => {
    storyOverlay.style.display = 'none';
    instructions.style.display = 'block';
    pcInstructions.style.display = 'block';
    mobileInstructions.style.display = 'none';
});

controls.addEventListener('unlock', () => {
    storyOverlay.style.display = 'flex';
    instructions.style.display = 'none';
});

scene.add(controls.object);

// Keyboard Controls
const onKeyDown = (event) => {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW': moveState.forward = true; break;
        case 'ArrowLeft':
        case 'KeyA': moveState.left = true; break;
        case 'ArrowDown':
        case 'KeyS': moveState.backward = true; break;
        case 'ArrowRight':
        case 'KeyD': moveState.right = true; break;
        case 'Space':
            if (moveState.canJump === true) velocity.y += 30;
            moveState.canJump = false;
            break;
    }
};

const onKeyUp = (event) => {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW': moveState.forward = false; break;
        case 'ArrowLeft':
        case 'KeyA': moveState.left = false; break;
        case 'ArrowDown':
        case 'KeyS': moveState.backward = false; break;
        case 'ArrowRight':
        case 'KeyD': moveState.right = false; break;
    }
};

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

// Touch Controls (Mobile)
if (isMobile) {
    let joystickActive = false;
    let joystickOrigin = { x: 0, y: 0 };

    joystickContainer.addEventListener('touchstart', (e) => {
        joystickActive = true;
        const touch = e.touches[0];
        const rect = joystickContainer.getBoundingClientRect();
        joystickOrigin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        e.preventDefault();
    });

    window.addEventListener('touchmove', (e) => {
        if (!joystickActive) return;
        const touch = e.touches[0];
        const dx = touch.clientX - joystickOrigin.x;
        const dy = touch.clientY - joystickOrigin.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 50;

        const angle = Math.atan2(dy, dx);
        const limitedDist = Math.min(dist, maxDist);

        const x = Math.cos(angle) * limitedDist;
        const y = Math.sin(angle) * limitedDist;

        joystick.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;

        moveState.forward = y < -20;
        moveState.backward = y > 20;
        moveState.left = x < -20;
        moveState.right = x > 20;
    });

    window.addEventListener('touchend', () => {
        joystickActive = false;
        joystick.style.transform = 'translate(-50%, -50%)';
        moveState.forward = false;
        moveState.backward = false;
        moveState.left = false;
        moveState.right = false;
    });

    // Tap to jump and look
    let lastTapTime = 0;
    window.addEventListener('touchstart', (e) => {
        if (e.target === joystickContainer || e.target === joystick) return;

        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTapTime;
        if (tapLength < 300 && tapLength > 0) {
            if (moveState.canJump === true) velocity.y += 30;
            moveState.canJump = false;
        }
        lastTapTime = currentTime;
    });

    let touchStartX = 0;
    let touchStartY = 0;
    window.addEventListener('touchstart', (e) => {
        if (e.target === joystickContainer || e.target === joystick) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    });

    window.addEventListener('touchmove', (e) => {
        if (e.target === joystickContainer || e.target === joystick) return;
        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        const dx = touchX - touchStartX;
        const dy = touchY - touchStartY;

        controls.object.rotation.y -= dx * 0.005;
        camera.rotation.x -= dy * 0.005;
        camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.rotation.x));

        touchStartX = touchX;
        touchStartY = touchY;
    });
}

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0x0a0a20, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0x00ffff, 2, 100);
pointLight.position.set(0, 10, 0);
scene.add(pointLight);

// --- Environment ---
const gridHelper = new THREE.GridHelper(1000, 100, 0x00ffff, 0x002222);
scene.add(gridHelper);

const pillarGeometry = new THREE.BoxGeometry(1, 10, 1);
const pillarMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });

for (let i = 0; i < 50; i++) {
    const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
    pillar.position.x = (Math.random() - 0.5) * 200;
    pillar.position.z = (Math.random() - 0.5) * 200;
    pillar.position.y = 5;
    scene.add(pillar);

    if (Math.random() > 0.8) {
        const pLight = new THREE.PointLight(0xff00ff, 1, 20);
        pLight.position.copy(pillar.position);
        pLight.position.y = 10;
        scene.add(pLight);
    }
}

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
    if (controls.isLocked === true || isMobile) {
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
