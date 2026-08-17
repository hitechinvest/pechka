/* Музыка: восточно-минорный луп на WebAudio, без файлов.
   Бас, дарбука-барабаны, шейкер, подложка и ведущая мелодия с эхом.
   Уровни плотности: 1 — меню, 2 — гонка, 3 — последний круг. */
(function (global) {
  'use strict';

  var BPM = 128;
  var STEP = 60 / BPM / 4;          // шестнадцатая
  var LOOKAHEAD = 0.22;             // на сколько вперёд планируем звуки

  // ре гармонический минор: Dm — Bb — Gm — A
  var PROG = [
    { root: 38, notes: [62, 65, 69] },
    { root: 34, notes: [58, 62, 65] },
    { root: 31, notes: [55, 58, 62] },
    { root: 33, notes: [57, 61, 64] }
  ];

  var BASS = [0, 3, 6, 8, 11, 14];
  var KICK = [0, 6, 8, 14];
  var SNARE = [4, 12];
  var DARBUKA = [2, 5, 7, 10, 13, 15];

  // ступени аккорда по шагам такта, -1 — пауза
  var MOTIFS = [
    [0, -1, 1, -1, 2, -1, 1, -1, 0, -1, 2, -1, 1, -1, 0, -1],
    [0, -1, -1, 1, 2, -1, 1, 0, -1, 2, -1, -1, 1, -1, 0, -1],
    [2, -1, 1, 0, -1, 1, 2, -1, 1, -1, 0, -1, 2, 1, 0, -1],
    [0, 1, 2, -1, 1, -1, 0, -1, 2, -1, 1, 0, -1, -1, 1, -1]
  ];

  function midi(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  function Music(sfx) {
    this.sfx = sfx;
    this.ctx = null;
    this.out = null;
    this.enabled = true;
    this.playing = false;
    this.intensity = 1;
    this.step = 0;
    this.nextTime = 0;
    this.timer = null;
  }

  Music.prototype.build = function () {
    this.sfx.init();
    if (!this.sfx.ctx || this.ctx) return;
    this.ctx = this.sfx.ctx;

    this.out = this.ctx.createGain();
    this.out.gain.value = 0;
    this.out.connect(this.sfx.master);

    // эхо для мелодии — три восьмых, чтобы луп «дышал»
    this.delay = this.ctx.createDelay(1);
    this.delay.delayTime.value = STEP * 6;
    this.feedback = this.ctx.createGain();
    this.feedback.gain.value = 0.28;
    this.echoLevel = this.ctx.createGain();
    this.echoLevel.gain.value = 0.35;
    this.delay.connect(this.feedback).connect(this.delay);
    this.delay.connect(this.echoLevel).connect(this.out);
  };

  Music.prototype.start = function () {
    this.build();
    if (!this.ctx || this.playing) return;
    this.playing = true;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.12;
    this.out.gain.cancelScheduledValues(this.ctx.currentTime);
    this.out.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    this.out.gain.linearRampToValueAtTime(this.enabled ? 0.2 : 0.0001, this.ctx.currentTime + 1.2);
    var self = this;
    this.timer = setInterval(function () { self.schedule(); }, 25);
  };

  Music.prototype.stop = function () {
    if (!this.playing) return;
    this.playing = false;
    clearInterval(this.timer);
    this.timer = null;
    if (this.out) {
      var t = this.ctx.currentTime;
      this.out.gain.cancelScheduledValues(t);
      this.out.gain.setTargetAtTime(0.0001, t, 0.25);
    }
  };

  Music.prototype.setEnabled = function (on) {
    this.enabled = on;
    if (this.out && this.ctx) {
      this.out.gain.setTargetAtTime(on ? 0.2 : 0.0001, this.ctx.currentTime, 0.15);
    }
    if (on && !this.playing) this.start();
  };

  Music.prototype.setIntensity = function (n) {
    this.intensity = n;
  };

  /* Приглушаем музыку, когда нужен гудок или объявление. */
  Music.prototype.duck = function (seconds) {
    if (!this.out || !this.ctx || !this.enabled) return;
    var t = this.ctx.currentTime;
    this.out.gain.cancelScheduledValues(t);
    this.out.gain.setTargetAtTime(0.07, t, 0.05);
    this.out.gain.setTargetAtTime(0.2, t + (seconds || 0.9), 0.3);
  };

  Music.prototype.schedule = function () {
    if (!this.playing) return;
    while (this.nextTime < this.ctx.currentTime + LOOKAHEAD) {
      this.playStep(this.step, this.nextTime);
      this.step = (this.step + 1) % 128;      // 8 тактов
      this.nextTime += STEP;
    }
  };

  Music.prototype.playStep = function (step, when) {
    var bar = Math.floor(step / 16);
    var s = step % 16;
    var chord = PROG[bar % PROG.length];
    var lvl = this.intensity;

    if (BASS.indexOf(s) >= 0) {
      var oct = (s === 8 || s === 11) ? 12 : 0;
      this.bass(midi(chord.root + oct), when, s === 0 ? 0.42 : 0.3);
    }
    if (KICK.indexOf(s) >= 0) this.kick(when);
    if (SNARE.indexOf(s) >= 0) this.snare(when, 0.16);
    if (DARBUKA.indexOf(s) >= 0) this.darbuka(when, s % 3 === 0 ? 0.13 : 0.08);
    if (lvl >= 2 && s % 2 === 1) this.hat(when, 0.055);
    if (lvl >= 3 && s % 2 === 0) this.hat(when, 0.03);

    if (s === 0) this.pad(chord, when, lvl >= 2 ? 0.05 : 0.035);

    if (lvl >= 2) {
      var motif = MOTIFS[bar % MOTIFS.length];
      var deg = motif[s];
      if (deg >= 0) {
        var note = chord.notes[deg] + (bar >= 4 ? 12 : 0);
        this.lead(midi(note), when, lvl >= 3 ? 0.13 : 0.1);
      }
    }
  };

  /* ---------- голоса ---------- */

  Music.prototype.bass = function (freq, when, gain) {
    var o = this.ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(freq, when);
    var lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(260, when);
    lp.frequency.exponentialRampToValueAtTime(120, when + STEP * 2);
    var g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(gain, when + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, when + STEP * 1.9);
    o.connect(lp).connect(g).connect(this.out);
    o.start(when);
    o.stop(when + STEP * 2.1);
  };

  Music.prototype.lead = function (freq, when, gain) {
    var voices = [
      { type: 'triangle', det: 1, g: 1 },
      { type: 'square', det: 1.006, g: 0.35 }
    ];
    var g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(gain, when + 0.014);
    g.gain.exponentialRampToValueAtTime(0.0001, when + STEP * 1.6);
    var lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2600;
    g.connect(lp);
    lp.connect(this.out);
    lp.connect(this.delay);
    for (var i = 0; i < voices.length; i++) {
      var o = this.ctx.createOscillator();
      o.type = voices[i].type;
      o.frequency.setValueAtTime(freq * voices[i].det, when);
      var vg = this.ctx.createGain();
      vg.gain.value = voices[i].g;
      o.connect(vg).connect(g);
      o.start(when);
      o.stop(when + STEP * 1.8);
    }
  };

  Music.prototype.pad = function (chord, when, gain) {
    var g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(gain, when + 0.25);
    g.gain.setValueAtTime(gain, when + STEP * 12);
    g.gain.exponentialRampToValueAtTime(0.0001, when + STEP * 16);
    var lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1100;
    g.connect(lp).connect(this.out);
    for (var i = 0; i < chord.notes.length; i++) {
      var o = this.ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.setValueAtTime(midi(chord.notes[i] - 12), when);
      var vg = this.ctx.createGain();
      vg.gain.value = 0.4;
      o.connect(vg).connect(g);
      o.start(when);
      o.stop(when + STEP * 16.2);
    }
  };

  Music.prototype.kick = function (when) {
    var o = this.ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(120, when);
    o.frequency.exponentialRampToValueAtTime(42, when + 0.12);
    var g = this.ctx.createGain();
    g.gain.setValueAtTime(0.34, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.22);
    o.connect(g).connect(this.out);
    o.start(when);
    o.stop(when + 0.25);
  };

  Music.prototype.noiseHit = function (when, gain, freq, dur, type) {
    var src = this.ctx.createBufferSource();
    src.buffer = this.sfx.noiseBuf;
    src.loop = true;
    var f = this.ctx.createBiquadFilter();
    f.type = type || 'bandpass';
    f.frequency.value = freq;
    f.Q.value = 1.1;
    var g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(gain, when + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    src.connect(f).connect(g).connect(this.out);
    src.start(when);
    src.stop(when + dur + 0.03);
  };

  Music.prototype.snare = function (when, gain) {
    this.noiseHit(when, gain, 1900, 0.16);
    var o = this.ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(210, when);
    o.frequency.exponentialRampToValueAtTime(150, when + 0.09);
    var g = this.ctx.createGain();
    g.gain.setValueAtTime(gain * 0.5, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.11);
    o.connect(g).connect(this.out);
    o.start(when);
    o.stop(when + 0.13);
  };

  Music.prototype.darbuka = function (when, gain) {
    this.noiseHit(when, gain, 420, 0.1);
    var o = this.ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(320, when);
    o.frequency.exponentialRampToValueAtTime(190, when + 0.07);
    var g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.09);
    o.connect(g).connect(this.out);
    o.start(when);
    o.stop(when + 0.11);
  };

  Music.prototype.hat = function (when, gain) {
    this.noiseHit(when, gain, 7200, 0.05, 'highpass');
  };

  global.Music = Music;
})(window);
