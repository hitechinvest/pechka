/* «Гонки на печках в Дубае» — логика гонки, светофоры, ИИ, камера, интерфейс. */
(function (global) {
  'use strict';

  var MAX_SPEED = 27;          // м/с (~97 км/ч)
  var ACCEL = 7.5;             // разгон, м/с^2
  var BRAKE = 11.5;            // торможение при отпущенной клавише, м/с^2
  var FIELD_SIZE = 8;          // всего печек на трассе
  var STEER_RATE = 6.4;        // м/с поперёк дороги на полном ходу
  var MAX_LANE = 9.6;          // до края асфальта
  var EDGE_LANE = 8.6;         // дальше — обочина: сыпется песок и падает скорость
  var EDGE_PENALTY = 0.8;      // множитель максимальной скорости на обочине
  var BODY_HALF = 1.38;        // полуширина печки для контактов
  var BOOST_SPEED = 39;        // м/с на турбо (~140 км/ч)
  var BOOST_ACCEL = 15;        // разгон на турбо
  var STEAM_DRAIN = 32;        // расход пара, % в секунду
  var STEAM_REFILL = 11;       // восстановление пара, % в секунду
  var STEAM_MIN = 18;          // ниже этого турбо не включить
  var HILL_PULL = 24;          // как сильно горка тянет назад (м/с^2 на единицу уклона)
  var DOWNHILL_CAP = 1.22;     // под горку можно перебрать сверх обычного максимума
  var GRAVITY = 12.5;          // сила тяжести: чуть меньше настоящей, чтобы прыжок читался

  var COLORS = [0xff4d4d, 0x4da3ff, 0x53d769, 0xffd23f, 0xb46cff, 0xff8a3d, 0x38e0d0, 0xff6fb5];
  /* Газ, руль и турбо для каждого игрока. Клавиши читаются по физическому
     положению, поэтому раскладка (русская или латиница) не важна.
     Цифра 1…7 — дублёр газа. */
  var HUMAN_KEYS = [
    { short: '↑', label: '↑ · ← → · Z (турбо)', throttle: ['ArrowUp', 'Space', 'Digit1'], left: ['ArrowLeft'], right: ['ArrowRight'], boost: ['KeyZ'] },
    { short: 'W', label: 'W · Q E', throttle: ['KeyW', 'Digit2'], left: ['KeyQ'], right: ['KeyE'], boost: [] },
    { short: 'I', label: 'I · J L', throttle: ['KeyI', 'Digit3'], left: ['KeyJ'], right: ['KeyL'], boost: [] },
    { short: 'T', label: 'T · F H', throttle: ['KeyT', 'Digit4'], left: ['KeyF'], right: ['KeyH'], boost: [] },
    { short: '8', label: 'Num 8 · 4 6', throttle: ['Numpad8', 'Digit5'], left: ['Numpad4'], right: ['Numpad6'], boost: [] },
    { short: 'N', label: 'N · B M', throttle: ['KeyN', 'Digit6'], left: ['KeyB'], right: ['KeyM'], boost: [] },
    { short: 'P', label: 'P · O [', throttle: ['KeyP', 'Digit7'], left: ['KeyO'], right: ['BracketLeft'], boost: [] }
  ];

  var AI_NAMES = ['Кузьмич', 'Матрёна', 'Валера', 'Зульфия', 'Дядя Гриша', 'Печкин', 'Байрам', 'Тётя Зина'];

  var Game = {};
  var renderer, scene, camera, clock;
  var track, intersections, smoke;
  var racers = [];
  var grannies = [];
  var granniesTimer = 0;
  var police = [];
  var camel = null;
  var roach = null;
  var puddles = [];
  var heli = null;
  var storm = { level: 0, active: false, timer: 45, left: 0, system: null };
  var sfx = new Sfx();
  var music = new Music(sfx);
  var engineNode = null;
  var keys = {};
  var touchThrottle = {};
  var touchSteer = {};
  var touchBoost = {};
  var state = 'menu';          // menu | countdown | race | over
  var countdown = 0;
  var totalLaps = 2;
  var focusIndex = 0;
  var cameraMode = 0;          // 0 — за печкой, 1 — дальний план, 2 — сверху
  var finishOrder = [];
  var overTimer = 0;
  var elapsed = 0;
  var lastHumans = 1;
  var fps = 60;
  var admin = {
    open: false,
    invincible: false,
    infiniteSteam: false,
    weakAI: false,
    noGrannies: false,
    noHazards: false,
    lights: 'auto'
  };
  var sunLight = null;
  var shadowsOn = false;
  var camPos = new THREE.Vector3();
  var camLook = new THREE.Vector3();
  var ui = {};

  /* ---------------- Инициализация сцены ---------------- */

  function initRenderer() {
    renderer = new THREE.WebGLRenderer({ antialias: true, canvas: ui.canvas });
    renderer.setPixelRatio(Math.min(global.devicePixelRatio || 1, 2));
    renderer.setSize(global.innerWidth, global.innerHeight);
    renderer.setClearColor(0xbcd3e6);

    // цвет и свет: линейное освещение с плёночной компрессией даёт куда более
    // живую картинку, чем сырой вывод
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.94;
    renderer.physicallyCorrectLights = false;
    World.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

    // тени: на телефоне по умолчанию выключены, на десктопе включены
    shadowsOn = !('ontouchstart' in global) && global.innerWidth > 700;
    renderer.shadowMap.enabled = shadowsOn;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xcbb489, 0.0013);

    camera = new THREE.PerspectiveCamera(62, global.innerWidth / global.innerHeight, 0.5, 3000);
    camera.position.set(0, 20, 40);

    scene.add(new THREE.HemisphereLight(0xbcd8ff, 0xa98d5f, 0.62));
    sunLight = new THREE.DirectionalLight(0xfff0c8, 1.3);
    sunLight.position.set(-90, 130, -70);
    sunLight.castShadow = shadowsOn;
    sunLight.shadow.mapSize.set(2048, 2048);
    var cam = sunLight.shadow.camera;
    cam.left = -70; cam.right = 70; cam.top = 70; cam.bottom = -70;
    cam.near = 10; cam.far = 380;
    sunLight.shadow.bias = -0.0012;
    sunLight.shadow.normalBias = 0.6;
    scene.add(sunLight);
    scene.add(sunLight.target);

    clock = new THREE.Clock();
    global.addEventListener('resize', onResize);
  }

  /* Солнце светит вокруг печки в фокусе — так теневая карта тратится на то,
     что реально видно. */
  function updateSun(r) {
    if (!sunLight || !r) return;
    sunLight.target.position.copy(r.mesh.position);
    sunLight.position.copy(r.mesh.position).add(new THREE.Vector3(-90, 130, -70));
  }

  function setShadows(on) {
    shadowsOn = on;
    renderer.shadowMap.enabled = on;
    sunLight.castShadow = on;
    scene.traverse(function (o) { if (o.isMesh && o.userData.shadowCaster) o.castShadow = on; });
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
    var ground = [World.embankmentMesh(track), World.shoulderMesh(track), World.roadMesh(track)];
    for (var i = 0; i < ground.length; i++) {
      ground[i].receiveShadow = true;
      scene.add(ground[i]);
    }
    World.jumpSigns(track, scene);
    intersections = World.buildIntersections(track, scene);
    intersections.forEach(function (i) { World.applyLightState(i); });
    addStartLine();
    smoke = new World.SmokeSystem(scene, 300);
    createGrannies();
    createHazards();
  }

  /* ---------------- Полиция, звери, лужи, буря ---------------- */

  function createHazards() {
    for (var i = 0; i < 2; i++) {
      var mesh = World.buildPoliceCar();
      scene.add(mesh);
      police.push({ isPolice: true, mesh: mesh, active: false, dist: 0, lane: 0,
        phase: 'parked', timer: 0, granny: null, blink: 0 });
    }

    var cm = World.buildCamel();
    scene.add(cm);
    camel = { isCamel: true, mesh: cm, active: false, dist: 0, lane: 0, dir: 1,
      speed: 1, walk: 0, timer: 25 + Math.random() * 30 };

    var rm = World.buildRoach();
    scene.add(rm);
    roach = { isRoach: true, mesh: rm, active: false, dist: 0, lane: 0, dir: 1,
      speed: 5, walk: 0, timer: 20 + Math.random() * 25 };

    var hm = World.buildHelicopter();
    scene.add(hm);
    heli = { mesh: hm, active: false, dist: 0, side: 1, timer: 30 + Math.random() * 40, spin: 0 };

    storm.system = new World.SandStorm(scene, 900);

    for (var k = 0; k < 9; k++) {
      var pm = World.buildPuddle();
      pm.visible = false;
      scene.add(pm);
      puddles.push({ mesh: pm, dist: 0, lane: 0, radius: 4 });
    }
  }

  function resetHazards() {
    for (var i = 0; i < police.length; i++) {
      police[i].active = false;
      police[i].mesh.visible = false;
    }
    camel.active = false; camel.mesh.visible = false; camel.timer = 30 + Math.random() * 30;
    roach.active = false; roach.mesh.visible = false; roach.timer = 22 + Math.random() * 25;
    heli.active = false; heli.mesh.visible = false; heli.timer = 25 + Math.random() * 35;
    storm.active = false; storm.level = 0; storm.timer = 40 + Math.random() * 40; storm.left = 0;
    sfx.setWind(0);
    sfx.setRotor(0);

    // лужи раскидываем заново на каждый заезд
    for (var k = 0; k < puddles.length; k++) {
      var p = puddles[k];
      p.dist = track.length * (k + 0.35 + Math.random() * 0.4) / puddles.length;
      p.lane = (Math.random() - 0.5) * 13;
      p.radius = 3.4 + Math.random() * 2.6;
      var pt = track.pointAt(p.dist);
      var n = track.sideAt(p.dist);
      var t = track.tangentAt(p.dist);
      p.mesh.position.copy(pt).addScaledVector(n, p.lane);
      p.mesh.position.y = pt.y + 0.035;
      p.mesh.scale.set(p.radius * 2, p.radius * 1.5, 1);
      p.mesh.rotation.set(-Math.PI / 2, 0, 0);
      p.mesh.rotateZ(-Math.atan2(t.x, t.z));
      p.mesh.visible = true;
    }
  }

  /* Полиция приезжает к нарушительнице и перекрывает часть дороги. */
  function spawnPolice(granny) {
    var free = null;
    for (var i = 0; i < police.length; i++) if (!police[i].active) { free = police[i]; break; }
    if (!free) return;
    for (var j = 0; j < police.length; j++) {
      if (police[j].active && Math.abs(track.norm(police[j].dist - granny.dist)) < 160) return;
    }
    free.active = true;
    free.dist = track.norm(granny.dist + 4);
    free.lane = Math.max(-6.5, Math.min(6.5, granny.lane));
    free.phase = 'parked';
    free.timer = 13 + Math.random() * 5;
    free.granny = granny;
    free.blink = 0;
    free.mesh.visible = true;
    granny.caught = true;

    var d = camera.position.distanceTo(free.mesh.position);
    sfx.siren(Math.max(0, 1 - d / 260), 3);
    if (d < 260) flash('Полиция забирает бабушку — объезжай машину!', '#5dd6ff');
  }

  function updatePolice(dt) {
    for (var i = 0; i < police.length; i++) {
      var c = police[i];
      if (!c.active) continue;
      c.blink += dt;
      c.timer -= dt;
      World.flashPolice(c.mesh, c.blink);

      // бабушку увозят через несколько секунд
      if (c.granny && c.timer < 8 && c.granny.active) {
        c.granny.active = false;
        c.granny.mesh.visible = false;
        c.granny = null;
      }
      if (c.timer <= 0) {
        c.active = false;
        c.mesh.visible = false;
        continue;
      }

      var p = track.pointAt(c.dist);
      var n = track.sideAt(c.dist);
      var t = track.tangentAt(c.dist);
      c.mesh.position.copy(p).addScaledVector(n, c.lane);
      c.mesh.position.y = p.y;
      c.mesh.rotation.order = 'YXZ';
      c.mesh.rotation.y = Math.atan2(t.x, t.z) + 0.35;
      c.mesh.rotation.x = -Math.atan(track.slopeAt(c.dist));
    }
  }

  /* Верблюд и таракан переходят дорогу так же, как бабушки. */
  function spawnCrosser(obj, speed, aheadMin, aheadMax) {
    var lead = -Infinity;
    for (var i = 0; i < racers.length; i++) {
      var r = racers[i];
      if (!r.dq && !r.finished && r.dist > lead) lead = r.dist;
    }
    if (lead === -Infinity) return;
    obj.active = true;
    obj.dist = track.norm(lead + aheadMin + Math.random() * (aheadMax - aheadMin));
    obj.dir = Math.random() < 0.5 ? 1 : -1;
    obj.lane = -obj.dir * (MAX_LANE + 5);
    obj.speed = speed;
    obj.walk = 0;
    obj.mesh.visible = true;
  }

  function updateCrosser(obj, dt, legSwing) {
    if (!obj.active) return;
    obj.walk += dt * legSwing;
    obj.lane += obj.dir * obj.speed * dt;
    var p = track.pointAt(obj.dist);
    var n = track.sideAt(obj.dist);
    var t = track.tangentAt(obj.dist);
    obj.mesh.position.copy(p).addScaledVector(n, obj.lane);
    obj.mesh.position.y = p.y;
    obj.mesh.rotation.y = Math.atan2(t.x, t.z) + obj.dir * Math.PI / 2;
    var legs = obj.mesh.userData.legs;
    for (var i = 0; i < legs.length; i++) {
      legs[i].rotation.x = Math.sin(obj.walk + i * 1.7) * 0.5;
    }
    if (Math.abs(obj.lane) > MAX_LANE + 6 && obj.lane * obj.dir > 0) {
      obj.active = false;
      obj.mesh.visible = false;
    }
  }

  function updateAnimals(dt) {
    if (!admin.noHazards) {
      camel.timer -= dt;
      if (camel.timer <= 0 && !camel.active) {
        camel.timer = 40 + Math.random() * 40;
        spawnCrosser(camel, 0.8 + Math.random() * 0.5, 120, 220);
        flash('Верблюд вышел на дорогу!', '#e0b070');
      }
      roach.timer -= dt;
      if (roach.timer <= 0 && !roach.active) {
        roach.timer = 32 + Math.random() * 35;
        spawnCrosser(roach, 4.5 + Math.random() * 2, 110, 200);
        flash('Лакукарача перебегает дорогу!', '#c98b5a');
      }
    }
    updateCrosser(camel, dt, 3);
    updateCrosser(roach, dt, 14);
    // таракан ещё и виляет
    if (roach.active) roach.mesh.rotation.z = Math.sin(roach.walk * 0.6) * 0.12;
  }

  /* Полицейский вертолёт проносится над трассой. */
  function updateHeli(dt) {
    var f = focusRacer();
    if (!heli.active) {
      heli.timer -= dt;
      if (heli.timer <= 0 && f && !admin.noHazards) {
        heli.timer = 45 + Math.random() * 45;
        heli.active = true;
        heli.dist = f.dist - 260;
        heli.side = Math.random() < 0.5 ? 1 : -1;
        heli.mesh.visible = true;
        sfx.startRotor();
      }
      sfx.setRotor(0);
      return;
    }

    heli.dist += 62 * dt;
    heli.spin += dt * 26;
    var p = track.pointAt(heli.dist);
    var n = track.sideAt(heli.dist);
    var t = track.tangentAt(heli.dist);
    heli.mesh.position.copy(p).addScaledVector(n, heli.side * 16);
    heli.mesh.position.y = p.y + 46;
    heli.mesh.rotation.y = Math.atan2(t.x, t.z);
    heli.mesh.rotation.z = Math.sin(heli.spin * 0.1) * 0.06 + heli.side * 0.08;
    heli.mesh.userData.rotor.rotation.y = heli.spin;
    heli.mesh.userData.tailRotor.rotation.x = heli.spin * 1.6;

    var dist = f ? camera.position.distanceTo(heli.mesh.position) : 999;
    sfx.setRotor(Math.max(0, 1 - dist / 220));

    if (f && heli.dist > f.dist + 320) {
      heli.active = false;
      heli.mesh.visible = false;
      sfx.setRotor(0);
    }
  }

  /* Песчаная буря: видимость падает почти до нуля на 10–15 секунд. */
  function updateStorm(dt) {
    if (storm.active) {
      storm.left -= dt;
      if (storm.left <= 0) {
        storm.active = false;
        storm.timer = 45 + Math.random() * 45;
        flash('Буря улеглась', '#e8cf9d');
      }
    } else if (!admin.noHazards) {
      storm.timer -= dt;
      if (storm.timer <= 0) {
        storm.active = true;
        storm.left = 10 + Math.random() * 5;
        sfx.startWind();
        flash('ПЕСЧАНАЯ БУРЯ!', '#e0a63c');
      }
    }

    var target = storm.active ? 1 : 0;
    storm.level += (target - storm.level) * Math.min(1, dt * 0.9);
    if (storm.level < 0.002) storm.level = 0;

    scene.fog.density = 0.0013 + storm.level * 0.0135;
    scene.fog.color.setHex(0xcbb489).lerp(new THREE.Color(0xbd8f4a), storm.level);
    renderer.setClearColor(new THREE.Color(0xbcd3e6).lerp(new THREE.Color(0xc79a52), storm.level));
    if (sunLight) sunLight.intensity = 1.3 * (1 - 0.55 * storm.level);
    if (World.skyMesh) {
      World.skyMesh.material.color.setHex(0xffffff).lerp(new THREE.Color(0xb98b46), storm.level);
    }
    sfx.setWind(storm.level);
    storm.system.update(dt, storm.level, camera.position);
  }

  /* Лужи: заехал — занос. */
  function checkPuddles(dt) {
    for (var i = 0; i < racers.length; i++) {
      var r = racers[i];
      if (r.dq || r.finished || r.jail > 0 || r.speed < 6) continue;
      if (r.puddleCooldown > 0) { r.puddleCooldown -= dt; continue; }
      for (var k = 0; k < puddles.length; k++) {
        var p = puddles[k];
        var along = Math.abs(track.norm(r.dist - p.dist + track.length / 2) - track.length / 2);
        if (along > p.radius) continue;
        if (Math.abs(r.lane - p.lane) > p.radius * 0.8) continue;
        r.skid = (Math.random() < 0.5 ? -1 : 1) * (2.6 + r.speed * 0.09);
        r.puddleCooldown = 2.2;
        var d = camera.position.distanceTo(r.mesh.position);
        sfx.splash(Math.max(0, 1 - d / 120));
        for (var s = 0; s < 5; s++) {
          var sp = r.mesh.position.clone();
          sp.y += 0.4;
          smoke.emit(sp, new THREE.Vector3((Math.random() - 0.5) * 6, 1.5 + Math.random() * 2,
            (Math.random() - 0.5) * 6), 1.0, 0xbcd8e8);
        }
        if (r.isHuman) flash(r.name + ' влетел в лужу — занос!', '#7fd4ff');
        break;
      }
    }
  }

  /* Столкновения со зверями и полицейской машиной. */
  function checkHazardHits() {
    for (var i = 0; i < racers.length; i++) {
      var r = racers[i];
      if (r.dq || r.finished || r.jail > 0 || r.speed < 1) continue;

      // полицейская машина: тюрьма на 30 секунд
      for (var k = 0; k < police.length; k++) {
        var c = police[k];
        if (!c.active) continue;
        var along = Math.abs(track.norm(r.dist - c.dist + track.length / 2) - track.length / 2);
        if (along < 3.6 && Math.abs(r.lane - c.lane) < 2.2) {
          jailRacer(r, 30, 'въехал в полицейскую машину');
          break;
        }
      }
      if (r.jail > 0) continue;

      // верблюд: печка рассыпается, тюрьма до конца гонки
      if (camel.active) {
        var ac = Math.abs(track.norm(r.dist - camel.dist + track.length / 2) - track.length / 2);
        if (ac < 3.4 && Math.abs(r.lane - camel.lane) < 2.6) {
          wreckRacer(r);
          continue;
        }
      }

      // таракан: шлепок, потеря хода, таракан удирает
      if (roach.active) {
        var ar = Math.abs(track.norm(r.dist - roach.dist + track.length / 2) - track.length / 2);
        if (ar < 3.2 && Math.abs(r.lane - roach.lane) < 2.4) {
          r.speed *= 0.45;
          r.skid = (Math.random() < 0.5 ? -1 : 1) * 2.2;
          roach.speed = 9;
          var d = camera.position.distanceTo(r.mesh.position);
          sfx.splat(Math.max(0, 1 - d / 120));
          if (r.isHuman) flash(r.name + ' задел лакукарачу!', '#c98b5a');
        }
      }
    }
  }

  function jailRacer(r, seconds, reason) {
    if (r.jail > 0 || r.dq || r.finished) return;
    if (admin.invincible && r.isHuman) {
      flash(r.name + ': ' + reason + ' — прощено (админ)', '#5dd6ff');
      return;
    }
    r.jail = seconds;
    r.jailReason = reason;
    r.speed = 0;
    r.throttle = false;
    r.steer = 0;
    r.skid = 0;
    r.flying = false;
    r.air = 0;
    r.lane = (r.lane >= 0 ? 1 : -1) * (MAX_LANE - 0.4);
    r.mesh.userData.fire.visible = false;
    r.mesh.userData.fireGlow.visible = false;
    if (!r.status) {
      r.status = World.statusSprite();
      r.status.position.set(0, 6.6, 0);
      r.mesh.add(r.status);
    }
    r.status.visible = true;
    sfx.siren(0.9, 2);
    sfx.jailClang();
    music.duck(1.4);
    flash(r.name + ' ' + reason + ' — тюрьма на ' + Math.round(seconds) + ' с!', '#ff8a3d');
  }

  /* Врезался в верблюда: печь разлетается кирпичами и выбывает. */
  function wreckRacer(r) {
    if (r.dq || r.finished) return;
    if (admin.invincible && r.isHuman) {
      flash(r.name + ': сбил верблюда — прощено (админ)', '#5dd6ff');
      return;
    }
    for (var i = 0; i < 22; i++) {
      var p = r.mesh.position.clone();
      p.y += 1 + Math.random() * 2.5;
      smoke.emit(p, new THREE.Vector3((Math.random() - 0.5) * 12, 2 + Math.random() * 6,
        (Math.random() - 0.5) * 12), 1.8, i % 3 ? 0xa8563c : 0x6a6a6a);
    }
    sfx.crash();
    sfx.jailClang();
    disqualify(r, 'врезался в верблюда — тюрьма до конца гонки');
    r.mesh.visible = false;
  }

  /* ---------------- Бабушки на дороге ---------------- */

  function createGrannies() {
    for (var i = 0; i < 7; i++) {
      var mesh = World.buildGranny();
      mesh.traverse(function (o) {
        if (o.isMesh) { o.castShadow = shadowsOn; o.userData.shadowCaster = true; }
      });
      if (mesh.userData.blob) mesh.userData.blob.visible = !shadowsOn;
      if (mesh.userData.blob) mesh.userData.blob.visible = !shadowsOn;
      scene.add(mesh);
      grannies.push({
        isGranny: true,
        mesh: mesh,
        active: false,
        dist: 0,
        lane: 0,
        dir: 1,
        speed: 1.4,
        walk: 0,
        angry: 0,
        whack: 0,          // сколько уже колотит печку
        whackCooldown: 0,  // после нагоняя идёт дальше молча
        knockTimer: 0
      });
    }
  }

  function resetGrannies() {
    granniesTimer = 3;
    for (var i = 0; i < grannies.length; i++) {
      grannies[i].active = false;
      grannies[i].mesh.visible = false;
    }
  }

  /* Бабушки идут по зебре, когда для печек красный, и просто «где удобно». */
  /* Поставить бабушку в конкретное место трассы (нужно и админке). */
  function spawnGrannyAt(dist, jaywalk) {
    var free = null;
    for (var i = 0; i < grannies.length; i++) if (!grannies[i].active) { free = grannies[i]; break; }
    if (!free) return null;
    free.active = true;
    free.dist = track.norm(dist);
    free.dir = Math.random() < 0.5 ? 1 : -1;
    free.lane = -free.dir * (MAX_LANE + 3.5);
    free.speed = 1.1 + Math.random() * 0.9;
    free.walk = Math.random() * 6;
    free.angry = 0;
    free.whack = 0;
    free.whackCooldown = 0;
    free.knockTimer = 0;
    free.caught = false;
    free.jaywalk = !!jaywalk;
    free.policeTimer = 3 + Math.random() * 4;
    free.mesh.visible = true;
    return free;
  }

  function spawnGranny() {
    var free = null;
    for (var i = 0; i < grannies.length; i++) if (!grannies[i].active) { free = grannies[i]; break; }
    if (!free) return;

    // впереди лидера, чтобы встреча точно состоялась
    var lead = -Infinity;
    for (var k = 0; k < racers.length; k++) {
      var r = racers[k];
      if (!r.dq && !r.finished && r.dist > lead) lead = r.dist;
    }
    if (lead === -Infinity) return;

    var onZebra = Math.random() < 0.65;
    var where;
    var jaywalk = !onZebra;
    if (onZebra) {
      // ближайшая зебра, до которой ещё не доехали
      var best = null, bestGap = Infinity;
      for (var j = 0; j < intersections.length; j++) {
        var gap = track.norm(intersections[j].dist - lead);
        if (gap > 70 && gap < bestGap) { bestGap = gap; best = intersections[j]; }
      }
      if (!best) return;
      where = best.dist - (track.width / 2 + 3.6) * (Math.random() < 0.5 ? 1 : -1);
    } else {
      where = lead + 110 + Math.random() * 90;
    }

    spawnGrannyAt(where, jaywalk);
  }

  /* Бабушка нарушает, если идёт не по зебре или когда для печек зелёный. */
  function grannyViolating(g) {
    if (g.jaywalk) return true;
    var best = null, bestGap = Infinity;
    for (var i = 0; i < intersections.length; i++) {
      var gap = Math.abs(track.norm(g.dist - intersections[i].dist + track.length / 2) - track.length / 2);
      if (gap < bestGap) { bestGap = gap; best = intersections[i]; }
    }
    return best && bestGap < 30 && best.state === 'green';
  }

  function updateGrannies(dt) {
    if (admin.noGrannies) {
      for (var n = 0; n < grannies.length; n++) {
        if (grannies[n].active) { grannies[n].active = false; grannies[n].mesh.visible = false; }
      }
      return;
    }
    granniesTimer -= dt;
    if (granniesTimer <= 0) {
      granniesTimer = 4 + Math.random() * 6;
      spawnGranny();
    }

    for (var i = 0; i < grannies.length; i++) {
      var g = grannies[i];
      if (!g.active) continue;

      var target = racerNextTo(g);          // кто подъехал в упор
      g.walk += dt * 6;

      if (g.caught) {
        // ждёт полицию, руки вверх
        g.mesh.userData.armR.rotation.z = -2.6;
        g.mesh.userData.armL.rotation.z = 2.6;
        var pc = track.pointAt(g.dist);
        var pn = track.sideAt(g.dist);
        g.mesh.position.copy(pc).addScaledVector(pn, g.lane);
        g.mesh.position.y = pc.y;
        continue;
      }

      // нарушение заметила полиция
      if (!admin.noHazards && Math.abs(g.lane) < MAX_LANE && grannyViolating(g)) {
        g.policeTimer -= dt;
        if (g.policeTimer <= 0) {
          g.policeTimer = 999;
          if (Math.random() < 0.5) spawnPolice(g);
        }
      }

      if (g.angry > 0) {
        // только что сбили: стоит и потрясает тростью
        g.angry -= dt;
        g.mesh.userData.armR.rotation.z = -2.2 + Math.sin(g.angry * 18) * 0.5;
      } else if (target && g.whackCooldown <= 0) {
        // колотит печку тростью и кричит, но дорогу переходить не забывает,
        // иначе за ней намертво встаёт весь поток
        g.whack += dt;
        g.mesh.userData.armR.rotation.z = -1.9 + Math.sin(g.whack * 13) * 0.85;
        g.knockTimer -= dt;
        if (g.knockTimer <= 0) {
          g.knockTimer = 0.44;
          var dcam = camera.position.distanceTo(g.mesh.position);
          sfx.caneWhack(Math.max(0, 1 - dcam / 90), Math.random() < 0.6);
        }
        // от такой ругани печка теряет ход
        target.speed = Math.max(0, target.speed - 6 * dt);
        g.lane += g.dir * g.speed * 0.4 * dt;
        if (g.whack > 3) { g.whack = 0; g.whackCooldown = 4; }
      } else {
        g.whack = 0;
        if (g.whackCooldown > 0) g.whackCooldown -= dt;
        g.mesh.userData.armR.rotation.z = Math.sin(g.walk) * 0.35;
        g.lane += g.dir * g.speed * dt;
      }
      g.mesh.userData.armL.rotation.z = -Math.sin(g.walk) * 0.25;

      var p = track.pointAt(g.dist);
      var n = track.sideAt(g.dist);
      var t = track.tangentAt(g.dist);
      g.mesh.position.copy(p).addScaledVector(n, g.lane);
      g.mesh.position.y = p.y + Math.abs(Math.sin(g.walk)) * 0.045;
      var faceDir = g.dir;
      if (target) faceDir = (target.lane > g.lane) ? 1 : -1;   // разворачивается к нарушителю
      g.mesh.rotation.y = Math.atan2(t.x, t.z) + faceDir * Math.PI / 2;
      g.mesh.rotation.z = Math.sin(g.walk) * 0.05;

      // ушла с дороги или все уже проехали — убираем
      var gone = Math.abs(g.lane) > MAX_LANE + 4 && (g.lane * g.dir) > 0;
      if (gone) { g.active = false; g.mesh.visible = false; }
    }
  }

  /* Печка, которая подъехала к бабушке вплотную (но пока не сбила). */
  function racerNextTo(g) {
    var best = null, bestGap = 6.5;
    for (var i = 0; i < racers.length; i++) {
      var r = racers[i];
      if (r.dq || r.finished) continue;
      var along = Math.abs(track.norm(g.dist - r.dist + track.length / 2) - track.length / 2);
      var across = Math.abs(g.lane - r.lane);
      if (along < bestGap && across < 4.2) { bestGap = along; best = r; }
    }
    return best;
  }

  /* Сбил бабушку — снятие с гонки. */
  function checkGrannyHits() {
    for (var i = 0; i < racers.length; i++) {
      var r = racers[i];
      if (r.dq || r.finished || r.speed < 0.5) continue;
      for (var k = 0; k < grannies.length; k++) {
        var g = grannies[k];
        if (!g.active) continue;
        if (Math.abs(track.norm(g.dist - r.dist + track.length / 2) - track.length / 2) > 2.6) continue;
        if (Math.abs(g.lane - r.lane) > BODY_HALF + 0.6) continue;

        g.angry = 2.6;
        g.mesh.userData.bag.position.y = 0.3;
        disqualify(r, 'сбил бабушку');
        sfx.thud();
        break;
      }
    }
  }

  function addStartLine() {
    var p = track.pointAt(0);
    var t = track.tangentAt(0);
    var g = new THREE.Group();
    g.position.copy(p);
    g.rotation.order = 'YXZ';
    g.rotation.y = Math.atan2(t.x, t.z);
    g.rotation.x = -Math.atan(track.slopeAt(0));

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

    // на одних печах едет Емеля, на других загорает блондинка, пара печей пустые
    var riders = ['emelya', 'blonde', 'emelya', 'blonde', 'emelya', 'blonde', null, null];
    riders.sort(function () { return Math.random() - 0.5; });

    for (var i = 0; i < FIELD_SIZE; i++) {
      var isHuman = i < humanCount;
      var name = isHuman ? ('Игрок ' + (i + 1)) : shuffledAi[i - humanCount];
      var color = COLORS[i % COLORS.length];
      var labelText = isHuman ? (name + ' [' + HUMAN_KEYS[i].short + ']') : null;
      var mesh = World.buildStove(color, labelText, riders[i]);
      mesh.rotation.order = 'YXZ';
      mesh.traverse(function (o) {
        if (o.isMesh) { o.castShadow = shadowsOn; o.userData.shadowCaster = true; }
      });
      if (mesh.userData.blob) mesh.userData.blob.visible = !shadowsOn;
      scene.add(mesh);

      var row = Math.floor(i / 2);
      var col = i % 2;
      var r = {
        id: i,
        name: name,
        color: color,
        isHuman: isHuman,
        keys: isHuman ? HUMAN_KEYS[i] : null,
        keyLabel: isHuman ? HUMAN_KEYS[i].label : null,
        canBoost: isHuman && i === 0,      // супер-пар только у первого игрока
        rider: riders[i],
        mesh: mesh,
        lane: (col === 0 ? -1 : 1) * (2.6 + row * 1.75),
        steer: 0,
        skid: 0,           // занос после лужи, м/с поперёк
        jail: 0,           // сколько ещё сидеть
        jailReason: '',
        status: null,
        puddleCooldown: 0,
        air: 0,            // насколько печка сейчас оторвалась от дороги
        flying: false,
        flyY: 0,
        flyVel: 0,
        slope: 0,
        boosting: false,
        steam: 100,
        bumpCooldown: 0,
        dustAcc: 0,
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
      r.lane = Math.max(-EDGE_LANE, Math.min(EDGE_LANE, r.lane));
      r.homeLane = r.lane;
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
    r.mesh.position.y = p.y + (r.air || 0);
    // печка смотрит туда, куда едет: доворот от руля, наклон по горке и крен
    var drift = Math.atan2(r.steer * STEER_RATE * 0.6, Math.max(r.speed, 6));
    r.mesh.rotation.y = Math.atan2(t.x, t.z) - drift;
    r.mesh.rotation.x = -Math.atan(track.slopeAt(r.dist)) * (r.air > 0.1 ? 0.4 : 1);
    r.mesh.rotation.z = -r.steer * 0.045 * Math.min(1, r.speed / 12) + (r.skid || 0) * 0.035;
  }

  /* ---------------- Светофоры ---------------- */

  function updateLights(dt) {
    if (admin.lights !== 'auto') {
      for (var f = 0; f < intersections.length; f++) {
        if (intersections[f].state !== admin.lights) {
          intersections[f].state = admin.lights;
          World.applyLightState(intersections[f]);
        }
      }
      return;
    }
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
        if (state === 'race' && vol > 0.05) {
          sfx.trainWhistle(vol * 0.9);
          if (vol > 0.5) music.duck(1.3);
        }
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

  function disqualify(r, reason) {
    if (r.dq || r.finished) return;
    if (admin.invincible && r.isHuman) {
      flash(r.name + ': ' + (reason || 'нарушение') + ' — прощено (админ)', '#5dd6ff');
      return;
    }
    r.dq = true;
    r.dqReason = reason || 'проехал на красный';
    r.place = 0;
    r.speed = 0;
    r.throttle = false;
    r.steer = 0;
    r.mesh.userData.stripe.material.color.setHex(0x555555);
    r.mesh.userData.fire.visible = false;
    r.mesh.userData.fireGlow.visible = false;
    for (var i = 0; i < 16; i++) {
      var p = r.mesh.position.clone();
      p.y = 3 + Math.random() * 2;
      smoke.emit(p, new THREE.Vector3((Math.random() - 0.5) * 6, 2 + Math.random() * 4,
        (Math.random() - 0.5) * 6), 3, 0x3a3a3a);
    }
    sfx.buzzer();
    music.duck(1.1);
    flash('ДИСКВАЛИФИКАЦИЯ: ' + r.name + ' ' + r.dqReason + '!', '#ff4d4d');
  }

  /* Столкновения печек. Печь — прямоугольник в координатах «вдоль трассы ×
     поперёк», поэтому расходимся по той оси, где перекрытие меньше:
     бортом — расталкиваем вбок, сзади — обмениваемся скоростью, как при
     ударе двух одинаковых масс. */
  function resolveContacts() {
    var LONG_HALF = 2.05;                 // полудлина печи
    var LAT_HALF = BODY_HALF;             // полуширина
    var RESTITUTION = 0.18;               // удар почти неупругий: печь тяжёлая

    for (var i = 0; i < racers.length; i++) {
      for (var j = i + 1; j < racers.length; j++) {
        var a = racers[i], b = racers[j];
        if (a.dq && b.dq) continue;

        var dd = a.dist - b.dist;
        var dl = a.lane - b.lane;
        var overLong = LONG_HALF * 2 - Math.abs(dd);
        var overLat = LAT_HALF * 2 - Math.abs(dl);
        if (overLong <= 0 || overLat <= 0) continue;

        var aFixed = a.dq || a.finished, bFixed = b.dq || b.finished;
        var impact;

        if (overLat <= overLong * 0.65) {
          // ---- контакт бортами ----
          var sign = dl >= 0 ? 1 : -1;
          if (!aFixed && !bFixed) {
            a.lane += sign * overLat / 2;
            b.lane -= sign * overLat / 2;
          } else if (!aFixed) {
            a.lane += sign * overLat;
          } else if (!bFixed) {
            b.lane -= sign * overLat;
          }
          // скребём боками: обе теряют немного хода и получают толчок наружу
          impact = Math.abs(a.speed - b.speed) * 0.5 + 2;
          if (!aFixed) { a.speed *= 0.975; a.steer *= 0.5; }
          if (!bFixed) { b.speed *= 0.975; b.steer *= 0.5; }
        } else {
          // ---- удар в корму ----
          var front = dd >= 0 ? a : b;      // кто впереди
          var rear = dd >= 0 ? b : a;
          var frontFixed = dd >= 0 ? aFixed : bFixed;
          var rearFixed = dd >= 0 ? bFixed : aFixed;

          if (!frontFixed && !rearFixed) {
            front.dist += overLong / 2;
            rear.dist -= overLong / 2;
          } else if (!frontFixed) {
            front.dist += overLong;
          } else if (!rearFixed) {
            rear.dist -= overLong;
          }

          var rel = rear.speed - front.speed;
          impact = Math.abs(rel);
          if (rel > 0) {
            // одинаковые массы: скорости почти меняются местами
            var vf = ((1 + RESTITUTION) * rear.speed + (1 - RESTITUTION) * front.speed) / 2;
            var vr = ((1 - RESTITUTION) * rear.speed + (1 + RESTITUTION) * front.speed) / 2;
            if (!frontFixed) front.speed = Math.min(vf, BOOST_SPEED * 1.3);
            if (!rearFixed) rear.speed = Math.max(0, vr);
            // от удара обе печки чуть уводит вбок — толкаться в лоб невыгодно
            var nudge = Math.min(1.2, impact * 0.06);
            if (!frontFixed) front.lane += (front.lane >= rear.lane ? 1 : -1) * nudge;
            if (!rearFixed) rear.lane += (rear.lane >= front.lane ? 1 : -1) * nudge;
          }
        }

        a.lane = Math.max(-MAX_LANE, Math.min(MAX_LANE, a.lane));
        b.lane = Math.max(-MAX_LANE, Math.min(MAX_LANE, b.lane));

        if (a.bumpCooldown <= 0 && b.bumpCooldown <= 0 && impact > 1.5) {
          a.bumpCooldown = b.bumpCooldown = 0.3;
          var d = camera.position.distanceTo(a.mesh.position);
          sfx.bump(Math.max(0, 1 - d / 130) * Math.min(1, impact / 12));
          // пыль и искры в точке контакта
          var mid = a.mesh.position.clone().lerp(b.mesh.position, 0.5);
          mid.y += 1.2;
          for (var k = 0; k < 3; k++) {
            smoke.emit(mid, new THREE.Vector3((Math.random() - 0.5) * 4,
              1 + Math.random() * 2, (Math.random() - 0.5) * 4), 1.1, 0xd8c9a8);
          }
        }
      }
    }
  }

  /* ---------------- Обновление гонки ---------------- */

  function pressed(codes) {
    for (var i = 0; i < codes.length; i++) if (keys[codes[i]]) return true;
    return false;
  }

  function updateRacer(r, dt) {
    if (r.dq) return;
    if (r.bumpCooldown > 0) r.bumpCooldown -= dt;

    // сидит в тюрьме: стоит у обочины, пока не выйдет срок
    if (r.jail > 0) {
      r.jail = Math.max(0, r.jail - dt);
      r.speed = 0;
      r.throttle = false;
      r.steer = 0;
      if (r.status) r.status.userData.set('ТЮРЬМА ' + Math.ceil(r.jail) + ' с', '#ff8a3d');
      if (r.jail === 0) {
        if (r.status) r.status.visible = false;
        r.mesh.userData.fire.visible = true;
        r.mesh.userData.fireGlow.visible = true;
        flash(r.name + ' вышел из тюрьмы', '#8ce99a');
      }
      placeRacer(r);
      animateStove(r, dt);
      return;
    }

    if (r.finished) {
      // докатывается и останавливается
      r.throttle = false;
      r.steer = 0;
      r.speed = Math.max(0, r.speed - BRAKE * 0.5 * dt);
    } else {
      var wantBoost;
      if (r.isHuman) {
        r.throttle = pressed(r.keys.throttle) || !!touchThrottle[r.id];
        var left = pressed(r.keys.left) || touchSteer[r.id] === -1;
        var right = pressed(r.keys.right) || touchSteer[r.id] === 1;
        r.steer = (right ? 1 : 0) - (left ? 1 : 0);
        wantBoost = r.canBoost && (pressed(r.keys.boost) || !!touchBoost[r.id]);
      } else {
        r.throttle = aiThrottle(r);
        r.steer = aiSteer(r);
        wantBoost = false;               // компьютер турбо не получает
      }

      // супер-пар: пока держат кнопку и есть пар в котле
      var wasBoosting = r.boosting;
      r.boosting = wantBoost && r.throttle && r.steam > (r.boosting ? 0.5 : STEAM_MIN);
      if (r.boosting) {
        r.steam = Math.max(0, r.steam - STEAM_DRAIN * dt);
        if (!wasBoosting) {
          var dcam = camera.position.distanceTo(r.mesh.position);
          sfx.steamBurst(Math.max(0, 1 - dcam / 140));
        }
      } else {
        r.steam = Math.min(100, r.steam + STEAM_REFILL * dt);
      }
      if (admin.infiniteSteam && r.canBoost) r.steam = 100;

      var onEdge = Math.abs(r.lane) > EDGE_LANE;
      var skill = r.isHuman ? 1 : r.ai.skill * (admin.weakAI ? 0.75 : 1);
      var maxV = (r.boosting ? BOOST_SPEED : MAX_SPEED) * skill * (onEdge ? EDGE_PENALTY : 1);
      var accel = r.boosting ? BOOST_ACCEL : ACCEL;
      if (r.throttle) r.speed = Math.min(maxV, r.speed + accel * dt);
      else r.speed = Math.max(0, r.speed - BRAKE * dt);
      if (r.speed > maxV) r.speed = Math.max(maxV, r.speed - BRAKE * 0.8 * dt);

      // горки: в подъём тянет назад и режет потолок скорости,
      // под уклон печка разгоняется сверх обычного предела
      var slope = track.slopeAt(r.dist);
      if (slope > 0) maxV *= Math.max(0.5, 1 - slope * 2.2);
      r.speed = Math.max(0, r.speed - HILL_PULL * slope * dt);
      r.speed = Math.min(r.speed, maxV * DOWNHILL_CAP);

      r.slope = slope;

      // Руль: на малой скорости печка почти не слушается.
      // Внимание: track.sideAt() смотрит ВЛЕВО от движения, поэтому
      // «вправо» (steer = +1) — это уменьшение полосы.
      // В заносе после лужи и в полёте руль почти бесполезен.
      var grip = (r.air > 0.15 ? 0.3 : 1) * (Math.abs(r.skid) > 0.4 ? 0.35 : 1);
      r.lane -= r.steer * STEER_RATE * dt * Math.min(1, r.speed / 9) * grip;

      if (r.skid !== 0) {
        r.lane += r.skid * dt;
        r.skid -= r.skid * Math.min(1, dt * 1.6);
        if (Math.abs(r.skid) < 0.05) r.skid = 0;
      }
      r.lane = Math.max(-MAX_LANE, Math.min(MAX_LANE, r.lane));

      if (onEdge && r.speed > 3) {
        r.dustAcc += dt * (1 + r.speed * 0.25);
        while (r.dustAcc > 1) {
          r.dustAcc -= 1;
          // пыль летит из-под задних колёс, чтобы не закрывать дорогу перед камерой
          var back = track.tangentAt(r.dist).multiplyScalar(-2.2);
          var dp = r.mesh.position.clone().add(back);
          dp.y = 0.35;
          smoke.emit(dp, new THREE.Vector3(back.x * 0.4, 0.7 + Math.random() * 0.6, back.z * 0.4),
            0.9, 0xdcc08a);
        }
      }
    }

    r.prevDist = r.dist;
    r.dist += r.speed * dt;

    // Полёт считаем уже по новому положению: пока печка в воздухе, дорога
    // из-под неё уходит вниз, и сравнивать надо с высотой там, куда она попала.
    if (!r.dq && !r.finished) updateJump(r, dt, r.slope);

    // проверка перекрёстков
    for (var i = 0; i < intersections.length; i++) {
      var it = intersections[i];
      if (crossedIntersection(r, it) && it.state === 'red') {
        disqualify(r, 'проехал на красный');
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
          music.duck(2.4);
          flash('🏁 ' + r.name + ' финишировал первым!', '#ffd23f');
        } else if (r.isHuman) {
          flash('🏁 ' + r.name + ' на финише, место ' + finishOrder.length, '#8ce99a');
        }
      }
    }

    placeRacer(r);
    animateStove(r, dt);
  }

  /* Кто мешает ехать прямо: печка впереди или бабушка на дороге. */
  function obstacleAhead(r, range) {
    var best = null, bestGap = range;
    for (var i = 0; i < racers.length; i++) {
      var o = racers[i];
      if (o === r || o.dq) continue;
      var gap = o.dist - r.dist;
      if (gap > 0.5 && gap < bestGap && Math.abs(o.lane - r.lane) < 3.4) { bestGap = gap; best = o; }
    }
    var others = grannies.concat(police, [camel, roach]);
    for (var k = 0; k < others.length; k++) {
      var g = others[k];
      if (!g || !g.active) continue;
      var gg = track.norm(g.dist - r.dist);
      var width = g.isPolice ? 4.2 : (g.isCamel ? 4 : 3.4);
      if (gg < bestGap && Math.abs(g.lane - r.lane) < width) { bestGap = gg; best = g; }
    }
    return best ? { obj: best, gap: bestGap } : null;
  }

  /* Отрыв на гребне. Печку держит дорога, пока ей хватает силы тяжести:
     если дорога уходит вниз быстрее, чем печка падает, — она взлетает.
     Считаем в абсолютной высоте, так честнее на длинных спусках. */
  function updateJump(r, dt, slope) {
    var roadY = track.heightAt(r.dist);

    if (!r.flying) {
      var down = r.speed * r.speed * track.curvatureAt(r.dist);
      r.air = 0;
      if (down < -GRAVITY && r.speed > 14) {
        // отрываемся: дорога уходит вниз быстрее, чем печка успевает падать
        r.flying = true;
        r.flyY = roadY;
        r.flyVel = Math.max(0, r.speed * slope) + 2.2;   // толчок на срыве с гребня
      }
      return;                       // в кадре отрыва ещё не падаем
    }

    r.flyVel -= GRAVITY * dt;
    r.flyY += r.flyVel * dt;
    if (r.flyY <= roadY) {
      if (r.flyVel < -4) {                     // приземление слышно
        var dl = camera.position.distanceTo(r.mesh.position);
        sfx.bump(Math.max(0, 1 - dl / 110) * Math.min(1, -r.flyVel / 10));
      }
      r.flying = false;
      r.flyVel = 0;
      r.air = 0;
    } else {
      r.air = Math.min(3.2, r.flyY - roadY);
    }
  }

  function aiSteer(r) {
    var target = r.homeLane;
    var ob = obstacleAhead(r, 30);
    if (ob) {
      // объезжаем с той стороны, где больше места до края
      var dir = ob.obj.lane <= 0 ? 1 : -1;
      target = ob.obj.lane + dir * 3.8;
      if (Math.abs(target) > EDGE_LANE) target = ob.obj.lane - dir * 3.8;
      target = Math.max(-EDGE_LANE, Math.min(EDGE_LANE, target));
    }
    // steer > 0 — руль вправо, а вправо полоса уменьшается
    var diff = r.lane - target;
    if (Math.abs(diff) < 0.25) return 0;
    return Math.max(-1, Math.min(1, diff / 2.2)) * 0.85;
  }

  function aiThrottle(r) {
    var ni = nextIntersection(r);
    var st = ni.inter.state;
    var toStop = ni.toStop;

    // бабушку объехать выходит не всегда — тогда тормозим,
    // но если уже почти встали, всё-таки крадёмся мимо
    var ob = obstacleAhead(r, 26);
    if (ob && (ob.obj.isGranny || ob.obj.isPolice || ob.obj.isCamel || ob.obj.isRoach)) {
      var needG = (r.speed * r.speed) / (2 * BRAKE) + r.speed * r.ai.reaction + 4;
      var close = Math.abs(ob.obj.lane - r.lane) < 2.6;
      if (ob.gap < needG && close && r.speed > 3) return false;
    }

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
    u.body.position.y = Math.sin(r.bob) * 0.04 * Math.min(1, r.speed / 8);
    var flick = 0.85 + Math.sin(r.bob * 3.3) * 0.15 + (r.throttle ? 0.35 : 0);
    if (r.boosting) flick *= 1.7;
    u.fireGlow.scale.set(3 * flick, 2.4 * flick, 1);
    if (u.vent) u.vent.scale.set(1.7 * flick, 1.1 * flick, 1);
    u.fire.material.color.setHex(r.boosting ? 0xfff0a0 : 0xff8a24);

    if (!r.dq) {
      // у далёких печек дыма меньше: спрайты — самая дорогая часть кадра
      var far = camera.position.distanceTo(r.mesh.position) > 130 ? 0.35 : 1;
      r.smokeAcc += dt * far * (2.5 + r.speed * 0.5 + (r.throttle ? 6 : 0) + (r.boosting ? 14 : 0));
      while (r.smokeAcc > 1) {
        r.smokeAcc -= 1;
        var pipe = new THREE.Vector3(-0.6, 5.15, -1.05).applyEuler(r.mesh.rotation).add(r.mesh.position);
        var back = track.tangentAt(r.dist).multiplyScalar(-r.speed * 0.25);
        back.y = 2.2 + Math.random() * 1.4;
        back.x += (Math.random() - 0.5) * 1.4;
        back.z += (Math.random() - 0.5) * 1.4;
        smoke.emit(pipe, back, (r.boosting ? 2.4 : 1.6) + Math.random());
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

    // Камера идёт по самой трассе позади печки: тогда на поворотах печь
    // остаётся в центре кадра, а не уезжает к краю.
    function behind(metres, height, laneShare) {
      var d = r.dist - metres;
      var pt = track.pointAt(d);
      var side = track.sideAt(d);
      return pt.clone().addScaledVector(side, r.lane * laneShare).add(new THREE.Vector3(0, height, 0));
    }

    if (cameraMode === 0) {
      desired.copy(behind(r.boosting ? 18.5 : 16, r.boosting ? 7.4 : 6.8, 0.85));
      look.addScaledVector(t, 13);
      look.y += 2.6;
    } else if (cameraMode === 1) {
      desired.copy(behind(30, 15, 0.5));
      look.addScaledVector(t, 24);
      look.y += 3;
    } else {
      desired.copy(r.mesh.position).add(new THREE.Vector3(0, 70, 0)).addScaledVector(t, -7);
      look.y += 1;
    }

    // чем быстрее печка, тем жёстче камера её держит
    var vv = Math.min(1, r.speed / BOOST_SPEED);
    var k = 1 - Math.exp(-(6 + vv * 14) * dt);
    camPos.lerp(desired, k);
    camLook.lerp(look, Math.min(1, k * 1.5));
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
      var status = r.finished ? 'финиш'
        : (r.jail > 0 ? ('тюрьма ' + Math.ceil(r.jail) + 'с')
        : ('круг ' + Math.min(r.lap, totalLaps) + '/' + totalLaps));
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

    // котёл показываем только у того, кому доступно турбо
    ui.steamBox.style.display = f.canBoost ? '' : 'none';
    if (f.canBoost) {
      ui.steamFill.style.width = Math.round(f.steam) + '%';
      ui.steamBox.classList.toggle('boosting', !!f.boosting);
      ui.steamBox.classList.toggle('empty', f.steam < STEAM_MIN && !f.boosting);
    }

    // бабушка на дороге впереди
    var granny = grannyAhead(f, 110);
    ui.granny.style.opacity = granny ? '1' : '0';
    if (granny) ui.grannyDist.textContent = Math.round(granny.gap) + ' м';

    // тюрьма и песчаная буря
    ui.jail.style.opacity = f.jail > 0 ? '1' : '0';
    if (f.jail > 0) ui.jailText.textContent = 'ТЮРЬМА · ' + Math.ceil(f.jail) + ' с · ' + f.jailReason;
    ui.storm.style.opacity = storm.level > 0.25 ? '1' : '0';

    // состояние каждого игрока
    for (var h = 0; h < ui.pedals.length; h++) {
      var pr = racers[h];
      if (!pr) continue;
      var el = ui.pedals[h];
      el.classList.toggle('on', !!pr.throttle && !pr.dq && !pr.finished);
      el.classList.toggle('boost', !!pr.boosting);
      el.classList.toggle('out', pr.dq);
      var bar = el.querySelector('.steam i');
      if (bar) bar.style.width = Math.round(pr.steam) + '%';
      el.classList.toggle('jailed', pr.jail > 0);
      el.querySelector('.pspeed').textContent = pr.dq ? 'снят'
        : (pr.jail > 0 ? 'тюрьма ' + Math.ceil(pr.jail) + 'с'
        : (pr.finished ? 'финиш' : Math.round(pr.speed * 3.6) + ' км/ч'));
    }
  }

  function grannyAhead(r, range) {
    var best = null;
    for (var i = 0; i < grannies.length; i++) {
      var g = grannies[i];
      if (!g.active || Math.abs(g.lane) > MAX_LANE + 1.5) continue;
      var gap = track.norm(g.dist - r.dist);
      if (gap < range && (!best || gap < best.gap)) best = { granny: g, gap: gap };
    }
    return best;
  }

  function showResults() {
    state = 'over';
    sfx.stopEngines();
    engineNode = null;
    music.setIntensity(1);
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
      html += '<p class="dqlist">Сняты с гонки: ' +
        dqd.map(function (r) { return r.name + ' (' + r.dqReason + ')'; }).join(', ') + '</p>';
    }
    ui.resultBody.innerHTML = html;
    ui.results.classList.add('show');
  }

  /* ---------------- Цикл ---------------- */

  function loop() {
    requestAnimationFrame(loop);
    var dt = Math.min(clock.getDelta(), 0.05);
    if (!scene) return;
    if (dt > 0) fps += (1 / dt - fps) * 0.06;
    if (admin.open) updateAdminStats();

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
      updateGrannies(dt);
      updatePolice(dt);
      updateAnimals(dt);
      for (var i = 0; i < racers.length; i++) updateRacer(racers[i], dt);
      resolveContacts();
      checkGrannyHits();
      checkHazardHits();
      checkPuddles(dt);
      for (var pi = 0; pi < racers.length; pi++) {
        if (!racers[pi].dq) placeRacer(racers[pi]);
      }

      var humansDone = racers.filter(function (r) { return r.isHuman; })
        .every(function (r) { return r.dq || r.finished; });
      var allDone = racers.every(function (r) { return r.dq || r.finished; });
      if (allDone) { overTimer += dt; if (overTimer > 1.2) showResults(); }
      else if (humansDone) { overTimer += dt; if (overTimer > 3) showResults(); }
    }

    if (smoke) smoke.update(dt);
    if (storm.system && state !== 'menu') { updateStorm(dt); updateHeli(dt); }
    var f = (state === 'menu') ? null : focusRacer();
    // подпись печки, за которой едет камера, только мешает — гасим её
    for (var n = 0; n < racers.length; n++) {
      var lbl = racers[n].mesh.userData.label;
      if (lbl) lbl.visible = !f || racers[n] !== f;
    }
    if (state === 'menu') updateMenuCamera(dt);
    else { updateCamera(dt, f); updateSun(f); }

    if (state === 'race' && f) {
      music.setIntensity(f.lap >= totalLaps ? 3 : 2);
    }
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
    camera.position.set(p.x, p.y + 26, p.z);
    var look = track.pointAt(d + 90);
    camera.lookAt(look.x, look.y + 6, look.z);
  }

  /* ---------------- Ввод ---------------- */

  function bindInput() {
    var swallow = /^(Space|Arrow|Digit|Numpad|Bracket|Comma|Key[ZSKGMPONBTIWQEFHLJ])/;
    global.addEventListener('keydown', function (e) {
      keys[e.code] = true;
      if (swallow.test(e.code)) e.preventDefault();
      if (state !== 'menu') {
        if (e.code === 'KeyC') cycleFocus();
        if (e.code === 'KeyV') cameraMode = (cameraMode + 1) % 3;
      }
      if (e.code === 'KeyX') toggleSound();
      if (e.code === 'KeyY') toggleMusic();
      if (e.code === 'KeyA') toggleAdmin();
      if (e.code === 'KeyR' && state === 'over') backToMenu();
      sfx.resume();
      music.start();
    });
    global.addEventListener('keyup', function (e) { keys[e.code] = false; });
    global.addEventListener('blur', function () { keys = {}; });
  }

  function toggleSound() {
    sfx.init();
    sfx.setMuted(!sfx.muted);
    ui.mute.textContent = sfx.muted ? '🔇' : '🔊';
    ui.mute.classList.toggle('off', sfx.muted);
  }

  function toggleMusic() {
    music.setEnabled(!music.enabled);
    ui.musicBtn.classList.toggle('off', !music.enabled);
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
      var color = '#' + new THREE.Color(COLORS[i]).getHexString();
      var el = document.createElement('div');
      el.className = 'pedal';
      el.style.borderColor = color;
      var turbo = (i === 0)
        ? '<button class="pbtn turbo" data-act="boost">ТУРБО Z</button><div class="steam"><i></i></div>'
        : '';
      el.innerHTML =
        '<div class="prow">' +
          '<button class="pbtn steer" data-act="left">◀</button>' +
          '<button class="pbtn gas" data-act="gas">' + HUMAN_KEYS[i].short + '</button>' +
          '<button class="pbtn steer" data-act="right">▶</button>' +
        '</div>' + turbo +
        '<span class="pspeed">Игрок ' + (i + 1) + '</span>';
      ui.pedalBar.appendChild(el);
      ui.pedals.push(el);
      bindPedal(el, i);
    }
  }

  /* Кнопки работают и мышью, и пальцем; отпускание ловим где угодно. */
  function bindPedal(el, idx) {
    var btns = el.querySelectorAll('.pbtn');
    for (var b = 0; b < btns.length; b++) {
      (function (node, act) {
        function down(ev) {
          ev.preventDefault();
          if (act === 'gas') touchThrottle[idx] = true;
          else if (act === 'boost') touchBoost[idx] = true;
          else touchSteer[idx] = act === 'left' ? -1 : 1;
          node.classList.add('held');
          sfx.resume();
          music.start();
        }
        function up(ev) {
          if (ev) ev.preventDefault();
          if (act === 'gas') touchThrottle[idx] = false;
          else if (act === 'boost') touchBoost[idx] = false;
          else if (touchSteer[idx] === (act === 'left' ? -1 : 1)) touchSteer[idx] = 0;
          node.classList.remove('held');
        }
        node.addEventListener('pointerdown', down);
        node.addEventListener('pointerup', up);
        node.addEventListener('pointercancel', up);
        node.addEventListener('pointerleave', up);
        node.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      })(btns[b], btns[b].dataset.act);
    }
  }

  function startRace(humanCount, laps) {
    totalLaps = laps;
    lastHumans = humanCount;
    createRacers(humanCount);
    randomizeLights();
    resetGrannies();
    resetHazards();
    buildPedals(humanCount);
    touchThrottle = {};
    touchSteer = {};
    touchBoost = {};
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
    music.start();
    music.setIntensity(2);
  }

  function backToMenu() {
    state = 'menu';
    sfx.stopEngines();
    engineNode = null;
    music.setIntensity(1);
    racers.forEach(function (r) { scene.remove(r.mesh); });
    racers = [];
    ui.results.classList.remove('show');
    ui.hud.classList.remove('show');
    ui.menu.classList.add('show');
  }

  /* ---------------- Админ-панель ---------------- */

  function toggleAdmin() {
    admin.open = !admin.open;
    ui.admin.classList.toggle('show', admin.open);
    ui.adminBtn.classList.toggle('off', !admin.open);
  }

  function updateAdminStats() {
    var live = 0, out = 0, gr = 0;
    for (var i = 0; i < racers.length; i++) {
      if (racers[i].dq) out++; else live++;
    }
    for (var k = 0; k < grannies.length; k++) if (grannies[k].active) gr++;
    var info = Game.renderInfo();
    ui.adminStats.innerHTML =
      'кадров/с: ' + fps.toFixed(0) + ' · draw call: ' + (info ? info.calls : 0) + '<br>' +
      'в гонке: ' + live + ' · снято: ' + out + ' · бабушек: ' + gr + '<br>' +
      'время: ' + elapsed.toFixed(1) + ' с · круг ' +
      (racers.length ? Math.min(focusRacer().lap, totalLaps) : 1) + '/' + totalLaps;
  }

  function killBot() {
    var f = focusRacer();
    var victim = null, bestGap = Infinity;
    for (var i = 0; i < racers.length; i++) {
      var r = racers[i];
      if (r.isHuman || r.dq || r.finished) continue;
      var gap = f ? track.norm(r.dist - f.dist) : i;
      if (gap < bestGap) { bestGap = gap; victim = r; }
    }
    if (!victim) { flash('Компьютерных соперников в гонке не осталось', '#5dd6ff'); return; }
    disqualify(victim, 'снят администратором');
  }

  function bindAdmin() {
    ui.admin = document.getElementById('admin');
    ui.adminBtn = document.getElementById('admin-btn');
    ui.adminStats = document.getElementById('adm-stats');
    ui.adminBtn.addEventListener('click', toggleAdmin);

    var checks = [
      ['adm-invincible', 'invincible'],
      ['adm-steam', 'infiniteSteam'],
      ['adm-slowai', 'weakAI'],
      ['adm-nogranny', 'noGrannies'],
      ['adm-nohazard', 'noHazards']
    ];
    checks.forEach(function (pair) {
      document.getElementById(pair[0]).addEventListener('change', function (e) {
        admin[pair[1]] = e.target.checked;
      });
    });

    var lightBtns = document.querySelectorAll('#adm-lights button');
    lightBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        admin.lights = b.dataset.mode;
        lightBtns.forEach(function (x) { x.classList.toggle('sel', x === b); });
        if (admin.lights === 'auto') randomizeLights();
      });
    });

    document.getElementById('adm-jump').addEventListener('click', function () {
      var f = focusRacer();
      if (!f || f.dq) return;
      f.prevDist = f.dist = f.dist + 200;
      placeRacer(f);
      flash(f.name + ' перемещён на 200 м вперёд', '#5dd6ff');
    });
    document.getElementById('adm-fill').addEventListener('click', function () {
      for (var i = 0; i < racers.length; i++) if (racers[i].canBoost) racers[i].steam = 100;
      flash('Котлы полны', '#5dd6ff');
    });
    document.getElementById('adm-granny').addEventListener('click', function () {
      var f = focusRacer();
      if (!f) return;
      spawnGrannyAt(f.dist + 70, true);      // нарушительница, за ней приедет полиция
    });
    document.getElementById('adm-police').addEventListener('click', function () {
      var f = focusRacer();
      if (!f) return;
      var g = spawnGrannyAt(f.dist + 55, true);
      if (!g) return;
      spawnPolice(g);
      // ставим машину прямо в полосу печки — так админкой удобно проверять
      for (var i = 0; i < police.length; i++) {
        if (police[i].active && police[i].granny === g) {
          police[i].dist = track.norm(f.dist + 55);
          police[i].lane = f.lane;
        }
      }
    });
    document.getElementById('adm-kill').addEventListener('click', killBot);
    document.getElementById('adm-storm').addEventListener('click', function () {
      storm.active = true;
      storm.left = 12;
      sfx.startWind();
      flash('ПЕСЧАНАЯ БУРЯ!', '#e0a63c');
    });
    document.getElementById('adm-heli').addEventListener('click', function () {
      var f = focusRacer();
      if (!f) return;
      heli.active = true;
      heli.dist = f.dist - 180;
      heli.side = Math.random() < 0.5 ? 1 : -1;
      heli.mesh.visible = true;
      sfx.startRotor();
    });
    document.getElementById('adm-free').addEventListener('click', function () {
      for (var i = 0; i < racers.length; i++) {
        if (racers[i].jail > 0) {
          racers[i].jail = 0;
          if (racers[i].status) racers[i].status.visible = false;
          racers[i].mesh.userData.fire.visible = true;
          racers[i].mesh.userData.fireGlow.visible = true;
        }
      }
      flash('Все на свободе', '#5dd6ff');
    });
    document.getElementById('adm-camel').addEventListener('click', function () {
      var f = focusRacer();
      spawnCrosser(camel, 1, 60, 90);
      if (f && camel.active) {           // прямо по курсу, чтобы точно встретиться
        camel.dist = track.norm(f.dist + 60);
        camel.lane = f.lane;
        camel.speed = 0.25;
      }
    });
    document.getElementById('adm-restart').addEventListener('click', function () {
      startRace(lastHumans, totalLaps);
    });
    document.getElementById('adm-finish').addEventListener('click', function () {
      if (state === 'race' || state === 'countdown') showResults();
    });
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
    ui.musicBtn = document.getElementById('music');
    ui.steamBox = document.getElementById('steam-box');
    ui.steamFill = document.getElementById('steam-fill');
    ui.granny = document.getElementById('granny-warn');
    ui.grannyDist = document.getElementById('granny-dist');
    ui.jail = document.getElementById('jail-warn');
    ui.jailText = document.getElementById('jail-text');
    ui.storm = document.getElementById('storm-warn');
    ui.pedals = [];

    initRenderer();
    buildWorld();
    bindInput();
    bindAdmin();
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
    document.addEventListener('pointerdown', function () {
      sfx.resume();
      music.start();
    }, { once: true });
    document.getElementById('again').addEventListener('click', function () {
      startRace(chosen, lapsChosen);
    });
    document.getElementById('to-menu').addEventListener('click', backToMenu);
    ui.mute.addEventListener('click', toggleSound);
    ui.musicBtn.addEventListener('click', toggleMusic);
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
    html += '<span class="kh">порядок: <b>газ · руль влево вправо</b></span>';
    document.getElementById('key-hints').innerHTML = html;
  }

  /* Насколько печка стоит правее осевой — считается от геометрии, а не от
     знака полосы, поэтому годится для проверки, куда именно её уводит руль. */
  function offsetRight(r) {
    var center = track.pointAt(r.dist);
    var right = new THREE.Vector3().crossVectors(track.tangentAt(r.dist), new THREE.Vector3(0, 1, 0));
    return r.mesh.position.clone().sub(center).dot(right.normalize());
  }

  /* Служебный снимок состояния — удобно для отладки из консоли. */
  Game.debug = function () {
    return {
      state: state,
      elapsed: +elapsed.toFixed(1),
      laps: totalLaps,
      trackLength: Math.round(track ? track.length : 0),
      lights: intersections ? intersections.map(function (i) { return i.state; }) : [],
      grannies: grannies.filter(function (g) { return g.active; }).map(function (g) {
        return {
          dist: Math.round(g.dist), lane: +g.lane.toFixed(1),
          angry: g.angry > 0, whacking: g.whack > 0
        };
      }),
      music: { on: music.enabled, playing: music.playing, level: music.intensity },
      storm: { active: storm.active, level: +storm.level.toFixed(2) },
      heli: heli ? heli.active : false,
      police: police.filter(function (c) { return c.active; }).map(function (c) {
        return { dist: Math.round(c.dist), lane: +c.lane.toFixed(1), left: +c.timer.toFixed(1) };
      }),
      camel: camel && camel.active ? { dist: Math.round(camel.dist), lane: +camel.lane.toFixed(1) } : null,
      roach: roach && roach.active ? { dist: Math.round(roach.dist), lane: +roach.lane.toFixed(1) } : null,
      racers: racers.map(function (r) {
        return {
          name: r.name, human: r.isHuman, lap: r.lap, dq: r.dq, finished: r.finished,
          kmh: Math.round(r.speed * 3.6), dist: Math.round(r.dist), place: r.place,
          lane: +r.lane.toFixed(1), offsetRight: +offsetRight(r).toFixed(1),
          steam: Math.round(r.steam), boosting: r.boosting,
          reason: r.dqReason || null, rider: r.rider,
          jail: +r.jail.toFixed(1), jailReason: r.jailReason || null, skid: +r.skid.toFixed(2),
          throttle: r.throttle,
          height: +track.heightAt(r.dist).toFixed(1),
          slope: +(track.slopeAt(r.dist) * 100).toFixed(1),
          air: +r.air.toFixed(2),
          blocker: (function () {
            if (r.isHuman) return null;
            var ob = obstacleAhead(r, 30);
            if (!ob) return null;
            return (ob.obj.isGranny ? 'бабушка' : ob.obj.name) + ' ' + Math.round(ob.gap) + 'м';
          })(),
          light: (function () {
            var ni = nextIntersection(r);
            return ni.inter.state + ' ' + Math.round(ni.toStop) + 'м';
          })()
        };
      })
    };
  };

  /* Отладка: что под печкой — асфальт, обочина или песок. */
  Game.groundUnder = function (id) {
    var r = racers[id || 0];
    if (!r) return null;
    var ray = new THREE.Raycaster(
      new THREE.Vector3(r.mesh.position.x, 20, r.mesh.position.z),
      new THREE.Vector3(0, -1, 0)
    );
    ray.camera = camera;                       // спрайты требуют камеру
    var meshes = [];
    scene.traverse(function (o) {
      if (!o.isMesh) return;
      var par = o.parent;
      if (par && (par.userData.wheels || par.userData.armL)) return;   // сама печка и бабушки не нужны
      meshes.push(o);
    });
    var hits = ray.intersectObjects(meshes, false);
    return hits.slice(0, 3).map(function (h) {
      return {
        y: +h.point.y.toFixed(3),
        color: h.object.material && h.object.material.color ? '#' + h.object.material.color.getHexString() : null,
        textured: !!(h.object.material && h.object.material.map),
        verts: h.object.geometry && h.object.geometry.attributes.position ? h.object.geometry.attributes.position.count : 0
      };
    });
  };

  /* Отладка: где камера относительно печки в фокусе. */
  Game.cameraInfo = function () {
    var f = focusRacer();
    if (!f) return null;
    // куда печка попадает на экране: 0,0 — левый верх, 1,1 — правый низ
    var top = f.mesh.position.clone(); top.y += 5.1;
    var mid = f.mesh.position.clone(); mid.y += 1.5;
    function project(v) {
      var q = v.clone().project(camera);
      return { x: +((q.x + 1) / 2).toFixed(2), y: +((1 - q.y) / 2).toFixed(2) };
    }
    return {
      distance: +camera.position.distanceTo(f.mesh.position).toFixed(1),
      camY: +camera.position.y.toFixed(1),
      speed: Math.round(f.speed * 3.6),
      mode: cameraMode,
      screenTop: project(top),
      screenMid: project(mid)
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
  global.__ground = Game.groundUnder;
  global.__cam = Game.cameraInfo;
})(window);
