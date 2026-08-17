/* Мир: трасса-кольцо по Дубаю, песок, небоскрёбы, пальмы, светофоры и сами печки. */
(function (global) {
  'use strict';

  var World = {};

  /* ---------- Текстуры (рисуем на canvas, чтобы не тянуть картинки) ---------- */

  function canvasTexture(w, h, draw, repeatX, repeatY) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeatX || 1, repeatY || 1);
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
    track.pointAt = function (dist) {
      return this.curve.getPointAt(this.norm(dist) / this.length);
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
      pos.push(l.x, y, l.z, r.x, y, r.z);
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
      group.rotation.y = angle;
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
      if (near < track.width / 2 + 16) continue;

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

    // Бурдж-Халифа: сужающиеся секции + шпиль
    var burjGeos = [], spireGeos = [];
    var bx = center.x + 20, bz = center.z + 40;
    var y = 0, secW = 46;
    for (var s = 0; s < 14; s++) {
      var sh = 34 - s * 0.9;
      var sec = new THREE.CylinderGeometry(secW * 0.5, secW * 0.46, sh, 6);
      World.scaleUV(sec, Math.max(1, Math.round(secW / 7)), Math.max(1, Math.round(sh / 8)));
      var ms = new THREE.Matrix4().makeRotationY(s * 0.12);
      ms.setPosition(bx, y + sh / 2, bz);
      sec.applyMatrix4(ms);
      burjGeos.push(sec);
      y += sh;
      secW *= 0.87;
    }
    group.add(new THREE.Mesh(World.mergeGeometries(burjGeos),
      new THREE.MeshLambertMaterial({ map: World.windowsTexture() })));
    var spire = new THREE.CylinderGeometry(0.4, 2.2, 120, 8);
    spire.translate(bx, y + 60, bz);
    spireGeos.push(spire);
    group.add(new THREE.Mesh(World.mergeGeometries(spireGeos),
      new THREE.MeshLambertMaterial({ color: 0xcfd8de })));

    // Пальмы вдоль трассы: стволы и листья — по одной склеенной сетке
    var trunkGeos = [], leafGeos = [];
    for (var i = 0; i < 120; i++) {
      var d = track.length * i / 120 + 4;
      var p = track.pointAt(d);
      var n = track.sideAt(d);
      var sideSign = (i % 2 === 0) ? 1 : -1;
      var off = track.width / 2 + 8 + Math.random() * 5;
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
      body: body, stripe: perina, quilt: odeyalo, vent: vent, rider: riderGroup
    };
    return g;
  };

  /* ---------- Бабушка ---------- */

  var GRANNY_KERCHIEFS = [0xd83a3a, 0xf0c020, 0x3f7fd8, 0xe066b0, 0x36b56a];
  var GRANNY_COATS = [0x4a5a72, 0x6b4a5a, 0x3f5a48, 0x6a5f42, 0x53476b];

  World.buildGranny = function () {
    var g = new THREE.Group();
    var coatColor = GRANNY_COATS[Math.floor(Math.random() * GRANNY_COATS.length)];
    var kerchief = GRANNY_KERCHIEFS[Math.floor(Math.random() * GRANNY_KERCHIEFS.length)];

    // пальто и юбка — одной сеткой
    var body = [];
    var skirt = new THREE.CylinderGeometry(0.34, 0.56, 0.85, 10);
    skirt.translate(0, 0.42, 0);
    body.push(skirt);
    var coat = new THREE.CylinderGeometry(0.3, 0.36, 0.62, 10);
    coat.translate(0, 1.13, 0);
    body.push(coat);
    g.add(new THREE.Mesh(World.mergeGeometries(body),
      new THREE.MeshLambertMaterial({ color: coatColor })));

    var head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10),
      new THREE.MeshLambertMaterial({ color: 0xe8c39a }));
    head.position.y = 1.6;
    g.add(head);

    // платок с узелком — одной сеткой
    var scarfParts = [];
    var scarf = new THREE.SphereGeometry(0.235, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.62);
    scarf.translate(0, 1.62, 0);
    scarfParts.push(scarf);
    var knot = new THREE.SphereGeometry(0.1, 8, 6);
    knot.translate(0, 1.45, -0.16);
    scarfParts.push(knot);
    g.add(new THREE.Mesh(World.mergeGeometries(scarfParts),
      new THREE.MeshLambertMaterial({ color: kerchief })));

    // руки: одна с авоськой, вторая может грозить кулаком
    var skinMat = new THREE.MeshLambertMaterial({ color: 0xe8c39a });
    var armL = new THREE.Group();
    var armLMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.55, 6), skinMat);
    armLMesh.position.y = -0.27;
    armL.add(armLMesh);
    armL.position.set(-0.32, 1.36, 0);
    g.add(armL);

    var armR = new THREE.Group();
    var armRMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.55, 6), skinMat);
    armRMesh.position.y = -0.27;
    armR.add(armRMesh);
    armR.position.set(0.32, 1.36, 0);
    g.add(armR);

    var bag = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.34, 0.18),
      new THREE.MeshLambertMaterial({ color: 0xb9843f }));
    bag.position.set(-0.34, 0.88, 0.04);
    g.add(bag);

    // трость: висит в правой руке и качается вместе с ней
    var caneParts = [];
    var stick = new THREE.CylinderGeometry(0.035, 0.048, 1.0, 6);
    stick.translate(0, -1.05, 0.02);
    caneParts.push(stick);
    var handle = new THREE.CylinderGeometry(0.036, 0.036, 0.24, 6);
    var mh = new THREE.Matrix4().makeRotationZ(Math.PI / 2.4);
    mh.setPosition(0.09, -0.53, 0.02);
    handle.applyMatrix4(mh);
    caneParts.push(handle);
    var cane = new THREE.Mesh(World.mergeGeometries(caneParts),
      new THREE.MeshLambertMaterial({ color: 0x7a5a34 }));
    armR.add(cane);

    var shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5),
      new THREE.MeshBasicMaterial({ map: World.shadowTexture(), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.04;
    g.add(shadow);

    g.visible = false;
    g.userData = { armL: armL, armR: armR, bag: bag, cane: cane };
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
