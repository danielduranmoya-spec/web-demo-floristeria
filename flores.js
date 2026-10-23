/* =========================================================
   Pétalo & Musgo · flores 3D hechas con código (three.js r186)

   No se descarga ningún modelo: cada pétalo es una malla
   curvada (copa, rizo y ondas del borde) y cada flor es una
   malla instanciada que se abre con setApertura(0…1).
   La usan la escena del inicio, el configurador de ramos y
   la página que genera el vídeo (video/generar.html).
   ========================================================= */
import * as THREE from 'three';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const DEG = Math.PI / 180;
const ORO = 2.39996;   // ángulo áureo: así se reparten los pétalos en la naturaleza

export function azar(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ---------- Pétalo: crece en +Y y su cara interior mira a −Z (hacia el centro de la flor) ---------- */
export function geometriaPetalo(o = {}) {
  const { largo = 1, ancho = .7, copa = .45, rizo = .1, ondas = .05, nOndas = 8, punta = .94, segU = 12, segV = 10, sombra = [.68, 1] } = o;
  const n = (segU + 1) * (segV + 1);
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), uv = new Float32Array(n * 2);
  let p = 0;
  for (let i = 0; i <= segU; i++) {
    const u = i / segU;
    const w = ancho * Math.max(.05, Math.sqrt(Math.sin(Math.PI * (.05 + (punta - .05) * Math.pow(u, 1.2)))));
    for (let j = 0; j <= segV; j++) {
      const v = j / segV * 2 - 1;
      const z = -copa * v * v * w + rizo * Math.pow(u, 3) * largo + ondas * Math.sin(v * nOndas + u * 5) * u * u * largo;
      pos[p * 3] = v * w; pos[p * 3 + 1] = u * largo; pos[p * 3 + 2] = z;
      const s = lerp(sombra[0], sombra[1], Math.pow(u, .7)) * (1 - .1 * v * v);
      col[p * 3] = col[p * 3 + 1] = col[p * 3 + 2] = s;
      uv[p * 2] = v * .5 + .5; uv[p * 2 + 1] = u;
      p++;
    }
  }
  const idx = [];
  for (let i = 0; i < segU; i++) for (let j = 0; j < segV; j++) {
    const a = i * (segV + 1) + j, b = a + segV + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function materialPetalo(extra = {}) {
  return new THREE.MeshPhysicalMaterial({
    vertexColors: true, side: THREE.DoubleSide, roughness: .62, metalness: 0,
    sheen: .6, sheenRoughness: .5, sheenColor: new THREE.Color(0xffe4ea), ...extra
  });
}

/* ---------- Tipos de flor ----------
   n: pétalos · geos: formas de pétalo (el pétalo elige una según su anillo)
   petalo(t, abierta, r): tamaño, inclinación, radio y altura del pétalo t (0 = centro, 1 = fuera) */
export const TIPOS = {
  peonia: {
    nombre: 'Peonía', n: 46,
    geos: [{ largo: 1, ancho: .8, copa: .2, rizo: .04, ondas: .06, nOndas: 9, punta: .97, sombra: [.5, 1] }],
    petalo(t, a) {
      return { escala: lerp(.4, 1.05, Math.pow(t, .6)), incl: lerp(lerp(-34, -6, t), lerp(4, 96, Math.pow(t, .9)), a), radio: lerp(.02, .24, t) * (.6 + .4 * a), y: -.05 * t * a };
    },
    abre: (b, t) => smooth(0, 1, b * 1.6 - (1 - t) * .6),
    centro: 0xf2c84b, interior: .78, boton: .13
  },
  rosa: {
    nombre: 'Rosa', n: 22,
    geos: [{ largo: 1, ancho: .95, copa: .36, rizo: 0, ondas: .02, punta: .97, sombra: [.45, 1] }, { largo: 1, ancho: .98, copa: .38, rizo: .4, ondas: .03, punta: .97, sombra: [.5, 1] }],
    geo: t => t > .45 ? 1 : 0,
    petalo(t, a) {
      return { escala: lerp(.42, 1, Math.pow(t, .5)), incl: lerp(lerp(-26, -4, t), lerp(-10, 74, Math.pow(t, 1.5)), a), radio: lerp(0, .13, t), y: 0 };
    },
    abre: (b, t) => smooth(0, 1, b * 1.5 - (1 - t) * .5),
    interior: .7
  },
  tulipan: {
    nombre: 'Tulipán', n: 6,
    geos: [{ largo: 1.45, ancho: .72, copa: .5, rizo: -.06, ondas: .01, punta: .99, sombra: [.55, 1] }],
    petalo(t, a, i) {
      const fuera = i % 2 === 0;
      return { escala: fuera ? 1 : .96, incl: lerp(fuera ? 6 : 2, fuera ? 46 : 34, a), radio: .07, y: 0, az: i / 6 * Math.PI * 2 };
    },
    abre: b => smooth(0, 1, b),
    centro: 0x3a3226, interior: .9
  },
  anemona: {
    nombre: 'Anémona', n: 13,
    geos: [{ largo: 1.02, ancho: 1, copa: .22, rizo: -.04, ondas: .035, nOndas: 6, punta: .96, sombra: [.82, 1] }],
    petalo(t, a, i) {
      const exterior = i < 7;
      return { escala: exterior ? 1 : .82, incl: lerp(18, exterior ? 84 : 70, a), radio: .1, y: exterior ? 0 : .02, az: exterior ? i / 7 * Math.PI * 2 : (i - 7) / 6 * Math.PI * 2 + .45 };
    },
    abre: b => smooth(.05, .95, b),
    estambres: 0x1d1b2e, interior: 1
  }
};

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
const _c = new THREE.Color();

/* ---------- Una flor ---------- */
export class Flor extends THREE.Group {
  constructor(tipo = 'peonia', color = 0xe8a0b4, { seed = 1, calidad = 1, material } = {}) {
    super();
    this.def = TIPOS[tipo];
    this.tipo = tipo;
    const def = this.def;
    const rnd = azar(seed);
    this.n = def.n > 20 ? Math.max(18, Math.round(def.n * calidad)) : def.n;
    this.mat = material || materialPetalo();
    this.geos = def.geos.map(g => geometriaPetalo({ ...g, segU: calidad < .8 ? 9 : 14, segV: calidad < .8 ? 8 : 14 }));
    // reparto de pétalos entre las formas
    this.grupos = this.geos.map(() => []);
    for (let i = 0; i < this.n; i++) {
      const t = this.n === 1 ? 1 : i / (this.n - 1);
      const g = def.geo ? def.geo(t) : 0;
      this.grupos[g].push({ i, t, giro: (rnd() - .5) * .35, az: i * ORO + (rnd() - .5) * .25, var: .92 + rnd() * .16, luz: .9 + rnd() * .18 });
    }
    this.mallas = this.geos.map((geo, g) => {
      const m = new THREE.InstancedMesh(geo, this.mat, Math.max(1, this.grupos[g].length));
      m.castShadow = false; m.frustumCulled = false;
      this.add(m);
      return m;
    });
    // cáliz verde y, según la flor, centro de estambres
    const caliz = new THREE.Mesh(new THREE.SphereGeometry(.14, 16, 10, 0, Math.PI * 2, Math.PI * .45, Math.PI * .55), new THREE.MeshStandardMaterial({ color: 0x5d7d3c, roughness: .7, side: THREE.DoubleSide }));
    caliz.position.y = .1; caliz.scale.set(1, .8, 1);
    this.add(caliz);
    if (def.estambres || def.centro) {
      const cuantos = def.estambres ? 46 : 60;
      const geo = new THREE.SphereGeometry(def.estambres ? .028 : .022, 6, 4);
      const est = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: def.estambres || def.centro, roughness: .5 }), cuantos);
      for (let k = 0; k < cuantos; k++) {
        const r = Math.sqrt(k / cuantos) * (def.estambres ? .2 : .14), a = k * ORO;
        _p.set(Math.cos(a) * r, .06 + (def.estambres ? .06 : .03) * (1 - r * 4) + rnd() * .02, Math.sin(a) * r);
        _m.compose(_p, _q.identity(), _s.setScalar(.8 + rnd() * .6));
        est.setMatrixAt(k, _m);
      }
      if (def.estambres) {
        const bola = new THREE.Mesh(new THREE.SphereGeometry(.11, 20, 14), new THREE.MeshStandardMaterial({ color: 0x14121f, roughness: .35 }));
        bola.position.y = .1; bola.scale.y = .7;
        this.add(bola);
      }
      this.estambres = est;
      this.add(est);
    }
    // botón central: rellena el hueco entre los pétalos de dentro
    if (def.boton) {
      this.boton = new THREE.Mesh(new THREE.SphereGeometry(def.boton, 18, 12), new THREE.MeshStandardMaterial({ roughness: .7 }));
      this.boton.position.y = .12; this.boton.scale.y = .8;
      this.add(this.boton);
    }
    this.setColor(color);
    this.setApertura(1);
  }

  setColor(color) {
    const base = new THREE.Color(color);
    if (this.boton) this.boton.material.color.copy(base).multiplyScalar(.62);
    this.grupos.forEach((lista, g) => {
      lista.forEach((p, k) => {
        _c.copy(base).multiplyScalar(p.luz * lerp(this.def.interior, 1, p.t));
        this.mallas[g].setColorAt(k, _c);
      });
      if (this.mallas[g].instanceColor) this.mallas[g].instanceColor.needsUpdate = true;
    });
  }

  /* b: 0 = capullo, 1 = abierta del todo */
  setApertura(b) {
    this.apertura = b;
    const def = this.def;
    this.grupos.forEach((lista, g) => {
      lista.forEach((p, k) => {
        const a = def.abre(b, p.t);
        const f = def.petalo(p.t, a, p.i);
        const az = f.az ?? p.az;
        const esc = f.escala * p.var * lerp(.55, 1, Math.min(1, b * 1.6));
        _p.set(Math.sin(az) * f.radio, .08 + f.y, Math.cos(az) * f.radio);
        // inclinación hacia fuera (eje X local) y luego giro alrededor del tallo
        _e.set(f.incl * DEG, az, p.giro, 'YXZ');
        _q.setFromEuler(_e);
        _m.compose(_p, _q, _s.set(esc, esc, esc));
        this.mallas[g].setMatrixAt(k, _m);
      });
      this.mallas[g].instanceMatrix.needsUpdate = true;
    });
    if (this.estambres) this.estambres.scale.setScalar(smooth(.3, .9, b));
  }

  dispose() {
    this.geos.forEach(g => g.dispose());
    this.traverse(o => { if (o.isMesh && o.material !== this.mat) { o.geometry.dispose(); o.material.dispose(); } });
  }
}

/* ---------- Ramo: flores en cúpula, verde, papel y lazo ---------- */
export const PAPELES = {
  kraft: { fuera: 0xc9a27a, dentro: 0xf6ead8 },
  nata: { fuera: 0xf3e6d3, dentro: 0xe8a0b4 },
  musgo: { fuera: 0x22382b, dentro: 0xf3e6d3 }
};

export class Ramo extends THREE.Group {
  // tipo: una flor o una lista de flores que se reparten por turnos
  constructor({ tipo = 'peonia', colores = [0xe8a0b4], flores = 9, papel = 'kraft', seed = 7, calidad = 1 } = {}) {
    super();
    const rnd = azar(seed);
    this.flores = [];
    this.material = materialPetalo();
    const R = .42 * Math.sqrt(flores) + .35;           // radio de la cúpula
    const cap = Math.min(1.05, .55 + flores * .03);     // apertura de la cúpula (rad)
    const atado = new THREE.Vector3(0, -2.1, 0);
    const tallos = [];
    for (let i = 0; i < flores; i++) {
      const phi = Math.acos(1 - (i + .5) / flores * (1 - Math.cos(cap)));
      const th = i * ORO + rnd() * .3;
      const dir = new THREE.Vector3(Math.sin(phi) * Math.cos(th), Math.cos(phi), Math.sin(phi) * Math.sin(th));
      const f = new Flor(Array.isArray(tipo) ? tipo[i % tipo.length] : tipo, colores[i % colores.length], { seed: seed * 31 + i, calidad, material: this.material });
      const cabeza = dir.clone().multiplyScalar(R).add(new THREE.Vector3(0, -R * .55, 0));
      f.position.copy(cabeza);
      f.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().multiplyScalar(1.15).add(new THREE.Vector3(0, .15, 0)).normalize());
      f.rotateY(rnd() * 6.28);
      f.scale.setScalar(.72 + rnd() * .12);
      f.userData.base = f.scale.x;
      this.add(f);
      this.flores.push(f);
      tallos.push(cabeza);
    }
    // eucalipto entre las flores
    const hoja = geometriaPetalo({ largo: .32, ancho: .3, copa: .1, rizo: 0, ondas: 0, punta: .99, segU: 5, segV: 4, sombra: [.85, 1] });
    const ramitas = Math.round(flores * .8) + 3;
    const hojas = new THREE.InstancedMesh(hoja, new THREE.MeshStandardMaterial({ vertexColors: true, color: 0x9fb3a0, roughness: .8, side: THREE.DoubleSide }), ramitas * 7);
    let h = 0;
    const tmpQ = new THREE.Quaternion();
    for (let r = 0; r < ramitas; r++) {
      const th = r / ramitas * Math.PI * 2 + rnd() * .4;
      const phi = cap * (.75 + rnd() * .4);
      const dir = new THREE.Vector3(Math.sin(phi) * Math.cos(th), Math.cos(phi), Math.sin(phi) * Math.sin(th));
      const ini = dir.clone().multiplyScalar(R * .7).add(new THREE.Vector3(0, -R * .55, 0));
      for (let k = 0; k < 7; k++) {
        _p.copy(ini).addScaledVector(dir, k * .16 + .1);
        tmpQ.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        _q.setFromEuler(_e.set((k % 2 ? 1 : -1) * 70 * DEG, k * 1.3, 0, 'YXZ'));
        _m.compose(_p, tmpQ.clone().multiply(_q), _s.setScalar(lerp(1.1, .6, k / 6)));
        hojas.setMatrixAt(h++, _m);
      }
      tallos.push(ini);
    }
    this.add(hojas);
    // tallos hasta el atado y por debajo del lazo
    const verdeTallo = new THREE.MeshStandardMaterial({ color: 0x4f6e35, roughness: .75 });
    const tuboGeo = [];
    tallos.forEach((p, i) => {
      const curva = new THREE.CatmullRomCurve3([p.clone().multiplyScalar(.98), p.clone().lerp(atado, .55).add(new THREE.Vector3(0, .1, 0)), atado.clone().add(new THREE.Vector3((rnd() - .5) * .08, 0, (rnd() - .5) * .08)), new THREE.Vector3((rnd() - .5) * .35, -3.15 - rnd() * .2, (rnd() - .5) * .35)]);
      tuboGeo.push(new THREE.Mesh(new THREE.TubeGeometry(curva, 18, .022, 5), verdeTallo));
    });
    tuboGeo.forEach(t => this.add(t));
    // papel: dos capas torneadas con el borde ondulado
    const pp = PAPELES[papel] || PAPELES.kraft;
    // papel de seda por dentro (asoma por arriba) y papel de fuera con la abertura detrás
    this.add(this.papelCapa(R * 1.06, pp.dentro, Math.PI * 1.1, .9, .02, rnd, .05));
    this.add(this.papelCapa(R * 1.1, pp.fuera, Math.PI * 1.26, .74, .03, rnd, -.35));
    // lazo
    const lazo = new THREE.Mesh(new THREE.TorusGeometry(.26, .045, 10, 40), new THREE.MeshStandardMaterial({ color: 0xf4c542, roughness: .35, metalness: .2 }));
    lazo.rotation.x = Math.PI / 2; lazo.position.copy(atado).add(new THREE.Vector3(0, .05, 0));
    this.add(lazo);
    const cinta = new THREE.Mesh(new THREE.PlaneGeometry(.1, .9, 1, 8), lazo.material);
    cinta.geometry.translate(0, -.45, 0);
    [[.2, .4], [-.25, -.3]].forEach(([x, rz]) => { const c = cinta.clone(); c.position.copy(atado).add(new THREE.Vector3(x * .9, .05, .24)); c.rotation.z = rz; this.add(c); });
    this.position.y = .7;
  }

  papelCapa(rArriba, color, inicio, fraccion, extra, rnd, arriba = -.25) {
    const perfil = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      perfil.push(new THREE.Vector2(lerp(.22, rArriba, Math.pow(t, .8)) + extra, lerp(-2.25, arriba, t)));
    }
    const geo = new THREE.LatheGeometry(perfil, 64, inicio, Math.PI * 2 * fraccion);
    const pos = geo.attributes.position;
    const ph = rnd() * 6;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const t = (y + 2.25) / (arriba + 2.25);
      const a = Math.atan2(z, x);
      const onda = Math.sin(a * 7 + ph) * .1 * t * t;
      const k = 1 + onda + Math.sin(a * 23) * .015 * t;
      pos.setXYZ(i, x * k, y + Math.cos(a * 5 + ph) * .14 * t * t * t, z * k);
    }
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: .9, side: THREE.DoubleSide }));
  }

  setApertura(b) { this.flores.forEach((f, i) => f.setApertura(clamp(b * 1.15 - (i % 5) * .03, 0, 1))); }

  dispose() {
    this.flores.forEach(f => f.dispose());
    this.material.dispose();
    this.traverse(o => { if (o.isMesh && o.material !== this.material) { o.geometry.dispose(); o.material.dispose?.(); } });
  }
}
