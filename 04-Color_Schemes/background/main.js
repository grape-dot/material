// Deterministic viewer for review screenshots (per render_capture.md):
// - controls disabled until user interaction (window.__interactive)
// - scripted views via ?view=front|three-quarter|side|top|match
// - window.__ready = true after first painted frame
// - window.__shoot = function() {} hook called on demand for CDP capture
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createNightSkyDioramaModel, createNightSkyDioramaLookDevLights } from './model.js?v=43';

const params = new URLSearchParams(location.search);
const viewName = params.get('view') || 'front';
const spin = params.get('spin') === '1';
const wire = params.get('wire') === '1';
const flat = params.get('flat') === '1';
const noglow = params.get('noglow') === '1';
const skytest = params.get('skytest') === '1';
const galtest = params.get('galtest');
const solo = params.get('solo') === '1';

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: params.get('preserve') === '1' });
renderer.setPixelRatio(window.devicePixelRatio || 1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05070f);

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 200);
const controls = new OrbitControls(camera, renderer.domElement);
window.__interactive = false;
controls.addEventListener('start', () => { window.__interactive = true; });

const VIEWS = {
  front:         { pos: [0, 4.5, 19],     up: [0, 1, 0], target: [0, 4, -1] },
  'three-quarter': { pos: [13, 7, 15],    up: [0, 1, 0], target: [0, 4, -1] },
  side:          { pos: [20, 4, 0],       up: [0, 1, 0], target: [0, 4, -1] },
  top:           { pos: [0, 24, 0.01],    up: [0, 0, -1], target: [0, 0, -1] },
  match:         { pos: [0, 2.2, 11.8],   up: [0, 1, 0], target: [0, 3.0, -1.5] },
};

function setView(name) {
  const v = VIEWS[name] || VIEWS.front;
  camera.up.set(v.up[0], v.up[1], v.up[2]);
  camera.position.set(v.pos[0], v.pos[1], v.pos[2]);
  camera.lookAt(v.target[0], v.target[1], v.target[2]);
  controls.target.set(v.target[0], v.target[1], v.target[2]);
  document.getElementById('viewname').textContent = name;
}

const model = createNightSkyDioramaModel({ castShadow: true, receiveShadow: true, qualityPriority: 'reference-fidelity' });
scene.add(model);

if (solo) {
  model.traverse((o) => {
    if (o.isMesh) {
      if (o.name === 'Galaxy spiral') {
        o.material = new THREE.MeshBasicMaterial({ color: 0xff2222, side: THREE.DoubleSide });
        o.frustumCulled = false;
        o.visible = true;
      } else {
        o.visible = false;
      }
    }
  });
}

if (flat) {
  // map-stripped silhouette evidence: unlit flat colors, no textures, no lights
  scene.background = new THREE.Color(0x0b0e1a);
  model.traverse((o) => {
    if (o.isMesh) {
      const m = o.material;
      const col = (m && m.color) ? m.color : new THREE.Color(0x888888);
      const base = new THREE.Color(0x888888);
      o.material = new THREE.MeshBasicMaterial({
        color: col ? col.clone() : base,
        opacity: (m && m.transparent) ? m.opacity : 1,
        transparent: !!(m && m.transparent),
        side: THREE.DoubleSide,
      });
      if (wire) o.material.wireframe = true;
    }
  });
} else {
  const lights = createNightSkyDioramaLookDevLights('reference');
  scene.add(lights);

  if (!noglow) {
    // glow point at the "hidden moon" direction for atmosphere
    const glow = new THREE.PointLight(0xffd98a, 60, 60, 2);
    glow.position.set(14, 22, -18);
    scene.add(glow);
  }

  if (skytest) {
    model.traverse((o) => {
      if (o.isMesh && o.name === 'Sky dome') {
        const m = o.material;
        o.material = skytest === '2'
          ? new THREE.MeshBasicMaterial({ color: 0xffffff, map: m.map, side: THREE.DoubleSide })
          : new THREE.MeshStandardMaterial({ color: 0xffffff, map: m.map, side: THREE.DoubleSide });
      }
    });
  }

  if (galtest) {
    model.traverse((o) => {
      if (o.isMesh && o.name === 'Galaxy spiral') {
        o.material = new THREE.MeshBasicMaterial({ color: 0xff2222, side: THREE.DoubleSide, depthWrite: false });
        if (galtest === '3') {
          // move the whole pivot in front of the camera
          const piv = o.parent;
          piv.position.set(0, 3, 2);
          piv.scale.set(1, 1, 1);
          o.position.set(0, 0, 0);
          o.frustumCulled = false;
        } else if (galtest === '4') {
          o.frustumCulled = false;
        } else if (galtest === '5') {
          const piv = o.parent;
          piv.scale.set(1, 1, 1);
          o.frustumCulled = false;
        } else if (galtest === '6') {
          const piv = o.parent;
          piv.scale.set(3, 2.3, 1);
          o.frustumCulled = false;
        }
      }
    });
  }
}

setView(viewName);

function loop() {
  requestAnimationFrame(loop);
  if (spin) model.rotation.y += 0.003;
  if (window.__interactive) controls.update();
  renderer.render(scene, camera);
  window.__ready = true;
}
loop();

window.__view = viewName;
window.__scene = scene;
window.__setView = setView;
window.__scene = scene;
window.__model = model;
window.__camera = camera;
window.__renderer = renderer;
window.__THREE = THREE;

if (params.get('shot') === '1') {
  // one explicit render, then report ready for CDP screenshot
  setTimeout(() => { window.__ready = true; }, 400);
}
