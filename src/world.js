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

  World.buildStove = function (color, label) {
    var g = new THREE.Group();
    var brick = World.brickTexture('#a8563c');
    var brickMat = new THREE.MeshLambertMaterial({ map: brick });

    var body = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.0, 3.6), brickMat);
    body.position.y = 1.35;
    g.add(body);

    // плита сверху
    var plate = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.22, 3.8),
      new THREE.MeshLambertMaterial({ color: 0x3a3d42 }));
    plate.position.y = 2.45;
    g.add(plate);

    // кольца плиты
    for (var i = 0; i < 2; i++) {
      var ring = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 14),
        new THREE.MeshLambertMaterial({ color: 0x24262a }));
      ring.position.set(-0.6 + i * 1.2, 2.58, 0.6);
      g.add(ring);
    }

    // труба
    var pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.42, 2.4, 10),
      new THREE.MeshLambertMaterial({ color: 0x5a5f66 }));
    pipe.position.set(0, 3.5, -1.15);
    g.add(pipe);
    var pipeTop = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.36, 0.35, 10),
      new THREE.MeshLambertMaterial({ color: 0x4a4e54 }));
    pipeTop.position.set(0, 4.78, -1.15);
    g.add(pipeTop);

    // дверца топки + огонь
    var door = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.0, 0.14),
      new THREE.MeshLambertMaterial({ color: 0x2b2b30 }));
    door.position.set(0, 1.15, 1.83);
    g.add(door);
    var fire = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 0.7),
      new THREE.MeshBasicMaterial({ color: 0xff8a24 }));
    fire.position.set(0, 1.15, 1.92);
    g.add(fire);
    var fireGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: World.glowTexture(255, 150, 40), transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    fireGlow.scale.set(3, 2.4, 1);
    fireGlow.position.set(0, 1.15, 2.0);
    g.add(fireGlow);

    // цветная полоса игрока
    var stripe = new THREE.Mesh(new THREE.BoxGeometry(2.56, 0.36, 3.66),
      new THREE.MeshLambertMaterial({ color: color }));
    stripe.position.y = 2.12;
    g.add(stripe);

    // колёса
    var wheelMat = new THREE.MeshLambertMaterial({ color: 0x1c1c20 });
    var wheels = [];
    for (var wx = -1; wx <= 1; wx += 2) {
      for (var wz = -1; wz <= 1; wz += 2) {
        // ось вращения колеса — X печки, поэтому вращаем родительский пивот
        var pivot = new THREE.Group();
        pivot.position.set(wx * 1.25, 0.62, wz * 1.25);
        var wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.42, 12), wheelMat);
        wheel.rotation.z = Math.PI / 2;
        pivot.add(wheel);
        g.add(pivot);
        wheels.push(pivot);
      }
    }

    // тень-пятно
    var shadow = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 5.6),
      new THREE.MeshBasicMaterial({ map: World.shadowTexture(), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.05;
    g.add(shadow);

    // подпись (только для живых игроков — чтобы не загораживать обзор)
    var lbl = null;
    if (label) {
      lbl = World.labelSprite(label, '#' + new THREE.Color(color).getHexString());
      lbl.position.set(0, 6.2, 0);
      g.add(lbl);
    }

    g.userData = { wheels: wheels, fire: fire, fireGlow: fireGlow, label: lbl, body: body, stripe: stripe };
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

    // платок
    var scarf = new THREE.Mesh(new THREE.SphereGeometry(0.235, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.62),
      new THREE.MeshLambertMaterial({ color: kerchief }));
    scarf.position.y = 1.62;
    g.add(scarf);
    var knot = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6),
      new THREE.MeshLambertMaterial({ color: kerchief }));
    knot.position.set(0, 1.45, -0.16);
    g.add(knot);

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

    var shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5),
      new THREE.MeshBasicMaterial({ map: World.shadowTexture(), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.04;
    g.add(shadow);

    g.visible = false;
    g.userData = { armL: armL, armR: armR, bag: bag };
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
