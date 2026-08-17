/* Синтезированный звук на WebAudio: гудок паровоза, гул печки, зуммер дисквалификации. */
(function (global) {
  'use strict';

  function Sfx() {
    this.ctx = null;
    this.master = null;
    this.noiseBuf = null;
    this.engines = [];
    this.muted = false;
  }

  Sfx.prototype.init = function () {
    if (this.ctx) return;
    var AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(this.ctx.destination);

    var len = Math.floor(this.ctx.sampleRate * 2);
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    var d = this.noiseBuf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  };

  Sfx.prototype.resume = function () {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  };

  Sfx.prototype.setMuted = function (m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.9;
  };

  Sfx.prototype.noise = function (dur, gain, filterFreq, dest) {
    if (!this.ctx) return null;
    var src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    var bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = filterFreq;
    bp.Q.value = 0.8;
    var g = this.ctx.createGain();
    var t = this.ctx.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp).connect(g).connect(dest || this.master);
    src.start(t);
    src.stop(t + dur + 0.05);
    return g;
  };

  /* Гудок паровоза: три расстроенных голоса через полосовой фильтр + пар и «чух-чух». */
  Sfx.prototype.trainWhistle = function (volume) {
    this.init();
    if (!this.ctx) return;
    var vol = Math.max(0, Math.min(1, volume === undefined ? 1 : volume));
    if (vol < 0.02) return;
    var t = this.ctx.currentTime;

    var out = this.ctx.createGain();
    out.gain.value = vol;
    out.connect(this.master);

    var bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 900;
    bp.Q.value = 1.4;
    bp.connect(out);

    var env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(0.22, t + 0.12);
    env.gain.setValueAtTime(0.22, t + 0.65);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 1.15);
    env.connect(bp);

    var vib = this.ctx.createOscillator();
    vib.frequency.value = 6.2;
    var vibG = this.ctx.createGain();
    vibG.gain.value = 7;
    vib.connect(vibG);
    vib.start(t);
    vib.stop(t + 1.3);

    var freqs = [523, 659, 784];
    for (var i = 0; i < freqs.length; i++) {
      var o = this.ctx.createOscillator();
      o.type = i === 2 ? 'triangle' : 'square';
      o.frequency.setValueAtTime(freqs[i] * 0.97, t);
      o.frequency.linearRampToValueAtTime(freqs[i], t + 0.18);
      o.frequency.setValueAtTime(freqs[i], t + 0.8);
      o.frequency.linearRampToValueAtTime(freqs[i] * 0.94, t + 1.15);
      vibG.connect(o.frequency);
      var g = this.ctx.createGain();
      g.gain.value = i === 0 ? 0.5 : 0.3;
      o.connect(g).connect(env);
      o.start(t);
      o.stop(t + 1.25);
    }

    // пар
    this.noise(0.9, 0.10 * vol, 2600, out);

    // «чух-чух-чух»
    for (var c = 0; c < 4; c++) {
      this.chuff(t + 0.9 + c * 0.26, 0.16 * vol, out);
    }
  };

  Sfx.prototype.chuff = function (when, gain, dest) {
    if (!this.ctx) return;
    var src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    var bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(320, when);
    bp.frequency.exponentialRampToValueAtTime(1400, when + 0.12);
    bp.Q.value = 1.1;
    var g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(gain, when + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.22);
    src.connect(bp).connect(g).connect(dest || this.master);
    src.start(when);
    src.stop(when + 0.3);
  };

  /* Зуммер дисквалификации. */
  Sfx.prototype.buzzer = function () {
    this.init();
    if (!this.ctx) return;
    var t = this.ctx.currentTime;
    var o = this.ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(200, t);
    o.frequency.exponentialRampToValueAtTime(60, t + 0.7);
    var g = this.ctx.createGain();
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 0.85);
    this.noise(0.5, 0.12, 700);
  };

  /* Удар бортом о борт. */
  Sfx.prototype.bump = function (vol) {
    this.init();
    if (!this.ctx || !vol) return;
    var t = this.ctx.currentTime;
    var o = this.ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(60, t + 0.14);
    var g = this.ctx.createGain();
    g.gain.setValueAtTime(0.22 * vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 0.22);
    this.noise(0.12, 0.1 * vol, 1500);
  };

  /* Наезд на бабушку: глухой удар, звон посуды из авоськи и возмущённое «ой-ой». */
  Sfx.prototype.thud = function () {
    this.init();
    if (!this.ctx) return;
    var t = this.ctx.currentTime;
    var o = this.ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(38, t + 0.25);
    var g = this.ctx.createGain();
    g.gain.setValueAtTime(0.34, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 0.4);
    this.noise(0.3, 0.14, 2400);

    // два возмущённых вскрика вверх-вниз
    for (var i = 0; i < 2; i++) {
      var v = this.ctx.createOscillator();
      v.type = 'triangle';
      var at = t + 0.18 + i * 0.24;
      v.frequency.setValueAtTime(520 + i * 90, at);
      v.frequency.linearRampToValueAtTime(760 + i * 90, at + 0.09);
      v.frequency.linearRampToValueAtTime(430 + i * 60, at + 0.22);
      var vg = this.ctx.createGain();
      vg.gain.setValueAtTime(0.0001, at);
      vg.gain.linearRampToValueAtTime(0.16, at + 0.04);
      vg.gain.exponentialRampToValueAtTime(0.0001, at + 0.24);
      v.connect(vg).connect(this.master);
      v.start(at);
      v.stop(at + 0.26);
    }
  };

  /* Выхлоп пара при включении турбо. */
  Sfx.prototype.steamBurst = function (vol) {
    this.init();
    if (!this.ctx || !vol || vol < 0.03) return;
    var t = this.ctx.currentTime;
    var out = this.ctx.createGain();
    out.gain.value = vol;
    out.connect(this.master);
    this.noise(0.7, 0.2, 3200, out);
    var o = this.ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(320, t);
    o.frequency.exponentialRampToValueAtTime(880, t + 0.35);
    var g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.12, t + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 0.5);
  };

  Sfx.prototype.beep = function (freq, dur, gain) {
    this.init();
    if (!this.ctx) return;
    var t = this.ctx.currentTime;
    var o = this.ctx.createOscillator();
    o.type = 'square';
    o.frequency.value = freq;
    var g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain || 0.18, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.25));
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + (dur || 0.25) + 0.05);
  };

  Sfx.prototype.fanfare = function () {
    this.init();
    if (!this.ctx) return;
    var notes = [523, 659, 784, 1046];
    for (var i = 0; i < notes.length; i++) {
      var self = this;
      (function (f, d) {
        setTimeout(function () { self.beep(f, 0.35, 0.16); }, d);
      })(notes[i], i * 130);
    }
    var s = this;
    setTimeout(function () { s.trainWhistle(0.8); }, 620);
  };

  /* Гул печки-паровоза для машины в фокусе камеры. */
  Sfx.prototype.startEngine = function () {
    this.init();
    if (!this.ctx) return null;
    var o = this.ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = 55;
    var o2 = this.ctx.createOscillator();
    o2.type = 'square';
    o2.frequency.value = 27;
    var lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 420;
    var g = this.ctx.createGain();
    g.gain.value = 0.0;
    o.connect(lp);
    o2.connect(lp);
    lp.connect(g).connect(this.master);
    o.start();
    o2.start();
    var eng = { osc: o, osc2: o2, gain: g, lp: lp };
    this.engines.push(eng);
    return eng;
  };

  Sfx.prototype.updateEngine = function (eng, speed, throttle) {
    if (!eng || !this.ctx) return;
    var t = this.ctx.currentTime;
    var base = 42 + speed * 3.1;
    eng.osc.frequency.setTargetAtTime(base, t, 0.08);
    eng.osc2.frequency.setTargetAtTime(base * 0.5, t, 0.08);
    eng.lp.frequency.setTargetAtTime(320 + speed * 22, t, 0.1);
    var target = 0.035 + (throttle ? 0.05 : 0.0) + Math.min(speed / 30, 1) * 0.05;
    eng.gain.gain.setTargetAtTime(target, t, 0.12);
  };

  Sfx.prototype.stopEngines = function () {
    for (var i = 0; i < this.engines.length; i++) {
      var e = this.engines[i];
      try {
        e.gain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.05);
        e.osc.stop(this.ctx.currentTime + 0.3);
        e.osc2.stop(this.ctx.currentTime + 0.3);
      } catch (err) { /* уже остановлен */ }
    }
    this.engines = [];
  };

  global.Sfx = Sfx;
})(window);
