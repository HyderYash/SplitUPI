/* Deterministic product-film timeline. No banking calls or external requests. */
(() => {
  'use strict';
  const DURATION = 36;
  const params = new URLSearchParams(location.search);
  const exportMode = params.get('export') === '1';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stage = document.getElementById('film-stage');
  const viewport = document.getElementById('viewport');
  const scenes = [...document.querySelectorAll('.scene')];
  const controls = document.getElementById('play-pause');
  const slider = document.getElementById('film-progress');
  const timeLabel = document.getElementById('time-label');
  const status = document.getElementById('film-status');
  const get = (id) => document.getElementById(id);
  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const smooth = (p) => { const t = clamp(p); return t * t * (3 - 2 * t); };
  const out = (p) => 1 - Math.pow(1 - clamp(p), 4);
  const mix = (a, b, p) => a + (b - a) * clamp(p);
  const money = (value) => '₹' + Math.round(value).toLocaleString('en-IN');
  let current = clamp(Number(params.get('t')) || 0, 0, DURATION);
  let playing = false;
  let baseTime = 0;
  let basePosition = 0;
  let frame = 0;

  if (exportMode) document.body.classList.add('export-mode');
  function resize() {
    const width = exportMode ? 1080 : Math.min(document.querySelector('.player').clientWidth, 810);
    const scale = width / 1080;
    viewport.style.width = `${width}px`;
    viewport.style.height = `${1350 * scale}px`;
    stage.style.setProperty('--scale', String(scale));
  }
  resize();
  addEventListener('resize', resize);

  // A real encoded QR of plain demo text, with no URI or payment capability.
  const matrix = '1111111010101001001111111/1000001000111110001000001/1011101011110010001011101/1011101001111011001011101/1011101001010010101011101/1000001010100011001000001/1111111010101010101111111/0000000001111111000000000/1010001100111011100100101/1110100010001001111101000/0101001110100000111010010/0001010111101111001001011/0101111101000110011011101/0011110110000010001011110/1100001011110110001010101/0011110000100111011001100/1101011001011000111111011/0000000010001011100010010/1111111010001000101010001/1000001000111001100010110/1011101000101100111110011/1011101001100000001101110/1011101011111010000011011/1000001001000101111101001/1111111010111111101111011'.split('/');
  const qrPath = matrix.flatMap((row, y) => [...row].flatMap((cell, x) => cell === '1' ? [`M${x + 4} ${y + 4}h1v1h-1Z`] : [])).join('');
  get('demo-qr').innerHTML = `<path fill="#17271e" d="${qrPath}"/>`;

  function setMotion(el, opacity, x = 0, y = 0, scale = 1, rotation = 0) {
    el.style.opacity = String(clamp(opacity));
    el.style.transform = `translate3d(${x}px,${y}px,0) scale(${scale}) rotate(${rotation}deg)`;
  }
  function cursor(id, local, start, end, from, to, clickAt) {
    const el = get(id);
    const path = out((local - start) / (end - start));
    const opacity = smooth((local - start) / .2) * (1 - smooth((local - clickAt - .45) / .25));
    const press = smooth((local - clickAt) / .09) * (1 - smooth((local - clickAt - .1) / .16));
    setMotion(el, opacity, mix(from[0], to[0], path), mix(from[1], to[1], path), 1 - press * .16);
    const ring = el.querySelector('.tap-ring');
    const ripple = clamp((local - clickAt) / .5);
    ring.style.opacity = local >= clickAt ? String((1 - ripple) * .65) : '0';
    ring.style.transform = `scale(${.4 + ripple * 1.9})`;
    return press;
  }
  function render(seconds) {
    current = clamp(seconds, 0, DURATION);
    for (const scene of scenes) {
      const start = Number(scene.dataset.start);
      const end = Number(scene.dataset.end);
      const local = current - start;
      const enter = start === 0 ? 1 : smooth((local + .3) / .6);
      const leave = end === DURATION ? 0 : smooth((current - end + .3) / .6);
      const opacity = enter * (1 - leave);
      scene.style.visibility = opacity > 0 ? 'visible' : 'hidden';
      scene.setAttribute('aria-hidden', opacity < .5 ? 'true' : 'false');
      setMotion(scene, opacity, 0, (1 - enter) * 30 - leave * 26, 1 - leave * .015);
      for (const el of scene.querySelectorAll('[data-in]')) {
        const delay = Number(el.dataset.in);
        const p = out((local - delay + (start === 0 ? .75 : .25)) / .7);
        if (el.classList.contains('merchant-pill')) {
          el.style.opacity = String(p);
          el.style.transform = `translateX(-50%) translateY(${(1 - p) * 24}px)`;
        } else setMotion(el, p, 0, (1 - p) * 28, 1 - (1 - p) * .016);
      }
    }

    // 1. A single total becomes three equal, moving cards.
    const intro = current;
    get('intro-total').textContent = money(6000 * out((intro - .35) / 1.2));
    for (let i = 1; i <= 3; i++) {
      const p = out((intro - 1.65 - i * .11) / .85);
      setMotion(get(`intro-share-${i}`), p, (2 - i) * 245 * (1 - p), -128 * (1 - p), .8 + p * .2, (i - 2) * (1 - p) * 9);
    }

    // 2. Meaningful field entry followed by a purposeful tap.
    const entry = current - 4.8;
    get('typed-merchant').textContent = 'The Bombay Bistro'.slice(0, Math.floor(clamp((entry - .5) / 1.0) * 17));
    get('typed-vpa').textContent = 'bistro@demo'.slice(0, Math.floor(clamp((entry - 1.4) / .65) * 11));
    get('merchant-caret').style.opacity = entry > .5 && entry < 1.5 ? '1' : '0';
    get('typed-amount').textContent = Math.round(6000 * out((entry - 2) / .75)).toLocaleString('en-IN');
    const entryPress = cursor('entry-cursor', entry, 2.9, 3.75, [947, 944], [693, 887], 3.84);
    get('entry-button').style.transform = `scale(${1 - entryPress * .025})`;
    get('entry-button').style.background = entry >= 3.84 ? '#305e3f' : '#17271e';

    // 3. The equal tab becomes active, the people count updates, amounts divide.
    const split = current - 10;
    const tabP = out((split - .75) / .7);
    get('tab-highlight').style.transform = `translateX(${(1 - tabP) * 281}px)`;
    get('equal-tab').style.color = tabP > .7 ? '#ffffff' : '#758571';
    const amountP = out((split - 1.8) / .85);
    get('people-count').textContent = split < 1.7 ? '2' : '3';
    const splitPress = cursor('split-cursor', split, .55, 1.05, [926, 470], [178, 354], 1.13);
    get('tab-highlight').style.filter = splitPress > 0 ? `brightness(${1 + splitPress * .15})` : 'none';
    for (let i = 1; i <= 3; i++) {
      const p = out((split - 1.8 - i * .11) / .7);
      const item = get(`split-amount-${i}`).parentElement;
      setMotion(item, p, (2 - i) * 150 * (1 - p), (1 - p) * -25, .86 + p * .14);
      get(`split-amount-${i}`).textContent = money(mix(3000, 2000, amountP));
    }

    // 4. Three requests fan out, all labelled for the same merchant.
    const requests = current - 15.5;
    for (let i = 1; i <= 3; i++) {
      const p = out((requests - .65 - i * .18) / .85);
      setMotion(get(`request-${i}`), p, (i % 2 ? -1 : 1) * (1 - p) * 170, (1 - p) * 34, .94 + p * .06, (i - 2) * (1 - p) * 6);
    }

    // 5. Demonstration scan, explicit manual-confirmation dialog, then tap.
    const confirm = current - 20.5;
    const scanP = clamp((confirm - .9) / 1.65);
    const scanLine = get('scan-line');
    scanLine.style.transform = `translateY(${scanP * 237}px)`;
    scanLine.style.opacity = confirm >= .9 && confirm <= 2.55 ? String(Math.sin(scanP * Math.PI)) : '0';
    const dialogP = out((confirm - 2.65) / .75);
    setMotion(get('confirm-dialog'), dialogP, 0, (1 - dialogP) * 165, .92 + dialogP * .08);
    get('qr-panel').style.transform = `translateY(${-dialogP * 36}px) scale(${1 - dialogP * .03})`;
    const confirmPress = cursor('confirm-cursor', confirm, 3.65, 4.4, [938, 1000], [661, 878], 4.52);
    get('confirm-button').style.transform = `scale(${1 - confirmPress * .03})`;
    get('confirm-button').style.background = confirm >= 4.52 ? '#305e3f' : '#17271e';

    // 6. Manual progress fills and rows confirm sequentially.
    const summary = current - 26.5;
    const receiptP = out((summary - .5) / 1.9);
    get('receipt-total').innerHTML = `${money(6000 * receiptP)}<span>.00</span>`;
    get('receipt-progress').style.width = `${receiptP * 100}%`;
    const marked = summary < .65 ? 0 : summary < 1.12 ? 1 : summary < 1.59 ? 2 : 3;
    get('receipt-count').textContent = `${marked} of 3 marked complete`;
    for (let i = 1; i <= 3; i++) {
      const p = out((summary - .4 - i * .32) / .6);
      setMotion(get(`receipt-row-${i}`), p, (1 - p) * 30, 0, 1);
    }

    // 7. The green end card arrives with a subtle physical scale and icon turn.
    const outro = current - 31.5;
    const endP = out((outro + .2) / .85);
    setMotion(get('finale-card'), 1, 0, (1 - endP) * 55, .87 + endP * .13);
    setMotion(get('finale-icon'), out((outro + .05) / .9), 0, 0, .8 + endP * .2, -14 * (1 - endP));
    get('verification-note').textContent = current >= 20.2 && current < 31.5 ? 'Manual confirmation · not bank-verified' : 'Designed for everyday together.';
    get('film-time-fill').style.width = `${current / DURATION * 100}%`;
    slider.value = String(current);
    slider.setAttribute('aria-valuetext', `${Math.floor(current)} seconds of 36`);
    timeLabel.textContent = `0:${String(Math.floor(current)).padStart(2, '0')} / 0:36`;
  }

  function updateControls() {
    controls.textContent = playing ? 'Pause' : current >= DURATION ? 'Play again' : 'Play';
    controls.setAttribute('aria-label', playing ? 'Pause animation' : 'Play animation');
  }
  function pause() {
    playing = false;
    cancelAnimationFrame(frame);
    updateControls();
  }
  function tick(now) {
    if (!playing) return;
    render(basePosition + (now - baseTime) / 1000);
    if (current >= DURATION) { pause(); status.textContent = 'Animation complete.'; return; }
    frame = requestAnimationFrame(tick);
  }
  function play() {
    if (playing) return;
    if (current >= DURATION) render(0);
    playing = true;
    baseTime = performance.now();
    basePosition = current;
    updateControls();
    frame = requestAnimationFrame(tick);
  }
  function seek(seconds) {
    pause();
    render(Number.isFinite(Number(seconds)) ? Number(seconds) : 0);
    updateControls();
    return { time: current, duration: DURATION, playing };
  }
  function replay() { seek(0); play(); }
  controls.addEventListener('click', () => playing ? pause() : play());
  get('replay').addEventListener('click', replay);
  slider.addEventListener('input', () => seek(Number(slider.value)));
  addEventListener('keydown', (event) => {
    if (/INPUT|BUTTON/.test(event.target.tagName)) return;
    if (event.code === 'Space') {
      event.preventDefault();
      if (playing) pause();
      else play();
    }
    if (event.code === 'ArrowRight') { event.preventDefault(); seek(current + 1); }
    if (event.code === 'ArrowLeft') { event.preventDefault(); seek(current - 1); }
    if (event.code === 'KeyR') replay();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && !exportMode) pause(); });
  window.FILM_DURATION = DURATION;
  window.seekFilm = seek;
  window.playFilm = play;
  window.pauseFilm = pause;
  window.getFilmState = () => ({ time: current, duration: DURATION, playing, width: 1080, height: 1350 });
  render(current);
  updateControls();
  document.fonts.ready.then(() => {
    document.documentElement.dataset.filmReady = 'true';
    if (params.get('paused') !== '1' && !exportMode && !reducedMotion) play();
  });
})();
