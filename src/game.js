/* «Гонки на печках в Дубае» — логика гонки, светофоры, ИИ, камера, интерфейс. */
(function (global) {
  'use strict';

  var MAX_SPEED = 27;          // м/с (~97 км/ч)
  var ACCEL = 7.5;             // разгон, м/с^2
  var BRAKE = 11.5;            // торможение при отпущенной клавише, м/с^2
  var FIELD_SIZE = 8;          // всего печек на трассе

  var COLORS = [0xff4d4d, 0x4da3ff, 0x53d769, 0xffd23f, 0xb46cff, 0xff8a3d, 0x38e0d0, 0xff6fb5];
  var HUMAN_KEYS = [
    { code: 'Digit1', label: '1' }, { code: 'Digit2', label: '2' }, { code: 'Digit3', label: '3' },
    { code: 'Digit4', label: '4' }, { code: 'Digit5', label: '5' }, { code: 'Digit6', label: '6' },
    { code: 'Digit7', label: '7' }
  ];
  var AI_NAMES = ['Кузьмич', 'Матрёна', 'Валера', 'Зульфия', 'Дядя Гриша', 'Печкин', 'Байрам', 'Тётя Зина'];

  var Game = {};
  var renderer, scene, camera, clock;
  var track, intersections, smoke;
  var racers = [];
  var sfx = new Sfx();
  var engineNode = null;
  var keys = {};
  var touchThrottle = {};
  var state = 'menu';          // menu | countdown | race | over
  var countdown = 0;
  var totalLaps = 2;
  var focusIndex = 0;
  var cameraMode = 0;          // 0 — за печкой, 1 — дальний план, 2 — сверху
  var finishOrder = [];
  var overTimer = 0;
  var elapsed = 0;
  var camPos = new THREE.Vector3();
  var camLook = new THREE.Vector3();
  var ui = {};

  /* ---------------- Инициализация сцены ---------------- */

  function initRenderer() {
    renderer = new THREE.WebGLRenderer({ antialias: true, canvas: ui.canvas });
    renderer.setPixelRatio(Math.min(global.devicePixelRatio || 1, 2));
    renderer.setSize(global.innerWidth, global.innerHeight);
    renderer.setClearColor(0xbcd3e6);

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xd8c49b, 0.0013);

    camera = new THREE.PerspectiveCamera(62, global.innerWidth / global.innerHeight, 0.5, 3000);
    camera.position.set(0, 20, 40);

    scene.add(new THREE.HemisphereLight(0xdfefff, 0xd8bd8a, 0.95));
    var sun = new THREE.DirectionalLight(0xfff2d0, 0.85);
    sun.position.set(-320, 420, -260);
    scene.add(sun);

    clock = new THREE.Clock();
    global.addEventListener('resize', onResize);
  }

  function onResize() {
    if (!renderer) return;
    camera.aspect = global.innerWidth / global.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(global.innerWidth, global.innerHeight);
  }

  function buildWorld() {
    track = World.buildTrack();
    World.buildCity(track, scene);
    scene.add(World.shoulderMesh(track));
    scene.add(World.roadMesh(track));
    intersections = World.buildIntersections(track, scene);
    intersections.forEach(function (i) { World.applyLightState(i); });
    addStartLine();
    smoke = new World.SmokeSystem(scene, 300);
  }

  function addStartLine() {
    var p = track.pointAt(0);
    var t = track.tangentAt(0);
    var g = new THREE.Group();
    g.position.copy(p);
    g.rotation.y = Math.atan2(t.x, t.z);

    var tex = World.canvasTexture(64, 64, function (ctx, w, h) {
      for (var y = 0; y < 8; y++) {
        for (var x = 0; x < 8; x++) {
          ctx.fillStyle = ((x + y) % 2) ? '#f4f1e6' : '#22252a';
          ctx.fillRect(x * w / 8, y * h / 8, w / 8, h / 8);
        }
      }
    }, 16, 1);
    var line = new THREE.Mesh(new THREE.PlaneGeometry(track.width, 3.5),
      new THREE.MeshBasicMaterial({ map: tex }));
    line.rotation.x = -Math.PI / 2;
    line.position.y = 0.07;
    g.add(line);

    // арка «СТАРТ / ФИНИШ»
    var postMat = new THREE.MeshLambertMaterial({ color: 0x2f3540 });
    for (var s = -1; s <= 1; s += 2) {
      var post = new THREE.Mesh(new THREE.BoxGeometry(1.2, 12, 1.2), postMat);
      post.position.set(s * (track.width / 2 + 1), 6, 0);
      g.add(post);
    }
    var bannerTex = World.canvasTexture(512, 128, function (ctx, w, h) {
      ctx.fillStyle = '#0f1a2b';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffd23f';
      ctx.font = 'bold 62px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('СТАРТ · ФИНИШ', w / 2, h / 2);
    });
    // два полотнища спина к спине, чтобы надпись читалась с обеих сторон
    for (var b = 0; b < 2; b++) {
      var banner = new THREE.Mesh(new THREE.PlaneGeometry(track.width + 4, 4.6),
        new THREE.MeshBasicMaterial({ map: bannerTex }));
      banner.position.set(0, 10.5, b === 0 ? 0.06 : -0.06);
      banner.rotation.y = b === 0 ? Math.PI : 0;
      g.add(banner);
    }
    scene.add(g);
  }

  /* ---------------- Гонщики ---------------- */

  function createRacers(humanCount) {
    racers.forEach(function (r) { scene.remove(r.mesh); });
    racers = [];
    finishOrder = [];
    var shuffledAi = AI_NAMES.slice().sort(function () { return Math.random() - 0.5; });

    for (var i = 0; i < FIELD_SIZE; i++) {
      var isHuman = i < humanCount;
      var name = isHuman ? ('Игрок ' + (i + 1)) : shuffledAi[i - humanCount];
      var color = COLORS[i % COLORS.length];
      var labelText = isHuman ? (name + ' [' + HUMAN_KEYS[i].label + ']') : null;
      var mesh = World.buildStove(color, labelText);
      scene.add(mesh);

      var row = Math.floor(i / 2);
      var col = i % 2;
      var r = {
        id: i,
        name: name,
        color: color,
        isHuman: isHuman,
        key: isHuman ? HUMAN_KEYS[i].code : null,
        keyLabel: isHuman ? HUMAN_KEYS[i].label : null,
        mesh: mesh,
        lane: (col === 0 ? -1 : 1) * (2.6 + row * 1.75),
        dist: -8 - row * 9,
        prevDist: -8 - row * 9,
        speed: 0,
        throttle: false,
        lap: 1,
        finished: false,
        dq: false,
        place: i + 1,
        finishTime: 0,
        smokeAcc: 0,
        bob: Math.random() * 10,
        ai: {
          reaction: 0.18 + Math.random() * 0.55,
          reckless: Math.random(),
          skill: 0.87 + Math.random() * 0.13
        }
      };
      r.lane = Math.max(-8, Math.min(8, r.lane));
      placeRacer(r);
      racers.push(r);
    }
    focusIndex = 0;
  }

  function placeRacer(r) {
    var p = track.pointAt(r.dist);
    var t = track.tangentAt(r.dist);
    var n = track.sideAt(r.dist);
    r.mesh.position.copy(p).addScaledVector(n, r.lane);
    r.mesh.position.y = 0;
    r.mesh.rotation.y = Math.atan2(t.x, t.z);
  }

  /* ---------------- Светофоры ---------------- */

  function updateLights(dt) {
    for (var i = 0; i < intersections.length; i++) {
      var it = intersections[i];
      it.timer -= dt;
      if (it.timer > 0) continue;
      if (it.state === 'green') {
        it.state = 'yellow';
        it.timer = 1.7;
      } else if (it.state === 'yellow') {
        it.state = 'red';
        it.timer = 3.4 + Math.random() * 3.6;
      } else {
        it.state = 'green';
        it.timer = 5 + Math.random() * 5;
        // «загорелся зелёный» — гудок паровоза: громкость по расстоянию,
        // а перекрёсток, к которому едет наша печка, слышно всегда
        var d = camera.position.distanceTo(it.position);
        var vol = Math.max(0, 1 - d / 420);
        var f = focusRacer();
        if (f && nextIntersection(f).inter === it) vol = Math.max(vol, 0.85);
        if (state === 'race' && vol > 0.05) sfx.trainWhistle(vol * 0.9);
      }
      World.applyLightState(it);
    }
  }

  function randomizeLights() {
    for (var i = 0; i < intersections.length; i++) {
      var it = intersections[i];
      var roll = Math.random();
      it.state = roll < 0.5 ? 'green' : (roll < 0.62 ? 'yellow' : 'red');
      it.timer = 2 + Math.random() * 6;
      World.applyLightState(it);
    }
  }

  /* Ближайший перекрёсток впереди: расстояние до стоп-линии и его состояние. */
  function nextIntersection(r) {
    var best = null, bestGap = Infinity;
    for (var i = 0; i < intersections.length; i++) {
      var it = intersections[i];
      var gap = track.norm(it.dist - r.dist);
      if (gap < bestGap) { bestGap = gap; best = it; }
    }
    return { inter: best, gap: bestGap, toStop: bestGap - (track.width / 2 + 7.5) };
  }

  function crossedIntersection(r, it) {
    var L = track.length;
    var a = Math.floor((r.prevDist - it.dist) / L);
    var b = Math.floor((r.dist - it.dist) / L);
    return b > a;
  }

  function disqualify(r) {
    if (r.dq || r.finished) return;
    r.dq = true;
    r.place = 0;
    r.speed = 0;
    r.throttle = false;
    r.mesh.userData.stripe.material.color.setHex(0x555555);
    r.mesh.userData.fire.visible = false;
    r.mesh.userData.fireGlow.visible = false;
    for (var i = 0; i < 16; i++) {
      var p = r.mesh.position.clone();
      p.y = 3 + Math.random() * 2;
      smoke.emit(p, new THREE.Vector3((Math.random() - 0.5) * 6, 2 + Math.random() * 4, (Math.random() - 0.5) * 6), 3, true);
    }
    sfx.buzzer();
    flash('ДИСКВАЛИФИКАЦИЯ: ' + r.name + ' проехал на красный!', '#ff4d4d');
  }

  /* ---------------- Обновление гонки ---------------- */

  function updateRacer(r, dt) {
    if (r.dq) return;
    if (r.finished) {
      // докатывается и останавливается
      r.throttle = false;
      r.speed = Math.max(0, r.speed - BRAKE * 0.5 * dt);
    } else {
      if (r.isHuman) {
        r.throttle = !!(keys[r.key] || touchThrottle[r.id] ||
          (r.id === 0 && (keys['Space'] || keys['ArrowUp'])));
      } else {
        r.throttle = aiThrottle(r);
      }
      var maxV = MAX_SPEED * (r.isHuman ? 1 : r.ai.skill);
      if (r.throttle) r.speed = Math.min(maxV, r.speed + ACCEL * dt);
      else r.speed = Math.max(0, r.speed - BRAKE * dt);
    }

    r.prevDist = r.dist;
    r.dist += r.speed * dt;

    // проверка перекрёстков
    for (var i = 0; i < intersections.length; i++) {
      var it = intersections[i];
      if (crossedIntersection(r, it) && it.state === 'red') {
        disqualify(r);
        r.dist = r.prevDist;
        break;
      }
    }
    if (r.dq) return;

    // круги и финиш
    var lap = Math.floor(r.dist / track.length) + 1;
    if (lap > r.lap && !r.finished) {
      r.lap = lap;
      if (r.lap > totalLaps) {
        r.finished = true;
        r.finishTime = elapsed;
        finishOrder.push(r);
        if (finishOrder.length === 1) {
          sfx.fanfare();
          flash('🏁 ' + r.name + ' финишировал первым!', '#ffd23f');
        } else if (r.isHuman) {
          flash('🏁 ' + r.name + ' на финише, место ' + finishOrder.length, '#8ce99a');
        }
      }
    }

    placeRacer(r);
    animateStove(r, dt);
  }

  function aiThrottle(r) {
    var ni = nextIntersection(r);
    var st = ni.inter.state;
    var toStop = ni.toStop;

    // держится у стоп-линии, пока красный
    if (st === 'red' && toStop < 2.5 && toStop > -3 && r.speed < 4) {
      r.speed = 0;
      return false;
    }
    var mustStop = false;
    if (st === 'red') mustStop = true;
    else if (st === 'yellow' && r.ai.reckless < 0.7) mustStop = true;

    // лихачи иногда всё-таки летят на красный
    if (st === 'red' && r.ai.reckless > 0.86 && toStop < 16 && r.speed > 14) mustStop = false;

    if (mustStop) {
      var need = (r.speed * r.speed) / (2 * BRAKE) + r.speed * r.ai.reaction + 3;
      if (toStop < need) return false;
    }
    return true;
  }

  function animateStove(r, dt) {
    var u = r.mesh.userData;
    var spin = r.speed * dt / 0.62;
    for (var i = 0; i < u.wheels.length; i++) u.wheels[i].rotation.x -= spin;

    r.bob += dt * (2 + r.speed * 0.6);
    u.body.position.y = 1.35 + Math.sin(r.bob) * 0.035 * Math.min(1, r.speed / 8);
    var flick = 0.85 + Math.sin(r.bob * 3.3) * 0.15 + (r.throttle ? 0.35 : 0);
    u.fireGlow.scale.set(3 * flick, 2.4 * flick, 1);

    if (!r.dq) {
      r.smokeAcc += dt * (2.5 + r.speed * 0.5 + (r.throttle ? 6 : 0));
      while (r.smokeAcc > 1) {
        r.smokeAcc -= 1;
        var pipe = new THREE.Vector3(0, 5.0, -1.15).applyEuler(r.mesh.rotation).add(r.mesh.position);
        var back = track.tangentAt(r.dist).multiplyScalar(-r.speed * 0.25);
        back.y = 2.2 + Math.random() * 1.4;
        back.x += (Math.random() - 0.5) * 1.4;
        back.z += (Math.random() - 0.5) * 1.4;
        smoke.emit(pipe, back, 1.6 + Math.random(), false);
      }
    }
  }

  function ranking() {
    var alive = racers.filter(function (r) { return !r.dq; });
    alive.sort(function (a, b) {
      if (a.finished && b.finished) return finishOrder.indexOf(a) - finishOrder.indexOf(b);
      if (a.finished) return -1;
      if (b.finished) return 1;
      return b.dist - a.dist;
    });
    alive.forEach(function (r, i) { r.place = i + 1; });
    return alive;
  }

  /* ---------------- Камера ---------------- */

  function focusRacer() {
    var r = racers[focusIndex];
    if (!r || r.dq) {
      var alive = ranking().filter(function (x) { return !x.finished; });
      if (alive.length) {
        r = alive[0];
        focusIndex = r.id;
      } else if (racers.length) {
        r = racers[focusIndex] || racers[0];
      }
    }
    return r;
  }

  function updateCamera(dt, r) {
    if (!r) return;
    var t = track.tangentAt(r.dist);
    var desired = new THREE.Vector3();
    var look = r.mesh.position.clone();

    if (cameraMode === 0) {
      desired.copy(r.mesh.position).addScaledVector(t, -15).add(new THREE.Vector3(0, 7.5, 0));
      look.addScaledVector(t, 14);
      look.y += 2.2;
    } else if (cameraMode === 1) {
      desired.copy(r.mesh.position).addScaledVector(t, -30).add(new THREE.Vector3(0, 18, 0));
      look.addScaledVector(t, 20);
      look.y += 3;
    } else {
      desired.copy(r.mesh.position).add(new THREE.Vector3(0, 62, 0)).addScaledVector(t, -6);
      look.y += 1;
    }

    var k = 1 - Math.pow(0.0016, dt);
    camPos.lerp(desired, k);
    camLook.lerp(look, Math.min(1, k * 1.6));
    camera.position.copy(camPos);

    // на скорости шире угол и небольшая тряска — печка всё-таки не гоночный болид
    if (cameraMode !== 2) {
      var v = r.speed / MAX_SPEED;
      var fov = 62 + v * 8;
      if (Math.abs(camera.fov - fov) > 0.1) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }
      var shake = v * v * 0.16;
      camera.position.x += (Math.random() - 0.5) * shake;
      camera.position.y += (Math.random() - 0.5) * shake;
    }
    camera.lookAt(camLook);
  }

  /* ---------------- Интерфейс ---------------- */

  function flash(text, color) {
    ui.flash.textContent = text;
    ui.flash.style.color = color || '#fff';
    ui.flash.style.opacity = '1';
    clearTimeout(ui.flashTimer);
    ui.flashTimer = setTimeout(function () { ui.flash.style.opacity = '0'; }, 2600);
  }

  function updateHud() {
    var order = ranking();
    var rows = '';
    for (var i = 0; i < order.length; i++) {
      var r = order[i];
      var status = r.finished ? 'финиш' : ('круг ' + Math.min(r.lap, totalLaps) + '/' + totalLaps);
      rows += '<div class="row' + (r.isHuman ? ' me' : '') + '">' +
        '<span class="pos">' + (i + 1) + '</span>' +
        '<span class="dot" style="background:#' + new THREE.Color(r.color).getHexString() + '"></span>' +
        '<span class="nm">' + r.name + '</span>' +
        '<span class="st">' + status + '</span></div>';
    }
    var dqd = racers.filter(function (r) { return r.dq; });
    for (var j = 0; j < dqd.length; j++) {
      rows += '<div class="row dq">' +
        '<span class="pos">—</span>' +
        '<span class="dot" style="background:#555"></span>' +
        '<span class="nm">' + dqd[j].name + '</span>' +
        '<span class="st">снят</span></div>';
    }
    ui.board.innerHTML = rows;

    var f = focusRacer();
    if (!f) return;
    ui.speed.textContent = Math.round(f.speed * 3.6);
    ui.watching.textContent = f.name + (f.isHuman ? ' · клавиша ' + f.keyLabel : ' · компьютер');

    var ni = nextIntersection(f);
    var st = ni.inter.state;
    var names = { red: 'КРАСНЫЙ — СТОЙ!', yellow: 'ЖЁЛТЫЙ — тормози', green: 'ЗЕЛЁНЫЙ — гони' };
    var colors = { red: '#ff4040', yellow: '#ffc42b', green: '#3ddc6b' };
    ui.lightLamp.style.background = colors[st];
    ui.lightLamp.style.boxShadow = '0 0 22px ' + colors[st];
    ui.lightText.textContent = names[st];
    ui.lightDist.textContent = Math.max(0, Math.round(ni.toStop)) + ' м';
    var danger = st === 'red' && ni.toStop < (f.speed * f.speed) / (2 * BRAKE) + 6 && f.speed > 2;
    ui.lightBox.className = 'light-box' + (danger ? ' danger' : '');

    // индикаторы газа игроков
    for (var h = 0; h < ui.pedals.length; h++) {
      var pr = racers[h];
      if (!pr) continue;
      ui.pedals[h].classList.toggle('on', !!pr.throttle && !pr.dq && !pr.finished);
      ui.pedals[h].classList.toggle('out', pr.dq);
      ui.pedals[h].querySelector('.pspeed').textContent = pr.dq ? 'снят' :
        (pr.finished ? 'финиш' : Math.round(pr.speed * 3.6) + ' км/ч');
    }
  }

  function showResults() {
    state = 'over';
    sfx.stopEngines();
    engineNode = null;
    var order = ranking();
    var humans = racers.filter(function (r) { return r.isHuman; });
    var allHumansOut = humans.every(function (r) { return r.dq; });
    var title = allHumansOut ? 'Все живые игроки сняты за красный' : 'Итоги гонки';
    var html = '<h2>' + title + '</h2><ol class="results">';
    for (var i = 0; i < order.length; i++) {
      var r = order[i];
      var note = r.finished ? (r.finishTime.toFixed(1) + ' с')
        : ('в пути · круг ' + Math.min(r.lap, totalLaps) + '/' + totalLaps);
      html += '<li><span class="dot" style="background:#' + new THREE.Color(r.color).getHexString() + '"></span>' +
        r.name + ' <em>' + note + '</em></li>';
    }
    html += '</ol>';
    var dqd = racers.filter(function (r) { return r.dq; });
    if (dqd.length) {
      html += '<p class="dqlist">Дисквалифицированы за красный: ' +
        dqd.map(function (r) { return r.name; }).join(', ') + '</p>';
    }
    ui.resultBody.innerHTML = html;
    ui.results.classList.add('show');
  }

  /* ---------------- Цикл ---------------- */

  function loop() {
    requestAnimationFrame(loop);
    var dt = Math.min(clock.getDelta(), 0.05);
    if (!scene) return;

    if (state === 'countdown') {
      var before = Math.ceil(countdown);
      countdown -= dt;
      var after = Math.ceil(countdown);
      if (after !== before) {
        if (after > 0) sfx.beep(520, 0.2);
        else sfx.beep(880, 0.5, 0.22);
      }
      ui.countdown.textContent = countdown > 0 ? String(Math.ceil(countdown)) : 'ПОЕХАЛИ!';
      if (countdown <= -0.7) {
        ui.countdown.textContent = '';
        ui.countdown.classList.remove('show');
        state = 'race';
      }
      updateLights(dt);
    } else if (state === 'race') {
      elapsed += dt;
      updateLights(dt);
      for (var i = 0; i < racers.length; i++) updateRacer(racers[i], dt);

      var humansDone = racers.filter(function (r) { return r.isHuman; })
        .every(function (r) { return r.dq || r.finished; });
      var allDone = racers.every(function (r) { return r.dq || r.finished; });
      if (allDone) { overTimer += dt; if (overTimer > 1.2) showResults(); }
      else if (humansDone) { overTimer += dt; if (overTimer > 3) showResults(); }
    }

    if (smoke) smoke.update(dt);
    var f = (state === 'menu') ? null : focusRacer();
    // подпись печки, за которой едет камера, только мешает — гасим её
    for (var n = 0; n < racers.length; n++) {
      var lbl = racers[n].mesh.userData.label;
      if (lbl) lbl.visible = !f || racers[n] !== f;
    }
    if (state === 'menu') updateMenuCamera(dt);
    else updateCamera(dt, f);

    if (state !== 'menu') {
      updateHud();
      if (engineNode && f) sfx.updateEngine(engineNode, f.speed, f.throttle);
    }
    renderer.render(scene, camera);
  }

  var menuT = 0;
  function updateMenuCamera(dt) {
    menuT += dt;
    var d = 120 + menuT * 22;
    var p = track.pointAt(d);
    camera.position.set(p.x, 26, p.z);
    var look = track.pointAt(d + 90);
    camera.lookAt(look.x, 6, look.z);
  }

  /* ---------------- Ввод ---------------- */

  function bindInput() {
    global.addEventListener('keydown', function (e) {
      keys[e.code] = true;
      if (e.code === 'Space' || e.code.indexOf('Digit') === 0 || e.code === 'ArrowUp') e.preventDefault();
      if (e.code === 'KeyC' && state !== 'menu') cycleFocus();
      if (e.code === 'KeyV' && state !== 'menu') cameraMode = (cameraMode + 1) % 3;
      if (e.code === 'KeyM') { sfx.setMuted(!sfx.muted); ui.mute.textContent = sfx.muted ? '🔇' : '🔊'; }
      if (e.code === 'KeyR' && state === 'over') backToMenu();
      sfx.resume();
    });
    global.addEventListener('keyup', function (e) { keys[e.code] = false; });
    global.addEventListener('blur', function () { keys = {}; });
  }

  function cycleFocus() {
    var start = focusIndex;
    for (var i = 1; i <= racers.length; i++) {
      var idx = (start + i) % racers.length;
      if (!racers[idx].dq) { focusIndex = idx; break; }
    }
    flash('Камера: ' + racers[focusIndex].name, '#9ad8ff');
  }

  /* ---------------- Меню и запуск ---------------- */

  function buildPedals(humanCount) {
    ui.pedalBar.innerHTML = '';
    ui.pedals = [];
    for (var i = 0; i < humanCount; i++) {
      var el = document.createElement('div');
      el.className = 'pedal';
      el.style.borderColor = '#' + new THREE.Color(COLORS[i]).getHexString();
      el.innerHTML = '<b>Игрок ' + (i + 1) + '</b>' +
        '<span class="pkey">' + HUMAN_KEYS[i].label + '</span>' +
        '<span class="pspeed">0 км/ч</span>';
      ui.pedalBar.appendChild(el);
      ui.pedals.push(el);

      (function (idx, node) {
        function down(ev) { ev.preventDefault(); touchThrottle[idx] = true; node.classList.add('on'); sfx.resume(); }
        function up(ev) { ev.preventDefault(); touchThrottle[idx] = false; node.classList.remove('on'); }
        node.addEventListener('pointerdown', down);
        node.addEventListener('pointerup', up);
        node.addEventListener('pointercancel', up);
        node.addEventListener('pointerleave', up);
      })(i, el);
    }
  }

  function startRace(humanCount, laps) {
    totalLaps = laps;
    createRacers(humanCount);
    randomizeLights();
    buildPedals(humanCount);
    touchThrottle = {};
    keys = {};
    elapsed = 0;
    overTimer = 0;
    cameraMode = 0;
    state = 'countdown';
    countdown = 3.0;

    var f = racers[0];
    var t = track.tangentAt(f.dist);
    camPos.copy(f.mesh.position).addScaledVector(t, -15).add(new THREE.Vector3(0, 7.5, 0));
    camLook.copy(f.mesh.position);

    ui.menu.classList.remove('show');
    ui.results.classList.remove('show');
    ui.hud.classList.add('show');
    ui.countdown.classList.add('show');

    sfx.init();
    sfx.resume();
    sfx.stopEngines();
    engineNode = sfx.startEngine();
  }

  function backToMenu() {
    state = 'menu';
    sfx.stopEngines();
    engineNode = null;
    racers.forEach(function (r) { scene.remove(r.mesh); });
    racers = [];
    ui.results.classList.remove('show');
    ui.hud.classList.remove('show');
    ui.menu.classList.add('show');
  }

  /* ---------------- Точка входа ---------------- */

  Game.boot = function () {
    ui.canvas = document.getElementById('scene');
    ui.menu = document.getElementById('menu');
    ui.hud = document.getElementById('hud');
    ui.board = document.getElementById('board');
    ui.speed = document.getElementById('speed');
    ui.watching = document.getElementById('watching');
    ui.lightBox = document.getElementById('light-box');
    ui.lightLamp = document.getElementById('light-lamp');
    ui.lightText = document.getElementById('light-text');
    ui.lightDist = document.getElementById('light-dist');
    ui.flash = document.getElementById('flash');
    ui.countdown = document.getElementById('countdown');
    ui.results = document.getElementById('results');
    ui.resultBody = document.getElementById('result-body');
    ui.pedalBar = document.getElementById('pedals');
    ui.mute = document.getElementById('mute');
    ui.pedals = [];

    initRenderer();
    buildWorld();
    bindInput();
    loop();

    // выбор числа игроков
    var chosen = 1;
    var lapsChosen = 2;
    var playerBtns = document.querySelectorAll('#players button');
    var lapBtns = document.querySelectorAll('#laps button');
    playerBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        chosen = parseInt(b.dataset.n, 10);
        playerBtns.forEach(function (x) { x.classList.toggle('sel', x === b); });
        document.getElementById('ai-note').textContent =
          'За остальных ' + (FIELD_SIZE - chosen) + ' печек играет компьютер';
        renderKeyHints(chosen);
      });
    });
    lapBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        lapsChosen = parseInt(b.dataset.n, 10);
        lapBtns.forEach(function (x) { x.classList.toggle('sel', x === b); });
      });
    });
    document.getElementById('start').addEventListener('click', function () {
      startRace(chosen, lapsChosen);
    });
    document.getElementById('again').addEventListener('click', function () {
      startRace(chosen, lapsChosen);
    });
    document.getElementById('to-menu').addEventListener('click', backToMenu);
    ui.mute.addEventListener('click', function () {
      sfx.init();
      sfx.setMuted(!sfx.muted);
      ui.mute.textContent = sfx.muted ? '🔇' : '🔊';
    });
    document.getElementById('cam').addEventListener('click', function () {
      cameraMode = (cameraMode + 1) % 3;
    });
    document.getElementById('switch').addEventListener('click', function () {
      if (state !== 'menu') cycleFocus();
    });

    renderKeyHints(1);
  };

  function renderKeyHints(n) {
    var html = '';
    for (var i = 0; i < n; i++) {
      html += '<span class="kh" style="border-color:#' + new THREE.Color(COLORS[i]).getHexString() + '">' +
        'Игрок ' + (i + 1) + ' → <b>' + HUMAN_KEYS[i].label + '</b></span>';
    }
    if (n === 1) html += '<span class="kh">или <b>↑</b> / <b>Пробел</b></span>';
    document.getElementById('key-hints').innerHTML = html;
  }

  /* Служебный снимок состояния — удобно для отладки из консоли. */
  Game.debug = function () {
    return {
      state: state,
      elapsed: +elapsed.toFixed(1),
      laps: totalLaps,
      trackLength: Math.round(track ? track.length : 0),
      lights: intersections ? intersections.map(function (i) { return i.state; }) : [],
      racers: racers.map(function (r) {
        return {
          name: r.name, human: r.isHuman, lap: r.lap, dq: r.dq, finished: r.finished,
          kmh: Math.round(r.speed * 3.6), dist: Math.round(r.dist), place: r.place
        };
      })
    };
  };

  Game.renderInfo = function () {
    return renderer ? {
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      textures: renderer.info.memory.textures,
      geometries: renderer.info.memory.geometries
    } : null;
  };

  global.Game = Game;
  global.__dbg = Game.debug;
  global.__renderInfo = Game.renderInfo;
})(window);
