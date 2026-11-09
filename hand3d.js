// Tangan 3D (Three.js). Indeks jari: 0 = jempol, 1..4 = telunjuk..kelingking (sama dengan fingers() di game.js).
import * as THREE from './three.module.min.js';

const SKIN = new THREE.Color(0xf6c9ad);
const COL = { R: [0xffc93c, 0x6ec6ff], L: [0xb57bff, 0x5fd3a5] }; // [jempol, jari lain] saat terbuka
const VAL = { R: [5, 1], L: [50, 10] };
const CUFF = { R: 0x7cc4ff, L: 0xff8fc7 };
const LEN = [1.45, 1.65, 1.5, 1.15]; // panjang telunjuk..kelingking

function label(text) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.beginPath(); g.arc(64, 64, 58, 0, 7); g.fill();
  g.fillStyle = '#5b2a63'; g.font = '900 64px ui-rounded, system-ui, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 64, 68);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthTest: false }));
  s.scale.setScalar(0.62);
  return s;
}

function palmShape(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

// fig: <figure> tempat canvas; onTap(i) dipanggil saat jari disentuh.
export function makeHand(fig, side, onTap) {
  const canvas = document.createElement('canvas');
  canvas.className = 'h3';
  fig.prepend(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  cam.position.set(0, 1.1, 9.9); cam.lookAt(0, 0.8, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xffc6e4, 1.9));
  const sun = new THREE.DirectionalLight(0xffffff, 1.7); sun.position.set(3, 6, 7); scene.add(sun);

  const m = side === 'R' ? 1 : -1; // tangan kiri = cermin tangan kanan
  const root = new THREE.Group(), hand = new THREE.Group();
  root.add(hand); scene.add(root);
  hand.position.x = 0.35 * m;
  const skinMat = () => new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.6 });

  const palm = new THREE.Mesh(new THREE.ExtrudeGeometry(palmShape(2.35, 2.2, 0.75), { depth: 0.5, bevelSize: 0.22, bevelThickness: 0.22, bevelSegments: 5, curveSegments: 10 }), skinMat());
  palm.position.z = -0.25;
  const cuff = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.45, 32), new THREE.MeshStandardMaterial({ color: CUFF[side], roughness: 0.4 }));
  cuff.scale.z = 0.45; cuff.position.y = -1.25;
  hand.add(palm, cuff);

  // satu jari = pangkal (pivot) + ruas ujung (joint), masing-masing bisa ditekuk
  // Dilihat dari punggung tangan (seperti anak melihat tangannya sendiri di meja): kuku menghadap pemain, jari melipat ke belakang.
  const fingers = [], nailMat = new THREE.MeshStandardMaterial({ color: 0xffe9f0, roughness: 0.25 });
  function finger(i, r, l1, l2, color) {
    const mat = skinMat(), pivot = new THREE.Group(), joint = new THREE.Group();
    const seg = l => { const s = new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 6, 14), mat); s.position.y = l / 2; return s; };
    pivot.add(seg(l1)); joint.position.y = l1; pivot.add(joint); joint.add(seg(l2));
    const nail = new THREE.Mesh(new THREE.SphereGeometry(r * 0.8, 16, 10), nailMat);
    nail.scale.set(0.85, 1.15, 0.35); nail.position.set(0, l2 * 0.8, r * 0.82); joint.add(nail);
    const tag = label(String(VAL[side][i ? 1 : 0])); tag.position.set(0, l2 + r + 0.38, 0.2); joint.add(tag);
    const f = { i, pivot, joint, mat, tag, color: new THREE.Color(color), t: 0, v: 0, on: false, chg: false };
    fingers[i] = f;
    return pivot;
  }
  LEN.forEach((l, k) => {
    const p = finger(k + 1, 0.25, l * 0.55, l * 0.45, COL[side][1]);
    p.position.set((-0.84 + 0.56 * k) * m, 1.0, 0);
    hand.add(p);
  });
  const thumb = finger(0, 0.3, 0.75, 0.6, COL[side][0]);
  thumb.position.set(-1.05 * m, -0.35, 0.1);
  hand.add(thumb);

  // Area sentuh tak terlihat, tetap di tempat walau jarinya terlipat: satu kolom lebar per jari.
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitBox = (i, w, h, x, y, rz = 0) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 1.6), hitMat);
    b.position.set(x, y, 0.3); b.rotation.z = rz; b.userData.i = i; hand.add(b);
  };
  LEN.forEach((l, k) => hitBox(k + 1, 0.56, l + 1.5, (-0.84 + 0.56 * k) * m, 0.55 + l / 2 + 0.35));
  hitBox(0, 1.1, 2.1, -1.45 * m, 0.15, 0.55 * m);

  // pose jari menurut t (0 = tertutup, 1 = terbuka). Sudut negatif = melipat menjauhi pemain.
  const lerp = (a, b, t) => a + (b - a) * t;
  function pose(f) {
    const t = f.t;
    if (f.i) { f.pivot.rotation.x = lerp(-1.5, 0, t); f.joint.rotation.x = lerp(-1.7, -0.05, t); }
    else { f.pivot.rotation.set(lerp(-1.0, 0, t), 0, lerp(-0.45, 0.55, t) * m); f.joint.rotation.x = lerp(-1.0, -0.05, t); }
  }

  let wave = 0;
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  canvas.addEventListener('pointerdown', e => {
    const b = canvas.getBoundingClientRect();
    ptr.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1);
    ray.setFromCamera(ptr, cam);
    const hit = ray.intersectObject(hand, true).find(h => h.object.userData.i != null);
    if (hit) onTap(hit.object.userData.i);
  });

  const clock = new THREE.Clock();
  (function frame() {
    requestAnimationFrame(frame);
    if (!canvas.offsetParent) return; // tidak tampil: hemat baterai
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * renderer.getPixelRatio())) { renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
    const dt = Math.min(clock.getDelta(), 0.05), T = clock.elapsedTime;
    const labels = !!canvas.closest('.labels');
    for (const f of fingers) {
      f.v += ((f.on ? 1 : 0) - f.t) * 0.22; f.v *= 0.68; f.t += f.v; // pegas: sedikit memantul
      pose(f);
      f.mat.color.lerpColors(SKIN, f.color, Math.min(1, Math.max(0, f.t)));
      f.mat.emissive.setHex(0xff3d8b).multiplyScalar(f.chg ? 0.25 + 0.2 * Math.sin(T * 6) : 0);
      f.tag.visible = labels && f.t > 0.6;
      f.tag.material.opacity = Math.min(1, (f.t - 0.6) * 3);
    }
    wave = Math.max(0, wave - dt);
    root.rotation.set(0.12 + 0.04 * Math.sin(T * 0.9), (-0.32 + 0.12 * Math.sin(T * 0.6)) * m, Math.sin(wave * 14) * wave * 0.5);
    root.position.y = 0.08 * Math.sin(T * 1.3) + Math.abs(Math.sin(wave * 10)) * wave * 0.8;
    renderer.render(scene, cam);
  })();

  return {
    set(on, chg) { fingers.forEach(f => { f.on = on[f.i]; f.chg = chg[f.i]; }); },
    wave() { wave = 1.2; },
  };
}
