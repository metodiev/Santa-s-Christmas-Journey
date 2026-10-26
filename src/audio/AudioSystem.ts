import { BUILT_TRACKS, midiToFreq, type BuiltTrack, type MusicEvent } from './tracks';
import { save } from '../systems/SaveSystem';

type Ctx = AudioContext;

const LOOKAHEAD = 0.22;
const TICK_MS = 45;

class AudioSystem {
  private ctx: Ctx | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private delaySend: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private track: BuiltTrack | null = null;
  private trackId = '';
  private pendingTrack: string | null = null;
  private nextIndex = 0;
  private patternStart = 0;
  private timer: number | null = null;
  private paused = false;
  private musicLevel = 0.62;
  private sfxLevel = 0.78;
  private unlocked = false;

  constructor() {
    save.on('settings', this.onSettings);
  }

  private onSettings = (): void => {
    this.musicLevel = save.settings.music;
    this.sfxLevel = save.settings.sfx;
    if (!this.ctx || !this.musicBus || !this.sfxBus) return;
    const now = this.ctx.currentTime;
    this.musicBus.gain.setTargetAtTime(this.musicLevel * 0.55, now, 0.08);
    this.sfxBus.gain.setTargetAtTime(this.sfxLevel * 0.7, now, 0.05);
  };

  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    this.ctx = ctx;
    const master = ctx.createGain();
    master.gain.value = 0.9;
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -14;
    compressor.knee.value = 18;
    compressor.ratio.value = 5;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.2;
    master.connect(compressor).connect(ctx.destination);

    const musicBus = ctx.createGain();
    musicBus.gain.value = this.musicLevel * 0.55;
    musicBus.connect(master);
    this.musicBus = musicBus;

    const sfxBus = ctx.createGain();
    sfxBus.gain.value = this.sfxLevel * 0.7;
    sfxBus.connect(master);
    this.sfxBus = sfxBus;

    const delay = ctx.createDelay(0.6);
    delay.delayTime.value = 0.28;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.2;
    const wet = ctx.createGain();
    wet.gain.value = 0.16;
    delay.connect(feedback).connect(delay);
    delay.connect(wet).connect(musicBus);
    this.delaySend = ctx.createGain();
    this.delaySend.gain.value = 0.4;
    this.delaySend.connect(delay);

    const length = Math.floor(ctx.sampleRate * 1.5);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuffer = buffer;

    this.unlocked = true;
    if (ctx.state === 'suspended') void ctx.resume();
    if (this.pendingTrack) {
      const id = this.pendingTrack;
      this.pendingTrack = null;
      this.playMusic(id);
    }
  }

  get isUnlocked(): boolean { return this.unlocked; }

  get currentTrackId(): string { return this.trackId; }

  playMusic(id: string): void {
    const built = BUILT_TRACKS[id];
    if (!built) return;
    if (!this.ctx) {
      this.pendingTrack = id;
      return;
    }
    if (this.trackId === id && this.timer !== null && !this.paused) return;
    this.stopScheduler();
    this.track = built;
    this.trackId = id;
    this.paused = false;
    this.nextIndex = 0;
    this.patternStart = this.ctx.currentTime + 0.08;
    if (this.musicBus) {
      this.musicBus.gain.cancelScheduledValues(this.ctx.currentTime);
      this.musicBus.gain.setValueAtTime(Math.max(0.0001, this.musicBus.gain.value), this.ctx.currentTime);
      this.musicBus.gain.linearRampToValueAtTime(this.musicLevel * 0.55, this.ctx.currentTime + 0.5);
    }
    this.startScheduler();
  }

  stopMusic(): void {
    this.stopScheduler();
    this.track = null;
    this.trackId = '';
    if (this.ctx && this.musicBus) {
      const now = this.ctx.currentTime;
      this.musicBus.gain.cancelScheduledValues(now);
      this.musicBus.gain.setValueAtTime(Math.max(0.0001, this.musicBus.gain.value), now);
      this.musicBus.gain.linearRampToValueAtTime(0.0001, now + 0.4);
    }
  }

  pauseMusic(): void {
    if (!this.ctx) return;
    this.paused = true;
    this.stopScheduler();
    if (this.musicBus) {
      const now = this.ctx.currentTime;
      this.musicBus.gain.cancelScheduledValues(now);
      this.musicBus.gain.setValueAtTime(Math.max(0.0001, this.musicBus.gain.value), now);
      this.musicBus.gain.linearRampToValueAtTime(0.0001, now + 0.2);
    }
  }

  resumeMusic(): void {
    if (!this.ctx || !this.track || !this.paused) return;
    this.paused = false;
    this.nextIndex = 0;
    this.patternStart = this.ctx.currentTime + 0.1;
    if (this.musicBus) {
      const now = this.ctx.currentTime;
      this.musicBus.gain.cancelScheduledValues(now);
      this.musicBus.gain.setValueAtTime(Math.max(0.0001, this.musicBus.gain.value), now);
      this.musicBus.gain.linearRampToValueAtTime(this.musicLevel * 0.55, now + 0.35);
    }
    this.startScheduler();
  }

  private startScheduler(): void {
    this.stopScheduler();
    this.timer = window.setInterval(() => this.schedule(), TICK_MS);
    this.schedule();
  }

  private stopScheduler(): void {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }

  private schedule(): void {
    const ctx = this.ctx;
    const track = this.track;
    if (!ctx || !track || !this.musicBus || this.paused) return;
    if (ctx.state !== 'running') return;
    const spb = 60 / track.data.bpm;
    const horizon = ctx.currentTime + LOOKAHEAD;
    let guard = 0;
    while (guard++ < 160) {
      if (this.nextIndex >= track.events.length) {
        if (track.data.loop === false) break;
        this.patternStart += track.loopBeats * spb;
        this.nextIndex = 0;
      }
      const event = track.events[this.nextIndex];
      const at = this.patternStart + event.beat * spb;
      if (at > horizon) break;
      this.playEvent(event, Math.max(ctx.currentTime + 0.02, at), spb);
      this.nextIndex++;
    }
  }

  private playEvent(event: MusicEvent, at: number, spb: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.musicBus || !this.track) return;
    const trackGain = (this.track.data.gain ?? 0.8) * event.gain;
    const leadOut = this.delaySend ?? this.musicBus;

    if (event.voice === 'lead') {
      const voice = this.track.data.lead;
      for (const midi of event.notes) {
        const freq = midiToFreq(midi);
        const dur = Math.max(0.09, event.dur * spb * 0.92);
        if (voice === 'bell') this.bell(freq, at, dur, 0.2 * trackGain, leadOut);
        else if (voice === 'flute') this.flute(freq, at, dur, 0.18 * trackGain, this.musicBus);
        else if (voice === 'pluck') this.pluck(freq, at, dur, 0.2 * trackGain, this.musicBus);
        else if (voice === 'glass') this.glass(freq, at, dur, 0.17 * trackGain, leadOut);
        else if (voice === 'strings') this.strings(freq, at, dur, 0.12 * trackGain, this.musicBus);
        else this.square(freq, at, dur, 0.1 * trackGain, this.musicBus);
      }
    } else if (event.voice === 'pad') {
      const dur = Math.max(0.4, event.dur * spb);
      for (const midi of event.notes) {
        this.pad(midiToFreq(midi), at, dur, 0.055 * trackGain, this.track.data.pad, this.musicBus);
      }
    } else if (event.voice === 'bass') {
      for (const midi of event.notes) {
        this.bass(midiToFreq(midi), at, Math.max(0.1, event.dur * spb), 0.24 * trackGain, this.musicBus);
      }
    } else {
      this.drum(event.voice, at, 0.24 * trackGain);
    }
  }

  private out(voiceGain: GainNode, bus: AudioNode): void {
    voiceGain.connect(bus);
  }

  private bell(freq: number, at: number, dur: number, gain: number, bus: AudioNode): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const carrier = ctx.createOscillator();
    const mod = ctx.createOscillator();
    const modGain = ctx.createGain();
    const env = ctx.createGain();
    carrier.type = 'sine';
    carrier.frequency.value = freq;
    mod.type = 'sine';
    mod.frequency.value = freq * 2.01;
    modGain.gain.value = freq * 0.9;
    mod.connect(modGain).connect(carrier.frequency);
    carrier.connect(env);
    this.out(env, bus);
    const peak = Math.max(0.0002, gain);
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(peak, at + 0.008);
    env.gain.exponentialRampToValueAtTime(peak * 0.35, at + Math.min(0.25, dur * 0.4));
    env.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    carrier.start(at);
    mod.start(at);
    carrier.stop(at + dur + 0.02);
    mod.stop(at + dur + 0.02);
  }

  private flute(freq: number, at: number, dur: number, gain: number, bus: AudioNode): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    filter.type = 'lowpass';
    filter.frequency.value = 2200;
    osc.connect(filter).connect(env);
    this.out(env, bus);
    env.gain.setValueAtTime(0.0001, at);
    env.gain.linearRampToValueAtTime(gain, at + 0.06);
    env.gain.setValueAtTime(gain, at + Math.max(0.08, dur - 0.12));
    env.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.start(at);
    osc.stop(at + dur + 0.02);
  }

  private glass(freq: number, at: number, dur: number, gain: number, bus: AudioNode): void {
    const ctx = this.ctx;
    if (!ctx) return;
    for (const detune of [0, 7]) {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq * (detune ? 2.005 : 1);
      osc.detune.value = detune === 0 ? 0 : 4;
      osc.connect(env);
      this.out(env, bus);
      const peak = gain * (detune ? 0.35 : 1);
      env.gain.setValueAtTime(0.0001, at);
      env.gain.linearRampToValueAtTime(peak, at + 0.04);
      env.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      osc.start(at);
      osc.stop(at + dur + 0.02);
    }
  }

  private pluck(freq: number, at: number, dur: number, gain: number, bus: AudioNode): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, at);
    filter.frequency.exponentialRampToValueAtTime(600, at + Math.min(0.5, dur));
    osc.connect(filter).connect(env);
    this.out(env, bus);
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), at + 0.006);
    env.gain.exponentialRampToValueAtTime(0.0001, at + Math.min(0.7, dur));
    osc.start(at);
    osc.stop(at + Math.min(0.72, dur) + 0.03);
  }

  private strings(freq: number, at: number, dur: number, gain: number, bus: AudioNode): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const env = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    osc2.type = 'sawtooth';
    osc2.frequency.value = freq * 1.004;
    filter.type = 'lowpass';
    filter.frequency.value = 1800;
    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(env);
    this.out(env, bus);
    env.gain.setValueAtTime(0.0001, at);
    env.gain.linearRampToValueAtTime(gain, at + Math.min(0.18, dur * 0.3));
    env.gain.setValueAtTime(gain, at + Math.max(0.15, dur - 0.15));
    env.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.start(at);
    osc2.start(at);
    osc.stop(at + dur + 0.02);
    osc2.stop(at + dur + 0.02);
  }

  private square(freq: number, at: number, dur: number, gain: number, bus: AudioNode): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(env);
    this.out(env, bus);
    env.gain.setValueAtTime(0.0001, at);
    env.gain.linearRampToValueAtTime(gain, at + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.start(at);
    osc.stop(at + dur + 0.02);
  }

  private pad(freq: number, at: number, dur: number, gain: number, voice: string, bus: AudioNode): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const env = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = voice === 'choir' ? 'sine' : 'triangle';
    osc.frequency.value = freq;
    osc2.type = 'sine';
    osc2.frequency.value = freq * (voice === 'choir' ? 2.002 : 1.002);
    filter.type = 'lowpass';
    filter.frequency.value = voice === 'choir' ? 1200 : 900;
    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(env);
    this.out(env, bus);
    env.gain.setValueAtTime(0.0001, at);
    env.gain.linearRampToValueAtTime(gain, at + Math.min(0.8, dur * 0.35));
    env.gain.setValueAtTime(gain, at + dur * 0.7);
    env.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.start(at);
    osc2.start(at);
    osc.stop(at + dur + 0.05);
    osc2.stop(at + dur + 0.05);
  }

  private bass(freq: number, at: number, dur: number, gain: number, bus: AudioNode): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    osc.connect(filter).connect(env);
    this.out(env, bus);
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), at + 0.015);
    env.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.start(at);
    osc.stop(at + dur + 0.02);
  }

  private noise(at: number, dur: number, gain: number, filterType: BiquadFilterType, freq: number, q = 1): void {
    const ctx = this.ctx;
    if (!ctx || !this.sfxBus && !this.musicBus) return;
    if (!this.noiseBuffer) return;
    const source = ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const env = ctx.createGain();
    source.connect(filter).connect(env);
    this.out(env, this.musicBus ?? this.sfxBus!);
    env.gain.setValueAtTime(0.0001, at);
    env.gain.linearRampToValueAtTime(gain, at + 0.005);
    env.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    source.start(at);
    source.stop(at + dur + 0.02);
  }

  private drum(voice: string, at: number, gain: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.musicBus) return;
    if (voice === 'kick' || voice === 'soft-kick') {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(voice === 'kick' ? 150 : 120, at);
      osc.frequency.exponentialRampToValueAtTime(48, at + 0.16);
      osc.connect(env);
      this.out(env, this.musicBus);
      env.gain.setValueAtTime(gain, at);
      env.gain.exponentialRampToValueAtTime(0.0001, at + (voice === 'kick' ? 0.26 : 0.2));
      osc.start(at);
      osc.stop(at + 0.3);
    } else if (voice === 'snare') {
      this.noise(at, 0.16, gain, 'bandpass', 1900, 0.8);
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = 180;
      osc.connect(env);
      this.out(env, this.musicBus);
      env.gain.setValueAtTime(gain * 0.5, at);
      env.gain.exponentialRampToValueAtTime(0.0001, at + 0.12);
      osc.start(at);
      osc.stop(at + 0.15);
    } else if (voice === 'sleigh') {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 2400 + Math.random() * 700;
      osc.connect(env);
      this.out(env, this.musicBus);
      env.gain.setValueAtTime(gain, at);
      env.gain.exponentialRampToValueAtTime(0.0001, at + 0.1);
      osc.start(at);
      osc.stop(at + 0.12);
    } else if (voice === 'shaker') {
      this.noise(at, 0.06, gain, 'highpass', 6000);
    } else if (voice === 'brush') {
      this.noise(at, 0.14, gain, 'bandpass', 3200, 0.6);
    } else if (voice === 'tick') {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = 1400 + Math.random() * 300;
      osc.connect(env);
      this.out(env, this.musicBus);
      env.gain.setValueAtTime(gain, at);
      env.gain.exponentialRampToValueAtTime(0.0001, at + 0.045);
      osc.start(at);
      osc.stop(at + 0.06);
    }
  }

  playSfx(name: string): void {
    if (!this.ctx) {
      this.unlock();
      if (!this.ctx) return;
    }
    const ctx = this.ctx;
    const bus = this.sfxBus;
    if (!ctx || !bus) return;
    const at = ctx.currentTime + 0.005;
    const tone = (freq: number, dur: number, type: OscillatorType, gain: number, slideTo?: number, delay = 0) => {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, at + delay);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, at + delay + dur);
      osc.connect(env);
      env.connect(bus);
      env.gain.setValueAtTime(0.0001, at + delay);
      env.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), at + delay + 0.01);
      env.gain.exponentialRampToValueAtTime(0.0001, at + delay + dur);
      osc.start(at + delay);
      osc.stop(at + delay + dur + 0.03);
    };
    const boom = (freq: number, dur: number, gain: number, delay = 0) => tone(freq, dur, 'sine', gain, freq * 0.35, delay);
    const noiseBurst = (dur: number, gain: number, type: BiquadFilterType, freq: number, delay = 0) => {
      if (!this.noiseBuffer) return;
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = type;
      filter.frequency.value = freq;
      const env = ctx.createGain();
      src.connect(filter).connect(env);
      env.connect(bus);
      env.gain.setValueAtTime(0.0001, at + delay);
      env.gain.linearRampToValueAtTime(gain, at + delay + 0.005);
      env.gain.exponentialRampToValueAtTime(0.0001, at + delay + dur);
      src.start(at + delay);
      src.stop(at + delay + dur + 0.02);
    };
    const chime = (freq: number, delay: number, gain = 0.18, dur = 0.4) => {
      this.bell(freq, at + delay, dur, gain, bus);
    };

    switch (name) {
      case 'click':
        tone(680, 0.06, 'triangle', 0.08, 520);
        break;
      case 'back':
        tone(420, 0.08, 'triangle', 0.07, 300);
        break;
      case 'jump':
        tone(300, 0.16, 'triangle', 0.12, 640);
        noiseBurst(0.08, 0.03, 'highpass', 2000);
        break;
      case 'doubleJump':
        tone(420, 0.18, 'sine', 0.12, 900);
        chime(1200, 0.03, 0.08, 0.18);
        break;
      case 'land':
        boom(120, 0.15, 0.2);
        noiseBurst(0.08, 0.1, 'lowpass', 500);
        break;
      case 'coin':
        chime(1320, 0, 0.15, 0.25);
        chime(1760, 0.07, 0.12, 0.3);
        break;
      case 'deliver':
        noiseBurst(0.45, 0.11, 'bandpass', 900);
        chime(1047, 0.15, 0.14, 0.5);
        chime(1568, 0.28, 0.12, 0.5);
        tone(880, 0.08, 'sine', 0.06, 1200, 0.42);
        tone(980, 0.08, 'sine', 0.05, 1350, 0.5);
        break;
      case 'stomp':
        boom(180, 0.16, 0.24);
        noiseBurst(0.1, 0.14, 'bandpass', 800);
        break;
      case 'hurt':
        tone(280, 0.32, 'sawtooth', 0.14, 80);
        noiseBurst(0.2, 0.1, 'lowpass', 900);
        break;
      case 'checkpoint':
        chime(784, 0, 0.13, 0.35);
        chime(1047, 0.1, 0.12, 0.4);
        chime(1568, 0.2, 0.1, 0.5);
        break;
      case 'secret':
        chime(1047, 0, 0.1, 0.3);
        chime(1319, 0.08, 0.1, 0.3);
        chime(1568, 0.16, 0.1, 0.35);
        chime(2093, 0.24, 0.08, 0.5);
        break;
      case 'spirit':
        chime(523, 0, 0.12, 0.4);
        chime(659, 0.1, 0.12, 0.4);
        chime(784, 0.2, 0.12, 0.4);
        chime(1047, 0.3, 0.1, 0.7);
        break;
      case 'unlock':
        chime(880, 0, 0.1, 0.35);
        chime(1175, 0.09, 0.1, 0.35);
        chime(1760, 0.18, 0.08, 0.5);
        break;
      case 'boss':
        boom(70, 0.9, 0.5);
        noiseBurst(0.8, 0.18, 'lowpass', 300);
        tone(110, 0.7, 'sawtooth', 0.1, 55);
        break;
      case 'bossHit':
        boom(130, 0.3, 0.3);
        noiseBurst(0.25, 0.15, 'bandpass', 1200);
        break;
      case 'gate':
        noiseBurst(1.1, 0.14, 'lowpass', 600);
        boom(90, 1, 0.2);
        break;
      case 'victory':
        [523, 659, 784, 1047, 1319].forEach((f, i) => chime(f, i * 0.14, 0.14, 0.7));
        boom(130, 0.4, 0.15, 0.1);
        break;
      case 'error':
        tone(220, 0.14, 'square', 0.06, 180);
        break;
      case 'bounce':
        tone(280, 0.22, 'sine', 0.14, 900);
        break;
      case 'woosh':
        noiseBurst(0.4, 0.12, 'bandpass', 1400);
        break;
      default:
        break;
    }
  }
}

export const audio = new AudioSystem();
