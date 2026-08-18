/* Мир: трасса-кольцо по Дубаю, песок, небоскрёбы, пальмы, светофоры и сами печки. */
(function (global) {
  'use strict';

  var World = {};

  /* ---------- Текстуры (рисуем на canvas, чтобы не тянуть картинки) ---------- */

  World.anisotropy = 1;      // выставляется рендерером при запуске

  function canvasTexture(w, h, draw, repeatX, repeatY) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeatX || 1, repeatY || 1);
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = World.anisotropy;
    return t;
  }
  World.canvasTexture = canvasTexture;

  World.sandTexture = function () {
    return canvasTexture(256, 256, function (g, w, h) {
      g.fillStyle = '#e2c893';
      g.fillRect(0, 0, w, h);
      for (var i = 0; i < 8000; i++) {
        g.fillStyle = Math.random() > 0.5 ? 'rgba(255,240,205,0.35)' : 'rgba(180,150,100,0.28)';
        g.fillRect(Math.random() * w, Math.random() * h, 1.6, 1.6);
      }
      for (var k = 0; k < 40; k++) {
        g.strokeStyle = 'rgba(196,166,112,0.25)';
        g.lineWidth = 1 + Math.random() * 3;
        g.beginPath();
        var yy = Math.random() * h;
        g.moveTo(0, yy);
        g.bezierCurveTo(w * 0.3, yy + 20, w * 0.6, yy - 20, w, yy + 6);
        g.stroke();
      }
    }, 70, 70);
  };

  /* Дорога: разметка запечена в текстуру. U — поперёк полотна, V — вдоль. */
  World.roadTexture = function (lengthMeters) {
    return canvasTexture(256, 256, function (g, w, h) {
      g.fillStyle = '#3a3a40';
      g.fillRect(0, 0, w, h);
      for (var i = 0; i < 9000; i++) {
        g.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.06)';
        g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
      g.fillStyle = '#efe9d8';
      g.fillRect(w * 0.03, 0, 5, h);
      g.fillRect(w * 0.97 - 5, 0, 5, h);
      g.fillStyle = '#f2e9c8';
      for (var y = 0; y < h; y += 64) g.fillRect(w * 0.5 - 3, y, 6, 34);
    }, 1, Math.max(1, Math.round(lengthMeters / 14)));
  };

  World.plainRoadTexture = function () {
    return canvasTexture(128, 128, function (g, w, h) {
      g.fillStyle = '#3d3d43';
      g.fillRect(0, 0, w, h);
      for (var i = 0; i < 3000; i++) {
        g.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)';
        g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
    }, 3, 3);
  };

  World.brickTexture = function (color) {
    return canvasTexture(128, 128, function (g, w, h) {
      g.fillStyle = color;
      g.fillRect(0, 0, w, h);
      var bh = 16, bw = 32;
      for (var row = 0; row * bh < h; row++) {
        var off = (row % 2) * bw / 2;
        for (var x = -bw; x < w + bw; x += bw) {
          g.fillStyle = 'rgba(255,255,255,' + (0.05 + Math.random() * 0.12) + ')';
          g.fillRect(x + off + 1.5, row * bh + 1.5, bw - 3, bh - 3);
        }
      }
      g.strokeStyle = 'rgba(0,0,0,0.35)';
      g.lineWidth = 2;
      for (var r = 0; r * bh <= h; r++) {
        g.beginPath(); g.moveTo(0, r * bh); g.lineTo(w, r * bh); g.stroke();
      }
    }, 2, 1);
  };

  World.windowsTexture = function () {
    return canvasTexture(128, 256, function (g, w, h) {
      var base = ['#6f7f92', '#5d6b7d', '#7d8c9c', '#8796a4'][Math.floor(Math.random() * 4)];
      g.fillStyle = base;
      g.fillRect(0, 0, w, h);
      var cw = 16, ch = 20;
      for (var y = 6; y < h - 6; y += ch) {
        for (var x = 6; x < w - 6; x += cw) {
          var lit = Math.random();
          if (lit > 0.74) g.fillStyle = 'rgba(255,232,170,0.95)';
          else if (lit > 0.45) g.fillStyle = 'rgba(150,200,225,0.75)';
          else g.fillStyle = 'rgba(40,58,74,0.85)';
          g.fillRect(x, y, cw - 5, ch - 8);
        }
      }
    }, 1, 1);
  };

  World.skyTexture = function () {
    return canvasTexture(16, 256, function (g, w, h) {
      var grd = g.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0.00, '#1f5ba8');
      grd.addColorStop(0.35, '#79aede');
      grd.addColorStop(0.64, '#cfd9dd');
      grd.addColorStop(0.84, '#eed6ad');
      grd.addColorStop(1.00, '#e3c089');
      g.fillStyle = grd;
      g.fillRect(0, 0, w, h);
    });
  };

  World.glowTexture = function (r, g_, b) {
    return canvasTexture(64, 64, function (g, w, h) {
      var grd = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      grd.addColorStop(0, 'rgba(' + r + ',' + g_ + ',' + b + ',1)');
      grd.addColorStop(0.35, 'rgba(' + r + ',' + g_ + ',' + b + ',0.5)');
      grd.addColorStop(1, 'rgba(' + r + ',' + g_ + ',' + b + ',0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, w, h);
    });
  };

  World.smokeTexture = function () {
    return canvasTexture(64, 64, function (g, w, h) {
      var grd = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      grd.addColorStop(0, 'rgba(255,255,255,0.85)');
      grd.addColorStop(0.45, 'rgba(225,225,225,0.35)');
      grd.addColorStop(1, 'rgba(210,210,210,0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, w, h);
    });
  };

  World.shadowTexture = function () {
    return canvasTexture(64, 64, function (g, w, h) {
      var grd = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      grd.addColorStop(0, 'rgba(0,0,0,0.34)');
      grd.addColorStop(0.6, 'rgba(0,0,0,0.13)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, w, h);
    });
  };

  /* Склеивает геометрии в одну — резко уменьшает число draw call'ов. */
  World.mergeGeometries = function (geos) {
    var pos = [], nor = [], uvs = [];
    for (var i = 0; i < geos.length; i++) {
      var g = geos[i].index ? geos[i].toNonIndexed() : geos[i];
      var p = g.attributes.position.array;
      var n = g.attributes.normal ? g.attributes.normal.array : null;
      var u = g.attributes.uv ? g.attributes.uv.array : null;
      for (var k = 0; k < p.length; k++) pos.push(p[k]);
      for (var k2 = 0; k2 < p.length; k2++) nor.push(n ? n[k2] : 0);
      var vcount = p.length / 3;
      for (var v = 0; v < vcount; v++) {
        uvs.push(u ? u[v * 2] : 0, u ? u[v * 2 + 1] : 0);
      }
    }
    var out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    out.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    if (!geos.length || !geos[0].attributes.normal) out.computeVertexNormals();
    return out;
  };

  World.scaleUV = function (geo, sx, sy) {
    var uv = geo.attributes.uv;
    for (var i = 0; i < uv.count; i++) {
      uv.setXY(i, uv.getX(i) * sx, uv.getY(i) * sy);
    }
    uv.needsUpdate = true;
    return geo;
  };

  World.labelSprite = function (text, color) {
    var c = document.createElement('canvas');
    c.width = 256; c.height = 64;
    var g = c.getContext('2d');
    g.fillStyle = 'rgba(10,14,22,0.66)';
    if (g.roundRect) { g.beginPath(); g.roundRect(3, 8, 250, 48, 12); g.fill(); }
    else g.fillRect(3, 8, 250, 48);
    g.fillStyle = color;
    g.fillRect(11, 15, 9, 34);
    g.font = 'bold 29px system-ui, -apple-system, sans-serif';
    g.fillStyle = '#ffffff';
    g.textBaseline = 'middle';
    g.fillText(text, 30, 33);
    var tex = new THREE.CanvasTexture(c);
    var spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    spr.scale.set(3.6, 0.9, 1);
    return spr;
  };

  /* Табличка над печкой с меняющимся текстом (тюрьма, статус). */
  World.statusSprite = function () {
    var c = document.createElement('canvas');
    c.width = 256; c.height = 64;
    var ctx = c.getContext('2d');
    var tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    var spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    spr.scale.set(5.2, 1.3, 1);
    spr.visible = false;
    spr.userData.set = function (text, color) {
      ctx.clearRect(0, 0, 256, 64);
      ctx.fillStyle = 'rgba(12,10,16,0.82)';
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(2, 6, 252, 52, 12); ctx.fill(); }
      else ctx.fillRect(2, 6, 252, 52);
      ctx.strokeStyle = color || '#ff8a3d';
      ctx.lineWidth = 3;
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(2, 6, 252, 52, 12); ctx.stroke(); }
      ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = color || '#ff8a3d';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 128, 33);
      tex.needsUpdate = true;
    };
    return spr;
  };

  /* ---------- Трасса ---------- */

  World.buildTrack = function () {
    var raw = [
      [0, 0], [130, -12], [235, -70], [312, -175], [305, -300], [232, -382],
      [104, -404], [-24, -352], [-112, -258], [-140, -140], [-82, -44]
    ];
    var pts = raw.map(function (p) { return new THREE.Vector3(p[0], 0, p[1]); });
    var curve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5);

    var track = {
      curve: curve,
      length: curve.getLength(),
      width: 22,
      samples: []
    };
    track.norm = function (dist) {
      var L = this.length;
      return ((dist % L) + L) % L;
    };

    /* Горки: сумма гармоник по длине круга. Каждое слагаемое неотрицательно,
       поэтому дорога никогда не уходит ниже песка, а профиль замкнут — на
       стыке круга нет ступеньки. */
    // Фазы нулевые: тогда на старте профиль ровный (все слагаемые в этой
    // точке имеют нулевой наклон), а дальше горки расходятся по кругу.
    var HILLS = [
      { amp: 7.0, harm: 2, phase: 0 },      // длинные пологие подъёмы
      { amp: 4.0, harm: 3, phase: 0 },
      { amp: 2.0, harm: 7, phase: 0 },
      { amp: 0.7, harm: 23, phase: 0 },     // мелкая волна под колёсами
      { amp: 0.3, harm: 37, phase: 0 }
    ];
    /* Отдельные трамплины: короткие крутые бугры, на которых печку
       по-настоящему подбрасывает даже без турбо. */
    // Трамплин несимметричный: заезжаешь полого, не теряя скорости,
    // а за гребнем дорога обрывается — там печку и подбрасывает.
    var JUMPS = [
      { at: 0.20, amp: 1.9, up: 24, down: 7 },
      { at: 0.38, amp: 1.7, up: 22, down: 6.5 },
      { at: 0.55, amp: 2.0, up: 26, down: 7.5 },
      { at: 0.72, amp: 1.7, up: 22, down: 6.5 },
      { at: 0.88, amp: 1.8, up: 24, down: 7 }
    ];
    track.jumps = JUMPS;

    track.heightAt = function (dist) {
      var L = this.length;
      var u = this.norm(dist) / L * Math.PI * 2;
      var h = 0;
      for (var i = 0; i < HILLS.length; i++) {
        h += HILLS[i].amp * (1 - Math.cos(u * HILLS[i].harm + HILLS[i].phase)) / 2;
      }
      for (var j = 0; j < JUMPS.length; j++) {
        var diff = this.norm(dist - JUMPS[j].at * L);
        if (diff > L / 2) diff -= L;                       // берём ближайшую сторону
        var k = diff / (diff < 0 ? JUMPS[j].up : JUMPS[j].down);
        if (k > -4 && k < 4) h += JUMPS[j].amp * Math.exp(-k * k);
      }
      return h;
    };
    /* Уклон в метрах подъёма на метр пути: + в горку, − под горку. */
    track.slopeAt = function (dist) {
      var d = 2;
      return (this.heightAt(dist + d) - this.heightAt(dist - d)) / (2 * d);
    };
    /* Кривизна профиля: на гребне отрицательная — по ней считаем отрыв. */
    track.curvatureAt = function (dist) {
      var d = 4;
      return (this.heightAt(dist + d) - 2 * this.heightAt(dist) + this.heightAt(dist - d)) / (d * d);
    };

    track.pointAt = function (dist) {
      var p = this.curve.getPointAt(this.norm(dist) / this.length);
      p.y = this.heightAt(dist);
      return p;
    };
    track.tangentAt = function (dist) {
      return this.curve.getTangentAt(this.norm(dist) / this.length).normalize();
    };
    track.sideAt = function (dist) {
      var t = this.tangentAt(dist);
      return new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), t).normalize();
    };

    for (var i = 0; i <= 500; i++) track.samples.push(track.pointAt(track.length * i / 500));
    return track;
  };

  function ribbon(track, halfWidth, y, material, segments, vRepeatDivisor) {
    var N = segments || 700;
    var pos = [], uv = [], idx = [];
    for (var i = 0; i <= N; i++) {
      var d = track.length * i / N;
      var p = track.pointAt(d);
      var n = track.sideAt(d);
      var l = p.clone().addScaledVector(n, halfWidth);
      var r = p.clone().addScaledVector(n, -halfWidth);
      pos.push(l.x, p.y + y, l.z, r.x, p.y + y, r.z);
      var v = vRepeatDivisor ? d / vRepeatDivisor : i / N;
      uv.push(0, v, 1, v);
      if (i < N) {
        var a = i * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, material);
  }

  World.roadMesh = function (track) {
    var mat = new THREE.MeshLambertMaterial({ map: World.roadTexture(track.length) });
    return ribbon(track, track.width / 2, 0.02, mat, 800);
  };

  World.shoulderMesh = function (track) {
    var mat = new THREE.MeshLambertMaterial({ color: 0xcbb183 });
    return ribbon(track, track.width / 2 + 5, 0.008, mat, 500);
  };

  /* Насыпь: скаты от края обочины вниз к песку, чтобы дорога на горках
     не висела в воздухе. Ширина ската зависит от высоты в этом месте. */
  World.embankmentMesh = function (track) {
    var N = 500;
    var edge = track.width / 2 + 5;
    var pos = [], idx = [];
    for (var i = 0; i <= N; i++) {
      var d = track.length * i / N;
      var p = track.pointAt(d);
      var n = track.sideAt(d);
      var run = 6 + p.y * 1.5;
      var lTop = p.clone().addScaledVector(n, edge);
      var lBot = p.clone().addScaledVector(n, edge + run);
      var rTop = p.clone().addScaledVector(n, -edge);
      var rBot = p.clone().addScaledVector(n, -(edge + run));
      pos.push(lTop.x, p.y, lTop.z, lBot.x, 0.01, lBot.z,
               rTop.x, p.y, rTop.z, rBot.x, 0.01, rBot.z);
      if (i < N) {
        var a = i * 4;
        idx.push(a, a + 1, a + 4, a + 1, a + 5, a + 4);          // левый скат
        idx.push(a + 2, a + 6, a + 3, a + 3, a + 6, a + 7);      // правый скат
      }
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: 0xd6bb89 }));
  };

  /* Насколько далеко от осевой начинается ровный песок в этом месте. */
  World.roadFootprint = function (track, dist) {
    return track.width / 2 + 11 + track.heightAt(dist) * 1.5;
  };

  /* ---------- Перекрёстки со светофорами ---------- */

  World.buildIntersections = function (track, scene) {
    var us = [0.13, 0.30, 0.47, 0.63, 0.80, 0.94];
    var list = [];
    var plain = World.plainRoadTexture();

    for (var i = 0; i < us.length; i++) {
      var d = us[i] * track.length;
      var p = track.pointAt(d);
      var t = track.tangentAt(d);
      var n = track.sideAt(d);
      var angle = Math.atan2(t.x, t.z);

      var group = new THREE.Group();
      group.position.copy(p);
      group.rotation.order = 'YXZ';
      group.rotation.y = angle;
      group.rotation.x = -Math.atan(track.slopeAt(d));   // ложится по уклону горки
      scene.add(group);

      // поперечная улица
      var cross = new THREE.Mesh(
        new THREE.PlaneGeometry(150, track.width),
        new THREE.MeshLambertMaterial({ map: plain })
      );
      cross.rotation.x = -Math.PI / 2;
      cross.position.y = 0.03;
      group.add(cross);

      // зебра + стоп-линия — одной склеенной геометрией
      var marks = [];
      var flat = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
      for (var z = -1; z <= 1; z += 2) {
        for (var s = -5; s <= 5; s++) {
          var stripe = new THREE.PlaneGeometry(1.4, 5);
          stripe.applyMatrix4(flat);
          stripe.translate(s * 2.3, 0.05, z * (track.width / 2 + 3.6));
          marks.push(stripe);
        }
      }
      var stopGeo = new THREE.PlaneGeometry(track.width - 1, 1.1);
      stopGeo.applyMatrix4(flat);
      stopGeo.translate(0, 0.06, -(track.width / 2 + 7.5));
      marks.push(stopGeo);
      group.add(new THREE.Mesh(World.mergeGeometries(marks),
        new THREE.MeshBasicMaterial({ color: 0xf3ecd7 })));

      var inter = {
        index: i,
        dist: d,
        position: p.clone(),
        tangent: t.clone(),
        side: n.clone(),
        group: group,
        stopDist: d - (track.width / 2 + 7.5),
        state: 'green',
        timer: 3 + Math.random() * 6,
        lamps: [],
        glows: []
      };

      // два столба-светофора по краям дороги
      for (var sideSign = -1; sideSign <= 1; sideSign += 2) {
        var pole = World.trafficLight();
        pole.position.set(sideSign * (track.width / 2 + 2.4), 0, -(track.width / 2 + 9));
        pole.rotation.y = sideSign > 0 ? Math.PI : 0;
        group.add(pole);
        inter.lamps.push(pole.userData.lamps);
        inter.glows.push(pole.userData.glows);
      }

      list.push(inter);
    }
    return list;
  };

  var POLE_MAT = null, LAMPBOX_MAT = null;

  World.trafficLight = function () {
    var g = new THREE.Group();
    if (!POLE_MAT) POLE_MAT = new THREE.MeshLambertMaterial({ color: 0x4a4f57 });
    if (!LAMPBOX_MAT) LAMPBOX_MAT = new THREE.MeshLambertMaterial({ color: 0x22262c });

    // столб + кронштейн + корпус — одна геометрия
    var parts = [];
    var pole = new THREE.CylinderGeometry(0.22, 0.28, 7, 8);
    pole.translate(0, 3.5, 0);
    parts.push(pole);
    var arm = new THREE.BoxGeometry(0.24, 0.24, 2.2);
    arm.translate(0, 6.9, 1.1);
    parts.push(arm);
    g.add(new THREE.Mesh(World.mergeGeometries(parts), POLE_MAT));

    var box = new THREE.Mesh(new THREE.BoxGeometry(1.5, 3.7, 1.1), LAMPBOX_MAT);
    box.position.set(0, 5.6, 2.1);
    g.add(box);

    var lamps = {}, glows = {};
    var defs = [
      ['red', 0xff2b2b, 1.15, 255, 60, 60],
      ['yellow', 0xffc32b, 0.0, 255, 200, 60],
      ['green', 0x2bff62, -1.15, 80, 255, 120]
    ];
    for (var i = 0; i < defs.length; i++) {
      var d = defs[i];
      var lamp = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, 14, 10),
        new THREE.MeshBasicMaterial({ color: d[1] })
      );
      lamp.position.set(0, 5.6 + d[2], 2.68);
      lamp.material.color.multiplyScalar(0.22);
      lamp.userData.baseColor = new THREE.Color(d[1]);
      g.add(lamp);
      lamps[d[0]] = lamp;

      var glow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: World.glowTexture(d[3], d[4], d[5]),
        transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
      }));
      glow.scale.set(2.6, 2.6, 1);
      glow.position.copy(lamp.position);
      glow.position.z += 0.2;
      glow.visible = false;
      g.add(glow);
      glows[d[0]] = glow;
    }
    g.userData.lamps = lamps;
    g.userData.glows = glows;
    return g;
  };

  World.applyLightState = function (inter) {
    for (var i = 0; i < inter.lamps.length; i++) {
      var lamps = inter.lamps[i], glows = inter.glows[i];
      ['red', 'yellow', 'green'].forEach(function (k) {
        var on = (k === inter.state);
        lamps[k].material.color.copy(lamps[k].userData.baseColor);
        if (!on) lamps[k].material.color.multiplyScalar(0.2);
        glows[k].visible = on;
      });
    }
  };

  /* ---------- Город ---------- */

  World.buildCity = function (track, scene) {
    var group = new THREE.Group();
    scene.add(group);

    // песок
    var sand = new THREE.Mesh(
      new THREE.PlaneGeometry(4000, 4000),
      new THREE.MeshLambertMaterial({ map: World.sandTexture() })
    );
    sand.rotation.x = -Math.PI / 2;
    sand.position.y = -0.05;
    group.add(sand);

    // небо
    var sky = new THREE.Mesh(
      new THREE.SphereGeometry(1800, 24, 16),
      new THREE.MeshBasicMaterial({ map: World.skyTexture(), side: THREE.BackSide, depthWrite: false })
    );
    group.add(sky);

    // солнце
    var sun = new THREE.Sprite(new THREE.SpriteMaterial({
      map: World.glowTexture(255, 246, 214), transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    sun.scale.set(420, 420, 1);
    sun.position.set(-900, 320, -1200);
    group.add(sun);

    function distanceToRoad(x, z) {
      var min = Infinity;
      for (var i = 0; i < track.samples.length; i += 2) {
        var s = track.samples[i];
        var dx = s.x - x, dz = s.z - z;
        var d2 = dx * dx + dz * dz;
        if (d2 < min) min = d2;
      }
      return Math.sqrt(min);
    }
    World._distanceToRoad = distanceToRoad;

    // Небоскрёбы: четыре «квартала» с общими материалами, внутри квартала всё склеено
    var BUCKETS = 4;
    var buckets = [], capGeos = [];
    for (var w = 0; w < BUCKETS; w++) buckets.push([]);

    var center = new THREE.Vector3(85, 0, -200);
    var placed = 0, tries = 0;
    while (placed < 140 && tries < 2400) {
      tries++;
      var ang = Math.random() * Math.PI * 2;
      var rad = 60 + Math.random() * 640;
      var x = center.x + Math.cos(ang) * rad;
      var z = center.z + Math.sin(ang) * rad;
      var near = distanceToRoad(x, z);
      if (near < track.width / 2 + 34) continue;    // за насыпью, иначе дом окажется в склоне
      var fin0 = track.pointAt(0), fs0 = track.sideAt(0);
      var bjx = fin0.x + fs0.x * -82, bjz = fin0.z + fs0.z * -82;
      if ((x - bjx) * (x - bjx) + (z - bjz) * (z - bjz) < 105 * 105) continue;   // площадь башни

      var h = 26 + Math.random() * Math.random() * 190 + (near < 90 ? 0 : 30);
      var bw = 12 + Math.random() * 24;
      var bd = 12 + Math.random() * 24;

      var geo = new THREE.BoxGeometry(bw, h, bd);
      World.scaleUV(geo, Math.max(1, Math.round(bw / 8)), Math.max(1, Math.round(h / 9)));
      var m = new THREE.Matrix4().makeRotationY(Math.random() * Math.PI);
      m.setPosition(x, h / 2, z);
      geo.applyMatrix4(m);
      buckets[placed % BUCKETS].push(geo);

      if (Math.random() > 0.55) {
        var ch = 6 + Math.random() * 18;
        var cap = new THREE.BoxGeometry(bw * 0.4, ch, bd * 0.4);
        cap.translate(x, h + ch / 2, z);
        capGeos.push(cap);
      }
      placed++;
    }
    for (var b2 = 0; b2 < BUCKETS; b2++) {
      if (!buckets[b2].length) continue;
      group.add(new THREE.Mesh(World.mergeGeometries(buckets[b2]),
        new THREE.MeshLambertMaterial({ map: World.windowsTexture() })));
    }
    if (capGeos.length) {
      group.add(new THREE.Mesh(World.mergeGeometries(capGeos),
        new THREE.MeshLambertMaterial({ color: 0x8d9aa6 })));
    }

    // Бурдж-Халифа стоит у самой финишной прямой
    var fin = track.pointAt(0);
    var fside = track.sideAt(0);
    var burj = new THREE.Vector3(fin.x, 0, fin.z).addScaledVector(fside, -82);
    World.burjPosition = burj.clone();
    World.buildBurj(group, burj.x, burj.z);

    // Пальмы вдоль трассы: стоят на песке за насыпью, поэтому отступ зависит
    // от высоты дороги в этом месте
    var trunkGeos = [], leafGeos = [];
    for (var i = 0; i < 120; i++) {
      var d = track.length * i / 120 + 4;
      var p = track.pointAt(d);
      var n = track.sideAt(d);
      var sideSign = (i % 2 === 0) ? 1 : -1;
      var off = World.roadFootprint(track, d) + 3 + Math.random() * 6;
      var pp = p.clone().addScaledVector(n, sideSign * off);
      World.palmGeometry(pp.x, pp.z, trunkGeos, leafGeos);
    }
    group.add(new THREE.Mesh(World.mergeGeometries(trunkGeos),
      new THREE.MeshLambertMaterial({ color: 0x8a6a44 })));
    group.add(new THREE.Mesh(World.mergeGeometries(leafGeos),
      new THREE.MeshLambertMaterial({ color: 0x3f7d34, side: THREE.DoubleSide })));

    // Дюны
    var duneGeos = [];
    for (var k = 0; k < 34; k++) {
      var a2 = Math.random() * Math.PI * 2;
      var r2 = 700 + Math.random() * 900;
      var dune = new THREE.SphereGeometry(60 + Math.random() * 120, 10, 6);
      var md = new THREE.Matrix4().makeScale(1, 0.16 + Math.random() * 0.12, 1);
      md.setPosition(center.x + Math.cos(a2) * r2, 0, center.z + Math.sin(a2) * r2);
      dune.applyMatrix4(md);
      duneGeos.push(dune);
    }
    group.add(new THREE.Mesh(World.mergeGeometries(duneGeos),
      new THREE.MeshLambertMaterial({ color: 0xdfc48c })));

    return group;
  };

  /* Полосатые столбики перед трамплинами — чтобы прыжок не был сюрпризом. */
  World.jumpSigns = function (track, scene) {
    var stripe = canvasTexture(32, 64, function (g, w, h) {
      for (var i = 0; i < 8; i++) {
        g.fillStyle = i % 2 ? '#1e1e22' : '#ffd23f';
        g.fillRect(0, i * h / 8, w, h / 8);
      }
    }, 1, 3);
    var geos = [];
    for (var j = 0; j < track.jumps.length; j++) {
      var d = track.jumps[j].at * track.length - track.jumps[j].up * 1.2;
      for (var s = -1; s <= 1; s += 2) {
        var p = track.pointAt(d);
        var n = track.sideAt(d);
        var post = new THREE.CylinderGeometry(0.3, 0.3, 3, 6);
        post.translate(p.x + n.x * s * (track.width / 2 + 2),
                       p.y + 1.5,
                       p.z + n.z * s * (track.width / 2 + 2));
        geos.push(post);
      }
    }
    var mesh = new THREE.Mesh(World.mergeGeometries(geos),
      new THREE.MeshLambertMaterial({ map: stripe }));
    scene.add(mesh);
    return mesh;
  };

  /* Бурдж-Халифа: три крыла со ступенчатыми отступами, шпиль и площадь. */
  World.buildBurj = function (group, x, z) {
    var winTex = World.windowsTexture();
    var glassMat = new THREE.MeshLambertMaterial({ map: winTex });
    var trimMat = new THREE.MeshLambertMaterial({ color: 0xcfd8de });

    var glass = [], trim = [];
    var y = 0;
    var w = 30;                 // полуширина крыла у земли
    var sections = 26;
    for (var i = 0; i < sections; i++) {
      var h = 30 - i * 0.55;
      var wing = new THREE.CylinderGeometry(w, w * 0.97, h, 6);
      World.scaleUV(wing, Math.max(1, Math.round(w / 3)), Math.max(1, Math.round(h / 7)));
      var m = new THREE.Matrix4().makeRotationY(i * 0.085);
      m.setPosition(x, y + h / 2, z);
      wing.applyMatrix4(m);
      glass.push(wing);

      // тонкий карниз на каждом отступе
      var ledge = new THREE.CylinderGeometry(w * 1.04, w * 1.04, 1.1, 6);
      var ml = new THREE.Matrix4().makeRotationY(i * 0.085);
      ml.setPosition(x, y + h, z);
      ledge.applyMatrix4(ml);
      trim.push(ledge);

      y += h;
      w *= 0.915;
    }

    // шпиль
    var spire = new THREE.CylinderGeometry(0.6, 3.4, 150, 8);
    spire.translate(x, y + 75, z);
    trim.push(spire);
    var tip = new THREE.CylinderGeometry(0.05, 0.6, 26, 6);
    tip.translate(x, y + 150 + 13, z);
    trim.push(tip);

    group.add(new THREE.Mesh(World.mergeGeometries(glass), glassMat));
    group.add(new THREE.Mesh(World.mergeGeometries(trim), trimMat));

    // площадь и бассейн у подножия
    var plaza = new THREE.Mesh(new THREE.CylinderGeometry(78, 78, 0.6, 24),
      new THREE.MeshLambertMaterial({ color: 0xd8d2c4 }));
    plaza.position.set(x, 0.3, z);
    group.add(plaza);
    var pool = new THREE.Mesh(new THREE.CylinderGeometry(46, 46, 0.4, 24),
      new THREE.MeshLambertMaterial({ color: 0x2f7fa8 }));
    pool.position.set(x, 0.65, z);
    group.add(pool);

    // пальмы по кругу площади
    var trunks = [], leaves = [];
    for (var k = 0; k < 14; k++) {
      var a = k / 14 * Math.PI * 2;
      World.palmGeometry(x + Math.cos(a) * 70, z + Math.sin(a) * 70, trunks, leaves);
    }
    group.add(new THREE.Mesh(World.mergeGeometries(trunks),
      new THREE.MeshLambertMaterial({ color: 0x8a6a44 })));
    group.add(new THREE.Mesh(World.mergeGeometries(leaves),
      new THREE.MeshLambertMaterial({ color: 0x3f7d34, side: THREE.DoubleSide })));

    return { x: x, z: z, height: y + 176 };
  };

  /* Геометрия одной пальмы, разложенная по спискам «ствол» и «листья». */
  World.palmGeometry = function (x, z, trunks, leaves) {
    var h = 6 + Math.random() * 4;
    var rotY = Math.random() * Math.PI;
    var trunk = new THREE.CylinderGeometry(0.28, 0.5, h, 7);
    trunk.translate(0, h / 2, 0);
    var mt = new THREE.Matrix4().makeRotationY(rotY);
    mt.setPosition(x, 0, z);
    trunk.applyMatrix4(mt);
    trunks.push(trunk);

    for (var i = 0; i < 7; i++) {
      var leaf = new THREE.PlaneGeometry(5.2, 1.15);
      var a = i / 7 * Math.PI * 2;
      var e = new THREE.Euler(0, -a, -0.5 - Math.random() * 0.25);
      var ml = new THREE.Matrix4().makeRotationFromEuler(e);
      ml.setPosition(Math.cos(a) * 2.1, h - 0.2 - Math.random() * 0.4, Math.sin(a) * 2.1);
      leaf.applyMatrix4(ml);
      leaf.applyMatrix4(mt);
      leaves.push(leaf);
    }
  };

  /* ---------- Печка ---------- */

  /* ---------- Текстуры русской печи ---------- */

  var TEX = {};   // общие текстуры печей: рисуем один раз на всех

  /* Белёная штукатурка с разводами и трещинками. */
  World.whitewashTexture = function () {
    return canvasTexture(128, 128, function (g, w, h) {
      g.fillStyle = '#f1ebdd';
      g.fillRect(0, 0, w, h);
      for (var i = 0; i < 900; i++) {
        g.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.5)' : 'rgba(196,180,152,0.22)';
        g.fillRect(Math.random() * w, Math.random() * h, 3 + Math.random() * 5, 2 + Math.random() * 4);
      }
      // трещинки и подпалины у низа
      g.strokeStyle = 'rgba(150,132,104,0.35)';
      for (var k = 0; k < 7; k++) {
        g.lineWidth = 0.8;
        g.beginPath();
        var x = Math.random() * w, y = Math.random() * h;
        g.moveTo(x, y);
        g.lineTo(x + (Math.random() - 0.5) * 26, y + Math.random() * 20);
        g.stroke();
      }
      var grd = g.createLinearGradient(0, h * 0.7, 0, h);
      grd.addColorStop(0, 'rgba(120,100,74,0)');
      grd.addColorStop(1, 'rgba(120,100,74,0.28)');
      g.fillStyle = grd;
      g.fillRect(0, h * 0.7, w, h * 0.3);
    });
  };

  /* Народная роспись: красно-синий узор по белому — для пояска вокруг печи. */
  World.ornamentTexture = function () {
    return canvasTexture(256, 64, function (g, w, h) {
      g.fillStyle = '#f6f1e4';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#c0392b';
      g.fillRect(0, 4, w, 3);
      g.fillRect(0, h - 7, w, 3);
      for (var x = 0; x < w; x += 32) {
        // ромб
        g.fillStyle = '#c0392b';
        g.beginPath();
        g.moveTo(x + 16, 14); g.lineTo(x + 27, h / 2); g.lineTo(x + 16, h - 14); g.lineTo(x + 5, h / 2);
        g.closePath(); g.fill();
        // синяя серединка и точки
        g.fillStyle = '#2b5fa8';
        g.beginPath(); g.arc(x + 16, h / 2, 4.5, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#e8a33d';
        g.beginPath(); g.arc(x + 32, h / 2, 3, 0, Math.PI * 2); g.fill();
      }
    }, 4, 1);
  };

  /* Передняя стенка: устье-арка с закопчённым сводом и роспись сверху. */
  World.stoveFrontTexture = function () {
    return canvasTexture(256, 160, function (g, w, h) {
      g.fillStyle = '#f1ebdd';
      g.fillRect(0, 0, w, h);
      for (var i = 0; i < 700; i++) {
        g.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.45)' : 'rgba(196,180,152,0.2)';
        g.fillRect(Math.random() * w, Math.random() * h, 3, 3);
      }

      // роспись по верху
      g.fillStyle = '#c0392b';
      g.fillRect(0, 9, w, 3);
      for (var x = 12; x < w; x += 34) {
        g.fillStyle = '#c0392b';
        g.beginPath();
        g.moveTo(x, 26); g.lineTo(x + 9, 18); g.lineTo(x + 18, 26); g.lineTo(x + 9, 34);
        g.closePath(); g.fill();
        g.fillStyle = '#2b5fa8';
        g.beginPath(); g.arc(x + 9, 26, 3, 0, Math.PI * 2); g.fill();
      }

      // копоть над устьем
      var soot = g.createRadialGradient(w / 2, 62, 5, w / 2, 62, 78);
      soot.addColorStop(0, 'rgba(48,40,34,0.55)');
      soot.addColorStop(1, 'rgba(48,40,34,0)');
      g.fillStyle = soot;
      g.fillRect(w / 2 - 80, 30, 160, 90);

      // устье: кирпичная обводка и чёрный проём с аркой
      function arch(pad, color) {
        g.fillStyle = color;
        g.beginPath();
        g.moveTo(w / 2 - 54 - pad, h - 6);
        g.lineTo(w / 2 - 54 - pad, 88 - pad);
        g.quadraticCurveTo(w / 2, 44 - pad * 1.6, w / 2 + 54 + pad, 88 - pad);
        g.lineTo(w / 2 + 54 + pad, h - 6);
        g.closePath();
        g.fill();
      }
      arch(7, '#a8563c');
      arch(0, '#17130f');

      // под (пол устья) и намёк на дрова
      g.fillStyle = '#2b2119';
      g.fillRect(w / 2 - 54, h - 26, 108, 20);
      g.strokeStyle = '#5a4530';
      g.lineWidth = 5;
      for (var d = -1; d <= 1; d++) {
        g.beginPath();
        g.moveTo(w / 2 - 34 + d * 8, h - 12);
        g.lineTo(w / 2 + 36 + d * 8, h - 18);
        g.stroke();
      }
    });
  };

  /* Бок печи: печурки-нишки, где сушат рукавицы. */
  World.stoveSideTexture = function () {
    return canvasTexture(256, 128, function (g, w, h) {
      g.fillStyle = '#f1ebdd';
      g.fillRect(0, 0, w, h);
      for (var i = 0; i < 600; i++) {
        g.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.45)' : 'rgba(196,180,152,0.2)';
        g.fillRect(Math.random() * w, Math.random() * h, 3, 3);
      }
      for (var n = 0; n < 2; n++) {
        var cx = 78 + n * 100, cy = 76;
        g.fillStyle = '#c9bda6';
        g.beginPath();
        g.moveTo(cx - 26, cy + 26);
        g.lineTo(cx - 26, cy - 6);
        g.quadraticCurveTo(cx, cy - 30, cx + 26, cy - 6);
        g.lineTo(cx + 26, cy + 26);
        g.closePath();
        g.fill();
        g.fillStyle = '#6d6250';
        g.beginPath();
        g.moveTo(cx - 20, cy + 26);
        g.lineTo(cx - 20, cy - 4);
        g.quadraticCurveTo(cx, cy - 24, cx + 20, cy - 4);
        g.lineTo(cx + 20, cy + 26);
        g.closePath();
        g.fill();
      }
      g.fillStyle = '#c0392b';
      g.fillRect(0, 16, w, 3);
      g.fillStyle = '#2b5fa8';
      for (var x = 10; x < w; x += 26) { g.beginPath(); g.arc(x, 28, 3.5, 0, Math.PI * 2); g.fill(); }
    });
  };

  /* Полосатая перина и одеяло в горошек — их красим в цвет игрока. */
  World.fabricTexture = function () {
    return canvasTexture(64, 64, function (g, w, h) {
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(0,0,0,0.16)';
      for (var y = 0; y < h; y += 12) g.fillRect(0, y, w, 5);
    }, 3, 2);
  };

  World.quiltTexture = function () {
    return canvasTexture(64, 64, function (g, w, h) {
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(0,0,0,0.22)';
      g.lineWidth = 2;
      for (var i = -h; i < w; i += 16) {
        g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke();
        g.beginPath(); g.moveTo(i + h, 0); g.lineTo(i, h); g.stroke();
      }
      g.fillStyle = 'rgba(0,0,0,0.14)';
      for (var y = 8; y < h; y += 16) for (var x = 8; x < w; x += 16) {
        g.beginPath(); g.arc(x, y, 2.5, 0, Math.PI * 2); g.fill();
      }
    }, 2, 1);
  };

  World.pillowTexture = function () {
    return canvasTexture(64, 64, function (g, w, h) {
      g.fillStyle = '#fbf6ec';
      g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(192,57,43,0.5)';
      g.lineWidth = 2;
      g.strokeRect(5, 5, w - 10, h - 10);
      g.fillStyle = 'rgba(43,95,168,0.35)';
      for (var x = 12; x < w - 8; x += 12) { g.beginPath(); g.arc(x, h - 12, 3, 0, Math.PI * 2); g.fill(); }
    });
  };

  /* Деревянное колесо со спицами — рисуем на торцах цилиндра. */
  World.wheelTexture = function () {
    return canvasTexture(128, 128, function (g, w, h) {
      var c = w / 2;
      g.fillStyle = '#6f5636';
      g.beginPath(); g.arc(c, c, c - 2, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#8a6a44';
      g.beginPath(); g.arc(c, c, c - 12, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#4a3826';
      g.beginPath(); g.arc(c, c, c - 20, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#8a6a44';
      g.lineWidth = 7;
      for (var i = 0; i < 6; i++) {
        var a = i / 6 * Math.PI * 2;
        g.beginPath();
        g.moveTo(c, c);
        g.lineTo(c + Math.cos(a) * (c - 14), c + Math.sin(a) * (c - 14));
        g.stroke();
      }
      g.fillStyle = '#5c4830';
      g.beginPath(); g.arc(c, c, 13, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#2f251a';
      g.beginPath(); g.arc(c, c, 5, 0, Math.PI * 2); g.fill();
    });
  };

  function stoveTextures() {
    if (TEX.ready) return TEX;
    TEX.whitewash = World.whitewashTexture();
    TEX.front = World.stoveFrontTexture();
    TEX.side = World.stoveSideTexture();
    TEX.ornament = World.ornamentTexture();
    TEX.brick = World.brickTexture('#a8563c');
    TEX.fabric = World.fabricTexture();
    TEX.quilt = World.quiltTexture();
    TEX.pillow = World.pillowTexture();
    TEX.wheel = World.wheelTexture();
    TEX.ready = true;
    return TEX;
  }

  /* ---------- Пассажиры на лежанке ---------- */

  /* Емеля: рубаха, порты, лапти, лежит подперев голову рукой. */
  function buildEmelya() {
    var g = new THREE.Group();
    var skinMat = new THREE.MeshLambertMaterial({ color: 0xf0c9a0 });

    // рубаха с рукавами
    var shirt = [];
    var torso = new THREE.BoxGeometry(0.64, 0.4, 1.2);
    torso.translate(0, 0.2, 0.05);
    shirt.push(torso);
    for (var sx = -1; sx <= 1; sx += 2) {
      var sleeve = new THREE.CylinderGeometry(0.11, 0.11, 0.5, 6);
      var m = new THREE.Matrix4().makeRotationX(Math.PI / 2);
      m.setPosition(sx * 0.34, 0.2, -0.1);
      sleeve.applyMatrix4(m);
      shirt.push(sleeve);
    }
    g.add(new THREE.Mesh(World.mergeGeometries(shirt),
      new THREE.MeshLambertMaterial({ color: 0xc0392b })));

    // порты
    var pants = [];
    for (var px = -1; px <= 1; px += 2) {
      var leg = new THREE.CylinderGeometry(0.13, 0.12, 0.8, 6);
      var ml = new THREE.Matrix4().makeRotationX(Math.PI / 2);
      ml.setPosition(px * 0.17, 0.16, 1.02);
      leg.applyMatrix4(ml);
      pants.push(leg);
    }
    g.add(new THREE.Mesh(World.mergeGeometries(pants),
      new THREE.MeshLambertMaterial({ color: 0x44546e })));

    // лапти
    var bast = [];
    for (var bx = -1; bx <= 1; bx += 2) {
      var shoe = new THREE.BoxGeometry(0.22, 0.16, 0.26);
      shoe.translate(bx * 0.17, 0.14, 1.5);
      bast.push(shoe);
    }
    g.add(new THREE.Mesh(World.mergeGeometries(bast),
      new THREE.MeshLambertMaterial({ color: 0xc8a05a })));

    // голова и рука, которой подпирает щёку
    var skin = [];
    var head = new THREE.SphereGeometry(0.21, 12, 10);
    head.translate(0, 0.5, -0.75);
    skin.push(head);
    var arm = new THREE.CylinderGeometry(0.09, 0.09, 0.55, 6);
    var ma = new THREE.Matrix4().makeRotationZ(0.5);
    ma.setPosition(0.3, 0.35, -0.62);
    arm.applyMatrix4(ma);
    skin.push(arm);
    g.add(new THREE.Mesh(World.mergeGeometries(skin), skinMat));

    // волосы и борода
    var hair = [];
    var cap = new THREE.SphereGeometry(0.23, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.58);
    cap.translate(0, 0.52, -0.76);
    hair.push(cap);
    var beard = new THREE.SphereGeometry(0.15, 10, 8);
    var mb = new THREE.Matrix4().makeScale(1, 0.85, 0.7);
    mb.setPosition(0, 0.38, -0.58);
    beard.applyMatrix4(mb);
    hair.push(beard);
    g.add(new THREE.Mesh(World.mergeGeometries(hair),
      new THREE.MeshLambertMaterial({ color: 0x9a6b3f })));

    return g;
  }

  /* Блондинка загорает на лежанке: купальник, очки, соломенная шляпа рядом. */
  function buildSunbather() {
    var g = new THREE.Group();
    var skinMat = new THREE.MeshLambertMaterial({ color: 0xe8b184 });

    var skin = [];
    var torso = new THREE.BoxGeometry(0.5, 0.32, 1.1);
    torso.translate(0, 0.17, 0.0);
    skin.push(torso);
    for (var lx = -1; lx <= 1; lx += 2) {
      var leg = new THREE.CylinderGeometry(0.11, 0.09, 0.95, 6);
      var ml = new THREE.Matrix4().makeRotationX(Math.PI / 2);
      ml.setPosition(lx * 0.13, 0.14, 1.02);
      leg.applyMatrix4(ml);
      skin.push(leg);

      var arm = new THREE.CylinderGeometry(0.075, 0.075, 0.62, 6);
      var ma = new THREE.Matrix4().makeRotationX(Math.PI / 2);
      ma.setPosition(lx * 0.3, 0.16, -0.05);
      arm.applyMatrix4(ma);
      skin.push(arm);
    }
    var head = new THREE.SphereGeometry(0.19, 12, 10);
    head.translate(0, 0.28, -0.68);
    skin.push(head);
    g.add(new THREE.Mesh(World.mergeGeometries(skin), skinMat));

    // купальник
    var swim = [];
    var top = new THREE.BoxGeometry(0.52, 0.14, 0.24);
    top.translate(0, 0.26, -0.28);
    swim.push(top);
    var bottom = new THREE.BoxGeometry(0.5, 0.14, 0.28);
    bottom.translate(0, 0.25, 0.36);
    swim.push(bottom);
    g.add(new THREE.Mesh(World.mergeGeometries(swim),
      new THREE.MeshLambertMaterial({ color: 0xff4f8b })));

    // волосы
    var hair = [];
    var cap = new THREE.SphereGeometry(0.21, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.62);
    cap.translate(0, 0.3, -0.7);
    hair.push(cap);
    var strand = new THREE.BoxGeometry(0.34, 0.12, 0.4);
    strand.translate(0, 0.2, -0.92);
    hair.push(strand);
    g.add(new THREE.Mesh(World.mergeGeometries(hair),
      new THREE.MeshLambertMaterial({ color: 0xf3d67a })));

    // тёмные очки
    var glasses = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.08, 0.07),
      new THREE.MeshLambertMaterial({ color: 0x23262b }));
    glasses.position.set(0, 0.35, -0.84);
    g.add(glasses);

    // соломенная шляпа лежит рядом
    var hat = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.06, 12),
      new THREE.MeshLambertMaterial({ color: 0xe6c88a }));
    hat.position.set(0.42, 0.06, 0.9);
    hat.rotation.z = 0.25;
    g.add(hat);

    return g;
  }

  World.buildRider = function (kind) {
    if (kind === 'emelya') return buildEmelya();
    if (kind === 'blonde') return buildSunbather();
    return null;
  };

  /* ---------- Русская печь на колёсах ---------- */

  World.buildStove = function (color, label, rider) {
    var g = new THREE.Group();
    var t = stoveTextures();

    // Белёный корпус: подпечье, основное тело и карниз — одной сеткой
    var mass = [];
    var podpech = new THREE.BoxGeometry(2.74, 0.85, 3.74);
    podpech.translate(0, 0.43, 0);
    mass.push(podpech);
    var corpus = new THREE.BoxGeometry(2.56, 1.5, 3.56);
    corpus.translate(0, 1.6, 0);
    mass.push(corpus);
    var karniz = new THREE.BoxGeometry(2.8, 0.2, 3.8);
    karniz.translate(0, 2.45, 0);
    mass.push(karniz);
    var body = new THREE.Mesh(World.mergeGeometries(mass),
      new THREE.MeshLambertMaterial({ map: t.whitewash }));
    g.add(body);

    // Устье: передняя стенка с аркой
    var front = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.45),
      new THREE.MeshLambertMaterial({ map: t.front }));
    front.position.set(0, 1.58, 1.79);
    g.add(front);

    // печурки по бокам — обе стенки одной сеткой
    var sides = [];
    for (var sx = -1; sx <= 1; sx += 2) {
      var side = new THREE.PlaneGeometry(3.4, 1.45);
      var ms = new THREE.Matrix4().makeRotationY(sx * Math.PI / 2);
      ms.setPosition(sx * 1.29, 1.58, 0);
      side.applyMatrix4(ms);
      sides.push(side);
    }
    g.add(new THREE.Mesh(World.mergeGeometries(sides),
      new THREE.MeshLambertMaterial({ map: t.side })));

    // задняя стенка: печурки и тёплый отсвет из поддувала
    var back = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.45),
      new THREE.MeshLambertMaterial({ map: t.side }));
    back.position.set(0, 1.58, -1.79);
    back.rotation.y = Math.PI;
    g.add(back);

    var vent = new THREE.Sprite(new THREE.SpriteMaterial({
      map: World.glowTexture(255, 140, 50), transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    vent.scale.set(1.7, 1.1, 1);
    vent.position.set(0, 0.5, -1.9);
    g.add(vent);

    // поясок с росписью под карнизом
    var band = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.3, 3.6),
      new THREE.MeshLambertMaterial({ map: t.ornament }));
    band.position.y = 2.24;
    g.add(band);

    // Лежанка и труба — общий кирпич, значит одна сетка
    var brickParts = [];
    var lezhanka = new THREE.BoxGeometry(2.5, 0.26, 3.5);
    lezhanka.translate(0, 2.68, 0);
    brickParts.push(lezhanka);
    var stack = new THREE.BoxGeometry(1.05, 1.75, 1.05);
    stack.translate(-0.6, 3.7, -1.05);
    brickParts.push(stack);
    var cap = new THREE.BoxGeometry(1.3, 0.22, 1.3);
    cap.translate(-0.6, 4.68, -1.05);
    brickParts.push(cap);
    g.add(new THREE.Mesh(World.mergeGeometries(brickParts),
      new THREE.MeshLambertMaterial({ map: t.brick })));

    // Перина в цвет игрока — по ней печку и узнают
    var perina = new THREE.Mesh(new THREE.BoxGeometry(2.16, 0.34, 2.05),
      new THREE.MeshLambertMaterial({ map: t.fabric, color: color }));
    perina.position.set(0, 2.97, 0.45);
    g.add(perina);

    // одеяло в горошек и подушка
    var odeyalo = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.18, 0.52),
      new THREE.MeshLambertMaterial({ map: t.quilt, color: color }));
    odeyalo.position.set(0, 3.2, 1.38);
    g.add(odeyalo);

    var podushka = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.34, 0.6),
      new THREE.MeshLambertMaterial({ map: t.pillow }));
    podushka.position.set(0.62, 3.28, -0.85);
    g.add(podushka);

    // Дымник, заслонка и чугунок — тоже одной сеткой
    var iron = [];
    var dymnik = new THREE.BoxGeometry(0.95, 0.28, 0.95);
    dymnik.translate(-0.6, 4.93, -1.05);
    iron.push(dymnik);
    var zaslonka = new THREE.BoxGeometry(1.0, 1.0, 0.07);
    var mz = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0.18, -0.32, 0.1));
    mz.setPosition(1.05, 0.62, 1.72);
    zaslonka.applyMatrix4(mz);
    iron.push(zaslonka);
    var pot = new THREE.CylinderGeometry(0.3, 0.22, 0.38, 10);
    pot.translate(0.95, 3.0, -1.32);
    iron.push(pot);
    g.add(new THREE.Mesh(World.mergeGeometries(iron),
      new THREE.MeshLambertMaterial({ color: 0x35302a })));

    // Огонь в устье
    var fire = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.72),
      new THREE.MeshBasicMaterial({ color: 0xff8a24 }));
    fire.position.set(0, 1.34, 1.83);
    g.add(fire);
    var fireGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: World.glowTexture(255, 150, 40), transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    fireGlow.scale.set(3, 2.4, 1);
    fireGlow.position.set(0, 1.34, 1.95);
    g.add(fireGlow);

    // Кочерга прислонена к боку
    var kocherga = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.9, 6),
      new THREE.MeshLambertMaterial({ color: 0x6f5636 }));
    kocherga.position.set(-1.2, 1.0, 1.5);
    kocherga.rotation.set(0.25, 0, 0.42);
    g.add(kocherga);

    // Деревянные колёса со спицами
    var wheelSide = new THREE.MeshLambertMaterial({ color: 0x6f5636 });
    var wheelFace = new THREE.MeshLambertMaterial({ map: t.wheel });
    var wheels = [];
    for (var wx = -1; wx <= 1; wx += 2) {
      for (var wz = -1; wz <= 1; wz += 2) {
        var pivot = new THREE.Group();
        pivot.position.set(wx * 1.3, 0.7, wz * 1.3);
        var wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.34, 14),
          [wheelSide, wheelFace, wheelFace]);
        wheel.rotation.z = Math.PI / 2;
        pivot.add(wheel);
        g.add(pivot);
        wheels.push(pivot);
      }
    }

    // тень-пятно
    var shadow = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 5.8),
      new THREE.MeshBasicMaterial({ map: World.shadowTexture(), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.05;
    g.add(shadow);

    // пассажир на лежанке: Емеля или блондинка на солнце
    var riderGroup = World.buildRider(rider);
    if (riderGroup) {
      // полулёжа, головой к подушке — так пассажира видно с догоняющей камеры
      riderGroup.position.set(0.34, 3.3, 0.12);
      riderGroup.rotation.x = 0.45;
      riderGroup.scale.setScalar(0.92);
      g.add(riderGroup);
    }

    // подпись (только для живых игроков — чтобы не загораживать обзор)
    var lbl = null;
    if (label) {
      lbl = World.labelSprite(label, '#' + new THREE.Color(color).getHexString());
      lbl.position.set(0, 6.2, 0);
      g.add(lbl);
    }

    g.userData = {
      wheels: wheels, fire: fire, fireGlow: fireGlow, label: lbl,
      body: body, stripe: perina, quilt: odeyalo, vent: vent, rider: riderGroup,
      blob: shadow
    };
    return g;
  };

  /* ---------- Полицейская машина ---------- */

  World.policeTexture = function (text, arabic) {
    return canvasTexture(256, 64, function (g, w, h) {
      g.fillStyle = '#f2f4f7';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#1b4f9c';
      g.fillRect(0, h * 0.54, w, h * 0.2);
      g.fillStyle = '#1b4f9c';
      g.font = 'bold ' + (arabic ? 26 : 22) + 'px system-ui, sans-serif';
      g.textAlign = 'center';
      g.fillText(text, w / 2, h * 0.4);
      g.fillStyle = '#c8ced8';
      g.fillRect(0, h - 3, w, 3);
    });
  };

  World.buildPoliceCar = function () {
    var g = new THREE.Group();

    // Корпус: борта разные — слева по-русски, справа по-арабски.
    // Порядок групп у BoxGeometry: +X, −X, +Y, −Y, +Z, −Z.
    var ru = new THREE.MeshLambertMaterial({ map: World.policeTexture('ПОЛИЦИЯ', false) });
    var ar = new THREE.MeshLambertMaterial({ map: World.policeTexture('شرطة', true) });
    var plain = new THREE.MeshLambertMaterial({ color: 0xf2f4f7 });
    var body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.75, 4.6),
      [ru, ar, plain, plain, plain, plain]);
    body.position.y = 0.72;
    g.add(body);

    var bumpers = [];
    for (var b = -1; b <= 1; b += 2) {
      var bumper = new THREE.BoxGeometry(2.16, 0.3, 0.24);
      bumper.translate(0, 0.5, b * 2.32);
      bumpers.push(bumper);
    }
    g.add(new THREE.Mesh(World.mergeGeometries(bumpers), plain));

    // кабина
    var cabin = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.62, 2.2),
      new THREE.MeshLambertMaterial({ color: 0x28313d }));
    cabin.position.set(0, 1.4, -0.15);
    g.add(cabin);

    // мигалки
    var bar = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.1, 0.34),
      new THREE.MeshLambertMaterial({ color: 0x1b2028 }));
    bar.position.set(0, 1.76, -0.15);
    g.add(bar);

    var lamps = {}, glows = {};
    var defs = [['red', 0xff2b2b, -0.34, 255, 60, 60], ['blue', 0x2b6bff, 0.34, 80, 130, 255]];
    for (var i = 0; i < defs.length; i++) {
      var d = defs[i];
      var lamp = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.2, 0.3),
        new THREE.MeshBasicMaterial({ color: d[1] }));
      lamp.position.set(d[2], 1.88, -0.15);
      lamp.userData.baseColor = new THREE.Color(d[1]);
      g.add(lamp);
      lamps[d[0]] = lamp;

      var glow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: World.glowTexture(d[3], d[4], d[5]), transparent: true,
        blending: THREE.AdditiveBlending, depthWrite: false
      }));
      glow.scale.set(3.4, 3.4, 1);
      glow.position.copy(lamp.position);
      g.add(glow);
      glows[d[0]] = glow;
    }

    // колёса
    var wheels = [];
    for (var wx = -1; wx <= 1; wx += 2) {
      for (var wz = -1; wz <= 1; wz += 2) {
        var wheel = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 10);
        var m = new THREE.Matrix4().makeRotationZ(Math.PI / 2);
        m.setPosition(wx * 1.0, 0.38, wz * 1.5);
        wheel.applyMatrix4(m);
        wheels.push(wheel);
      }
    }
    g.add(new THREE.Mesh(World.mergeGeometries(wheels),
      new THREE.MeshLambertMaterial({ color: 0x1a1a1e })));

    var shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 5.6),
      new THREE.MeshBasicMaterial({ map: World.shadowTexture(), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.05;
    g.add(shadow);

    g.visible = false;
    g.userData = { lamps: lamps, glows: glows, blob: shadow };
    return g;
  };

  /* Мигалки: попеременно красная и синяя. */
  World.flashPolice = function (mesh, t) {
    var red = (t % 0.7) < 0.35;
    var l = mesh.userData.lamps, gl = mesh.userData.glows;
    l.red.material.color.copy(l.red.userData.baseColor).multiplyScalar(red ? 1 : 0.2);
    l.blue.material.color.copy(l.blue.userData.baseColor).multiplyScalar(red ? 0.2 : 1);
    gl.red.visible = red;
    gl.blue.visible = !red;
  };

  /* ---------- Полицейский вертолёт ---------- */

  World.buildHelicopter = function () {
    var g = new THREE.Group();
    var white = new THREE.MeshLambertMaterial({ color: 0xeef1f5 });
    var blue = new THREE.MeshLambertMaterial({ color: 0x1b4f9c });
    var dark = new THREE.MeshLambertMaterial({ color: 0x2a3240 });

    var hull = [];
    var cab = new THREE.SphereGeometry(1.5, 14, 12);
    var mc = new THREE.Matrix4().makeScale(1, 0.92, 1.5);
    cab.applyMatrix4(mc);
    hull.push(cab);
    var boom = new THREE.CylinderGeometry(0.3, 0.18, 4.4, 8);
    var mb = new THREE.Matrix4().makeRotationX(Math.PI / 2);
    mb.setPosition(0, 0.25, -3.2);
    boom.applyMatrix4(mb);
    hull.push(boom);
    var fin = new THREE.BoxGeometry(0.12, 1.1, 0.8);
    fin.translate(0, 0.8, -5.1);
    hull.push(fin);
    g.add(new THREE.Mesh(World.mergeGeometries(hull), white));

    var stripe = new THREE.Mesh(new THREE.BoxGeometry(3.05, 0.34, 2.2), blue);
    stripe.position.set(0, -0.1, 0.2);
    g.add(stripe);

    var glass = new THREE.Mesh(new THREE.SphereGeometry(1.05, 12, 10), dark);
    glass.scale.set(0.95, 0.8, 1);
    glass.position.set(0, 0.15, 1.15);
    g.add(glass);

    var skids = [];
    for (var sx = -1; sx <= 1; sx += 2) {
      var skid = new THREE.CylinderGeometry(0.08, 0.08, 3.4, 6);
      var ms = new THREE.Matrix4().makeRotationX(Math.PI / 2);
      ms.setPosition(sx * 0.9, -1.5, 0.2);
      skid.applyMatrix4(ms);
      skids.push(skid);
      for (var k = -1; k <= 1; k += 2) {
        var leg = new THREE.CylinderGeometry(0.07, 0.07, 0.8, 6);
        leg.translate(sx * 0.9, -1.1, k * 0.9);
        skids.push(leg);
      }
    }
    g.add(new THREE.Mesh(World.mergeGeometries(skids), dark));

    // винты
    var rotor = new THREE.Group();
    var blades = [];
    for (var i = 0; i < 2; i++) {
      var blade = new THREE.BoxGeometry(11, 0.08, 0.5);
      var mr = new THREE.Matrix4().makeRotationY(i * Math.PI / 2);
      blade.applyMatrix4(mr);
      blades.push(blade);
    }
    rotor.add(new THREE.Mesh(World.mergeGeometries(blades), dark));
    rotor.position.y = 1.5;
    g.add(rotor);

    var tailRotor = new THREE.Group();
    var tb = [];
    for (var j = 0; j < 2; j++) {
      var tblade = new THREE.BoxGeometry(0.1, 1.8, 0.24);
      var mt = new THREE.Matrix4().makeRotationZ(j * Math.PI / 2);
      tblade.applyMatrix4(mt);
      tb.push(tblade);
    }
    tailRotor.add(new THREE.Mesh(World.mergeGeometries(tb), dark));
    tailRotor.position.set(0.2, 0.8, -5.1);
    g.add(tailRotor);

    // прожектор
    var beam = new THREE.Sprite(new THREE.SpriteMaterial({
      map: World.glowTexture(255, 245, 200), transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    beam.scale.set(9, 9, 1);
    beam.position.set(0, -1.6, 0.6);
    g.add(beam);

    g.visible = false;
    g.userData = { rotor: rotor, tailRotor: tailRotor, beam: beam };
    return g;
  };

  /* ---------- Верблюд ---------- */

  World.buildCamel = function () {
    var g = new THREE.Group();
    var hide = new THREE.MeshLambertMaterial({ color: 0xc79a5b });
    var dark = new THREE.MeshLambertMaterial({ color: 0x8a6a3f });

    var parts = [];
    var body = new THREE.SphereGeometry(0.95, 14, 12);
    var mb = new THREE.Matrix4().makeScale(0.85, 0.85, 1.5);
    mb.setPosition(0, 1.65, 0);
    body.applyMatrix4(mb);
    parts.push(body);

    for (var hmp = -1; hmp <= 1; hmp += 2) {
      var hump = new THREE.SphereGeometry(0.5, 12, 10);
      var mh = new THREE.Matrix4().makeScale(0.85, 0.9, 1);
      mh.setPosition(0, 2.35, hmp * 0.42);
      hump.applyMatrix4(mh);
      parts.push(hump);
    }

    var neck = new THREE.CylinderGeometry(0.22, 0.33, 1.5, 10);
    var mn = new THREE.Matrix4().makeRotationX(-0.45);
    mn.setPosition(0, 2.3, 1.1);
    neck.applyMatrix4(mn);
    parts.push(neck);

    var head = new THREE.SphereGeometry(0.3, 12, 10);
    var mhd = new THREE.Matrix4().makeScale(0.8, 0.85, 1.25);
    mhd.setPosition(0, 2.95, 1.7);
    head.applyMatrix4(mhd);
    parts.push(head);

    var muzzle = new THREE.SphereGeometry(0.18, 10, 8);
    muzzle.translate(0, 2.82, 2.05);
    parts.push(muzzle);
    g.add(new THREE.Mesh(World.mergeGeometries(parts), hide));

    var legs = [];
    var legPivots = [];
    for (var lx = -1; lx <= 1; lx += 2) {
      for (var lz = -1; lz <= 1; lz += 2) {
        var pivot = new THREE.Group();
        pivot.position.set(lx * 0.5, 1.5, lz * 0.85);
        var leg = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 1.5, 8), hide);
        leg.position.y = -0.75;
        pivot.add(leg);
        var hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.2, 8), dark);
        hoof.position.y = -1.55;
        pivot.add(hoof);
        g.add(pivot);
        legPivots.push(pivot);
      }
    }

    var tail = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.03, 0.9, 6), dark);
    tail.position.set(0, 2.0, -1.4);
    tail.rotation.x = 0.5;
    g.add(tail);

    // попона
    var rug = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 1.2),
      new THREE.MeshLambertMaterial({ color: 0xc0392b }));
    rug.position.set(0, 2.2, -0.1);
    g.add(rug);

    var shadow = new THREE.Mesh(new THREE.PlaneGeometry(4, 4.6),
      new THREE.MeshBasicMaterial({ map: World.shadowTexture(), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.05;
    g.add(shadow);

    g.visible = false;
    g.userData = { legs: legPivots, blob: shadow };
    return g;
  };

  /* ---------- Гигантский таракан ---------- */

  World.buildRoach = function () {
    var g = new THREE.Group();
    var shell = new THREE.MeshLambertMaterial({ color: 0x5a3220 });
    var dark = new THREE.MeshLambertMaterial({ color: 0x2f1c12 });

    var parts = [];
    var abdomen = new THREE.SphereGeometry(1.1, 14, 12);
    var ma = new THREE.Matrix4().makeScale(0.85, 0.42, 1.5);
    ma.setPosition(0, 0.75, -0.4);
    abdomen.applyMatrix4(ma);
    parts.push(abdomen);
    var thorax = new THREE.SphereGeometry(0.75, 12, 10);
    var mt = new THREE.Matrix4().makeScale(0.95, 0.5, 0.9);
    mt.setPosition(0, 0.85, 1.05);
    thorax.applyMatrix4(mt);
    parts.push(thorax);
    var head = new THREE.SphereGeometry(0.4, 10, 8);
    var mh = new THREE.Matrix4().makeScale(0.9, 0.6, 0.8);
    mh.setPosition(0, 0.8, 1.75);
    head.applyMatrix4(mh);
    parts.push(head);
    g.add(new THREE.Mesh(World.mergeGeometries(parts), shell));

    // надкрылья
    for (var wx = -1; wx <= 1; wx += 2) {
      var wing = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 8), dark);
      wing.scale.set(0.45, 0.16, 1.35);
      wing.position.set(wx * 0.35, 1.05, -0.35);
      wing.rotation.z = wx * 0.18;
      g.add(wing);
    }

    // усы
    var antennae = [];
    for (var ax = -1; ax <= 1; ax += 2) {
      var ant = new THREE.CylinderGeometry(0.04, 0.02, 2.2, 5);
      var man = new THREE.Matrix4().makeRotationX(1.15);
      var rot = new THREE.Matrix4().makeRotationZ(ax * 0.35);
      man.premultiply(rot);
      man.setPosition(ax * 0.2, 1.25, 2.5);
      ant.applyMatrix4(man);
      antennae.push(ant);
    }
    g.add(new THREE.Mesh(World.mergeGeometries(antennae), dark));

    // лапы: три пары, каждая качается при беге
    var legPivots = [];
    for (var i = 0; i < 3; i++) {
      for (var lx = -1; lx <= 1; lx += 2) {
        var pivot = new THREE.Group();
        pivot.position.set(lx * 0.55, 0.72, 1.1 - i * 0.95);
        var leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 1.1, 6), dark);
        leg.position.set(lx * 0.4, -0.3, 0);
        leg.rotation.z = lx * 0.9;
        pivot.add(leg);
        g.add(pivot);
        legPivots.push(pivot);
      }
    }

    var shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 4.4),
      new THREE.MeshBasicMaterial({ map: World.shadowTexture(), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.05;
    g.add(shadow);

    g.visible = false;
    g.userData = { legs: legPivots, blob: shadow };
    return g;
  };

  /* ---------- Лужа ---------- */

  World.buildPuddle = function () {
    var tex = canvasTexture(64, 64, function (g, w, h) {
      var grd = g.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
      grd.addColorStop(0, 'rgba(70,120,150,0.75)');
      grd.addColorStop(0.65, 'rgba(90,140,170,0.55)');
      grd.addColorStop(1, 'rgba(120,160,180,0)');
      g.fillStyle = grd;
      g.beginPath(); g.ellipse(w / 2, h / 2, w / 2, h / 2.4, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.35)';
      g.lineWidth = 2;
      g.beginPath(); g.ellipse(w / 2 - 6, h / 2 - 5, 12, 5, 0.4, 0, Math.PI * 2); g.stroke();
    });
    var mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.renderOrder = 1;
    return mesh;
  };

  /* ---------- Песчаная буря ---------- */

  World.SandStorm = function (scene, count) {
    var n = count || 900;
    var geo = new THREE.BufferGeometry();
    var pos = new Float32Array(n * 3);
    this.box = { x: 220, y: 60, z: 220 };
    for (var i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * this.box.x;
      pos[i * 3 + 1] = Math.random() * this.box.y;
      pos[i * 3 + 2] = (Math.random() - 0.5) * this.box.z;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var tex = canvasTexture(32, 32, function (g, w, h) {
      var grd = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      grd.addColorStop(0, 'rgba(226,200,147,0.95)');
      grd.addColorStop(1, 'rgba(226,200,147,0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, w, h);
    });
    this.points = new THREE.Points(geo, new THREE.PointsMaterial({
      map: tex, size: 1.7, transparent: true, opacity: 0,
      depthWrite: false, sizeAttenuation: true, fog: false
    }));
    this.points.frustumCulled = false;
    this.points.visible = false;
    scene.add(this.points);
    this.wind = new THREE.Vector3(-22, 1.5, 9);
  };

  /* Частицы летят по ветру и заворачиваются в коробке вокруг камеры. */
  World.SandStorm.prototype.update = function (dt, level, camPos) {
    this.points.visible = level > 0.01;
    this.points.material.opacity = Math.min(0.85, level * 0.9);
    if (!this.points.visible) return;
    var arr = this.points.geometry.attributes.position.array;
    var bx = this.box.x, by = this.box.y, bz = this.box.z;
    for (var i = 0; i < arr.length; i += 3) {
      arr[i] += this.wind.x * dt;
      arr[i + 1] += this.wind.y * dt * (0.5 + Math.random());
      arr[i + 2] += this.wind.z * dt;
      var dx = arr[i] - camPos.x, dy = arr[i + 1] - camPos.y, dz = arr[i + 2] - camPos.z;
      if (dx < -bx / 2) arr[i] += bx; else if (dx > bx / 2) arr[i] -= bx;
      if (dy < -by / 2) arr[i] += by; else if (dy > by / 2) arr[i] -= by;
      if (dz < -bz / 2) arr[i] += bz; else if (dz > bz / 2) arr[i] -= bz;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
  };

  /* ---------- Бабушка ---------- */

  var GRANNY_KERCHIEFS = ['#d83a3a', '#f0c020', '#3f7fd8', '#e066b0', '#36b56a', '#e8e2d4'];
  var GRANNY_COATS = [0x4a5a72, 0x6b4a5a, 0x3f5a48, 0x6a5f42, 0x53476b, 0x7a5b4a];
  var GRANNY_SKIRTS = [0x3a3f4a, 0x5b3f46, 0x40402f, 0x3f4a52];

  /* Лицо: круглые щёки, добрые глаза, морщинки — рисуем текстурой,
     геометрией такое не собрать без сотни полигонов. */
  World.grannyFaceTexture = function () {
    return canvasTexture(128, 128, function (g, w, h) {
      g.fillStyle = '#f0c9a4';
      g.fillRect(0, 0, w, h);
      // лицо смотрит в −Z, это середина развёртки сферы
      var cx = w * 0.5, cy = h * 0.52;
      // румянец
      g.fillStyle = 'rgba(224,122,110,0.5)';
      g.beginPath(); g.arc(cx - 17, cy + 6, 9, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(cx + 17, cy + 6, 9, 0, Math.PI * 2); g.fill();
      // глаза
      g.fillStyle = '#3a2b22';
      g.beginPath(); g.arc(cx - 10, cy - 6, 3.2, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(cx + 10, cy - 6, 3.2, 0, Math.PI * 2); g.fill();
      // брови и морщинки
      g.strokeStyle = 'rgba(120,90,70,0.75)';
      g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(cx - 15, cy - 13); g.quadraticCurveTo(cx - 10, cy - 16, cx - 5, cy - 13); g.stroke();
      g.beginPath(); g.moveTo(cx + 5, cy - 13); g.quadraticCurveTo(cx + 10, cy - 16, cx + 15, cy - 13); g.stroke();
      g.beginPath(); g.moveTo(cx - 20, cy - 2); g.lineTo(cx - 15, cy - 1); g.stroke();
      g.beginPath(); g.moveTo(cx + 15, cy - 1); g.lineTo(cx + 20, cy - 2); g.stroke();
      // нос картошкой
      g.fillStyle = 'rgba(214,150,120,0.85)';
      g.beginPath(); g.arc(cx, cy + 2, 4.2, 0, Math.PI * 2); g.fill();
      // рот
      g.strokeStyle = '#8c4a44';
      g.lineWidth = 2;
      g.beginPath(); g.moveTo(cx - 6, cy + 15); g.quadraticCurveTo(cx, cy + 19, cx + 6, cy + 15); g.stroke();
    });
  };

  /* Платок в горошек, завязанный под подбородком. */
  function kerchiefTexture(color) {
    return canvasTexture(64, 64, function (g, w, h) {
      g.fillStyle = color;
      g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,255,255,0.75)';
      for (var y = 6; y < h; y += 14) {
        for (var x = (y % 28 === 6 ? 6 : 13); x < w; x += 14) {
          g.beginPath(); g.arc(x, y, 2.4, 0, Math.PI * 2); g.fill();
        }
      }
      g.strokeStyle = 'rgba(0,0,0,0.18)';
      g.lineWidth = 2;
      g.strokeRect(1, 1, w - 2, h - 2);
    });
  }

  var GRANNY_FACE = null;

  /* Бабушка ростом ~1.55 м: валенки, длинная юбка с фартуком, телогрейка,
     платок вокруг лица, авоська с батоном и молоком, трость. Спина сутулая. */
  World.buildGranny = function () {
    var g = new THREE.Group();
    if (!GRANNY_FACE) GRANNY_FACE = World.grannyFaceTexture();
    var coatColor = GRANNY_COATS[Math.floor(Math.random() * GRANNY_COATS.length)];
    var skirtColor = GRANNY_SKIRTS[Math.floor(Math.random() * GRANNY_SKIRTS.length)];
    var kerColor = GRANNY_KERCHIEFS[Math.floor(Math.random() * GRANNY_KERCHIEFS.length)];
    var skinMat = new THREE.MeshLambertMaterial({ color: 0xefc7a2 });

    // валенки
    var boots = [];
    for (var bx = -1; bx <= 1; bx += 2) {
      var shaft = new THREE.CylinderGeometry(0.105, 0.12, 0.3, 8);
      shaft.translate(bx * 0.11, 0.15, 0);
      boots.push(shaft);
      var foot = new THREE.BoxGeometry(0.16, 0.1, 0.28);
      foot.translate(bx * 0.11, 0.05, 0.06);
      boots.push(foot);
    }
    g.add(new THREE.Mesh(World.mergeGeometries(boots),
      new THREE.MeshLambertMaterial({ color: 0x6b6155 })));

    // юбка до пят
    var skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.44, 0.64, 14),
      new THREE.MeshLambertMaterial({ color: skirtColor }));
    skirt.position.y = 0.6;
    g.add(skirt);

    // фартук
    var apron = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.4, 0.05),
      new THREE.MeshLambertMaterial({ color: 0xd8cdb6 }));
    apron.position.set(0, 0.6, 0.33);
    g.add(apron);

    // сутулая верхняя половина
    var upper = new THREE.Group();
    upper.position.y = 0.9;
    upper.rotation.x = 0.17;
    g.add(upper);

    // телогрейка
    var coat = [];
    var chest = new THREE.CylinderGeometry(0.24, 0.28, 0.44, 14);
    chest.translate(0, 0.22, 0);
    coat.push(chest);
    var shoulders = new THREE.SphereGeometry(0.235, 12, 8);
    var msh = new THREE.Matrix4().makeScale(1.05, 0.62, 0.92);
    msh.setPosition(0, 0.43, 0);
    shoulders.applyMatrix4(msh);
    coat.push(shoulders);
    upper.add(new THREE.Mesh(World.mergeGeometries(coat),
      new THREE.MeshLambertMaterial({ color: coatColor })));

    // голова: лицо развёрнуто вперёд (в −Z)
    var head = new THREE.Mesh(new THREE.SphereGeometry(0.145, 16, 12),
      new THREE.MeshLambertMaterial({ map: GRANNY_FACE }));
    head.position.y = 0.6;
    head.rotation.y = -Math.PI / 2;      // разворачиваем лицо вперёд (+Z у модели)
    upper.add(head);

    // платок обнимает голову сзади и с боков, лицо остаётся открытым
    var kerTex = kerchiefTexture(kerColor);
    var scarf = [];
    // купол закрывает только макушку выше бровей, лицо остаётся открытым
    var dome = new THREE.SphereGeometry(0.163, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.46);
    dome.translate(0, 0.6, 0);
    scarf.push(dome);
    // затылок и «уши» платка
    var backFold = new THREE.SphereGeometry(0.135, 12, 10);
    var mbf = new THREE.Matrix4().makeScale(1.05, 0.95, 0.75);
    mbf.setPosition(0, 0.57, -0.075);
    backFold.applyMatrix4(mbf);
    scarf.push(backFold);
    for (var kx = -1; kx <= 1; kx += 2) {
      var side = new THREE.SphereGeometry(0.075, 8, 8);
      var msd = new THREE.Matrix4().makeScale(0.7, 1.25, 1);
      msd.setPosition(kx * 0.125, 0.56, -0.02);
      side.applyMatrix4(msd);
      scarf.push(side);
    }
    // узелок и кончики платка под подбородком
    var knot = new THREE.SphereGeometry(0.055, 8, 6);
    knot.translate(0, 0.47, 0.1);
    scarf.push(knot);
    var tail = new THREE.BoxGeometry(0.12, 0.15, 0.05);
    tail.translate(0, 0.4, 0.11);
    scarf.push(tail);
    upper.add(new THREE.Mesh(World.mergeGeometries(scarf),
      new THREE.MeshLambertMaterial({ map: kerTex, side: THREE.DoubleSide })));

    // седая прядь у лица
    var hair = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.1),
      new THREE.MeshLambertMaterial({ color: 0xe8e6e0 }));
    hair.position.set(0, 0.675, 0.085);
    upper.add(hair);

    // руки: рукав телогрейки и кисть
    function arm(side) {
      var group = new THREE.Group();
      var sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.36, 8),
        new THREE.MeshLambertMaterial({ color: coatColor }));
      sleeve.position.y = -0.18;
      group.add(sleeve);
      var hand = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 6), skinMat);
      hand.position.y = -0.38;
      group.add(hand);
      group.position.set(side * 0.26, 0.38, 0.01);
      upper.add(group);
      return group;
    }
    var armL = arm(-1);
    var armR = arm(1);

    // авоська с батоном и молоком
    var bag = new THREE.Group();
    bag.add(new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, 0.17),
      new THREE.MeshLambertMaterial({ color: 0xb9843f })));
    var loaf = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.26, 8),
      new THREE.MeshLambertMaterial({ color: 0xd8a860 }));
    loaf.position.set(0.05, 0.17, 0);
    loaf.rotation.z = 0.35;
    bag.add(loaf);
    var milk = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 8),
      new THREE.MeshLambertMaterial({ color: 0xf2f2ee }));
    milk.position.set(-0.06, 0.15, 0.02);
    bag.add(milk);
    bag.position.set(0, -0.52, 0.01);
    armL.add(bag);

    // трость
    var caneParts = [];
    var stick = new THREE.CylinderGeometry(0.03, 0.038, 0.9, 6);
    stick.translate(0, -0.85, 0.01);
    caneParts.push(stick);
    var handle = new THREE.CylinderGeometry(0.032, 0.032, 0.2, 6);
    var mh = new THREE.Matrix4().makeRotationZ(Math.PI / 2.4);
    mh.setPosition(0.075, -0.4, 0.01);
    handle.applyMatrix4(mh);
    caneParts.push(handle);
    var cane = new THREE.Mesh(World.mergeGeometries(caneParts),
      new THREE.MeshLambertMaterial({ color: 0x7a5a34 }));
    armR.add(cane);

    var shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4),
      new THREE.MeshBasicMaterial({ map: World.shadowTexture(), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.04;
    g.add(shadow);

    g.visible = false;
    g.userData = { armL: armL, armR: armR, bag: bag, cane: cane, blob: shadow, upper: upper };
    return g;
  };

  /* Пул частиц дыма для всех печек. */
  World.SmokeSystem = function (scene, max) {
    this.parts = [];
    this.max = max || 260;
    this.idx = 0;
    var tex = World.smokeTexture();
    for (var i = 0; i < this.max; i++) {
      var s = new THREE.Sprite(new THREE.SpriteMaterial({
        map: tex, transparent: true, opacity: 0, depthWrite: false
      }));
      s.visible = false;
      scene.add(s);
      this.parts.push({ spr: s, life: 0, ttl: 1, vel: new THREE.Vector3(), size: 1 });
    }
  };

  World.SmokeSystem.prototype.emit = function (pos, vel, size, colorHex) {
    var p = this.parts[this.idx];
    this.idx = (this.idx + 1) % this.max;
    p.spr.position.copy(pos);
    p.vel.copy(vel);
    p.life = 0;
    p.ttl = 1.4 + Math.random() * 1.3;
    p.size = size;
    p.spr.visible = true;
    p.spr.material.color.setHex(colorHex === undefined ? 0xdedede : colorHex);
  };

  World.SmokeSystem.prototype.update = function (dt) {
    for (var i = 0; i < this.parts.length; i++) {
      var p = this.parts[i];
      if (!p.spr.visible) continue;
      p.life += dt;
      if (p.life >= p.ttl) { p.spr.visible = false; continue; }
      var k = p.life / p.ttl;
      p.spr.position.addScaledVector(p.vel, dt);
      p.vel.y += dt * 0.9;
      p.vel.multiplyScalar(1 - dt * 0.6);
      var sz = p.size * (1 + k * 3.2);
      p.spr.scale.set(sz, sz, 1);
      p.spr.material.opacity = 0.55 * (1 - k);
    }
  };

  global.World = World;
})(window);
