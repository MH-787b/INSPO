/**
 * Web Audio API ambient sound generator.
 * Creates different sound textures per inspiration category — no audio files needed.
 */

const AudioEngine = (() => {
  let ctx = null;
  let masterGain = null;
  let activeNodes = [];
  let isPlaying = false;
  let currentType = null;

  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(ctx.destination);
  }

  function cleanup() {
    activeNodes.forEach(node => {
      try {
        node.stop?.();
        node.disconnect?.();
      } catch (e) { /* already stopped */ }
    });
    activeNodes = [];
  }

  // ── Sound Generators ──

  function warmDrone() {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.value = 110;
    osc2.type = 'sine';
    osc2.frequency.value = 165;

    filter.type = 'lowpass';
    filter.frequency.value = 400;
    filter.Q.value = 1;

    gain.gain.value = 0.4;

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    // Gentle frequency drift
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.1;
    lfoGain.gain.value = 3;
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfoGain.connect(osc2.frequency);

    osc1.start();
    osc2.start();
    lfo.start();

    activeNodes.push(osc1, osc2, lfo);
  }

  function textureNoise() {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 0.5;

    const gain = ctx.createGain();
    gain.gain.value = 0.15;

    // Slow filter sweep
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.05;
    lfoGain.gain.value = 400;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    lfo.start();
    source.start();

    activeNodes.push(source, lfo);
  }

  function gentleMelody() {
    const notes = [261.6, 293.7, 329.6, 392.0, 440.0, 523.3]; // C major pentatonic-ish
    const gain = ctx.createGain();
    const reverb = ctx.createBiquadFilter();
    reverb.type = 'lowpass';
    reverb.frequency.value = 1200;
    gain.gain.value = 0.2;
    reverb.connect(gain);
    gain.connect(masterGain);

    function playNote() {
      if (!isPlaying || currentType !== 'gentle-melody') return;

      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      const freq = notes[Math.floor(Math.random() * notes.length)];

      osc.type = 'sine';
      osc.frequency.value = freq;
      noteGain.gain.value = 0;
      noteGain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.3);
      noteGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.5);

      osc.connect(noteGain);
      noteGain.connect(reverb);
      osc.start();
      osc.stop(ctx.currentTime + 3);

      const next = 1500 + Math.random() * 3000;
      setTimeout(playNote, next);
    }

    playNote();
    activeNodes.push(gain);
  }

  function windRain() {
    // Wind
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }

    const wind = ctx.createBufferSource();
    wind.buffer = buffer;
    wind.loop = true;

    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.value = 500;
    windFilter.Q.value = 2;

    const windGain = ctx.createGain();
    windGain.gain.value = 0.12;

    // Wind modulation
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.15;
    lfoGain.gain.value = 200;
    lfo.connect(lfoGain);
    lfoGain.connect(windFilter.frequency);

    wind.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(masterGain);

    lfo.start();
    wind.start();

    activeNodes.push(wind, lfo);
  }

  function pulseRhythm() {
    const gain = ctx.createGain();
    gain.gain.value = 0.25;
    gain.connect(masterGain);

    function pulse() {
      if (!isPlaying || currentType !== 'pulse-rhythm') return;

      const osc = ctx.createOscillator();
      const pGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = 80 + Math.random() * 60;

      pGain.gain.value = 0;
      pGain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.05);
      pGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

      osc.connect(pGain);
      pGain.connect(gain);
      osc.start();
      osc.stop(ctx.currentTime + 1);

      setTimeout(pulse, 600 + Math.random() * 400);
    }

    pulse();
    activeNodes.push(gain);
  }

  // ── Public API ──

  const generators = {
    'warm-drone': warmDrone,
    'texture-noise': textureNoise,
    'gentle-melody': gentleMelody,
    'wind-rain': windRain,
    'pulse-rhythm': pulseRhythm
  };

  return {
    play(type) {
      init();
      if (ctx.state === 'suspended') ctx.resume();

      cleanup();
      currentType = type;
      isPlaying = true;

      if (generators[type]) {
        generators[type]();
      }

      masterGain.gain.cancelScheduledValues(ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.5);
    },

    stop() {
      if (!ctx) return;
      isPlaying = false;
      masterGain.gain.cancelScheduledValues(ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
      setTimeout(cleanup, 1000);
    },

    toggle(type) {
      if (isPlaying) {
        this.stop();
        return false;
      } else {
        this.play(type);
        return true;
      }
    },

    get playing() {
      return isPlaying;
    }
  };
})();
