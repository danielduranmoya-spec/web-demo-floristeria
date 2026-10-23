/* =========================================================
   Pétalo & Musgo · interacción de la web
   Menú, títulos que aparecen letra a letra, ramos del día,
   diseñador de ramos (precio y pedido por WhatsApp), vídeo
   interactivo, calendario de temporada, horario y cookies.
   La escena 3D está en escena.js y escucha el evento «pm:ramo».
   ========================================================= */
(function () {
  'use strict';

  /* ===================== CONFIG ===================== */
  var WHATSAPP = '34600000000';
  var ENVIO = 5;   // € por entrega a domicilio en Mérida
  var TIPOS = {
    peonia: { nombre: 'Peonía', precio: 59, colores: [['Rosa peonía', '#E8A0B4'], ['Coral', '#F08A7E'], ['Blanco nata', '#F6EEE6'], ['Fucsia', '#C2457A']] },
    rosa: { nombre: 'Rosa de jardín', precio: 52, colores: [['Roja', '#C8324B'], ['Rosa empolvado', '#E7B3B8'], ['Melocotón', '#F3B38A'], ['Blanca', '#F7F2EC']] },
    tulipan: { nombre: 'Tulipán', precio: 42, colores: [['Amarillo polen', '#F4C542'], ['Naranja', '#F08A3C'], ['Lila', '#B79AD8'], ['Rojo', '#D2384A']] },
    anemona: { nombre: 'Anémona', precio: 48, colores: [['Blanca', '#F6F1EC'], ['Roja', '#C42B3A'], ['Violeta', '#6F4AA0'], ['Rosa', '#E58FB0']] }
  };
  var TAMANOS = { s: { nombre: 'S', flores: 7, factor: .65 }, m: { nombre: 'M', flores: 11, factor: 1 }, l: { nombre: 'L', flores: 17, factor: 1.55 } };
  var PAPELES = { kraft: 'Kraft', nata: 'Nata y rosa', musgo: 'Verde musgo' };
  var ENTREGAS = { tienda: 'Recojo en tienda', casa: 'A domicilio (+5 €)' };
  var RAMOS_DIA = [
    { nombre: 'Santa Eulalia', txt: 'Peonía rosa con eucalipto y kraft. El que más sale.', op: { tipo: 'peonia', color: 0, tam: 'm', papel: 'kraft' } },
    { nombre: 'Templo de Diana', txt: 'Rosa de jardín roja, papel verde musgo. Para declararse.', op: { tipo: 'rosa', color: 0, tam: 'l', papel: 'musgo' } },
    { nombre: 'Guadiana', txt: 'Tulipán amarillo polen en papel nata. Alegra cualquier mesa.', op: { tipo: 'tulipan', color: 0, tam: 's', papel: 'nata' } },
    { nombre: 'Acueducto', txt: 'Anémona blanca de corazón negro. Elegante y distinto.', op: { tipo: 'anemona', color: 0, tam: 'm', papel: 'kraft' } }
  ];
  var CAPITULOS = [
    { t: 0, titulo: 'Capullo', nota: 'La peonía llega cerrada como una canica: así viaja mejor y dura más en casa.' },
    { t: 1.6, titulo: 'Se abre', nota: 'En dos o tres días se abre del todo. Agua fresca y tallo cortado en diagonal.' },
    { t: 3.8, titulo: 'El ramo', nota: 'Montaje en espiral: cada tallo inclinado para que el ramo respire y no se aplaste.' },
    { t: 6, titulo: 'Listo', nota: 'Papel kraft, lazo amarillo polen y tarjeta escrita a mano.', cta: true }
  ];
  var MESES = [
    ['Ene', 'Anémona, ranúnculo, mimosa y eucalipto'], ['Feb', 'Tulipán, mimosa y anémona: el mes de San Valentín'],
    ['Mar', 'Tulipán, ranúnculo, fresia y flor de almendro'], ['Abr', 'Peonía temprana, lilas y guisante de olor'],
    ['May', 'Peonía en plenitud, rosa de jardín y amapola'], ['Jun', 'Peonía, lavanda de La Serena y hortensia'],
    ['Jul', 'Girasol, lavanda, dalia y espiga de trigo'], ['Ago', 'Dalia, zinnia, girasol y siempreviva'],
    ['Sep', 'Dalia, rosa de jardín y bayas de rosa mosqueta'], ['Oct', 'Crisantemo, dalia, hoja de olivo y granada'],
    ['Nov', 'Crisantemo, anémona temprana y amaranto'], ['Dic', 'Amaryllis, pascua, acebo y ramas de pino']
  ];
  // Horario en minutos desde medianoche; 0 = domingo
  var HORARIO = { 0: [[600, 810]], 1: [[570, 840], [1020, 1230]], 2: [[570, 840], [1020, 1230]], 3: [[570, 840], [1020, 1230]], 4: [[570, 840], [1020, 1230]], 5: [[570, 840], [1020, 1230]], 6: [[570, 870]] };
  /* ================================================== */

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var guardar = function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} };
  var leer = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };
  var euros = function (n) { return n.toLocaleString('es-ES') + ' €'; };

  /* ---------- Menú y cabecera ---------- */
  var cab = $('[data-cabecera]'), menuBtn = $('[data-menu-btn]'), menu = $('[data-menu]');
  menuBtn.addEventListener('click', function () {
    var abierto = menuBtn.getAttribute('aria-expanded') === 'true';
    menuBtn.setAttribute('aria-expanded', String(!abierto));
    menu.hidden = abierto;
    document.body.classList.toggle('menu-abierto', !abierto);
  });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { menuBtn.click(); }); });
  addEventListener('scroll', function () { cab.classList.toggle('cabecera--solida', scrollY > 40); }, { passive: true });

  /* ---------- Títulos letra a letra (desenfoque → nítido) ---------- */
  function partir(el) {
    var n = 0;
    (function recorrer(nodo) {
      Array.prototype.slice.call(nodo.childNodes).forEach(function (h) {
        if (h.nodeType === 3) {
          var frag = document.createDocumentFragment();
          h.textContent.split(/(\s+)/).forEach(function (pal) {
            if (!pal) return;
            if (/^\s+$/.test(pal)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span');
            w.className = 'palabra';
            pal.split('').forEach(function (c) {
              var l = document.createElement('span');
              l.className = 'letra'; l.textContent = c; l.style.setProperty('--i', n++);
              l.setAttribute('aria-hidden', 'true');
              w.appendChild(l);
            });
            frag.appendChild(w);
          });
          h.parentNode.replaceChild(frag, h);
        } else if (h.nodeType === 1) recorrer(h);
      });
    })(el);
  }
  var titulos = $$('[data-letras]');
  titulos.forEach(function (t) { var txt = t.textContent; partir(t); t.setAttribute('aria-label', txt.replace(/\s+/g, ' ').trim()); });
  var obsLetras = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visto'); obsLetras.unobserve(e.target); } });
  }, { threshold: .3 });
  titulos.forEach(function (t) { obsLetras.observe(t); });
  var obsAparece = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visto'); obsAparece.unobserve(e.target); } });
  }, { threshold: .15 });
  $$('.servicio, .opinion, .ramo, .taller__cifras li').forEach(function (el) { el.classList.add('aparece'); obsAparece.observe(el); });

  /* ---------- Diseñador de ramos ---------- */
  var estado = { tipo: 'peonia', color: 0, tam: 'm', papel: 'kraft', entrega: 'casa' };
  var form = $('[data-config]');
  function aclarar(hex, k) {
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = n >> 8 & 255, b = n & 255;
    var f = function (c) { return Math.round(k > 0 ? c + (255 - c) * k : c * (1 + k)); };
    return (f(r) << 16) | (f(g) << 8) | f(b);
  }
  function precio() {
    var p = Math.round(TIPOS[estado.tipo].precio * TAMANOS[estado.tam].factor);
    return p + (estado.entrega === 'casa' ? ENVIO : 0);
  }
  function chip(grupo, valor, etiqueta, extra) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.dataset.grupo = grupo; b.dataset.valor = valor;
    b.setAttribute('aria-pressed', 'false');
    b.innerHTML = etiqueta + (extra ? '<small>' + extra + '</small>' : '');
    return b;
  }
  function pintarOpciones() {
    var c = $('[data-opciones="tipo"]'); c.innerHTML = '';
    Object.keys(TIPOS).forEach(function (k) { c.appendChild(chip('tipo', k, TIPOS[k].nombre, 'desde ' + Math.round(TIPOS[k].precio * .65) + ' €')); });
    var t = $('[data-opciones="tam"]'); t.innerHTML = '';
    Object.keys(TAMANOS).forEach(function (k) { t.appendChild(chip('tam', k, TAMANOS[k].nombre, TAMANOS[k].flores + ' flores')); });
    var p = $('[data-opciones="papel"]'); p.innerHTML = '';
    Object.keys(PAPELES).forEach(function (k) { p.appendChild(chip('papel', k, '<i class="papel papel--' + k + '"></i>' + PAPELES[k])); });
    var e = $('[data-opciones="entrega"]'); e.innerHTML = '';
    Object.keys(ENTREGAS).forEach(function (k) { e.appendChild(chip('entrega', k, ENTREGAS[k])); });
  }
  function pintarColores() {
    var m = $('[data-opciones="color"]'); m.innerHTML = '';
    TIPOS[estado.tipo].colores.forEach(function (c, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'muestra'; b.dataset.grupo = 'color'; b.dataset.valor = i;
      b.style.setProperty('--c', c[1]);
      b.setAttribute('aria-label', c[0]); b.setAttribute('aria-pressed', 'false'); b.title = c[0];
      m.appendChild(b);
    });
  }
  function actualizar(enviar3d) {
    $$('[data-grupo]', form).forEach(function (b) { b.setAttribute('aria-pressed', String(String(estado[b.dataset.grupo]) === b.dataset.valor)); });
    var tipo = TIPOS[estado.tipo], color = tipo.colores[estado.color], tam = TAMANOS[estado.tam];
    $('[data-color-nombre]').textContent = '· ' + color[0];
    $('[data-total]').textContent = euros(precio());
    $('[data-resumen]').textContent = 'Ramo ' + tam.nombre + ' · ' + tam.flores + ' ' + tipo.nombre.toLowerCase() + (tam.flores > 1 ? 's' : '') + ' ' + color[0].toLowerCase();
    var tarjeta = $('[data-tarjeta]').value.trim(), fecha = $('[data-fecha]').value;
    var msg = 'Hola Pétalo & Musgo, quiero este ramo:\n' +
      '· Flor: ' + tipo.nombre + ' (' + color[0] + ')\n' +
      '· Tamaño: ' + tam.nombre + ' (' + tam.flores + ' flores)\n' +
      '· Papel: ' + PAPELES[estado.papel] + '\n' +
      '· Entrega: ' + ENTREGAS[estado.entrega].replace(/ \(.*\)/, '') + (fecha ? ' el ' + fecha.split('-').reverse().join('/') : '') + '\n' +
      (tarjeta ? '· Tarjeta: «' + tarjeta + '»\n' : '') +
      '· Total: ' + euros(precio());
    $('[data-pedir]').href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(msg);
    if (enviar3d) {
      var hex = color[1];
      var op = { tipo: estado.tipo, colores: [parseInt(hex.slice(1), 16), aclarar(hex, .22), aclarar(hex, -.12)], flores: tam.flores, papel: estado.papel, seed: 7 + estado.color };
      window.PM_RAMO = op;
      document.dispatchEvent(new CustomEvent('pm:ramo', { detail: op }));
    }
  }
  pintarOpciones(); pintarColores();
  form.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-grupo]');
    if (!b) return;
    var g = b.dataset.grupo, v = g === 'color' ? +b.dataset.valor : b.dataset.valor;
    if (estado[g] === v) return;
    estado[g] = v;
    if (g === 'tipo') { estado.color = 0; pintarColores(); }
    actualizar(g !== 'entrega');
  });
  form.addEventListener('submit', function (ev) { ev.preventDefault(); });
  var tarjeta = $('[data-tarjeta]');
  tarjeta.addEventListener('input', function () { $('[data-cuenta]').textContent = tarjeta.value.length + '/120'; actualizar(false); });
  var fecha = $('[data-fecha]');
  fecha.min = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  fecha.addEventListener('change', function () { actualizar(false); });
  actualizar(true);

  /* ---------- Ramos del día ---------- */
  var grid = $('[data-ramos]');
  RAMOS_DIA.forEach(function (r) {
    var tipo = TIPOS[r.op.tipo], hex = tipo.colores[r.op.color][1];
    var p = Math.round(tipo.precio * TAMANOS[r.op.tam].factor);
    var a = document.createElement('article');
    a.className = 'ramo ramo--' + r.op.papel;
    a.style.setProperty('--c', hex);
    a.innerHTML =
      '<div class="ramo__flores" aria-hidden="true">' +
        '<svg class="f1"><use href="#i-flor"/></svg><svg class="f2"><use href="#i-flor"/></svg><svg class="f3"><use href="#i-flor"/></svg>' +
      '</div>' +
      '<h3>' + r.nombre + '</h3><p>' + r.txt + '</p>' +
      '<p class="ramo__pie"><strong>' + p + ' €</strong><span>' + tipo.nombre + ' · ' + TAMANOS[r.op.tam].nombre + '</span></p>' +
      '<button class="btn btn--linea btn--peq" type="button">Personalizar</button>';
    $('button', a).addEventListener('click', function () {
      Object.assign(estado, r.op);
      pintarColores(); actualizar(true);
      $('#configura').scrollIntoView({ behavior: quieto ? 'auto' : 'smooth' });
    });
    grid.appendChild(a);
  });

  /* ---------- Vídeo interactivo ---------- */
  var caja = $('[data-video]');
  if (caja) {
    var video = $('video', caja), marco = $('[data-arrastre]', caja), barra = $('[data-tiempo]', caja), nota = $('[data-nota]', caja), play = $('[data-play]', caja);
    var lista = $('[data-capitulos]', caja), marcas = $('[data-marcas]', caja);
    var dur = function () { return video.duration || 8; };
    var capActual = -1;
    CAPITULOS.forEach(function (c, i) {
      var li = document.createElement('li');
      li.innerHTML = '<button type="button"><span>0' + (i + 1) + '</span>' + c.titulo + '</button>';
      $('button', li).addEventListener('click', function () { video.currentTime = c.t + .05; pintar(); });
      lista.appendChild(li);
      var m = document.createElement('i'); m.style.left = (c.t / 8 * 100) + '%'; marcas.appendChild(m);
    });
    function pintar() {
      var t = video.currentTime;
      if (!barra.matches(':active')) barra.value = Math.round(t / dur() * 1000);
      barra.style.setProperty('--p', (t / dur() * 100) + '%');
      var k = 0;
      CAPITULOS.forEach(function (c, i) { if (t >= c.t) k = i; });
      if (k !== capActual) {
        capActual = k;
        $$('button', lista).forEach(function (b, i) { b.setAttribute('aria-current', i === k ? 'step' : 'false'); });
        var c = CAPITULOS[k];
        nota.innerHTML = '<span>0' + (k + 1) + ' · ' + c.titulo + '</span><p>' + c.nota + '</p>' + (c.cta ? '<a class="btn btn--peonia btn--peq" href="#configura">Diseñar el mío</a>' : '');
        nota.classList.remove('entra'); void nota.offsetWidth; nota.classList.add('entra');
      }
    }
    function estadoPlay() {
      var parado = video.paused;
      play.innerHTML = '<svg aria-hidden="true"><use href="#i-' + (parado ? 'play' : 'pause') + '"/></svg>';
      play.setAttribute('aria-label', parado ? 'Reproducir' : 'Pausar');
      caja.classList.toggle('reproduciendo', !parado);
    }
    video.addEventListener('timeupdate', pintar);
    video.addEventListener('loadedmetadata', pintar);
    video.addEventListener('play', estadoPlay); video.addEventListener('pause', estadoPlay);
    play.addEventListener('click', function (ev) { ev.stopPropagation(); if (video.paused) video.play(); else video.pause(); });
    barra.addEventListener('input', function () { video.pause(); video.currentTime = barra.value / 1000 * dur(); pintar(); });
    // arrastrar sobre el vídeo = mover el tiempo (como abrir la flor con la mano)
    var drag = null;
    marco.addEventListener('pointerdown', function (ev) {
      if (ev.target.closest('a, button')) return;
      drag = { x: ev.clientX, t: video.currentTime, movido: false, seguia: !video.paused };
      marco.setPointerCapture(ev.pointerId);
    });
    marco.addEventListener('pointermove', function (ev) {
      if (!drag) return;
      var dx = ev.clientX - drag.x;
      if (Math.abs(dx) > 6 && !drag.movido) { drag.movido = true; video.pause(); caja.classList.add('arrastrando'); }
      if (drag.movido) { video.currentTime = Math.min(dur() - .05, Math.max(0, drag.t + dx / marco.clientWidth * dur() * 1.2)); pintar(); }
    });
    var fin = function () {
      if (!drag) return;
      if (!drag.movido) { if (video.paused) video.play(); else video.pause(); }
      caja.classList.remove('arrastrando');
      drag = null;
    };
    marco.addEventListener('pointerup', fin); marco.addEventListener('pointercancel', fin);
    // se reproduce solo al verse (sin sonido) si no se ha pedido menos movimiento
    if (!quieto) new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting && !caja.dataset.tocado) { video.play().catch(function () {}); caja.dataset.tocado = '1'; } else if (!e.isIntersecting) video.pause(); });
    }, { threshold: .5 }).observe(marco);
    pintar(); estadoPlay();
  }

  /* ---------- Temporada ---------- */
  var meses = $('[data-meses]'), detalle = $('[data-mes-detalle]');
  var hoyMes = new Date().getMonth();
  MESES.forEach(function (m, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'mes' + (i === hoyMes ? ' mes--hoy' : ''); b.setAttribute('role', 'tab');
    b.textContent = m[0];
    b.addEventListener('click', function () { elegirMes(i); });
    meses.appendChild(b);
  });
  function elegirMes(i) {
    $$('.mes', meses).forEach(function (b, k) { b.setAttribute('aria-selected', String(k === i)); b.tabIndex = k === i ? 0 : -1; });
    var nombres = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    detalle.innerHTML = '<p class="mes-detalle__mes">' + nombres[i] + (i === hoyMes ? ' <span>este mes</span>' : '') + '</p><p class="mes-detalle__flores">' + MESES[i][1] + '</p>';
  }
  elegirMes(hoyMes);

  /* ---------- Cifras que cuentan ---------- */
  var obsCifras = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      obsCifras.unobserve(e.target);
      var fin = +e.target.dataset.cuentaA, ini = fin > 3000 ? 0 : (fin > 1000 ? fin - 40 : 0), t0 = performance.now();
      if (quieto) return;
      (function paso(ahora) {
        var k = Math.min(1, (ahora - t0) / 1600), v = Math.round(ini + (fin - ini) * (1 - Math.pow(1 - k, 3)));
        e.target.textContent = fin > 3000 ? v.toLocaleString('es-ES') : String(v);
        if (k < 1) requestAnimationFrame(paso);
      })(t0);
    });
  }, { threshold: .6 });
  $$('[data-cuenta-a]').forEach(function (el) { obsCifras.observe(el); });

  /* ---------- Horario: abierto ahora (hora de Mérida) ---------- */
  try {
    var partes = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
    var val = function (t) { return partes.filter(function (p) { return p.type === t; })[0].value; };
    var dia = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(val('weekday'));
    var min = (+val('hour') % 24) * 60 + +val('minute');
    var abierto = (HORARIO[dia] || []).some(function (r) { return min >= r[0] && min < r[1]; });
    var fila = $('[data-dia="' + dia + '"]');
    if (fila) fila.classList.add('hoy');
    var est = $('[data-estado]');
    est.textContent = abierto ? 'Abierto ahora' : 'Cerrado ahora · pide por WhatsApp y te contestamos al abrir';
    est.classList.add(abierto ? 'estado--abierto' : 'estado--cerrado');
  } catch (e) {}

  /* ---------- Cookies y mapa ---------- */
  var aviso = $('[data-cookies]'), mapa = $('[data-mapa]');
  function cargarMapa() {
    if (mapa.dataset.cargado) return;
    mapa.dataset.cargado = '1';
    mapa.innerHTML = '<iframe title="Mapa: Calle Santa Eulalia, 41, Mérida" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=-6.3476%2C38.9150%2C-6.3396%2C38.9194&amp;layer=mapnik&amp;marker=38.9172%2C-6.3436"></iframe>';
  }
  function decidir(v) { guardar('pm-consent', v); aviso.hidden = true; if (v === 'aceptado') cargarMapa(); }
  var previo = leer('pm-consent');
  if (previo === 'aceptado') cargarMapa();
  else if (!previo) setTimeout(function () { aviso.hidden = false; }, 1800);
  $$('[data-consent]').forEach(function (b) { b.addEventListener('click', function () { decidir(b.dataset.consent); }); });
  $('[data-cargar-mapa]').addEventListener('click', function () { decidir('aceptado'); });
  $$('[data-abrir-cookies]').forEach(function (b) { b.addEventListener('click', function () { aviso.hidden = false; }); });
})();
