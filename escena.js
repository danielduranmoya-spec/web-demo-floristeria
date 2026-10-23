/* =========================================================
   Pétalo & Musgo · escenas 3D (three.js r186)

   1. Inicio (#lienzo-inicio): una peonía que se abre al entrar
      y una corriente de pétalos que viaja hacia la cámara.
      Al bajar, la corriente acelera (efecto «viaje») y la
      cámara sigue al ratón o a la inclinación del móvil.
   2. Ramo (#lienzo-ramo): el ramo del configurador. Se
      reconstruye con cada cambio (evento «pm:ramo» que manda
      script.js) y se gira arrastrando.
   Las dos escenas solo se dibujan cuando se ven en pantalla.
   ========================================================= */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Flor, Ramo, geometriaPetalo, materialPetalo, azar } from './flores.js';

/* ===================== CONFIG ===================== */
const PALETA_PETALOS = [0xe8a0b4, 0xf3d0d8, 0xfbf4ea, 0xd77a93, 0xf4c542];   // corriente de pétalos
const PESOS = [.34, .26, .18, .14, .08];
const FONDO = 0xfbf4ea;
/* ================================================== */

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = t => 1 - Math.pow(1 - t, 3);
const movil = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
const calidad = movil ? .6 : 1;

function crearRenderer(canvas) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  r.setPixelRatio(Math.min(devicePixelRatio, movil ? 1.75 : 2));
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 1.05;
  r.outputColorSpace = THREE.SRGBColorSpace;
  return r;
}
function luces(scene, renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.environmentIntensity = .45;
  const sol = new THREE.DirectionalLight(0xfff1e0, 2.4);
  sol.position.set(2, 4, 3);
  scene.add(sol, new THREE.HemisphereLight(0xffffff, 0xb89c86, .35));
}
// Ajusta el lienzo a su caja CSS; devuelve true si cambió
function ajustar(renderer, camara) {
  const c = renderer.domElement, w = c.clientWidth, h = c.clientHeight;
  if (!w || !h) return false;
  const actual = renderer.getSize(new THREE.Vector2());
  if (actual.x === w && actual.y === h) return false;
  renderer.setSize(w, h, false);
  camara.aspect = w / h;
  camara.updateProjectionMatrix();
  return true;
}
function visible(el, cb) {
  new IntersectionObserver(([e]) => cb(e.isIntersecting), { rootMargin: '120px' }).observe(el);
}

/* ---------- 1. Inicio: peonía + corriente de pétalos ---------- */
function inicio(canvas) {
  const renderer = crearRenderer(canvas);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(FONDO, 7, 24);
  luces(scene, renderer);
  const camara = new THREE.PerspectiveCamera(38, 1, .1, 60);
  camara.position.set(0, 0, 7);

  const peonia = new Flor('peonia', 0xe07f9c, { seed: 11, calidad });
  peonia.setApertura(quieto ? 1 : .05);
  const soporte = new THREE.Group();
  soporte.add(peonia);
  scene.add(soporte);

  // corriente de pétalos (una sola malla instanciada)
  const N = movil ? 120 : 260;
  const geo = geometriaPetalo({ largo: .42, ancho: .34, copa: .12, rizo: .08, ondas: .02, segU: 6, segV: 5, sombra: [.75, 1] });
  const petalos = new THREE.InstancedMesh(geo, materialPetalo(), N);
  petalos.frustumCulled = false;
  const rnd = azar(2024);
  const p = [];
  const col = new THREE.Color();
  for (let i = 0; i < N; i++) {
    let k = 0, r = rnd(), acc = 0;
    while (k < PESOS.length - 1 && r > (acc += PESOS[k])) k++;
    petalos.setColorAt(i, col.set(PALETA_PETALOS[k]).multiplyScalar(.9 + rnd() * .15));
    p.push({ x: (rnd() - .5) * 16, y: (rnd() - .5) * 10, z: -22 + rnd() * 28, v: .5 + rnd() * .9, rx: rnd() * 6, ry: rnd() * 6, w: (rnd() - .5) * 2.4, ph: rnd() * 6, esc: .45 + rnd() * .6 });
  }
  scene.add(petalos);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3();

  // ratón / giroscopio
  const mira = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', ev => { mira.tx = ev.clientX / innerWidth * 2 - 1; mira.ty = ev.clientY / innerHeight * 2 - 1; }, { passive: true });
  addEventListener('deviceorientation', ev => { if (ev.gamma == null) return; mira.tx = clamp(ev.gamma / 30, -1, 1); mira.ty = clamp((ev.beta - 45) / 30, -1, 1); }, { passive: true });

  let activo = true, t0 = performance.now(), ultimo = t0;
  visible(canvas, x => activo = x);
  const hero = canvas.closest('section');

  function cuadro(ahora) {
    const dt = Math.min(.05, (ahora - ultimo) / 1000); ultimo = ahora;
    if (ajustar(renderer, camara)) {
      const vertical = camara.aspect < .9;
      soporte.position.set(vertical ? .2 : 2.35, vertical ? -1.35 : -.45, 0);
      soporte.scale.setScalar(vertical ? .95 : 1.2);
    }
    const t = (ahora - t0) / 1000;
    const prog = clamp(scrollY / Math.max(1, hero.offsetHeight), 0, 1);
    // la peonía se abre en 3 s y luego «respira»
    if (!quieto) peonia.setApertura(t < 3.4 ? lerp(.05, 1, easeOut(clamp((t - .3) / 3.1, 0, 1))) : 1 - .035 * (1 + Math.sin(t * 1.1)) * .5);
    // inclinada hacia la cámara y girando sobre su propio tallo
    peonia.rotation.set(.85 + prog * .5, quieto ? .3 : t * .16, 0);
    // pétalos que viajan hacia la cámara
    const vel = quieto ? 0 : (1 + prog * 5);
    for (let i = 0; i < N; i++) {
      const a = p[i];
      a.z += a.v * vel * dt * 1.6;
      if (a.z > camara.position.z - 1.2) { a.z = -22; a.x = (rnd() - .5) * 16; a.y = (rnd() - .5) * 10; }
      a.rx += dt * a.w * vel * .6; a.ry += dt * a.w * .4;
      v.set(a.x + Math.sin(t * .6 + a.ph) * .5, a.y + Math.cos(t * .4 + a.ph) * .35, a.z);
      q.setFromEuler(e.set(a.rx, a.ry, a.ph));
      m.compose(v, q, s.setScalar(a.esc));
      petalos.setMatrixAt(i, m);
    }
    petalos.instanceMatrix.needsUpdate = true;
    // cámara: sigue al puntero y avanza con el scroll
    mira.x = lerp(mira.x, mira.tx, .04); mira.y = lerp(mira.y, mira.ty, .04);
    camara.position.set(mira.x * .7, -mira.y * .45, 7 - prog * 2.6);
    camara.lookAt(0, 0, -3);
    renderer.render(scene, camara);
  }
  return { cuadro, activo: () => activo && !document.hidden };
}

/* ---------- 2. Configurador de ramos ---------- */
function configurador(canvas) {
  const renderer = crearRenderer(canvas);
  const scene = new THREE.Scene();
  luces(scene, renderer);
  const camara = new THREE.PerspectiveCamera(32, 1, .1, 60);
  const giro = new THREE.Group();
  scene.add(giro);
  let ramo = null, saliente = null, nace = 0, opciones = null;

  function construir(op) {
    if (ramo) { saliente = { obj: ramo, t: performance.now() }; }
    ramo = new Ramo({ ...op, calidad: calidad * (op.flores > 12 ? .8 : 1) });
    ramo.setApertura(quieto ? 1 : 0);
    ramo.scale.setScalar(quieto ? 1 : .001);
    giro.add(ramo);
    nace = performance.now();
    // el encuadre se ajusta al tamaño del ramo
    const R = .42 * Math.sqrt(op.flores) + .35;
    camara.userData.dist = 6.6 + R * 2.4;
  }
  document.addEventListener('pm:ramo', ev => { opciones = ev.detail; construir(opciones); });
  if (window.PM_RAMO) construir(window.PM_RAMO);

  // arrastrar para girar (solo en horizontal: el scroll vertical sigue funcionando)
  let vel = .25, arrastre = null;
  canvas.addEventListener('pointerdown', ev => { arrastre = { x: ev.clientX, t: performance.now() }; canvas.setPointerCapture(ev.pointerId); canvas.classList.add('arrastrando'); });
  canvas.addEventListener('pointermove', ev => {
    if (!arrastre) return;
    const dx = ev.clientX - arrastre.x, dtm = Math.max(1, performance.now() - arrastre.t);
    giro.rotation.y += dx * .012;
    vel = clamp(dx / dtm * 12, -6, 6);
    arrastre.x = ev.clientX; arrastre.t = performance.now();
  });
  const soltar = () => { arrastre = null; canvas.classList.remove('arrastrando'); };
  canvas.addEventListener('pointerup', soltar);
  canvas.addEventListener('pointercancel', soltar);

  let activo = false, ultimo = performance.now();
  visible(canvas, x => activo = x);

  function cuadro(ahora) {
    const dt = Math.min(.05, (ahora - ultimo) / 1000); ultimo = ahora;
    ajustar(renderer, camara);
    const d = camara.userData.dist || 9;
    const vertical = camara.aspect < .8;
    camara.position.set(0, 1.1, d * (vertical ? 1.18 : 1));
    camara.lookAt(0, -.1, 0);
    if (!arrastre) { vel = lerp(vel, quieto ? 0 : .25, .03); giro.rotation.y += vel * dt; }
    if (ramo && !quieto) {
      const k = clamp((ahora - nace) / 1400, 0, 1);
      ramo.scale.setScalar(easeOut(clamp(k * 2, 0, 1)) * .999 + .001);
      ramo.setApertura(easeOut(k));
    }
    if (saliente) {
      const k = clamp((ahora - saliente.t) / 350, 0, 1);
      saliente.obj.scale.setScalar(Math.max(.001, 1 - easeOut(k)));
      saliente.obj.position.y = .7 + k * .6;
      if (k >= 1 || quieto) { giro.remove(saliente.obj); saliente.obj.dispose(); saliente = null; }
    }
    renderer.render(scene, camara);
  }
  return { cuadro, activo: () => activo && !document.hidden };
}

/* ---------- Arranque ---------- */
try {
  const escenas = [];
  const a = document.getElementById('lienzo-inicio');
  const b = document.getElementById('lienzo-ramo');
  if (a) escenas.push(inicio(a));
  if (b) escenas.push(configurador(b));
  document.documentElement.classList.add('con-3d');
  const bucle = ahora => {
    for (const s of escenas) if (s.activo()) s.cuadro(ahora);
    requestAnimationFrame(bucle);
  };
  requestAnimationFrame(bucle);
} catch (err) {
  console.warn('Sin 3D:', err);
  document.documentElement.classList.add('sin-3d');
}
