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
      g.fillStyle = '#d9bd88';
      g.fillRect(0, 0, w, h);
      for (var i = 0; i < 8000; i++) {
        g.fillStyle = Math.random() > 0.5 ? 'rgba(255,238,198,0.3)' : 'rgba(158,128,84,0.3)';
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

  World.snowTexture = function () {
    return canvasTexture(256, 256, function (g, w, h) {
      g.fillStyle = '#eef2f7';
      g.fillRect(0, 0, w, h);
      for (var i = 0; i < 6000; i++) {
        g.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.7)' : 'rgba(186,201,222,0.35)';
        g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
      // наметённые волны
      for (var k = 0; k < 26; k++) {
        g.strokeStyle = 'rgba(176,194,218,0.3)';
        g.lineWidth = 2 + Math.random() * 5;
        g.beginPath();
        var y = Math.random() * h;
        g.moveTo(0, y);
        g.bezierCurveTo(w * 0.3, y + 16, w * 0.7, y - 16, w, y + 4);
        g.stroke();
      }
    }, 60, 60);
  };

  World.grassTexture = function () {
    return canvasTexture(256, 256, function (g, w, h) {
      g.fillStyle = '#6f8a4a';
      g.fillRect(0, 0, w, h);
      for (var i = 0; i < 9000; i++) {
        var v = Math.random();
        g.fillStyle = v > 0.66 ? 'rgba(140,168,92,0.5)'
          : (v > 0.33 ? 'rgba(86,110,58,0.5)' : 'rgba(178,186,120,0.35)');
        g.fillRect(Math.random() * w, Math.random() * h, 2, 3);
      }
      for (var k = 0; k < 22; k++) {
        g.fillStyle = 'rgba(120,140,80,0.35)';
        g.beginPath();
        g.ellipse(Math.random() * w, Math.random() * h, 20 + Math.random() * 40,
          12 + Math.random() * 24, Math.random(), 0, Math.PI * 2);
        g.fill();
      }
    }, 70, 70);
  };

  World.urbanGroundTexture = function () {
    return canvasTexture(256, 256, function (g, w, h) {
      g.fillStyle = '#8d8f93';
      g.fillRect(0, 0, w, h);
      for (var i = 0; i < 5000; i++) {
        g.fillStyle = Math.random() > 0.5 ? 'rgba(190,192,198,0.3)' : 'rgba(96,98,104,0.3)';
        g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
      g.strokeStyle = 'rgba(70,72,78,0.45)';
      g.lineWidth = 2;
      for (var x = 0; x < w; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
      for (var y = 0; y < h; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    }, 55, 55);
  };

  World.groundTexture = function (kind) {
    if (kind === 'snow') return World.snowTexture();
    if (kind === 'grass') return World.grassTexture();
    if (kind === 'urban') return World.urbanGroundTexture();
    return World.sandTexture();
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

  /* ---------- Фасады небоскрёбов ----------
     Четыре стиля: зеркальное стекло, дубайский камень, белые панели и
     полосатый. В текстуру запечены межэтажные плиты, простенки, разный свет
     в окнах и потёки — вблизи фасад перестаёт быть однотонной сеткой. */

  function noiseOverlay(g, w, h, times, light, dark) {
    for (var i = 0; i < times; i++) {
      g.fillStyle = Math.random() > 0.5 ? light : dark;
      g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
  }

  /* Потёки и грязь сверху вниз. */
  function grime(g, w, h, alpha) {
    for (var i = 0; i < 26; i++) {
      var x = Math.random() * w;
      var len = h * (0.15 + Math.random() * 0.5);
      var grd = g.createLinearGradient(x, 0, x, len);
      grd.addColorStop(0, 'rgba(40,36,30,' + alpha + ')');
      grd.addColorStop(1, 'rgba(40,36,30,0)');
      g.fillStyle = grd;
      g.fillRect(x, Math.random() * h * 0.4, 1 + Math.random() * 3, len);
    }
  }

  World.facadeTexture = function (style) {
    return canvasTexture(256, 512, function (g, w, h) {
      var cols = 8, rows = 16;
      var cw = w / cols, ch = h / rows;

      if (style === 'sand') {
        // дубайский камень: тёплые панели с утопленными окнами
        g.fillStyle = '#d8c1a0';
        g.fillRect(0, 0, w, h);
        noiseOverlay(g, w, h, 2600, 'rgba(255,247,230,0.35)', 'rgba(150,124,92,0.25)');
        for (var r = 0; r < rows; r++) {
          for (var c = 0; c < cols; c++) {
            var x = c * cw, y = r * ch;
            // ниша
            g.fillStyle = 'rgba(120,98,70,0.55)';
            g.fillRect(x + 5, y + 5, cw - 10, ch - 11);
            var lit = Math.random();
            g.fillStyle = lit > 0.78 ? '#ffd9a0' : (lit > 0.5 ? '#7d9aa8' : '#4a5b66');
            g.fillRect(x + 7, y + 7, cw - 14, ch - 15);
            // козырёк над окном ловит солнце
            g.fillStyle = 'rgba(255,248,232,0.75)';
            g.fillRect(x + 4, y + 3, cw - 8, 2);
          }
          // межэтажная плита
          g.fillStyle = 'rgba(238,226,206,0.9)';
          g.fillRect(0, r * ch + ch - 4, w, 4);
        }
        // резной поясок раз в четыре этажа
        for (var b = 0; b < rows; b += 4) {
          g.fillStyle = 'rgba(190,163,124,0.8)';
          g.fillRect(0, b * ch - 3, w, 6);
          g.fillStyle = 'rgba(255,250,238,0.5)';
          for (var xx = 3; xx < w; xx += 9) g.fillRect(xx, b * ch - 2, 4, 4);
        }
        grime(g, w, h, 0.1);

      } else if (style === 'white') {
        // белые панели с ленточным остеклением
        g.fillStyle = '#e9ebee';
        g.fillRect(0, 0, w, h);
        noiseOverlay(g, w, h, 1800, 'rgba(255,255,255,0.5)', 'rgba(160,168,178,0.22)');
        for (var r2 = 0; r2 < rows; r2++) {
          var y2 = r2 * ch;
          var band = g.createLinearGradient(0, y2 + 4, 0, y2 + ch - 6);
          band.addColorStop(0, '#33465a');
          band.addColorStop(1, '#5c7c93');
          g.fillStyle = band;
          g.fillRect(0, y2 + 4, w, ch - 10);
          // подсвеченные секции
          for (var c2 = 0; c2 < cols; c2++) {
            if (Math.random() > 0.72) {
              g.fillStyle = 'rgba(255,222,168,0.9)';
              g.fillRect(c2 * cw + 2, y2 + 6, cw - 5, ch - 14);
            }
            g.fillStyle = 'rgba(220,226,232,0.85)';
            g.fillRect(c2 * cw, y2 + 4, 2, ch - 10);      // простенок
          }
          g.fillStyle = 'rgba(246,248,250,0.95)';
          g.fillRect(0, y2 + ch - 6, w, 6);                // парапет балкона
        }
        grime(g, w, h, 0.07);

      } else if (style === 'stripe') {
        // чередование тёмного стекла и светлого камня
        g.fillStyle = '#c9ccd2';
        g.fillRect(0, 0, w, h);
        for (var r3 = 0; r3 < rows; r3++) {
          var y3 = r3 * ch;
          if (r3 % 2 === 0) {
            var gl = g.createLinearGradient(0, y3, 0, y3 + ch);
            gl.addColorStop(0, '#2b3d4f');
            gl.addColorStop(1, '#46647b');
            g.fillStyle = gl;
            g.fillRect(0, y3 + 2, w, ch - 4);
            for (var c3 = 0; c3 < cols; c3++) {
              if (Math.random() > 0.8) {
                g.fillStyle = 'rgba(255,226,175,0.85)';
                g.fillRect(c3 * cw + 3, y3 + 5, cw - 7, ch - 12);
              }
            }
          } else {
            g.fillStyle = '#dfe2e6';
            g.fillRect(0, y3 + 2, w, ch - 4);
            noiseOverlay(g, w, ch, 120, 'rgba(255,255,255,0.5)', 'rgba(150,155,165,0.25)');
          }
          g.fillStyle = 'rgba(120,128,138,0.5)';
          g.fillRect(0, y3, w, 2);
        }
        grime(g, w, h, 0.09);

      } else if (style === 'stalin') {
        // сталинский ампир: охра, пилястры, высокие окна, лепной карниз
        g.fillStyle = '#d8c8a8';
        g.fillRect(0, 0, w, h);
        noiseOverlay(g, w, h, 2200, 'rgba(255,250,232,0.35)', 'rgba(150,130,96,0.25)');
        for (var r5 = 0; r5 < rows; r5++) {
          var y5 = r5 * ch;
          for (var c6 = 0; c6 < cols; c6++) {
            var x6 = c6 * cw;
            g.fillStyle = 'rgba(120,102,74,0.5)';
            g.fillRect(x6 + 6, y5 + 5, cw - 12, ch - 12);
            var lit5 = Math.random();
            g.fillStyle = lit5 > 0.75 ? '#ffe0a8' : (lit5 > 0.45 ? '#6f8496' : '#3f4c58');
            g.fillRect(x6 + 8, y5 + 7, cw - 16, ch - 16);
            g.fillStyle = 'rgba(246,238,218,0.9)';      // наличник
            g.fillRect(x6 + 4, y5 + 3, cw - 8, 3);
          }
          g.fillStyle = 'rgba(198,178,140,0.85)';
          g.fillRect(0, y5 + ch - 5, w, 5);
        }
        // пилястры
        for (var pz = 0; pz <= cols; pz += 2) {
          g.fillStyle = 'rgba(226,212,180,0.75)';
          g.fillRect(pz * cw - 3, 0, 6, h);
        }
        g.fillStyle = '#c8b184';
        g.fillRect(0, 0, w, 14);
        g.fillStyle = 'rgba(255,250,235,0.6)';
        for (var dz = 6; dz < w; dz += 16) g.fillRect(dz, 3, 8, 8);
        grime(g, w, h, 0.1);

      } else if (style === 'panel') {
        // панельный дом: швы, балконы, мелкие окна
        g.fillStyle = '#c9cbc6';
        g.fillRect(0, 0, w, h);
        noiseOverlay(g, w, h, 2000, 'rgba(240,242,238,0.4)', 'rgba(126,130,126,0.3)');
        for (var r6 = 0; r6 < rows; r6++) {
          var y6 = r6 * ch;
          for (var c7 = 0; c7 < cols; c7++) {
            var x7 = c7 * cw;
            var lit6 = Math.random();
            g.fillStyle = lit6 > 0.72 ? '#ffdca0' : (lit6 > 0.45 ? '#7f95a4' : '#404a54');
            g.fillRect(x7 + 5, y6 + 6, cw - 10, ch - 16);
            if (Math.random() > 0.6) {                  // застеклённый балкон
              g.fillStyle = 'rgba(196,204,200,0.9)';
              g.fillRect(x7 + 3, y6 + ch - 12, cw - 6, 8);
            }
          }
          g.strokeStyle = 'rgba(120,124,120,0.7)';       // шов панели
          g.lineWidth = 2;
          g.beginPath(); g.moveTo(0, y6 + ch - 2); g.lineTo(w, y6 + ch - 2); g.stroke();
        }
        for (var sv = 0; sv <= cols; sv += 2) {
          g.strokeStyle = 'rgba(120,124,120,0.55)';
          g.beginPath(); g.moveTo(sv * cw, 0); g.lineTo(sv * cw, h); g.stroke();
        }
        grime(g, w, h, 0.14);

      } else if (style === 'brick') {
        // кирпичный дом с белыми наличниками
        g.fillStyle = '#a8563c';
        g.fillRect(0, 0, w, h);
        var bh2 = 7, bw2 = 18;
        for (var row2 = 0; row2 * bh2 < h; row2++) {
          var off2 = (row2 % 2) * bw2 / 2;
          for (var x8 = -bw2; x8 < w + bw2; x8 += bw2) {
            g.fillStyle = 'rgba(255,255,255,' + (0.04 + Math.random() * 0.1) + ')';
            g.fillRect(x8 + off2 + 1, row2 * bh2 + 1, bw2 - 2, bh2 - 2);
          }
        }
        for (var r7 = 0; r7 < rows; r7++) {
          for (var c8 = 0; c8 < cols; c8++) {
            var x9 = c8 * cw, y7 = r7 * ch;
            g.fillStyle = '#f0ece0';
            g.fillRect(x9 + 4, y7 + 5, cw - 8, ch - 12);
            var lit7 = Math.random();
            g.fillStyle = lit7 > 0.72 ? '#ffe2ab' : (lit7 > 0.4 ? '#5f7484' : '#33404c');
            g.fillRect(x9 + 7, y7 + 8, cw - 14, ch - 18);
          }
        }
        grime(g, w, h, 0.12);

      } else if (style === 'neon') {
        // токийский фасад: тёмное стекло и вертикальные вывески
        g.fillStyle = '#2b2f38';
        g.fillRect(0, 0, w, h);
        noiseOverlay(g, w, h, 1500, 'rgba(120,140,160,0.2)', 'rgba(10,12,16,0.4)');
        for (var r8 = 0; r8 < rows; r8++) {
          for (var c9 = 0; c9 < cols; c9++) {
            var xa = c9 * cw, ya = r8 * ch;
            var lit8 = Math.random();
            g.fillStyle = lit8 > 0.62 ? 'rgba(190,225,255,0.75)' : 'rgba(40,52,66,0.9)';
            g.fillRect(xa + 3, ya + 4, cw - 6, ch - 10);
          }
        }
        var neon = ['#ff3d6e', '#38e0d0', '#ffd23f', '#7c4dff', '#4dff88'];
        for (var nsign = 0; nsign < 5; nsign++) {
          var nx = Math.random() * (w - 26);
          var ny = Math.random() * (h - 120);
          var nh = 60 + Math.random() * 60;
          var col = neon[Math.floor(Math.random() * neon.length)];
          g.fillStyle = col;
          g.globalAlpha = 0.9;
          g.fillRect(nx, ny, 22, nh);
          g.globalAlpha = 1;
          g.fillStyle = 'rgba(0,0,0,0.55)';
          for (var ch2 = 0; ch2 < nh - 12; ch2 += 18) {
            g.fillRect(nx + 5, ny + 6 + ch2, 12, 10);
          }
        }

      } else if (style === 'haussmann') {
        // парижский дом: кремовый камень, балконы с ковкой, мансарда
        g.fillStyle = '#e2d8c4';
        g.fillRect(0, 0, w, h);
        noiseOverlay(g, w, h, 2000, 'rgba(255,252,242,0.4)', 'rgba(160,148,124,0.25)');
        for (var r9 = 0; r9 < rows; r9++) {
          var yb = r9 * ch;
          for (var ca = 0; ca < cols; ca++) {
            var xb = ca * cw;
            g.fillStyle = '#c8bca4';
            g.fillRect(xb + 5, yb + 4, cw - 10, ch - 12);
            var lit9 = Math.random();
            g.fillStyle = lit9 > 0.74 ? '#ffe6b8' : (lit9 > 0.45 ? '#6b7f92' : '#3a4652');
            g.fillRect(xb + 7, yb + 6, cw - 14, ch - 16);
          }
          // кованый балкон через этаж
          if (r9 % 2 === 1) {
            g.fillStyle = 'rgba(48,50,54,0.85)';
            g.fillRect(0, yb + ch - 11, w, 3);
            for (var bx2 = 2; bx2 < w; bx2 += 6) g.fillRect(bx2, yb + ch - 11, 2, 7);
          }
          g.fillStyle = 'rgba(238,230,214,0.9)';
          g.fillRect(0, yb + ch - 4, w, 4);
        }
        // мансарда сверху тайла
        g.fillStyle = '#4a4f57';
        g.fillRect(0, 0, w, 26);
        g.fillStyle = '#8b929c';
        for (var mx = 8; mx < w; mx += 32) g.fillRect(mx, 6, 14, 14);
        grime(g, w, h, 0.08);

      } else {
        // зеркальное стекло: небо сверху, город снизу
        var base = g.createLinearGradient(0, 0, 0, h);
        base.addColorStop(0, '#8fb6d6');
        base.addColorStop(0.45, '#5f87a8');
        base.addColorStop(1, '#33506b');
        g.fillStyle = base;
        g.fillRect(0, 0, w, h);
        for (var r4 = 0; r4 < rows; r4++) {
          for (var c4 = 0; c4 < cols; c4++) {
            var x4 = c4 * cw, y4 = r4 * ch;
            var t = Math.random();
            if (t > 0.86) g.fillStyle = 'rgba(255,226,170,0.92)';        // горит свет
            else if (t > 0.66) g.fillStyle = 'rgba(196,224,244,0.5)';     // блик неба
            else if (t > 0.4) g.fillStyle = 'rgba(30,52,74,0.35)';
            else g.fillStyle = 'rgba(12,26,42,0.25)';
            g.fillRect(x4 + 2, y4 + 3, cw - 4, ch - 8);
          }
          g.fillStyle = 'rgba(190,206,220,0.55)';
          g.fillRect(0, r4 * ch + ch - 5, w, 3);                          // плита
        }
        for (var c5 = 0; c5 <= cols; c5++) {
          g.fillStyle = 'rgba(206,220,232,0.4)';
          g.fillRect(c5 * cw - 1, 0, 2, h);                               // ребро
        }
        grime(g, w, h, 0.08);
      }

      // затемнение к низу: у земли фасад всегда темнее
      var shade = g.createLinearGradient(0, h * 0.75, 0, h);
      shade.addColorStop(0, 'rgba(20,18,16,0)');
      shade.addColorStop(1, 'rgba(20,18,16,0.28)');
      g.fillStyle = shade;
      g.fillRect(0, h * 0.75, w, h * 0.25);
    });
  };

  /* Старое имя оставлено: им пользуется башня. */
  World.windowsTexture = function () {
    return World.facadeTexture('glass');
  };

  /* Небо панорамой: зенит, дымка у горизонта, солнце с ореолом и перистые
     облака. Солнце нарисовано там же, откуда светит направленный свет. */
  World.SUN_UV = { u: 0.895, v: 0.227 };
  World.SUN_DIR = new THREE.Vector3(-0.52, 0.755, -0.41);

  World.skyTexture = function (theme) {
    theme = theme || World.THEMES.dubai;
    return canvasTexture(1024, 512, function (g, w, h) {
      var grd = g.createLinearGradient(0, 0, 0, h);
      for (var st = 0; st < theme.sky.length; st++) {
        grd.addColorStop(theme.sky[st][0], theme.sky[st][1]);
      }
      g.fillStyle = grd;
      g.fillRect(0, 0, w, h);

      // перистые облака: вытянутые мазки на нескольких высотах
      for (var i = 0; i < theme.clouds; i++) {
        var cy = h * (0.16 + Math.random() * 0.36);
        var cx = Math.random() * w;
        var len = 60 + Math.random() * 320;
        var thick = 3 + Math.random() * 12;
        var alpha = 0.05 + Math.random() * theme.cloudAlpha;
        var cl = g.createLinearGradient(cx - len / 2, cy, cx + len / 2, cy);
        cl.addColorStop(0, 'rgba(255,255,255,0)');
        cl.addColorStop(0.5, 'rgba(255,255,255,' + alpha + ')');
        cl.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = cl;
        g.beginPath();
        g.ellipse(cx, cy, len / 2, thick, (Math.random() - 0.5) * 0.12, 0, Math.PI * 2);
        g.fill();
      }

      // пыльная дымка над горизонтом
      var haze = g.createLinearGradient(0, h * 0.58, 0, h * 0.92);
      haze.addColorStop(0, theme.haze + '0)');
      haze.addColorStop(0.6, theme.haze + '0.24)');
      haze.addColorStop(1, theme.haze + '0.45)');
      g.fillStyle = haze;
      g.fillRect(0, h * 0.58, w, h * 0.34);

      // солнце с широким ореолом
      var sx = w * World.SUN_UV.u, sy = h * World.SUN_UV.v;
      var halo = g.createRadialGradient(sx, sy, 4, sx, sy, 260);
      halo.addColorStop(0, 'rgba(255,252,232,0.95)');
      halo.addColorStop(0.06, 'rgba(255,244,206,0.75)');
      halo.addColorStop(0.25, 'rgba(255,232,180,0.28)');
      halo.addColorStop(1, 'rgba(255,226,170,0)');
      g.fillStyle = halo;
      g.fillRect(sx - 280, sy - 280, 560, 560);
      g.fillStyle = 'rgba(255,255,248,1)';
      g.beginPath(); g.arc(sx, sy, 16, 0, Math.PI * 2); g.fill();

      // редкие кучевые ближе к горизонту
      for (var k = 0; k < 16; k++) {
        var bx = Math.random() * w;
        var by = h * (0.5 + Math.random() * 0.12);
        var r = 18 + Math.random() * 34;
        g.fillStyle = 'rgba(255,255,255,0.13)';
        for (var b = 0; b < 5; b++) {
          g.beginPath();
          g.arc(bx + (b - 2) * r * 0.55, by + Math.sin(b) * r * 0.18, r * (0.5 + Math.random() * 0.5), 0, Math.PI * 2);
          g.fill();
        }
      }
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
    var mat = new THREE.MeshLambertMaterial({ color: World.theme.shoulder });
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
    return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: World.theme.embankment }));
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

  /* ---------- Города ---------- */

  World.THEMES = {
    dubai: {
      id: 'dubai', title: 'Дубай', hint: 'песок, небоскрёбы, Бурдж-Халифа',
      ground: 'sand', groundTint: 0xffffff,
      shoulder: 0xbda574, embankment: 0xc7ab7b,
      sky: [[0.00,'#0b3372'],[0.18,'#245fa8'],[0.36,'#4a8cc9'],[0.52,'#84badb'],
            [0.66,'#c2d3d3'],[0.78,'#e0caa0'],[0.90,'#dcb379'],[1.00,'#c4945c']],
      haze: 'rgba(226,206,170,', clouds: 90, cloudAlpha: 0.16,
      fog: 0xcbb489, clear: 0xbcd3e6, fogDensity: 0.0013,
      facades: ['glass', 'sand', 'white', 'stripe'],
      heights: [26, 190], capColor: 0x8d9aa6,
      trees: 'palm', treeCount: 96, dunes: true, cacti: true,
      weather: ['sand', 'rain'],
      landmarks: 'dubai'
    },
    moscow: {
      id: 'moscow', title: 'Москва', hint: 'снег, сталинки, Кремль',
      ground: 'snow', groundTint: 0xffffff,
      shoulder: 0xd7dee8, embankment: 0xc6cfdb,
      sky: [[0.00,'#2a3f63'],[0.20,'#4f6b93'],[0.40,'#7e97b8'],[0.58,'#aebccb'],
            [0.72,'#c9d2da'],[0.86,'#dde2e6'],[1.00,'#e8ebee']],
      haze: 'rgba(210,220,232,', clouds: 190, cloudAlpha: 0.3,
      fog: 0xc3ccd8, clear: 0xaebccb, fogDensity: 0.0019,
      facades: ['stalin', 'panel', 'brick', 'white'],
      heights: [22, 90], capColor: 0x9aa3ad,
      trees: 'birch', treeCount: 90, spruces: true, dunes: false,
      weather: ['snow', 'rain'],
      landmarks: 'moscow'
    },
    yoshkar: {
      id: 'yoshkar', title: 'Йошкар-Ола', hint: 'набережная Брюгге и ёлки',
      ground: 'snow', groundTint: 0xf6f2ea,
      shoulder: 0xd9dfe6, embankment: 0xcad2dc,
      sky: [[0.00,'#33507e'],[0.20,'#5c7fab'],[0.40,'#8ba7c6'],[0.58,'#bfcedb'],
            [0.74,'#dfe4e6'],[0.88,'#efe6d8'],[1.00,'#f2e6d0']],
      haze: 'rgba(224,228,232,', clouds: 150, cloudAlpha: 0.26,
      fog: 0xd2d8e0, clear: 0xbfcedb, fogDensity: 0.0017,
      facades: ['brick', 'panel', 'stalin', 'white'],
      heights: [16, 46], capColor: 0xa8b0b8,
      trees: 'spruce', treeCount: 86, dunes: false,
      weather: ['snow', 'rain'],
      landmarks: 'yoshkar'
    },
    tokyo: {
      id: 'tokyo', title: 'Токио', hint: 'неон, сакура, Токийская башня',
      ground: 'urban', groundTint: 0xffffff,
      shoulder: 0x9a9ca2, embankment: 0x8c8e94,
      sky: [[0.00,'#1a2748'],[0.18,'#39456e'],[0.36,'#6a6392'],[0.52,'#a97a9a'],
            [0.68,'#e0929a'],[0.82,'#f2b790'],[1.00,'#f6d3a6']],
      haze: 'rgba(240,200,180,', clouds: 110, cloudAlpha: 0.2,
      fog: 0xa88fa0, clear: 0x8f7f9c, fogDensity: 0.0016,
      facades: ['neon', 'glass', 'white', 'stripe'],
      heights: [24, 170], capColor: 0x7f858f,
      trees: 'sakura', treeCount: 92, dunes: false,
      weather: ['rain', 'rain', 'sand'],
      landmarks: 'tokyo'
    },
    paris: {
      id: 'paris', title: 'Париж', hint: 'османовские дома и Эйфелева башня',
      ground: 'grass', groundTint: 0xffffff,
      shoulder: 0xb9b49a, embankment: 0xa9a98c,
      sky: [[0.00,'#1c4f8f'],[0.20,'#3e7ab6'],[0.40,'#7ba7cf'],[0.58,'#b3cadd'],
            [0.74,'#d8dfdf'],[0.88,'#ece4d2'],[1.00,'#e6d9bd']],
      haze: 'rgba(226,226,214,', clouds: 140, cloudAlpha: 0.24,
      fog: 0xc9ccc0, clear: 0xb3cadd, fogDensity: 0.0015,
      facades: ['haussmann', 'white', 'stripe', 'brick'],
      heights: [18, 52], capColor: 0x6c7079,
      trees: 'plane', treeCount: 94, dunes: false,
      weather: ['rain', 'rain', 'snow'],
      landmarks: 'paris'
    }
  };

  World.theme = World.THEMES.dubai;

  World.buildCity = function (track, scene, theme) {
    theme = theme || World.THEMES.dubai;
    World.theme = theme;
    var group = new THREE.Group();
    scene.add(group);

    // земля: песок, снег, трава или городской бетон
    var ground = new THREE.Mesh(
      new THREE.PlaneGeometry(4000, 4000),
      new THREE.MeshLambertMaterial({ map: World.groundTexture(theme.ground), color: theme.groundTint })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    group.add(ground);

    // небо: панорама на сфере, её же подкрашиваем в непогоду
    var sky = new THREE.Mesh(
      new THREE.SphereGeometry(1800, 32, 20),
      new THREE.MeshBasicMaterial({ map: World.skyTexture(theme), side: THREE.BackSide,
        depthWrite: false, fog: false })
    );
    group.add(sky);
    World.skyMesh = sky;

    // солнце светится там же, куда смотрит направленный свет
    var sun = new THREE.Sprite(new THREE.SpriteMaterial({
      map: World.glowTexture(255, 246, 214), transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    sun.scale.set(300, 300, 1);
    sun.position.copy(World.SUN_DIR).multiplyScalar(1400);
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
      var pdd = track.length * 0.52;
      var ppp = track.pointAt(pdd), pnn = track.sideAt(pdd);
      var plx = ppp.x + pnn.x * 105, plz = ppp.z + pnn.z * 105;
      if ((x - plx) * (x - plx) + (z - plz) * (z - plz) < 95 * 95) continue;      // двор дворца

      var hmin = theme.heights[0], hspan = theme.heights[1];
      var h = hmin + Math.random() * Math.random() * hspan + (near < 90 ? 0 : hmin * 0.6);
      var bw = 12 + Math.random() * 24;
      var bd = 12 + Math.random() * 24;

      var geo = new THREE.BoxGeometry(bw, h, bd);
      // тайл фасада — 8 окон в ширину (~26 м) и 16 этажей (~48 м),
      // поэтому делим размеры дома на метры тайла, иначе окна сливаются в кашу
      World.scaleUV(geo, Math.max(1, Math.round(bw / 26)), Math.max(1, Math.round(h / 48)));
      var m = new THREE.Matrix4().makeRotationY(Math.random() * Math.PI);
      m.setPosition(x, h / 2, z);
      geo.applyMatrix4(m);
      buckets[placed % BUCKETS].push(geo);

      if (Math.random() > 0.55) {
        var ch = 6 + Math.random() * 18;
        var cap = new THREE.BoxGeometry(bw * 0.4, ch, bd * 0.4);
        cap.translate(x, h + ch / 2, z);
        capGeos.push(cap);
        // на высоких домах ещё и антенна — силуэт города становится живее
        if (h > 110 && Math.random() > 0.4) {
          var mast = new THREE.CylinderGeometry(0.35, 0.6, 18 + Math.random() * 16, 6);
          mast.translate(x, h + ch + 9, z);
          capGeos.push(mast);
        }
      }
      placed++;
    }
    var STYLES = theme.facades;
    for (var b2 = 0; b2 < BUCKETS; b2++) {
      if (!buckets[b2].length) continue;
      var tex = World.facadeTexture(STYLES[b2 % STYLES.length]);
      // стеклянные фасады бликуют на солнце, каменные — нет
      var st = STYLES[b2 % STYLES.length];
      var glassy = st === 'glass' || st === 'neon' || st === 'stripe' || st === 'white';
      var mat = glassy
        ? new THREE.MeshPhongMaterial({ map: tex, emissiveMap: tex, emissive: 0x1a1712,
            specular: 0x6a7c8c, shininess: 42 })
        : new THREE.MeshLambertMaterial({ map: tex, emissiveMap: tex, emissive: 0x141210 });
      group.add(new THREE.Mesh(World.mergeGeometries(buckets[b2]), mat));
    }
    if (capGeos.length) {
      group.add(new THREE.Mesh(World.mergeGeometries(capGeos),
        new THREE.MeshLambertMaterial({ color: theme.capColor })));
    }

    // Достопримечательности: одна у финиша, одна на дальней стороне круга
    var fin = track.pointAt(0);
    var fside = track.sideAt(0);
    var spotA = new THREE.Vector3(fin.x, 0, fin.z).addScaledVector(fside, -82);
    var pd = track.length * 0.52;
    var pp2 = track.pointAt(pd);
    var pn = track.sideAt(pd);
    var spotB = new THREE.Vector3(pp2.x, 0, pp2.z).addScaledVector(pn, 105);
    var faceB = Math.atan2(-pn.x, -pn.z);
    World.burjPosition = spotA.clone();

    if (theme.landmarks === 'dubai') {
      World.buildBurj(group, spotA.x, spotA.z);
      World.buildPalace(group, spotB.x, spotB.z, faceB);
    } else if (theme.landmarks === 'moscow') {
      World.buildKremlin(group, spotA.x, spotA.z, Math.atan2(fside.x, fside.z));
      World.buildPalace(group, spotB.x, spotB.z, faceB);        // усадьба вдалеке
    } else if (theme.landmarks === 'yoshkar') {
      World.buildFlemishRow(group, spotA.x, spotA.z, Math.atan2(fside.x, fside.z));
      World.buildKremlin(group, spotB.x, spotB.z, faceB);
    } else if (theme.landmarks === 'tokyo') {
      World.buildTokyoTower(group, spotA.x, spotA.z);
      World.buildFlemishRow(group, spotB.x, spotB.z, faceB);    // квартал у башни
    } else if (theme.landmarks === 'paris') {
      World.buildEiffel(group, spotA.x, spotA.z);
      World.buildFlemishRow(group, spotB.x, spotB.z, faceB);
    }

    // Пальмы вдоль трассы: стоят на песке за насыпью, поэтому отступ зависит
    // от высоты дороги в этом месте
    var trunkGeos = [], leafGeos = [], nutGeos = [];
    var extraTrunks = [], extraLeaves = [];
    var count = theme.treeCount || 90;
    for (var i = 0; i < count; i++) {
      var d = track.length * i / count + 4;
      var p = track.pointAt(d);
      var n = track.sideAt(d);
      var sideSign = (i % 2 === 0) ? 1 : -1;
      var off = World.roadFootprint(track, d) + 3 + Math.random() * 7;
      var tp = p.clone().addScaledVector(n, sideSign * off);
      if (theme.trees === 'palm') World.palmGeometry(tp.x, tp.z, trunkGeos, leafGeos, nutGeos);
      else World.treeGeometry(theme.trees, tp.x, tp.z, trunkGeos, leafGeos);

      // в северных городах между лиственными вставляем ёлки
      if (theme.spruces && i % 3 === 0) {
        var off2 = off + 9 + Math.random() * 7;
        var sp = p.clone().addScaledVector(n, sideSign * off2);
        World.treeGeometry('spruce', sp.x, sp.z, extraTrunks, extraLeaves);
      }
    }
    if (theme.trees === 'palm') {
      var pm = World.palmMaterials();
      group.add(new THREE.Mesh(World.mergeGeometries(trunkGeos), pm.trunk));
      group.add(new THREE.Mesh(World.mergeGeometries(leafGeos), pm.leaf));
      if (nutGeos.length) group.add(new THREE.Mesh(World.mergeGeometries(nutGeos), pm.nut));
    } else {
      var tm = World.treeMaterials(theme.trees);
      group.add(new THREE.Mesh(World.mergeGeometries(trunkGeos), tm.trunk));
      group.add(new THREE.Mesh(World.mergeGeometries(leafGeos), tm.leaf));
    }
    if (extraTrunks.length) {
      var sm = World.treeMaterials('spruce');
      group.add(new THREE.Mesh(World.mergeGeometries(extraTrunks), sm.trunk));
      group.add(new THREE.Mesh(World.mergeGeometries(extraLeaves), sm.leaf));
    }

    // Кактусы: колючий подлесок пустыни между пальмами
    if (theme.cacti) {
      var cactusGeos = [];
      for (var c1 = 0; c1 < 70; c1++) {
        var cd = track.length * c1 / 70 + 18;
        var cp = track.pointAt(cd);
        var cn = track.sideAt(cd);
        var cs = (c1 % 2 === 0) ? -1 : 1;
        var coff = World.roadFootprint(track, cd) + 5 + Math.random() * 16;
        var cpos = cp.clone().addScaledVector(cn, cs * coff);
        World.cactusGeometry(cpos.x + (Math.random() - 0.5) * 6,
                             cpos.z + (Math.random() - 0.5) * 6, cactusGeos);
      }
      group.add(new THREE.Mesh(World.mergeGeometries(cactusGeos), World.cactusMaterial()));
    }

    // Дюны — только там, где вокруг пустыня
    if (!theme.dunes) return group;
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
    var winTex = World.facadeTexture('glass');
    var glassMat = new THREE.MeshPhongMaterial({ map: winTex, emissiveMap: winTex,
      emissive: 0x1b1814, specular: 0x8899aa, shininess: 60 });
    var trimMat = new THREE.MeshLambertMaterial({ color: 0xcfd8de });

    var glass = [], trim = [];
    var y = 0;
    var w = 30;                 // полуширина крыла у земли
    var sections = 26;
    for (var i = 0; i < sections; i++) {
      var h = 30 - i * 0.55;
      var wing = new THREE.CylinderGeometry(w, w * 0.97, h, 6);
      World.scaleUV(wing, Math.max(1, Math.round(w / 9)), Math.max(1, Math.round(h / 34)));
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
    World.burjMaterial = glassMat;
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
    var pmb = World.palmMaterials();
    var trunks = [], leaves = [], bnuts = [];
    for (var k = 0; k < 14; k++) {
      var a = k / 14 * Math.PI * 2;
      World.palmGeometry(x + Math.cos(a) * 70, z + Math.sin(a) * 70, trunks, leaves, bnuts);
    }
    group.add(new THREE.Mesh(World.mergeGeometries(trunks), pmb.trunk));
    group.add(new THREE.Mesh(World.mergeGeometries(leaves), pmb.leaf));
    if (bnuts.length) group.add(new THREE.Mesh(World.mergeGeometries(bnuts), pmb.nut));

    return { x: x, z: z, height: y + 176 };
  };

  /* ---------- Дворец шейха ---------- */

  World.sandstoneTexture = function () {
    return canvasTexture(256, 256, function (g, w, h) {
      g.fillStyle = '#e0cba6';
      g.fillRect(0, 0, w, h);
      for (var i = 0; i < 4000; i++) {
        g.fillStyle = Math.random() > 0.5 ? 'rgba(255,250,236,0.4)' : 'rgba(168,142,104,0.25)';
        g.fillRect(Math.random() * w, Math.random() * h, 2.5, 2.5);
      }
      // кладка крупными блоками
      g.strokeStyle = 'rgba(150,124,88,0.35)';
      g.lineWidth = 1.5;
      for (var y = 0; y < h; y += 32) {
        g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
        var off = (y / 32) % 2 ? 32 : 0;
        for (var x = off; x < w; x += 64) {
          g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 32); g.stroke();
        }
      }
    }, 3, 3);
  };

  /* Стена дворца: стрельчатые арки и решётчатый узор. */
  World.palaceWallTexture = function () {
    return canvasTexture(256, 256, function (g, w, h) {
      g.fillStyle = '#e4d0ac';
      g.fillRect(0, 0, w, h);
      for (var i = 0; i < 2500; i++) {
        g.fillStyle = Math.random() > 0.5 ? 'rgba(255,250,238,0.35)' : 'rgba(170,144,106,0.22)';
        g.fillRect(Math.random() * w, Math.random() * h, 2.5, 2.5);
      }
      // ряд стрельчатых окон
      for (var c = 0; c < 4; c++) {
        var cx = 32 + c * 64, cy = 150;
        g.fillStyle = '#8a6a44';
        g.beginPath();
        g.moveTo(cx - 16, cy + 44);
        g.lineTo(cx - 16, cy - 8);
        g.quadraticCurveTo(cx, cy - 46, cx + 16, cy - 8);
        g.lineTo(cx + 16, cy + 44);
        g.closePath();
        g.fill();
        g.fillStyle = '#3d4b57';
        g.beginPath();
        g.moveTo(cx - 11, cy + 44);
        g.lineTo(cx - 11, cy - 6);
        g.quadraticCurveTo(cx, cy - 38, cx + 11, cy - 6);
        g.lineTo(cx + 11, cy + 44);
        g.closePath();
        g.fill();
        // переплёт
        g.strokeStyle = 'rgba(226,206,166,0.9)';
        g.lineWidth = 2;
        g.beginPath(); g.moveTo(cx, cy - 30); g.lineTo(cx, cy + 44); g.stroke();
        g.beginPath(); g.moveTo(cx - 11, cy + 10); g.lineTo(cx + 11, cy + 10); g.stroke();
      }
      // орнаментальный поясок
      g.fillStyle = '#b98f52';
      g.fillRect(0, 60, w, 5);
      g.fillRect(0, 92, w, 5);
      g.fillStyle = 'rgba(190,140,70,0.55)';
      for (var x2 = 8; x2 < w; x2 += 24) {
        g.beginPath();
        g.moveTo(x2, 66); g.lineTo(x2 + 12, 76); g.lineTo(x2, 86); g.lineTo(x2 - 12, 76);
        g.closePath(); g.fill();
      }
      g.fillStyle = 'rgba(140,112,72,0.35)';
      g.fillRect(0, h - 26, w, 26);
    }, 2, 1);
  };

  /* Дворец шейха: стены с зубцами, четыре башни, золотой купол и фонтан. */
  World.buildPalace = function (group, x, z, angle) {
    var stoneMat = new THREE.MeshLambertMaterial({ map: World.sandstoneTexture() });
    var wallMat = new THREE.MeshLambertMaterial({ map: World.palaceWallTexture() });
    var goldMat = new THREE.MeshPhongMaterial({ color: 0xd9a441, specular: 0xfff0c0, shininess: 70 });
    var tealMat = new THREE.MeshPhongMaterial({ color: 0x2f8f8a, specular: 0xbfeeea, shininess: 50 });

    var root = new THREE.Group();
    root.position.set(x, 0, z);
    root.rotation.y = angle || 0;
    group.add(root);

    // стилобат и стены с зубцами
    var stone = [];
    var base = new THREE.BoxGeometry(78, 2.6, 78);
    base.translate(0, 1.3, 0);
    stone.push(base);
    var steps = new THREE.BoxGeometry(26, 1.2, 8);
    steps.translate(0, 0.6, 43);
    stone.push(steps);

    for (var side = 0; side < 4; side++) {
      // каждую стену строим у себя и разворачиваем на свою сторону двора
      var m = new THREE.Matrix4().makeRotationY(side * Math.PI / 2);
      var off = new THREE.Matrix4().makeTranslation(0, 0, -37.5);
      var wall = new THREE.BoxGeometry(78, 8, 3);
      wall.applyMatrix4(off);
      wall.applyMatrix4(m);
      wall.translate(0, 6.6, 0);
      stone.push(wall);

      // зубцы поверху
      for (var t = -36; t <= 36; t += 4.5) {
        var merlon = new THREE.BoxGeometry(2.2, 1.8, 3.2);
        var mo = new THREE.Matrix4().makeTranslation(t, 0, -37.5);
        merlon.applyMatrix4(mo);
        merlon.applyMatrix4(m);
        merlon.translate(0, 11.5, 0);
        stone.push(merlon);
      }
    }
    root.add(new THREE.Mesh(World.mergeGeometries(stone), stoneMat));

    // главный корпус
    var mainBody = new THREE.Mesh(new THREE.BoxGeometry(38, 17, 28), wallMat);
    mainBody.position.y = 11.5;
    root.add(mainBody);

    var wings = [];
    for (var wx = -1; wx <= 1; wx += 2) {
      var wing = new THREE.BoxGeometry(16, 12, 20);
      wing.translate(wx * 26, 9, -2);
      wings.push(wing);
    }
    root.add(new THREE.Mesh(World.mergeGeometries(wings), wallMat));

    // угловые башни с шатрами
    var towers = [], roofs = [];
    for (var tx = -1; tx <= 1; tx += 2) {
      for (var tz = -1; tz <= 1; tz += 2) {
        var tower = new THREE.CylinderGeometry(5, 5.6, 20, 12);
        tower.translate(tx * 34, 10, tz * 34);
        towers.push(tower);
        var ring = new THREE.CylinderGeometry(6, 6, 1.2, 12);
        ring.translate(tx * 34, 20, tz * 34);
        towers.push(ring);
        var cone = new THREE.ConeGeometry(6.2, 8, 12);
        cone.translate(tx * 34, 24.6, tz * 34);
        roofs.push(cone);
      }
    }
    root.add(new THREE.Mesh(World.mergeGeometries(towers), stoneMat));
    root.add(new THREE.Mesh(World.mergeGeometries(roofs), tealMat));

    // золотой купол на барабане
    var drum = new THREE.Mesh(new THREE.CylinderGeometry(11, 11.6, 5, 16), wallMat);
    drum.position.y = 22.5;
    root.add(drum);

    var domes = [];
    var dome = new THREE.SphereGeometry(11.2, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.52);
    dome.translate(0, 25, 0);
    domes.push(dome);
    for (var dx = -1; dx <= 1; dx += 2) {
      var small = new THREE.SphereGeometry(5.2, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.52);
      small.translate(dx * 26, 15, -2);
      domes.push(small);
    }
    root.add(new THREE.Mesh(World.mergeGeometries(domes), goldMat));

    // шпиль с полумесяцем
    var spire = [];
    var pin = new THREE.CylinderGeometry(0.35, 0.5, 8, 8);
    pin.translate(0, 39, 0);
    spire.push(pin);
    var ball = new THREE.SphereGeometry(1.1, 10, 8);
    ball.translate(0, 43.4, 0);
    spire.push(ball);
    var crescent = new THREE.TorusGeometry(1.5, 0.28, 8, 16, Math.PI * 1.25);
    var mc = new THREE.Matrix4().makeRotationZ(-0.6);
    mc.setPosition(0, 46, 0);
    crescent.applyMatrix4(mc);
    spire.push(crescent);
    root.add(new THREE.Mesh(World.mergeGeometries(spire), goldMat));

    // ворота: тёмная арочная ниша
    var gate = new THREE.Mesh(new THREE.BoxGeometry(9, 11, 1.2),
      new THREE.MeshLambertMaterial({ color: 0x4a3626 }));
    gate.position.set(0, 7, 14.4);
    root.add(gate);
    var gateArch = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 1.2, 16, 1, false, 0, Math.PI),
      new THREE.MeshLambertMaterial({ color: 0x4a3626 }));
    gateArch.rotation.x = Math.PI / 2;
    gateArch.rotation.z = Math.PI;
    gateArch.position.set(0, 12.4, 14.4);
    root.add(gateArch);

    // фонтан во дворе
    var pool = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 1, 20), stoneMat);
    pool.position.set(0, 3, 26);
    root.add(pool);
    var water = new THREE.Mesh(new THREE.CylinderGeometry(8.2, 8.2, 0.4, 20),
      new THREE.MeshPhongMaterial({ color: 0x2f7fa8, specular: 0xdff2ff, shininess: 80 }));
    water.position.set(0, 3.5, 26);
    root.add(water);
    var jet = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.9, 4, 10),
      new THREE.MeshLambertMaterial({ color: 0xbfe3f2 }));
    jet.position.set(0, 5.6, 26);
    root.add(jet);

    // пальмы вдоль стилобата
    var pmp = World.palmMaterials();
    var trunks = [], leaves = [], pnuts = [];
    for (var i = 0; i < 12; i++) {
      var a = i / 12 * Math.PI * 2;
      World.palmGeometry(x + Math.cos(a) * 50, z + Math.sin(a) * 50, trunks, leaves, pnuts);
    }
    group.add(new THREE.Mesh(World.mergeGeometries(trunks), pmp.trunk));
    group.add(new THREE.Mesh(World.mergeGeometries(leaves), pmp.leaf));
    if (pnuts.length) group.add(new THREE.Mesh(World.mergeGeometries(pnuts), pmp.nut));

    World.palacePosition = new THREE.Vector3(x, 0, z);
    return root;
  };

  /* Геометрия одной пальмы, разложенная по спискам «ствол» и «листья». */
  /* ---------- Пальмы ---------- */

  /* Кора финиковой пальмы: ромбовидные рубцы от старых листьев. */
  World.palmBarkTexture = function () {
    return canvasTexture(64, 128, function (g, w, h) {
      g.fillStyle = '#8a6a44';
      g.fillRect(0, 0, w, h);
      for (var i = 0; i < 1200; i++) {
        g.fillStyle = Math.random() > 0.5 ? 'rgba(196,164,116,0.35)' : 'rgba(84,60,36,0.35)';
        g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
      var rows = 10, cols = 4;
      for (var r = 0; r < rows; r++) {
        var off = (r % 2) * (w / cols) / 2;
        for (var c = -1; c <= cols; c++) {
          var cx = off + c * (w / cols) + w / cols / 2;
          var cy = r * (h / rows) + h / rows / 2;
          g.fillStyle = 'rgba(122,92,58,0.9)';
          g.beginPath();
          g.moveTo(cx, cy - 5); g.lineTo(cx + 7, cy); g.lineTo(cx, cy + 5); g.lineTo(cx - 7, cy);
          g.closePath(); g.fill();
          g.strokeStyle = 'rgba(60,42,26,0.5)';
          g.lineWidth = 1;
          g.stroke();
          g.fillStyle = 'rgba(214,186,140,0.4)';
          g.fillRect(cx - 6, cy - 5, 12, 1.6);
        }
      }
    }, 2, 3);
  };

  /* Перистый лист: черешок и листочки по бокам, фон прозрачный. */
  World.palmLeafTexture = function () {
    return canvasTexture(128, 256, function (g, w, h) {
      g.clearRect(0, 0, w, h);
      var midX = w / 2;

      // черешок сужается к концу
      g.strokeStyle = '#4f7a2e';
      g.lineWidth = 6;
      g.beginPath();
      g.moveTo(midX, 0);
      g.lineTo(midX, h);
      g.stroke();
      g.strokeStyle = '#6d9c3c';
      g.lineWidth = 2.5;
      g.beginPath();
      g.moveTo(midX, 0);
      g.lineTo(midX, h);
      g.stroke();

      // листочки: чем ближе к концу, тем короче и круче
      for (var y = 8; y < h - 6; y += 7) {
        var t = y / h;
        var len = midX * (0.95 - t * 0.55) * (t < 0.12 ? t / 0.12 : 1);
        var lift = 12 + t * 16;
        var shade = 60 + Math.random() * 40;
        for (var side = -1; side <= 1; side += 2) {
          g.strokeStyle = 'rgb(' + Math.round(48 + shade * 0.35) + ',' +
            Math.round(96 + shade * 0.75) + ',' + Math.round(38 + shade * 0.3) + ')';
          g.lineWidth = 4.2;
          g.lineCap = 'round';
          g.beginPath();
          g.moveTo(midX, y);
          g.quadraticCurveTo(midX + side * len * 0.6, y + lift * 0.4,
                             midX + side * len, y + lift);
          g.stroke();
        }
      }
    });
  };

  /* Один лист: полоска, которая поднимается от кроны и провисает к концу. */
  function frondGeometry(len, width, tiltUp, droop) {
    var N = 6;
    var pos = [], uv = [], idx = [];
    for (var i = 0; i <= N; i++) {
      var t = i / N;
      var along = len * t;
      var x = Math.cos(tiltUp) * along;
      var y = Math.sin(tiltUp) * along - droop * along * t;
      // ширина: узко у черешка, шире в середине, острый конец
      var wdt = width * (t < 0.15 ? t / 0.15 : 1) * (1 - t * 0.75);
      pos.push(x, y, -wdt, x, y, wdt);
      uv.push(0, t, 1, t);
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
    return geo;
  }

  /* Пальма: изогнутый ствол, крона из 12 листьев и гроздь фиников.
     Геометрия раскладывается по спискам, чтобы потом склеиться в общие сетки. */
  World.palmGeometry = function (x, z, trunks, leaves, nuts) {
    var h = 7 + Math.random() * 4.5;
    var rotY = Math.random() * Math.PI * 2;
    var bend = (Math.random() - 0.5) * 1.6;          // наклон кроны вбок
    var bendZ = (Math.random() - 0.5) * 1.2;

    // ствол: гнём вершины по высоте, а не собираем из кусков
    var trunk = new THREE.CylinderGeometry(0.26, 0.46, h, 7, 6, true);
    trunk.translate(0, h / 2, 0);
    var tp = trunk.attributes.position;
    for (var v = 0; v < tp.count; v++) {
      var ty = tp.getY(v);
      var k = ty / h;
      var curve = k * k;                              // книзу прямой, кверху уводит
      tp.setX(v, tp.getX(v) + bend * curve);
      tp.setZ(v, tp.getZ(v) + bendZ * curve);
    }
    tp.needsUpdate = true;
    trunk.computeVertexNormals();
    World.scaleUV(trunk, 1, Math.max(1, Math.round(h / 3)));

    var mt = new THREE.Matrix4().makeRotationY(rotY);
    mt.setPosition(x, 0, z);
    trunk.applyMatrix4(mt);
    trunks.push(trunk);

    // крона сидит на конце изогнутого ствола
    var topX = bend, topZ = bendZ, topY = h;
    var count = 14 + Math.floor(Math.random() * 4);
    var green = 0.85 + Math.random() * 0.3;

    for (var i = 0; i < count; i++) {
      var a = (i / count) * Math.PI * 2 + Math.random() * 0.2;
      var young = i % 4 === 0;                        // молодые листья торчат вверх
      var len = (young ? 2.8 : 3.7) + Math.random() * 1.3;
      var tilt = young ? 0.75 + Math.random() * 0.35 : 0.1 + Math.random() * 0.35;
      var droop = young ? 0.06 : 0.13 + Math.random() * 0.09;

      var frond = frondGeometry(len, 0.82, tilt, droop);
      var e = new THREE.Euler(0, -a, Math.sin(i * 2.1) * 0.18, 'YXZ');
      var ml = new THREE.Matrix4().makeRotationFromEuler(e);
      ml.setPosition(topX, topY - 0.25, topZ);
      frond.applyMatrix4(ml);
      frond.applyMatrix4(mt);
      leaves.push(frond);
    }

    // сухие листья под кроной
    for (var d = 0; d < 3; d++) {
      var ad = Math.random() * Math.PI * 2;
      var dry = frondGeometry(2.1 + Math.random(), 0.62, -0.55, 0.05);
      var md = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0, -ad, 0, 'YXZ'));
      md.setPosition(topX, topY - 0.45, topZ);
      dry.applyMatrix4(md);
      dry.applyMatrix4(mt);
      leaves.push(dry);
    }

    // гроздь фиников
    if (nuts && Math.random() > 0.45) {
      var cluster = 4 + Math.floor(Math.random() * 4);
      var ca = Math.random() * Math.PI * 2;
      for (var n = 0; n < cluster; n++) {
        var nut = new THREE.SphereGeometry(0.16, 6, 5);
        var nx = topX + Math.cos(ca) * (0.5 + Math.random() * 0.5);
        var nz = topZ + Math.sin(ca) * (0.5 + Math.random() * 0.5);
        nut.translate(nx, topY - 0.7 - Math.random() * 0.5, nz);
        nut.applyMatrix4(mt);
        nuts.push(nut);
      }
    }
  };

  /* Материалы кроны и ствола общие на весь мир. */
  World.palmMaterials = function () {
    if (!World._palmMats) {
      var leafTex = World.palmLeafTexture();
      World._palmMats = {
        trunk: new THREE.MeshLambertMaterial({ map: World.palmBarkTexture() }),
        leaf: new THREE.MeshLambertMaterial({
          map: leafTex, side: THREE.DoubleSide, alphaTest: 0.45, transparent: false
        }),
        nut: new THREE.MeshLambertMaterial({ color: 0xc9762f })
      };
    }
    return World._palmMats;
  };

  /* ---------- Деревья других городов ---------- */

  World.barkTexture = function (kind) {
    return canvasTexture(64, 128, function (g, w, h) {
      if (kind === 'birch') {
        g.fillStyle = '#f0efe8';
        g.fillRect(0, 0, w, h);
        g.fillStyle = 'rgba(60,58,54,0.85)';
        for (var i = 0; i < 26; i++) {
          var y = Math.random() * h;
          var len = 6 + Math.random() * 18;
          g.fillRect(Math.random() * w, y, len, 3 + Math.random() * 3);
        }
        g.fillStyle = 'rgba(180,175,160,0.4)';
        for (var k = 0; k < 300; k++) g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      } else {
        g.fillStyle = kind === 'plane' ? '#9a9a86' : '#6b4f35';
        g.fillRect(0, 0, w, h);
        for (var j = 0; j < 900; j++) {
          g.fillStyle = Math.random() > 0.5 ? 'rgba(230,224,206,0.3)' : 'rgba(50,38,26,0.35)';
          g.fillRect(Math.random() * w, Math.random() * h, 3, 5);
        }
        if (kind === 'plane') {                    // пятнистая кора платана
          for (var p = 0; p < 26; p++) {
            g.fillStyle = 'rgba(214,208,186,0.55)';
            g.beginPath();
            g.ellipse(Math.random() * w, Math.random() * h, 5 + Math.random() * 7,
              7 + Math.random() * 9, Math.random(), 0, Math.PI * 2);
            g.fill();
          }
        }
      }
    }, 1, 2);
  };

  /* Лиственное дерево или ёлка. Геометрия кладётся в общие списки. */
  World.treeGeometry = function (kind, x, z, trunks, leaves) {
    var rot = new THREE.Matrix4().makeRotationY(Math.random() * Math.PI * 2);
    rot.setPosition(x, 0, z);

    if (kind === 'spruce') {
      var th = 1.2 + Math.random() * 0.6;
      var trunk = new THREE.CylinderGeometry(0.16, 0.28, th, 6);
      trunk.translate(0, th / 2, 0);
      trunk.applyMatrix4(rot);
      trunks.push(trunk);
      var levels = 4 + Math.floor(Math.random() * 2);
      var y = th * 0.7, r = 2.2 + Math.random() * 0.8;
      for (var i = 0; i < levels; i++) {
        var cone = new THREE.ConeGeometry(r, 2.6, 9);
        cone.translate(0, y + 1.3, 0);
        cone.applyMatrix4(rot);
        leaves.push(cone);
        y += 1.5;
        r *= 0.76;
      }
      return;
    }

    var h = kind === 'birch' ? 7 + Math.random() * 3 : 5.5 + Math.random() * 2.5;
    var rBot = kind === 'birch' ? 0.24 : 0.34;
    var trunk2 = new THREE.CylinderGeometry(rBot * 0.6, rBot, h, 7);
    trunk2.translate(0, h / 2, 0);
    World.scaleUV(trunk2, 1, Math.max(1, Math.round(h / 3)));
    trunk2.applyMatrix4(rot);
    trunks.push(trunk2);

    // ветки
    for (var b = 0; b < 3; b++) {
      var br = new THREE.CylinderGeometry(0.06, 0.1, 1.6, 5);
      var e = new THREE.Euler(0, Math.random() * 6.28, 0.9 + Math.random() * 0.3);
      var mb = new THREE.Matrix4().makeRotationFromEuler(e);
      mb.setPosition(0, h * (0.6 + b * 0.12), 0);
      br.applyMatrix4(mb);
      br.applyMatrix4(rot);
      trunks.push(br);
    }

    // крона из нескольких шаров
    var blobs = kind === 'birch' ? 4 : 5;
    for (var c = 0; c < blobs; c++) {
      var rad = (kind === 'plane' ? 2.4 : 1.9) * (0.7 + Math.random() * 0.5);
      var blob = new THREE.SphereGeometry(rad, 9, 7);
      var ms = new THREE.Matrix4().makeScale(1, kind === 'birch' ? 1.25 : 0.85, 1);
      ms.setPosition((Math.random() - 0.5) * 2.4, h + 0.6 + Math.random() * 1.6,
        (Math.random() - 0.5) * 2.4);
      blob.applyMatrix4(ms);
      blob.applyMatrix4(rot);
      leaves.push(blob);
    }
  };

  World.treeMaterials = function (kind) {
    var key = '_tree_' + kind;
    if (!World[key]) {
      var leafColor = kind === 'sakura' ? 0xf3b6cf
        : (kind === 'spruce' ? 0x2f5c38 : (kind === 'plane' ? 0x6d8f45 : 0x86a84e));
      World[key] = {
        trunk: kind === 'spruce'
          ? new THREE.MeshLambertMaterial({ color: 0x5a4230 })
          : new THREE.MeshLambertMaterial({ map: World.barkTexture(kind) }),
        leaf: new THREE.MeshLambertMaterial({ color: leafColor })
      };
    }
    return World[key];
  };

  /* ---------- Достопримечательности городов ---------- */

  /* Эйфелева башня: четыре гнутые опоры, две площадки, шпиль. */
  World.buildEiffel = function (group, x, z) {
    var iron = new THREE.MeshLambertMaterial({ color: 0x8a7a63 });
    var parts = [];
    var H = 300;

    function legAt(sx, sz) {
      var segs = 14;
      for (var i = 0; i < segs; i++) {
        var t0 = i / segs, t1 = (i + 1) / segs;
        // профиль сужается по экспоненте, как у настоящей башни
        var s0 = Math.pow(1 - t0, 1.7), s1 = Math.pow(1 - t1, 1.7);
        var y0 = t0 * H * 0.78, y1 = t1 * H * 0.78;
        var r0 = 32 * s0 + 1.5, r1 = 32 * s1 + 1.5;
        var thick = 2.6 * (0.35 + s0);
        var len = Math.sqrt((y1 - y0) * (y1 - y0) + (r0 - r1) * (r0 - r1) * 2);
        var beam = new THREE.CylinderGeometry(thick * 0.7, thick, len, 5);
        var midR = (r0 + r1) / 2;
        var e = new THREE.Euler(sz * Math.atan2((r0 - r1), (y1 - y0)) * 0.9, 0,
          -sx * Math.atan2((r0 - r1), (y1 - y0)) * 0.9);
        var m = new THREE.Matrix4().makeRotationFromEuler(e);
        m.setPosition(sx * midR, (y0 + y1) / 2, sz * midR);
        beam.applyMatrix4(m);
        parts.push(beam);
      }
    }
    legAt(1, 1); legAt(1, -1); legAt(-1, 1); legAt(-1, -1);

    // арки между опорами и площадки
    for (var lvl = 0; lvl < 3; lvl++) {
      var ly = [40, 105, 195][lvl];
      var lr = [26, 16, 7][lvl];
      var deck = new THREE.BoxGeometry(lr * 2.6, 3, lr * 2.6);
      deck.translate(0, ly, 0);
      parts.push(deck);
      var rail = new THREE.TorusGeometry(lr * 1.35, 0.5, 6, 4);
      var mr = new THREE.Matrix4().makeRotationX(Math.PI / 2);
      mr.setPosition(0, ly + 2.5, 0);
      rail.applyMatrix4(mr);
      parts.push(rail);
    }

    // решётчатые крестовины
    for (var cx = 0; cx < 22; cx++) {
      var cy = 10 + cx * 9;
      var scale = Math.pow(1 - cy / (H * 0.78), 1.7);
      var half = 32 * scale + 1.5;
      if (half < 2) continue;
      for (var d = 0; d < 4; d++) {
        var brace = new THREE.BoxGeometry(half * 2.6, 0.8, 0.8);
        var mm = new THREE.Matrix4().makeRotationY(d * Math.PI / 2);
        var tilt = new THREE.Matrix4().makeRotationZ((cx % 2 ? 1 : -1) * 0.5);
        mm.multiply(tilt);
        mm.setPosition(0, cy, 0);
        brace.applyMatrix4(mm);
        parts.push(brace);
      }
    }

    var spire = new THREE.CylinderGeometry(0.5, 3, H * 0.22, 8);
    spire.translate(0, H * 0.78 + H * 0.11, 0);
    parts.push(spire);
    var tip = new THREE.SphereGeometry(1.6, 8, 6);
    tip.translate(0, H, 0);
    parts.push(tip);

    var mesh = new THREE.Mesh(World.mergeGeometries(parts), iron);
    mesh.position.set(x, 0, z);
    group.add(mesh);
    return mesh;
  };

  /* Токийская башня: красно-белая решётка с антенной. */
  World.buildTokyoTower = function (group, x, z) {
    var red = new THREE.MeshLambertMaterial({ color: 0xd94436 });
    var white = new THREE.MeshLambertMaterial({ color: 0xf2f2ef });
    var redParts = [], whiteParts = [];
    var H = 250;

    for (var i = 0; i < 16; i++) {
      var t0 = i / 16, t1 = (i + 1) / 16;
      var s0 = Math.pow(1 - t0, 1.5), s1 = Math.pow(1 - t1, 1.5);
      var y0 = t0 * H * 0.7, y1 = t1 * H * 0.7;
      var r0 = 28 * s0 + 2, r1 = 28 * s1 + 2;
      for (var c = 0; c < 4; c++) {
        var ang = c * Math.PI / 2 + Math.PI / 4;
        var len = Math.hypot(y1 - y0, (r0 - r1) * 1.4);
        var beam = new THREE.CylinderGeometry(1.6, 2, len, 5);
        var e = new THREE.Euler(0, 0, Math.atan2(r0 - r1, y1 - y0));
        var m = new THREE.Matrix4().makeRotationFromEuler(e);
        var midR = (r0 + r1) / 2;
        m.setPosition(Math.cos(ang) * midR, (y0 + y1) / 2, Math.sin(ang) * midR);
        var rotAxis = new THREE.Matrix4().makeRotationY(-ang);
        var mm = new THREE.Matrix4().makeRotationY(ang).multiply(
          new THREE.Matrix4().makeRotationFromEuler(e));
        mm.setPosition(Math.cos(ang) * midR, (y0 + y1) / 2, Math.sin(ang) * midR);
        beam.applyMatrix4(mm);
        (i % 2 ? whiteParts : redParts).push(beam);
      }
      // пояс
      var band = new THREE.TorusGeometry(r1 * 1.35, 0.9, 5, 4);
      var mb = new THREE.Matrix4().makeRotationX(Math.PI / 2);
      mb.setPosition(0, y1, 0);
      band.applyMatrix4(mb);
      (i % 2 ? whiteParts : redParts).push(band);
    }

    var deck = new THREE.BoxGeometry(38, 8, 38);
    deck.translate(0, 62, 0);
    whiteParts.push(deck);
    var deck2 = new THREE.CylinderGeometry(11, 12, 7, 10);
    deck2.translate(0, 148, 0);
    whiteParts.push(deck2);

    var mast = new THREE.CylinderGeometry(0.7, 2.4, H * 0.34, 8);
    mast.translate(0, H * 0.7 + H * 0.17, 0);
    redParts.push(mast);

    var r1m = new THREE.Mesh(World.mergeGeometries(redParts), red);
    r1m.position.set(x, 0, z);
    group.add(r1m);
    var w1m = new THREE.Mesh(World.mergeGeometries(whiteParts), white);
    w1m.position.set(x, 0, z);
    group.add(w1m);
  };

  /* Кремлёвская башня со звездой и куском стены. */
  World.buildKremlin = function (group, x, z, angle) {
    var brickMat = new THREE.MeshLambertMaterial({ map: World.brickTexture('#9c3b34') });
    var whiteMat = new THREE.MeshLambertMaterial({ color: 0xeae4d8 });
    var roofMat = new THREE.MeshLambertMaterial({ color: 0x2f5c4a });
    var goldMat = new THREE.MeshPhongMaterial({ color: 0xd9a441, specular: 0xfff0c0, shininess: 70 });

    var root = new THREE.Group();
    root.position.set(x, 0, z);
    root.rotation.y = angle || 0;
    group.add(root);

    var brick = [];
    // стена с зубцами-ласточкиными хвостами
    for (var side = -1; side <= 1; side += 2) {
      var wall = new THREE.BoxGeometry(90, 12, 4);
      wall.translate(side * 62, 6, 0);
      brick.push(wall);
      for (var t = -44; t <= 44; t += 5.5) {
        var merlon = new THREE.BoxGeometry(3, 4, 4.4);
        merlon.translate(side * 62 + t, 14, 0);
        brick.push(merlon);
        var horn1 = new THREE.BoxGeometry(1.1, 2.2, 4.4);
        horn1.translate(side * 62 + t - 1.1, 17, 0);
        brick.push(horn1);
        var horn2 = new THREE.BoxGeometry(1.1, 2.2, 4.4);
        horn2.translate(side * 62 + t + 1.1, 17, 0);
        brick.push(horn2);
      }
    }
    // сама башня
    var base = new THREE.BoxGeometry(20, 34, 20);
    base.translate(0, 17, 0);
    brick.push(base);
    var mid = new THREE.BoxGeometry(15, 16, 15);
    mid.translate(0, 42, 0);
    brick.push(mid);
    root.add(new THREE.Mesh(World.mergeGeometries(brick), brickMat));

    // белые пояса и часы
    var whites = [];
    var belt = new THREE.BoxGeometry(21.5, 2.4, 21.5);
    belt.translate(0, 34, 0);
    whites.push(belt);
    var belt2 = new THREE.BoxGeometry(16.5, 2, 16.5);
    belt2.translate(0, 50, 0);
    whites.push(belt2);
    root.add(new THREE.Mesh(World.mergeGeometries(whites), whiteMat));

    var clockTex = canvasTexture(128, 128, function (g, w, h) {
      g.fillStyle = '#2b2b2b';
      g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 4, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#e0b954';
      g.lineWidth = 5;
      g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 8, 0, Math.PI * 2); g.stroke();
      g.fillStyle = '#e0b954';
      for (var i = 0; i < 12; i++) {
        var a = i / 12 * Math.PI * 2;
        g.beginPath();
        g.arc(w / 2 + Math.cos(a) * (w / 2 - 18), h / 2 + Math.sin(a) * (h / 2 - 18), 4, 0, Math.PI * 2);
        g.fill();
      }
      g.lineWidth = 6;
      g.strokeStyle = '#e0b954';
      g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 + 24, h / 2 - 26); g.stroke();
      g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 - 12, h / 2 - 34); g.stroke();
    });
    for (var f = 0; f < 4; f++) {
      var clock = new THREE.Mesh(new THREE.PlaneGeometry(11, 11),
        new THREE.MeshLambertMaterial({ map: clockTex }));
      var a2 = f * Math.PI / 2;
      clock.position.set(Math.sin(a2) * 7.7, 42, Math.cos(a2) * 7.7);
      clock.rotation.y = a2;
      root.add(clock);
    }

    // зелёный шатёр и рубиновая звезда
    var tent = new THREE.Mesh(new THREE.ConeGeometry(12, 26, 8), roofMat);
    tent.position.y = 64;
    root.add(tent);
    var pin = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 6, 6), goldMat);
    pin.position.y = 79;
    root.add(pin);
    var star = new THREE.Mesh(new THREE.OctahedronGeometry(3.2, 0),
      new THREE.MeshPhongMaterial({ color: 0xd83a3a, emissive: 0x6a1010, shininess: 80 }));
    star.position.y = 83.5;
    root.add(star);
    return root;
  };

  /* Набережная Брюгге: ряд разноцветных домиков со ступенчатыми фронтонами. */
  World.buildFlemishRow = function (group, x, z, angle) {
    var root = new THREE.Group();
    root.position.set(x, 0, z);
    root.rotation.y = angle || 0;
    group.add(root);

    var colors = [0xd05a4a, 0xe0b23c, 0x4f8fbf, 0x6fae63, 0xd68ab0, 0xe4dcc8, 0xb06a3c];
    var roofMat = new THREE.MeshLambertMaterial({ color: 0x6b3f34 });
    var trimMat = new THREE.MeshLambertMaterial({ color: 0xf2ece0 });
    var roofs = [], trims = [];

    for (var i = 0; i < 9; i++) {
      var wdt = 9 + Math.random() * 4;
      var hgt = 14 + Math.random() * 8;
      var px = (i - 4) * 12;
      var mat = new THREE.MeshLambertMaterial({ color: colors[i % colors.length] });

      var house = new THREE.Mesh(new THREE.BoxGeometry(wdt, hgt, 12), mat);
      house.position.set(px, hgt / 2, 0);
      root.add(house);

      // ступенчатый фронтон
      var steps = 4;
      for (var stp = 0; stp < steps; stp++) {
        var sw = wdt * (1 - stp * 0.22);
        var step = new THREE.Mesh(new THREE.BoxGeometry(sw, 1.6, 12.4), mat);
        step.position.set(px, hgt + 0.8 + stp * 1.6, 0);
        root.add(step);
      }

      var roof = new THREE.BoxGeometry(wdt * 0.35, 1.4, 12.6);
      roof.translate(px, hgt + steps * 1.6 + 1.4, 0);
      roofs.push(roof);

      // окна
      for (var fl = 0; fl < 3; fl++) {
        for (var c = -1; c <= 1; c++) {
          var win = new THREE.BoxGeometry(2.2, 3, 0.4);
          win.translate(px + c * 3, 3.5 + fl * 4.2, 6.1);
          trims.push(win);
        }
      }
      var door = new THREE.BoxGeometry(2.6, 4, 0.5);
      door.translate(px, 2, 6.15);
      trims.push(door);
    }
    root.add(new THREE.Mesh(World.mergeGeometries(roofs), roofMat));
    root.add(new THREE.Mesh(World.mergeGeometries(trims), trimMat));

    // башенка с часами в середине
    var tower = new THREE.Mesh(new THREE.BoxGeometry(11, 34, 11),
      new THREE.MeshLambertMaterial({ color: 0xe4dcc8 }));
    tower.position.set(0, 17, -16);
    root.add(tower);
    var spire = new THREE.Mesh(new THREE.ConeGeometry(8, 16, 6), roofMat);
    spire.position.set(0, 42, -16);
    root.add(spire);
    return root;
  };

  /* ---------- Печка ---------- */  /* ---------- Печка ---------- */

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

  /* Шерсть: песочная, с подпалинами и лохматостью. */
  World.camelFurTexture = function () {
    return canvasTexture(128, 128, function (g, w, h) {
      g.fillStyle = '#c69a5f';
      g.fillRect(0, 0, w, h);
      for (var i = 0; i < 2200; i++) {
        var v = Math.random();
        g.fillStyle = v > 0.6 ? 'rgba(226,190,140,0.45)'
          : (v > 0.3 ? 'rgba(160,118,68,0.35)' : 'rgba(110,78,44,0.25)');
        g.fillRect(Math.random() * w, Math.random() * h, 2.5, 4);
      }
      // клочья шерсти
      g.strokeStyle = 'rgba(232,200,150,0.5)';
      g.lineWidth = 1.4;
      for (var k = 0; k < 60; k++) {
        var x = Math.random() * w, y = Math.random() * h;
        g.beginPath();
        g.moveTo(x, y);
        g.quadraticCurveTo(x + 3, y + 6, x - 2, y + 12);
        g.stroke();
      }
    }, 2, 2);
  };

  /* Морда: добрые глаза с ресницами, ноздри, губа. */
  World.camelFaceTexture = function () {
    return canvasTexture(128, 128, function (g, w, h) {
      g.fillStyle = '#c69a5f';
      g.fillRect(0, 0, w, h);
      for (var i = 0; i < 900; i++) {
        g.fillStyle = Math.random() > 0.5 ? 'rgba(226,190,140,0.4)' : 'rgba(150,110,64,0.3)';
        g.fillRect(Math.random() * w, Math.random() * h, 2.5, 3);
      }
      var cx = w * 0.5, cy = h * 0.45;
      // глаза по бокам морды
      for (var s = -1; s <= 1; s += 2) {
        var ex = cx + s * 30;
        g.fillStyle = '#f4e6d2';
        g.beginPath(); g.ellipse(ex, cy - 12, 9, 7, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#2b1d12';
        g.beginPath(); g.ellipse(ex, cy - 11, 5.5, 5, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#fff';
        g.beginPath(); g.arc(ex - 2, cy - 13, 1.6, 0, Math.PI * 2); g.fill();
        // ресницы
        g.strokeStyle = '#3a2716';
        g.lineWidth = 1.6;
        for (var l = -2; l <= 2; l++) {
          g.beginPath();
          g.moveTo(ex + l * 4, cy - 18);
          g.lineTo(ex + l * 4.6, cy - 24);
          g.stroke();
        }
      }
      // ноздри и губа ближе к «носу» развёртки
      g.fillStyle = 'rgba(90,60,36,0.85)';
      g.beginPath(); g.ellipse(cx - 9, cy + 26, 4.5, 6, 0.3, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.ellipse(cx + 9, cy + 26, 4.5, 6, -0.3, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(120,84,50,0.8)';
      g.lineWidth = 2.5;
      g.beginPath();
      g.moveTo(cx - 14, cy + 38);
      g.quadraticCurveTo(cx, cy + 44, cx + 14, cy + 38);
      g.stroke();
    });
  };

  /* Ковровая попона с кистями. */
  World.camelRugTexture = function () {
    return canvasTexture(128, 64, function (g, w, h) {
      g.fillStyle = '#a8322c';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#e0a83c';
      g.fillRect(0, 6, w, 5);
      g.fillRect(0, h - 11, w, 5);
      g.fillStyle = '#2f6f8f';
      for (var x = 6; x < w; x += 22) {
        g.beginPath();
        g.moveTo(x, h / 2 - 11); g.lineTo(x + 11, h / 2); g.lineTo(x, h / 2 + 11); g.lineTo(x - 11, h / 2);
        g.closePath(); g.fill();
      }
      g.fillStyle = '#f0e0c0';
      for (var d = 14; d < w; d += 22) {
        g.beginPath(); g.arc(d, h / 2, 3.2, 0, Math.PI * 2); g.fill();
      }
    }, 2, 1);
  };

  /* Дромадер: один горб, длинная гнутая шея, суставчатые ноги, попона. */
  World.buildCamel = function () {
    var g = new THREE.Group();
    var fur = new THREE.MeshLambertMaterial({ map: World.camelFurTexture() });
    var dark = new THREE.MeshLambertMaterial({ color: 0x7a5734 });

    // ---- корпус, горб и шея ----
    var body = [];
    var barrel = new THREE.SphereGeometry(1, 16, 12);
    var mb = new THREE.Matrix4().makeScale(0.9, 0.95, 1.7);
    mb.setPosition(0, 1.85, -0.1);
    barrel.applyMatrix4(mb);
    body.push(barrel);

    // грудь пошире, круп поуже
    var chest = new THREE.SphereGeometry(0.85, 14, 10);
    var mch = new THREE.Matrix4().makeScale(1, 1.05, 0.9);
    mch.setPosition(0, 1.95, 1.05);
    chest.applyMatrix4(mch);
    body.push(chest);

    var hump = new THREE.SphereGeometry(0.72, 14, 12);
    var mh = new THREE.Matrix4().makeScale(0.9, 1.15, 1.05);
    mh.setPosition(0, 2.75, -0.25);
    hump.applyMatrix4(mh);
    body.push(hump);

    // шея из сегментов по дуге
    var neckPts = [
      { y: 2.35, z: 1.5, r: 0.42 },
      { y: 2.75, z: 1.85, r: 0.36 },
      { y: 3.15, z: 2.05, r: 0.31 },
      { y: 3.5, z: 2.15, r: 0.27 }
    ];
    for (var i = 0; i < neckPts.length; i++) {
      var seg = new THREE.SphereGeometry(neckPts[i].r, 12, 10);
      var ms = new THREE.Matrix4().makeScale(1, 1.25, 1);
      ms.setPosition(0, neckPts[i].y, neckPts[i].z);
      seg.applyMatrix4(ms);
      body.push(seg);
    }
    g.add(new THREE.Mesh(World.mergeGeometries(body), fur));

    // грива под шеей
    var mane = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.5, 1.0),
      new THREE.MeshLambertMaterial({ color: 0x8a6238 }));
    mane.position.set(0, 2.75, 1.72);
    mane.rotation.x = -0.5;
    g.add(mane);

    // ---- голова ----
    var head = new THREE.Group();
    head.position.set(0, 3.62, 2.2);
    g.add(head);

    var skull = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 12),
      new THREE.MeshLambertMaterial({ map: World.camelFaceTexture() }));
    skull.scale.set(0.85, 0.95, 1.5);
    skull.position.z = 0.15;
    head.add(skull);

    var muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 10), fur);
    muzzle.scale.set(0.9, 0.8, 1.2);
    muzzle.position.set(0, -0.1, 0.55);
    head.add(muzzle);

    var ears = [];
    for (var ex = -1; ex <= 1; ex += 2) {
      var ear = new THREE.SphereGeometry(0.11, 8, 6);
      var me = new THREE.Matrix4().makeScale(0.55, 1, 0.4);
      me.setPosition(ex * 0.2, 0.26, -0.1);
      ear.applyMatrix4(me);
      ears.push(ear);
    }
    head.add(new THREE.Mesh(World.mergeGeometries(ears), fur));

    // недоуздок
    var halter = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.028, 6, 14), dark);
    halter.rotation.y = Math.PI / 2;
    halter.position.set(0, -0.05, 0.42);
    head.add(halter);

    // ---- ноги с коленями ----
    var legPivots = [];
    for (var lx = -1; lx <= 1; lx += 2) {
      for (var lz = -1; lz <= 1; lz += 2) {
        var pivot = new THREE.Group();
        pivot.position.set(lx * 0.55, 1.75, lz === 1 ? 0.95 : -0.95);

        var parts = [];
        var thigh = new THREE.CylinderGeometry(0.19, 0.14, 0.85, 8);
        thigh.translate(0, -0.42, 0);
        parts.push(thigh);
        var knee = new THREE.SphereGeometry(0.16, 8, 6);
        knee.translate(0, -0.85, lz === 1 ? 0.04 : -0.04);
        parts.push(knee);
        var shin = new THREE.CylinderGeometry(0.11, 0.09, 0.8, 8);
        shin.translate(0, -1.28, lz === 1 ? 0.06 : -0.06);
        parts.push(shin);
        pivot.add(new THREE.Mesh(World.mergeGeometries(parts), fur));

        // широкая двупалая ступня
        var pad = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), dark);
        pad.scale.set(1, 0.45, 1.25);
        pad.position.set(0, -1.7, lz === 1 ? 0.1 : -0.1);
        pivot.add(pad);

        g.add(pivot);
        legPivots.push(pivot);
      }
    }

    // ---- попона и седло ----
    var rug = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.12, 1.5),
      new THREE.MeshLambertMaterial({ map: World.camelRugTexture() }));
    rug.position.set(0, 2.42, 0.35);
    rug.rotation.x = -0.06;
    g.add(rug);

    var saddle = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.42, 0.3, 10), dark);
    saddle.position.set(0, 3.06, -0.25);
    g.add(saddle);

    // кисти по краю попоны
    var tassels = [];
    for (var tx = -1; tx <= 1; tx += 2) {
      for (var t = -2; t <= 2; t++) {
        var tas = new THREE.CylinderGeometry(0.04, 0.02, 0.28, 5);
        tas.translate(tx * 0.93, 2.28, 0.35 + t * 0.3);
        tassels.push(tas);
      }
    }
    g.add(new THREE.Mesh(World.mergeGeometries(tassels),
      new THREE.MeshLambertMaterial({ color: 0xe0a83c })));

    // ---- хвост ----
    var tail = new THREE.Group();
    tail.position.set(0, 2.35, -1.55);
    var tailMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.04, 0.9, 6), fur);
    tailMesh.position.y = -0.45;
    tail.add(tailMesh);
    var tuft = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), dark);
    tuft.scale.set(0.8, 1.4, 0.8);
    tuft.position.y = -0.95;
    tail.add(tuft);
    tail.rotation.x = 0.35;
    g.add(tail);

    var shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 4.6),
      new THREE.MeshBasicMaterial({ map: World.shadowTexture(), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.05;
    g.add(shadow);

    g.visible = false;
    g.userData = { legs: legPivots, blob: shadow, head: head, tail: tail, neckBob: 0 };
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

  /* ---------- Ливень ---------- */

  World.RainSystem = function (scene, count) {
    var n = count || 1400;
    var geo = new THREE.BufferGeometry();
    var pos = new Float32Array(n * 3);
    this.box = { x: 120, y: 70, z: 120 };
    for (var i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * this.box.x;
      pos[i * 3 + 1] = Math.random() * this.box.y;
      pos[i * 3 + 2] = (Math.random() - 0.5) * this.box.z;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    // капля — вытянутый штрих, чтобы точки читались как струи
    var tex = canvasTexture(32, 64, function (g, w, h) {
      g.clearRect(0, 0, w, h);
      var grd = g.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, 'rgba(200,225,245,0)');
      grd.addColorStop(0.45, 'rgba(214,236,255,0.85)');
      grd.addColorStop(1, 'rgba(190,220,245,0)');
      g.fillStyle = grd;
      g.fillRect(w / 2 - 2, 0, 4, h);
    });
    this.points = new THREE.Points(geo, new THREE.PointsMaterial({
      map: tex, size: 2.6, transparent: true, opacity: 0,
      depthWrite: false, sizeAttenuation: true, fog: false
    }));
    this.points.frustumCulled = false;
    this.points.visible = false;
    scene.add(this.points);
    this.fall = new THREE.Vector3(-8, -52, 3);

    // снежинка: мягкий пушистый кружок — та же система, другой режим
    this.rainTex = tex;
    this.snowTex = canvasTexture(32, 32, function (g, w, h) {
      g.clearRect(0, 0, w, h);
      var grd = g.createRadialGradient(16, 16, 1, 16, 16, 15);
      grd.addColorStop(0, 'rgba(255,255,255,0.95)');
      grd.addColorStop(0.5, 'rgba(240,248,255,0.55)');
      grd.addColorStop(1, 'rgba(230,240,255,0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, w, h);
    });
    this.mode = 'rain';
  };

  /* Тот же поток частиц умеет быть и снегопадом: медленнее и пушистее. */
  World.RainSystem.prototype.setMode = function (mode) {
    if (this.mode === mode) return;
    this.mode = mode;
    var m = this.points.material;
    if (mode === 'snow') {
      m.map = this.snowTex;
      m.size = 1.5;
      this.fall.set(-2.6, -6.5, 1.4);
    } else {
      m.map = this.rainTex;
      m.size = 2.6;
      this.fall.set(-8, -52, 3);
    }
    m.needsUpdate = true;
  };

  World.RainSystem.prototype.update = function (dt, level, camPos) {
    this.points.visible = level > 0.01;
    this.points.material.opacity = Math.min(0.9, level);
    if (!this.points.visible) return;
    var arr = this.points.geometry.attributes.position.array;
    var bx = this.box.x, by = this.box.y, bz = this.box.z;
    for (var i = 0; i < arr.length; i += 3) {
      arr[i] += this.fall.x * dt;
      arr[i + 1] += this.fall.y * dt;
      arr[i + 2] += this.fall.z * dt;
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

  /* ---------- Тротуары ---------- */

  function sidewalkTexture() {
    return canvasTexture(128, 128, function (g, w, h) {
      g.fillStyle = '#c6bfae';
      g.fillRect(0, 0, w, h);
      for (var i = 0; i < 2600; i++) {
        g.fillStyle = Math.random() > 0.5 ? 'rgba(255,252,240,0.22)' : 'rgba(120,112,96,0.2)';
        g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
      }
      // швы между плитами 2×2
      g.strokeStyle = 'rgba(96,90,78,0.55)';
      g.lineWidth = 2;
      for (var k = 0; k <= 2; k++) {
        g.beginPath(); g.moveTo(k * w / 2, 0); g.lineTo(k * w / 2, h); g.stroke();
        g.beginPath(); g.moveTo(0, k * h / 2); g.lineTo(w, k * h / 2); g.stroke();
      }
    });
  }

  /* Тротуар с бордюром по обеим сторонам дороги — по нему ходят люди.
     Лежит за краем асфальта, печкам туда не заехать. */
  World.sidewalkMesh = function (track) {
    var inner = track.width / 2 + 0.6;
    var outer = track.width / 2 + 4.6;
    var top = 0.3;
    var N = 500;
    var pos = [], uv = [], idx = [];
    var base = 0;
    for (var s = 0; s < 2; s++) {
      var sign = s === 0 ? 1 : -1;
      for (var i = 0; i <= N; i++) {
        var d = track.length * i / N;
        var p = track.pointAt(d);
        var n = track.sideAt(d);
        var a = p.clone().addScaledVector(n, sign * inner);
        var b = p.clone().addScaledVector(n, sign * outer);
        var v = d / 5;
        pos.push(a.x, p.y + 0.02, a.z);     // низ бордюра
        pos.push(a.x, p.y + top, a.z);      // верх бордюра
        pos.push(b.x, p.y + top, b.z);      // внешний край
        uv.push(0, v, 0.14, v, 1, v);
        if (i < N) {
          var q = base + i * 3;
          idx.push(q, q + 3, q + 1, q + 1, q + 3, q + 4);          // бордюр
          idx.push(q + 1, q + 4, q + 2, q + 2, q + 4, q + 5);      // плитка
        }
      }
      base += (N + 1) * 3;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({
      map: sidewalkTexture(), color: World.theme.sidewalk || 0xffffff
    }));
  };

  World.sidewalkOffset = function (track) { return track.width / 2 + 2.6; };

  /* ---------- Пешеходы ---------- */

  /* Цвета пешеходов сложены в одну палитру-текстуру: тогда вся фигурка
     склеивается в пару сеток и не съедает draw call'ы. */
  var PED_COLORS = [
    '#e9bd97', '#cd935f', '#8d5a3b',                                  // 0..2 кожа
    '#241d16', '#6b4b2a', '#c9b287', '#8d8d8d',                       // 3..6 волосы
    '#e14b4b', '#3f7fd8', '#39b06a', '#f0c23c', '#8a5cc4', '#eae6de', // 7..12 верх
    '#2c3550', '#42506b', '#6b5f4a', '#22242a',                       // 13..16 низ
    '#f6f4ee', '#e2ded2', '#1a1a1e', '#c9433c', '#2f6f5a'             // 17..21 роба, обувь, сумка
  ];
  var PED_PALETTE = null;
  function pedPalette() {
    if (PED_PALETTE) return PED_PALETTE;
    var c = document.createElement('canvas');
    c.width = 32; c.height = 1;
    var g = c.getContext('2d');
    for (var i = 0; i < 32; i++) {
      g.fillStyle = PED_COLORS[i] || '#888888';
      g.fillRect(i, 0, 1, 1);
    }
    PED_PALETTE = new THREE.CanvasTexture(c);
    PED_PALETTE.magFilter = THREE.NearestFilter;
    PED_PALETTE.minFilter = THREE.NearestFilter;
    PED_PALETTE.generateMipmaps = false;
    PED_PALETTE.encoding = THREE.sRGBEncoding;
    return PED_PALETTE;
  }

  /* Красим геометрию «цветом номер i», перекидывая все её UV в один пиксель палитры. */
  function paint(geo, i) {
    var uv = geo.attributes.uv;
    var u = (i + 0.5) / 32;
    for (var k = 0; k < uv.count; k++) uv.setXY(k, u, 0.5);
    uv.needsUpdate = true;
    return geo;
  }

  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

  /* Человек на тротуаре: горожанин, дама в юбке или араб в кандуре.
     Ноги — отдельные сетки, чтобы шагали. */
  World.buildPedestrian = function (kind) {
    var g = new THREE.Group();
    var mat = new THREE.MeshLambertMaterial({ map: pedPalette() });
    kind = kind || pick(['man', 'woman', 'thobe', 'man', 'woman']);

    var skin = pick([0, 0, 1, 1, 2]);
    var hair = pick([3, 3, 4, 5, 6]);
    var shirt = pick([7, 8, 9, 10, 11, 12]);
    var pants = pick([13, 14, 15, 16]);
    var tall = 0.92 + Math.random() * 0.16;
    if (kind === 'thobe') { shirt = 17; pants = 17; }

    // ноги: две отдельные сетки с осью вращения в бедре
    var legs = [];
    for (var s = -1; s <= 1; s += 2) {
      var lg = new THREE.Group();
      lg.position.set(s * 0.13, 0.82, 0);
      var parts = [];
      var shin = new THREE.CylinderGeometry(0.075, 0.065, 0.8, 7);
      shin.translate(0, -0.4, 0);
      parts.push(paint(shin, kind === 'woman' && Math.random() < 0.5 ? skin : pants));
      var shoe = new THREE.BoxGeometry(0.15, 0.1, 0.28);
      shoe.translate(0, -0.83, 0.05);
      parts.push(paint(shoe, 19));
      var leg = new THREE.Mesh(World.mergeGeometries(parts), mat);
      lg.add(leg);
      g.add(lg);
      legs.push(lg);
    }

    // корпус, руки и голова — одной сеткой
    var body = [];
    if (kind === 'woman') {
      var skirt = new THREE.CylinderGeometry(0.19, 0.3, 0.5, 12);
      skirt.translate(0, 0.86, 0);
      body.push(paint(skirt, pants));
    } else if (kind === 'thobe') {
      var robe = new THREE.CylinderGeometry(0.2, 0.34, 1.12, 12);
      robe.translate(0, 0.62, 0);
      body.push(paint(robe, 17));
    }
    var torso = new THREE.CylinderGeometry(0.19, 0.21, 0.5, 12);
    torso.translate(0, 1.12, 0);
    body.push(paint(torso, shirt));
    var shoulders = new THREE.SphereGeometry(0.2, 12, 8);
    var msh = new THREE.Matrix4().makeScale(1.1, 0.6, 0.9);
    msh.setPosition(0, 1.35, 0);
    shoulders.applyMatrix4(msh);
    body.push(paint(shoulders, shirt));

    for (var ax = -1; ax <= 1; ax += 2) {
      var arm = new THREE.CylinderGeometry(0.055, 0.05, 0.56, 7);
      var ma = new THREE.Matrix4().makeRotationZ(ax * 0.12);
      ma.setPosition(ax * 0.24, 1.06, 0);
      arm.applyMatrix4(ma);
      body.push(paint(arm, kind === 'thobe' ? 17 : shirt));
      var hand = new THREE.SphereGeometry(0.06, 8, 6);
      hand.translate(ax * 0.28, 0.78, 0);
      body.push(paint(hand, skin));
    }

    var neck = new THREE.CylinderGeometry(0.06, 0.07, 0.1, 8);
    neck.translate(0, 1.45, 0);
    body.push(paint(neck, skin));
    var head = new THREE.SphereGeometry(0.125, 14, 10);
    var mh = new THREE.Matrix4().makeScale(0.92, 1.1, 0.95);
    mh.setPosition(0, 1.58, 0);
    head.applyMatrix4(mh);
    body.push(paint(head, skin));
    var nose = new THREE.ConeGeometry(0.03, 0.07, 6);
    var mn = new THREE.Matrix4().makeRotationX(Math.PI / 2);
    mn.setPosition(0, 1.57, 0.12);
    nose.applyMatrix4(mn);
    body.push(paint(nose, skin));

    if (kind === 'thobe') {
      // гутра: белый платок и чёрный обруч
      var cloth = new THREE.SphereGeometry(0.145, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62);
      cloth.translate(0, 1.585, 0);
      body.push(paint(cloth, 18));
      var back = new THREE.BoxGeometry(0.24, 0.3, 0.1);
      back.translate(0, 1.46, -0.11);
      body.push(paint(back, 18));
      var ring = new THREE.TorusGeometry(0.13, 0.022, 6, 14);
      var mr = new THREE.Matrix4().makeRotationX(Math.PI / 2);
      mr.setPosition(0, 1.64, 0);
      ring.applyMatrix4(mr);
      body.push(paint(ring, 19));
    } else {
      var cap = new THREE.SphereGeometry(0.132, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55);
      cap.translate(0, 1.585, 0);
      body.push(paint(cap, hair));
      if (kind === 'woman') {                     // длинные волосы по спине
        var mane = new THREE.BoxGeometry(0.2, 0.34, 0.11);
        mane.translate(0, 1.44, -0.1);
        body.push(paint(mane, hair));
      }
    }

    if (Math.random() < 0.45) {                   // сумка через плечо
      var bag = new THREE.BoxGeometry(0.22, 0.24, 0.1);
      bag.translate(0.24, 0.95, 0.05);
      body.push(paint(bag, pick([20, 21, 13])));
    }

    g.add(new THREE.Mesh(World.mergeGeometries(body), mat));
    g.scale.setScalar(tall);
    g.userData.legs = legs;
    g.userData.kind = kind;
    return g;
  };

  /* ---------- Дорожные знаки и плакаты ---------- */

  World.speedSign = function (limit) {
    var g = new THREE.Group();
    var post = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 2.9, 8),
      new THREE.MeshLambertMaterial({ color: 0x9aa0a6 }));
    post.position.y = 1.45;
    g.add(post);

    var tex = canvasTexture(128, 128, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#f5f2ea';
      ctx.beginPath(); ctx.arc(64, 64, 60, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 15;
      ctx.strokeStyle = '#d02b23';
      ctx.beginPath(); ctx.arc(64, 64, 52, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#17171b';
      ctx.font = 'bold 58px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(limit), 64, 68);
    });
    var mat = new THREE.MeshLambertMaterial({ map: tex, transparent: true,
      side: THREE.DoubleSide, alphaTest: 0.4 });
    for (var s = 0; s < 2; s++) {
      var disc = new THREE.Mesh(new THREE.CircleGeometry(0.62, 24), mat);
      disc.position.set(0, 2.7, s ? -0.045 : 0.045);
      disc.rotation.y = s ? Math.PI : 0;
      g.add(disc);
    }

    // камера-радар на кронштейне: понятно, что штраф выпишут
    var cam = new THREE.Group();
    var box = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.26, 0.5),
      new THREE.MeshLambertMaterial({ color: 0x4a4f57 }));
    cam.add(box);
    var lens = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.12, 10),
      new THREE.MeshLambertMaterial({ color: 0x1b1d22, emissive: 0x331010 }));
    lens.rotation.x = Math.PI / 2;
    lens.position.z = 0.28;
    cam.add(lens);
    cam.position.set(0, 3.45, 0.2);
    g.add(cam);
    g.userData.lens = lens;

    var arm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.55, 0.06),
      new THREE.MeshLambertMaterial({ color: 0x9aa0a6 }));
    arm.position.set(0, 3.15, 0.2);
    g.add(arm);

    g.userData.limit = limit;
    return g;
  };

  /* Плакат у дороги с народной мудростью. */
  World.billboard = function (lines, accent) {
    var g = new THREE.Group();
    var W = 7.6, H = 3.4;
    var tex = canvasTexture(512, 232, function (ctx, w, h) {
      var grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#f7f2e4');
      grad.addColorStop(1, '#e6dcc4');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = accent || '#c0392b';
      ctx.lineWidth = 12;
      ctx.strokeRect(6, 6, w - 12, h - 12);
      ctx.fillStyle = accent || '#c0392b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var size = lines.length > 1 ? 44 : 56;
      for (var i = 0; i < lines.length; i++) {
        var t = lines[i];
        ctx.font = 'bold ' + size + 'px system-ui, -apple-system, sans-serif';
        while (ctx.measureText(t).width > w - 60 && size > 20) {
          size -= 2;
          ctx.font = 'bold ' + size + 'px system-ui, -apple-system, sans-serif';
        }
        ctx.fillText(t, w / 2, h / 2 + (i - (lines.length - 1) / 2) * (size + 12));
      }
    });

    var panel = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.18),
      [new THREE.MeshLambertMaterial({ color: 0x8a8378 }),
       new THREE.MeshLambertMaterial({ color: 0x8a8378 }),
       new THREE.MeshLambertMaterial({ color: 0x8a8378 }),
       new THREE.MeshLambertMaterial({ color: 0x8a8378 }),
       new THREE.MeshLambertMaterial({ map: tex }),
       new THREE.MeshLambertMaterial({ color: 0x6f6a62 })]);
    panel.position.y = H / 2 + 2.6;
    g.add(panel);

    var legs = [];
    for (var s = -1; s <= 1; s += 2) {
      var leg = new THREE.CylinderGeometry(0.12, 0.14, 2.7, 8);
      leg.translate(s * W * 0.32, 1.35, 0);
      legs.push(leg);
    }
    var brace = new THREE.BoxGeometry(W * 0.72, 0.14, 0.14);
    brace.translate(0, 2.2, 0);
    legs.push(brace);
    g.add(new THREE.Mesh(World.mergeGeometries(legs),
      new THREE.MeshLambertMaterial({ color: 0x7d766c })));
    return g;
  };

  World.BILLBOARDS = [
    { lines: ['НЕ ПЕЙ ЗА РУЛЁМ!'], accent: '#c0392b' },
    { lines: ['НЕ ГОНИ —', 'ТЕБЯ ДОМА ЖДЁТ СЕМЬЯ!'], accent: '#1f6f4a' },
    { lines: ['ПРОПУСТИ БАБУШКУ —', 'ОНА ТОЖЕ ЧЬЯ-ТО МАМА'], accent: '#8a5cc4' },
    { lines: ['ПЕЧЬ ЛЮБИТ ДРОВА,', 'А ДОРОГА — ТРЕЗВЫХ'], accent: '#b45309' }
  ];

  /* ---------- Кактусы ---------- */

  World.cactusGeometry = function (x, z, geos) {
    var h = 2.4 + Math.random() * 2.6;
    var r = 0.26 + Math.random() * 0.12;
    var trunk = new THREE.CylinderGeometry(r * 0.92, r, h, 9);
    trunk.translate(x, h / 2, z);
    geos.push(trunk);
    var capTop = new THREE.SphereGeometry(r * 0.92, 9, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    capTop.translate(x, h, z);
    geos.push(capTop);

    var arms = Math.random() < 0.75 ? (Math.random() < 0.4 ? 2 : 1) : 0;
    for (var a = 0; a < arms; a++) {
      var side = a === 0 ? (Math.random() < 0.5 ? 1 : -1) : -1;
      var ang = Math.random() * Math.PI * 2;
      var dx = Math.cos(ang) * side, dz = Math.sin(ang) * side;
      var base = h * (0.42 + Math.random() * 0.2);
      var run = 0.55 + Math.random() * 0.3;
      var armR = r * 0.72;
      var horiz = new THREE.CylinderGeometry(armR, armR, run * 2, 8);
      var mh = new THREE.Matrix4().makeRotationZ(Math.PI / 2);
      mh.premultiply(new THREE.Matrix4().makeRotationY(-ang));
      mh.setPosition(x + dx * run, base, z + dz * run);
      horiz.applyMatrix4(mh);
      geos.push(horiz);
      var up = 0.9 + Math.random() * 1.1;
      var vert = new THREE.CylinderGeometry(armR * 0.92, armR, up, 8);
      vert.translate(x + dx * run * 2, base + up / 2, z + dz * run * 2);
      geos.push(vert);
      var tip = new THREE.SphereGeometry(armR * 0.92, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
      tip.translate(x + dx * run * 2, base + up, z + dz * run * 2);
      geos.push(tip);
    }

    // рядом парочка «бочонков»
    if (Math.random() < 0.5) {
      var br = 0.35 + Math.random() * 0.3;
      var ball = new THREE.SphereGeometry(br, 9, 7);
      var mb = new THREE.Matrix4().makeScale(1, 0.75, 1);
      mb.setPosition(x + (Math.random() - 0.5) * 3.4, br * 0.7, z + (Math.random() - 0.5) * 3.4);
      ball.applyMatrix4(mb);
      geos.push(ball);
    }
  };

  World.cactusMaterial = function () {
    return new THREE.MeshLambertMaterial({
      map: canvasTexture(64, 64, function (g, w, h) {
        g.fillStyle = '#4a7b45';
        g.fillRect(0, 0, w, h);
        for (var i = 0; i < 7; i++) {                 // рёбра
          g.strokeStyle = i % 2 ? 'rgba(30,58,30,0.5)' : 'rgba(126,168,110,0.45)';
          g.lineWidth = 3;
          g.beginPath(); g.moveTo(i * w / 7 + 3, 0); g.lineTo(i * w / 7 + 3, h); g.stroke();
        }
        for (var k = 0; k < 130; k++) {               // колючки
          g.fillStyle = 'rgba(240,232,190,0.7)';
          g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
        }
      }, 1, 3)
    });
  };

  /* ---------- Солнечная монетка ---------- */

  World.buildCoin = function () {
    var g = new THREE.Group();
    var face = canvasTexture(128, 128, function (ctx, w, h) {
      var grad = ctx.createRadialGradient(52, 46, 6, 64, 64, 64);
      grad.addColorStop(0, '#fff6c8');
      grad.addColorStop(0.6, '#ffd23f');
      grad.addColorStop(1, '#c98f14');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#a9740c';
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(64, 64, 56, 0, Math.PI * 2); ctx.stroke();
      // солнышко с лучами и лицом
      ctx.strokeStyle = '#b1790c';
      ctx.lineWidth = 5;
      for (var i = 0; i < 12; i++) {
        var a = i * Math.PI / 6;
        ctx.beginPath();
        ctx.moveTo(64 + Math.cos(a) * 30, 64 + Math.sin(a) * 30);
        ctx.lineTo(64 + Math.cos(a) * 44, 64 + Math.sin(a) * 44);
        ctx.stroke();
      }
      ctx.fillStyle = '#fff0b0';
      ctx.beginPath(); ctx.arc(64, 64, 26, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8a5c05';
      ctx.beginPath(); ctx.arc(55, 58, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(73, 58, 4, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#8a5c05';
      ctx.beginPath(); ctx.arc(64, 68, 12, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
    });
    var edge = new THREE.MeshLambertMaterial({ color: 0xd8a520, emissive: 0x3a2600 });
    var flat = new THREE.MeshLambertMaterial({ map: face, emissive: 0x4a3400, emissiveMap: face });
    var coin = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.16, 26),
      [edge, flat, flat]);
    coin.rotation.x = Math.PI / 2;
    g.add(coin);

    var glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: World.glowTexture(255, 226, 130), transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.85
    }));
    glow.scale.set(5, 5, 1);
    g.add(glow);
    g.userData.coin = coin;
    g.userData.glow = glow;
    return g;
  };

  /* Руки солнца: два золотых луча с ладонями, которые подхватывают печку.
     Лучи — прозрачные конусы «в небо», ладони — плотные, чтобы читались. */
  World.buildSunHands = function () {
    var g = new THREE.Group();
    var rayMat = new THREE.MeshBasicMaterial({
      color: 0xffd873, transparent: true, opacity: 0.28,
      blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide
    });
    var handMat = new THREE.MeshLambertMaterial({
      color: 0xffc63c, emissive: 0x8a5c05, transparent: true, opacity: 0.95
    });
    g.userData.rayMat = rayMat;
    g.userData.handMat = handMat;

    var TILT = 0.42;                       // наклон луча к солнцу
    var L = 70;
    for (var s = -1; s <= 1; s += 2) {
      var arm = new THREE.Group();
      arm.position.set(s * 3.1, 1.1, 0);
      arm.rotation.z = s * 0.12;
      arm.rotation.x = -TILT;              // после поворота группы это «в сторону солнца»

      var beam = new THREE.Mesh(
        new THREE.CylinderGeometry(1.6, 0.55, L, 12, 1, true), rayMat);
      beam.position.y = L / 2;
      arm.add(beam);

      // ладонь и пальцы: держат печку с боков
      var hand = [];
      var palm = new THREE.SphereGeometry(1.05, 14, 10);
      var mp = new THREE.Matrix4().makeScale(0.75, 0.55, 1.35);
      mp.setPosition(0, 0, 0);
      palm.applyMatrix4(mp);
      hand.push(palm);
      var wrist = new THREE.CylinderGeometry(0.55, 0.75, 1.6, 10);
      wrist.translate(0, 0.9, 0);
      hand.push(wrist);
      for (var f = 0; f < 4; f++) {
        var fin = new THREE.CylinderGeometry(0.17, 0.2, 1.7, 7);
        var mf = new THREE.Matrix4().makeRotationZ(s * -1.15);
        mf.setPosition(s * -0.85, 0.35, (f - 1.5) * 0.66);
        fin.applyMatrix4(mf);
        hand.push(fin);
      }
      var thumb = new THREE.CylinderGeometry(0.2, 0.24, 1.4, 7);
      var mt = new THREE.Matrix4().makeRotationX(-1.15);
      mt.setPosition(s * -0.2, 0.1, 1.15);
      thumb.applyMatrix4(mt);
      hand.push(thumb);
      arm.add(new THREE.Mesh(World.mergeGeometries(hand), handMat));

      g.add(arm);
    }

    var halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: World.glowTexture(255, 226, 140), transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.35
    }));
    halo.scale.set(9, 9, 1);
    halo.position.y = 2.4;
    g.add(halo);
    g.userData.halo = halo;
    g.visible = false;
    return g;
  };

  /* ---------- Птички ---------- */

  var BIRD_COLORS = [
    { body: 0x4d9be6, wing: 0x2f6fb0, belly: 0xf2f6fb },   // синичка-лазоревка
    { body: 0xf0c23c, wing: 0xc99a1c, belly: 0xfff3cd },   // жёлтая
    { body: 0xf4f4f2, wing: 0xd8d8d4, belly: 0xffffff },   // голубь
    { body: 0xe0705a, wing: 0xb5432f, belly: 0xffe6d8 },   // снегирь
    { body: 0x67c07a, wing: 0x3d8a52, belly: 0xeaf7ea }    // попугайчик
  ];

  /* Маленькая птичка с машущими крыльями. */
  World.buildBird = function () {
    var c = BIRD_COLORS[Math.floor(Math.random() * BIRD_COLORS.length)];
    var g = new THREE.Group();
    var bodyMat = new THREE.MeshLambertMaterial({ color: c.body });
    var wingMat = new THREE.MeshLambertMaterial({ color: c.wing, side: THREE.DoubleSide });

    var parts = [];
    var body = new THREE.SphereGeometry(0.26, 12, 9);
    var mb = new THREE.Matrix4().makeScale(0.8, 0.8, 1.5);
    mb.setPosition(0, 0, 0);
    body.applyMatrix4(mb);
    parts.push(body);
    var head = new THREE.SphereGeometry(0.17, 10, 8);
    head.translate(0, 0.1, 0.32);
    parts.push(head);
    var tail = new THREE.BoxGeometry(0.24, 0.04, 0.34);
    var mt = new THREE.Matrix4().makeRotationX(-0.25);
    mt.setPosition(0, 0.05, -0.44);
    tail.applyMatrix4(mt);
    parts.push(tail);
    g.add(new THREE.Mesh(World.mergeGeometries(parts), bodyMat));

    var beak = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.16, 6),
      new THREE.MeshLambertMaterial({ color: 0xe8a53c }));
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, 0.09, 0.48);
    g.add(beak);

    var eyes = [];
    for (var e = -1; e <= 1; e += 2) {
      var eye = new THREE.SphereGeometry(0.035, 6, 5);
      eye.translate(e * 0.1, 0.14, 0.42);
      eyes.push(eye);
    }
    g.add(new THREE.Mesh(World.mergeGeometries(eyes),
      new THREE.MeshLambertMaterial({ color: 0x14161a })));

    // крылья: плоские «перья», качаются вокруг оси Z
    var wings = [];
    for (var s = -1; s <= 1; s += 2) {
      var pivot = new THREE.Group();
      pivot.position.set(s * 0.16, 0.06, 0.02);
      var shape = new THREE.PlaneGeometry(0.72, 0.34, 3, 1);
      var pos = shape.attributes.position;
      for (var i = 0; i < pos.count; i++) {           // изгиб пера
        var x = pos.getX(i);
        pos.setZ(i, -Math.abs(x) * 0.28);
      }
      shape.computeVertexNormals();
      var m = new THREE.Matrix4().makeRotationY(s > 0 ? 0 : Math.PI);
      m.setPosition(s * 0.36, 0, 0);
      shape.applyMatrix4(m);
      var wing = new THREE.Mesh(shape, wingMat);
      pivot.add(wing);
      g.add(pivot);
      wings.push(pivot);
    }

    g.userData.wings = wings;
    g.scale.setScalar(0.8 + Math.random() * 0.6);
    return g;
  };

  global.World = World;
})(window);
