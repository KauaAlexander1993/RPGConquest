// Procedural Web Audio API sound effects and ambient soundscape for RPG immersion
// 100% synthetic, zero external asset dependencies, zero broken links

export type RPGSceneType = 
  | 'floresta' 
  | 'caverna' 
  | 'castelo' 
  | 'cidade' 
  | 'ruinas' 
  | 'mar' 
  | 'deserto' 
  | 'montanha' 
  | 'espaco' 
  | 'taverna' 
  | 'escola'
  | 'default';

class SoundFX {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  public volume: number = 0.6;
  public ambientEnabled: boolean = false;
  private currentAmbientScene: string | null = null;
  private ambientNodes: {
    sources: (AudioNode | number)[];
    gainNode?: GainNode;
  } | null = null;

  constructor() {
    try {
      const savedMute = localStorage.getItem('rpg_audio_mute');
      if (savedMute !== null) {
        this.enabled = savedMute !== 'true';
      }
      const savedAmbient = localStorage.getItem('rpg_ambient_enabled');
      if (savedAmbient !== null) {
        this.ambientEnabled = savedAmbient === 'true';
      }
    } catch {}
  }

  public getContext(): AudioContext | null {
    if (!this.enabled) return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public setMuted(muted: boolean) {
    this.enabled = !muted;
    try {
      localStorage.setItem('rpg_audio_mute', String(muted));
    } catch {}
    if (muted) {
      this.stopAmbient();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.ambientNodes && this.ambientNodes.gainNode && this.ctx) {
      this.ambientNodes.gainNode.gain.setValueAtTime(this.volume * 0.18, this.ctx.currentTime);
    }
  }

  // --- 1. PAGE FLIP (Papel / Pergaminho do Diário) ---
  playPageFlip() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const dur = 0.22;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Multi-grain friction noise to simulate rough parchment fibers sliding
    for (let i = 0; i < bufferSize; i++) {
      const envelope = Math.sin((i / bufferSize) * Math.PI);
      const grain = Math.sin(i * 0.05) > 0 ? 1 : -0.7;
      data[i] = (Math.random() * 2 - 1) * envelope * (0.8 + 0.2 * grain);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(700, now + dur);
    filter.Q.setValueAtTime(1.8, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.24 * this.volume, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + dur + 0.02);
  }

  // --- 2. BATTLE SOUNDS ---

  // Espada afiada / Ataque cortante
  playSlash() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const dur = 0.14;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2400, now);
    filter.frequency.exponentialRampToValueAtTime(320, now + dur);
    filter.Q.setValueAtTime(3.2, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + dur);
  }

  // Choque de lâminas / Ferro contra ferro
  playSwordClash() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // Inharmonic metallic ring frequencies
    const freqs = [920, 1480, 2640, 4200];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.96, now + 0.35);

      const amp = (0.2 / (idx + 1)) * this.volume;
      gain.gain.setValueAtTime(amp, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.36);
    });

    // Metallic spark transient
    this.playSlash();
  }

  // Impacto pesado / Golpe contundente / Escudo
  playHeavyImpact() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Sub-bass thud
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.28);

    gain.gain.setValueAtTime(0.4 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);

    // Wood/iron crunch
    const dur = 0.09;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.25 * this.volume, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + dur);
  }

  // Rugido / Tensão de monstro ou fera ancestral
  playMonsterRoar() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const dur = 0.75;

    // Low guttural saw oscillator with frequency pitch sweep
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(65, now);
    osc.frequency.linearRampToValueAtTime(115, now + 0.25);
    osc.frequency.exponentialRampToValueAtTime(45, now + dur);

    // Filter distortion sweep
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, now);
    filter.frequency.linearRampToValueAtTime(850, now + 0.2);
    filter.frequency.exponentialRampToValueAtTime(180, now + dur);

    // Tremolo LFO for guttural growl
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(18, now);
    lfoGain.gain.setValueAtTime(35, now);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.28 * this.volume, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    lfo.start(now);
    osc.stop(now + dur);
    lfo.stop(now + dur);
  }

  // Trompa de guerra / Início de combate dramático
  playWarHorn() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const dur = 0.9;

    [110, 164.81].forEach(baseFreq => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(baseFreq * 0.97, now);
      osc.frequency.linearRampToValueAtTime(baseFreq, now + 0.15);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18 * this.volume, now + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);
      filter.frequency.linearRampToValueAtTime(950, now + 0.3);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + dur);
    });
  }

  // --- 3. AMBIENT TRANSITION (Transição Suave de Ambiente) ---
  playAmbientTransition(sceneType?: string) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const dur = 1.4;

    const chordMap: Record<string, number[]> = {
      caverna: [130.81, 164.81, 196.00, 246.94], // C minor / mystery
      castelo: [146.83, 220.00, 293.66, 369.99], // D major majestic
      ruinas: [110.00, 146.83, 174.61, 220.00],  // A minor ancient
      mar: [174.61, 220.00, 261.63, 349.23],     // F major ocean breeze
      deserto: [146.83, 155.56, 220.00, 293.66], // Phrygian exotic
      espaco: [196.00, 293.66, 392.00, 587.33],  // Ethereal fifths
      taverna: [196.00, 246.94, 293.66, 392.00], // G major cozy
      floresta: [164.81, 220.00, 261.63, 329.63] // E minor nature
    };

    const freqs = (sceneType && chordMap[sceneType.toLowerCase()]) || chordMap.floresta;

    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime((0.12 / (idx * 0.4 + 1)) * this.volume, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.04);
      osc.stop(now + dur);
    });

    // Soft chime sparkle
    const chime = ctx.createOscillator();
    const cGain = ctx.createGain();
    chime.type = 'triangle';
    chime.frequency.setValueAtTime(1046.5, now + 0.3);
    chime.frequency.exponentialRampToValueAtTime(1318.5, now + 0.7);

    cGain.gain.setValueAtTime(0.001, now + 0.3);
    cGain.gain.linearRampToValueAtTime(0.07 * this.volume, now + 0.45);
    cGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    chime.connect(cGain);
    cGain.connect(ctx.destination);

    chime.start(now + 0.3);
    chime.stop(now + dur);
  }

  // --- 4. CONTINUOUS AMBIENT SOUNDSCAPE (Loop Suave de Fundo) ---
  startAmbient(sceneType: string = 'floresta') {
    if (!this.enabled || !this.ambientEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    if (this.ambientNodes && this.currentAmbientScene === sceneType) {
      return; // already playing this scene
    }

    this.stopAmbient();
    this.currentAmbientScene = sceneType;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.18 * this.volume, ctx.currentTime + 1.2);
    masterGain.connect(ctx.destination);

    const nodes: (AudioNode | number)[] = [];

    // Filtered continuous pink/wind noise generator
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      output[i] = b0 + b1 + b2;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = sceneType === 'caverna' ? 'lowpass' : 'bandpass';
    filter.frequency.setValueAtTime(sceneType === 'caverna' ? 240 : 480, ctx.currentTime);
    filter.Q.setValueAtTime(sceneType === 'caverna' ? 1.5 : 2.5, ctx.currentTime);

    // Slow wind modulation
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(0.2, ctx.currentTime);
    lfoGain.gain.setValueAtTime(140, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    noiseSource.connect(filter);
    filter.connect(masterGain);

    noiseSource.start();
    lfo.start();

    nodes.push(noiseSource, lfo, filter, masterGain);

    // Ambient background musical drone
    const droneFreq = sceneType === 'caverna' ? 65.41 : (sceneType === 'mar' ? 87.31 : 110.0);
    const droneOsc = ctx.createOscillator();
    const droneGain = ctx.createGain();
    droneOsc.type = 'sine';
    droneOsc.frequency.setValueAtTime(droneFreq, ctx.currentTime);
    droneGain.gain.setValueAtTime(0.04, ctx.currentTime);

    droneOsc.connect(droneGain);
    droneGain.connect(masterGain);
    droneOsc.start();
    nodes.push(droneOsc, droneGain);

    this.ambientNodes = {
      sources: nodes,
      gainNode: masterGain
    };
  }

  stopAmbient() {
    if (!this.ambientNodes || !this.ctx) return;
    const { sources, gainNode } = this.ambientNodes;
    try {
      if (gainNode) {
        gainNode.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
      }
      setTimeout(() => {
        sources.forEach(n => {
          try {
            if (typeof (n as any).stop === 'function') (n as any).stop();
            if (typeof (n as any).disconnect === 'function') (n as any).disconnect();
          } catch {}
        });
      }, 700);
    } catch {}
    this.ambientNodes = null;
    this.currentAmbientScene = null;
  }

  toggleAmbient(sceneType: string = 'floresta') {
    this.ambientEnabled = !this.ambientEnabled;
    try {
      localStorage.setItem('rpg_ambient_enabled', String(this.ambientEnabled));
    } catch {}

    if (this.ambientEnabled) {
      this.startAmbient(sceneType);
    } else {
      this.stopAmbient();
    }
    return this.ambientEnabled;
  }

  isAmbientPlaying(): boolean {
    return this.ambientEnabled && this.ambientNodes !== null;
  }

  // --- 5. DICE ROLL ---
  playDiceRoll() {
    const ctx = this.getContext();
    if (!ctx) return;

    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140 + Math.random() * 220, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.05);

        gain.gain.setValueAtTime(0.2 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.06);
      }, i * 45);
    }
  }

  // --- 6. SUCCESS & FANFARE ---
  playSuccess() {
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [392, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
    notes.forEach((freq, idx) => {
      const now = ctx.currentTime + idx * 0.09;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.2 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    });
  }

  playQuestFanfare() {
    const ctx = this.getContext();
    if (!ctx) return;

    const chords = [
      [261.63, 329.63, 392.00], // C
      [293.66, 369.99, 440.00], // D
      [329.63, 415.30, 493.88], // E
      [523.25, 659.25, 783.99]  // High C octave
    ];

    chords.forEach((chord, step) => {
      const stepTime = ctx.currentTime + step * 0.16;
      chord.forEach(f => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = step === 3 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(f, stepTime);

        gain.gain.setValueAtTime(0.12 * this.volume, stepTime);
        gain.gain.exponentialRampToValueAtTime(0.001, stepTime + (step === 3 ? 0.6 : 0.22));

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(stepTime);
        osc.stop(stepTime + 0.65);
      });
    });
  }

  // --- 7. COIN / CRYSTAL JINGLE ---
  playCoinJingle() {
    const ctx = this.getContext();
    if (!ctx) return;

    [2489, 3136, 4186].forEach((f, idx) => {
      const now = ctx.currentTime + idx * 0.06;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);

      gain.gain.setValueAtTime(0.18 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.26);
    });
  }

  // --- 8. MAGIC CAST ---
  playMagic() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.26);

    gain.gain.setValueAtTime(0.18 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.34);
  }

  // --- 9. INTERACTION CLICKS ---
  playClick() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.035);

    gain.gain.setValueAtTime(0.1 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  // --- 10. POTION DRINK (Consumível / Cura) ---
  playPotionDrink() {
    const ctx = this.getContext();
    if (!ctx) return;

    // Bubbling liquid pop frequencies
    [320, 480, 620, 840].forEach((freq, idx) => {
      setTimeout(() => {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.06);

        gain.gain.setValueAtTime(0.16 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.07);
      }, idx * 60);
    });
  }

  // --- 11. EQUIP ITEM (Armas / Armaduras / Relíquias) ---
  playEquipItem() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);

    gain.gain.setValueAtTime(0.2 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.11);

    // Subtle metallic click
    this.playClick();
  }
}

export const soundFX = new SoundFX();

// Expose globally so vanilla scripts in container can trigger contextual audio effortlessly
if (typeof window !== 'undefined') {
  (window as any).soundFX = soundFX;
}
