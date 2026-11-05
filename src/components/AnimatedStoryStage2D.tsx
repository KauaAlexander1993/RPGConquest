import { useState, useEffect, type FC } from 'react';
import { CharacterAvatar2D, VisualCharacterConfig, DEFAULT_AVATAR } from './CharacterAvatar2D';
import { Volume2, VolumeX, Swords, Wand2, Shield, Sparkles } from 'lucide-react';
import { soundFX } from '../utils/soundEffects';

interface StoryStageProps {
  scene: string;
  worldName: string;
  characterConfig: VisualCharacterConfig;
  criatura?: string;
  npc?: string;
  lastAction?: string;
  dangerLevel?: number;
  onActionClick?: (action: string) => void;
}

export const AnimatedStoryStage2D: FC<StoryStageProps> = ({
  scene = 'floresta',
  worldName = 'Fantasia medieval',
  characterConfig = DEFAULT_AVATAR,
  criatura = '',
  npc = '',
  lastAction = '',
  dangerLevel = 2,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(soundFX.enabled);
  const [actionEffect, setActionEffect] = useState<'slash' | 'magic' | 'shield' | null>(null);
  const [particles, setParticles] = useState<Array<{ x: number; y: number; size: number; speed: number; opacity: number }>>([]);

  // Generate atmospheric floating particles (embers, fireflies, dust)
  useEffect(() => {
    const list = Array.from({ length: 24 }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 3,
      speed: 2 + Math.random() * 4,
      opacity: 0.3 + Math.random() * 0.7,
    }));
    setParticles(list);
    // Smooth atmospheric transition sound
    soundFX.playAmbientTransition(scene);
  }, [scene]);

  // Trigger visual slash/magic/shield FX when action changes
  useEffect(() => {
    if (!lastAction) return;
    const lower = lastAction.toLowerCase();
    if (lower.includes('atac') || lower.includes('golp') || lower.includes('espada') || lower.includes('lut')) {
      setActionEffect('slash');
      soundFX.playSwordClash();
      setTimeout(() => setActionEffect(null), 800);
    } else if (lower.includes('magia') || lower.includes('feiti') || lower.includes('arcano') || lower.includes('poder')) {
      setActionEffect('magic');
      soundFX.playMagic();
      setTimeout(() => setActionEffect(null), 1000);
    } else if (lower.includes('defend') || lower.includes('escudo') || lower.includes('guard')) {
      setActionEffect('shield');
      soundFX.playHeavyImpact();
      setTimeout(() => setActionEffect(null), 800);
    }
  }, [lastAction]);

  const toggleSound = () => {
    soundFX.enabled = !soundFX.enabled;
    setSoundEnabled(soundFX.enabled);
  };

  // Scene Palette Configuration
  const getScenePalette = () => {
    switch (scene) {
      case 'caverna':
        return { sky: ['#0f0c1b', '#1f1a30'], ground: '#14111f', moon: '#a855f7', weather: 'embers' };
      case 'castelo':
        return { sky: ['#1e1b4b', '#312e81'], ground: '#0f172a', moon: '#fef08a', weather: 'torches' };
      case 'cidade':
        return { sky: ['#18181b', '#27272a'], ground: '#09090b', moon: '#fbbf24', weather: 'dust' };
      case 'mar':
        return { sky: ['#082f49', '#0369a1'], ground: '#0284c7', moon: '#e0f2fe', weather: 'mist' };
      case 'espaco':
        return { sky: ['#030712', '#1e1b4b'], ground: '#111827', moon: '#38bdf8', weather: 'stars' };
      case 'deserto':
        return { sky: ['#451a03', '#9a3412'], ground: '#78350f', moon: '#fdba74', weather: 'dust' };
      case 'ruinas':
        return { sky: ['#1c1917', '#292524'], ground: '#0c0a09', moon: '#a3e635', weather: 'embers' };
      default: // floresta
        return { sky: ['#064e3b', '#022c22'], ground: '#062e1e', moon: '#fef08a', weather: 'fireflies' };
    }
  };

  const palette = getScenePalette();

  return (
    <div className="relative w-full h-64 md:h-72 rounded-2xl overflow-hidden border border-[#3a3626] bg-[#0b0d0c] shadow-2xl select-none mb-4">
      {/* Sky & Horizon Gradient */}
      <div
        className="absolute inset-0 transition-colors duration-1000"
        style={{
          background: `linear-gradient(180deg, ${palette.sky[0]} 0%, ${palette.sky[1]} 65%, ${palette.ground} 100%)`,
        }}
      />

      {/* Twinkling Celestial Body (Moon/Sun/Arcane Orb) */}
      <div
        style={{ backgroundColor: palette.moon }}
        className="absolute top-5 right-12 w-16 h-16 rounded-full shadow-[0_0_40px_10px] shadow-current opacity-85 animate-[pulse_4s_ease-in-out_infinite]"
      />

      {/* Distant Parallax Silhouettes (Mountains or Forest) */}
      <svg
        viewBox="0 0 500 180"
        className="absolute bottom-10 left-0 right-0 w-full h-32 opacity-40 pointer-events-none"
        preserveAspectRatio="none"
      >
        <path
          d="M0 120 Q80 40 160 110 T320 80 T500 130 V180 H0 Z"
          fill="#000000"
        />
        <path
          d="M0 140 Q120 70 240 130 T480 110 V180 H0 Z"
          fill="#050505"
        />
      </svg>

      {/* Ground plane */}
      <div
        style={{ backgroundColor: palette.ground }}
        className="absolute bottom-0 left-0 right-0 h-16 border-t border-black/40 shadow-inner"
      />

      {/* Atmospheric Particles (Embers / Fireflies / Rain) */}
      {particles.map((p, idx) => (
        <div
          key={idx}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            animationDuration: `${p.speed}s`,
          }}
          className="absolute rounded-full bg-[#fde047] shadow-[0_0_6px_#fde047] pointer-events-none animate-ping"
        />
      ))}

      {/* Stage Characters: Hero on Left, Adversary/NPC on Right */}
      <div className="absolute inset-0 flex justify-between items-end px-6 md:px-16 pb-3 pointer-events-none">
        {/* Left: Player's Customized Character */}
        <div className="relative pointer-events-auto transform transition-transform hover:scale-105">
          {/* Hero Name Badge */}
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-black/75 border border-[#e8c46a66] text-[11px] font-serif text-[#e8c46a] whitespace-nowrap shadow-md">
            Você (Herói)
          </div>

          <CharacterAvatar2D
            config={{
              ...characterConfig,
              animation: actionEffect ? (actionEffect === 'magic' ? 'cast' : 'attack') : 'idle',
            }}
            size={140}
          />
        </div>

        {/* Right: Encountered Monster or NPC */}
        <div className="relative pointer-events-auto transform transition-transform hover:scale-105">
          {criatura ? (
            <div className="flex flex-col items-center">
              <div className="px-2.5 py-0.5 mb-1 rounded bg-red-950/80 border border-red-500/50 text-[11px] font-serif text-red-300 font-bold tracking-wider shadow-md uppercase">
                {criatura} (Ameaça Nv {dangerLevel})
              </div>
              <div className="animate-[bounce_3s_ease-in-out_infinite]">
                <MonsterSprite2D type={criatura} />
              </div>
            </div>
          ) : npc ? (
            <div className="flex flex-col items-center">
              <div className="px-2.5 py-0.5 mb-1 rounded bg-blue-950/80 border border-blue-500/50 text-[11px] font-serif text-blue-200 font-bold tracking-wider shadow-md">
                NPC: {npc}
              </div>
              <div className="animate-[pulse_3s_ease-in-out_infinite]">
                <NpcSprite2D type={npc} />
              </div>
            </div>
          ) : (
            <div className="text-center opacity-60 pb-8">
              <div className="text-xs font-serif text-[#9a927e] italic">
                Caminho desimpedido...
              </div>
              <div className="w-12 h-1 bg-[#3a3626] mx-auto mt-1 rounded-full" />
            </div>
          )}
        </div>
      </div>

      {/* Visual FX Overlay (Slash streaks, magic burst, shield) */}
      {actionEffect === 'slash' && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-96 h-2 bg-gradient-to-r from-transparent via-white to-transparent rotate-45 shadow-[0_0_25px_8px_#ffffff] animate-ping" />
        </div>
      )}
      {actionEffect === 'magic' && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-48 h-48 rounded-full border-4 border-cyan-400 shadow-[0_0_40px_10px_#06b6d4] animate-ping opacity-75" />
        </div>
      )}

      {/* Top Controls Overlay */}
      <div className="absolute top-3 left-4 right-4 flex justify-between items-center pointer-events-auto">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-[#3a3626] text-xs font-serif text-[#e8c46a] flex items-center gap-1.5 shadow">
            <Sparkles className="w-3.5 h-3.5 text-[#e8c46a]" /> {scene.toUpperCase()} · {worldName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Silenciar Efeitos' : 'Ativar Efeitos'}
            className="p-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-[#3a3626] hover:border-[#e8c46a] text-[#e8c46a] transition-all shadow"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-[#9a927e]" />}
          </button>
        </div>
      </div>
    </div>
  );
};

// 2D Monster Sprite Renderer
const MonsterSprite2D: FC<{ type: string }> = ({ type }) => {
  const t = type.toLowerCase();
  if (t.includes('dragao') || t.includes('dragão')) {
    return (
      <svg viewBox="-50 -50 100 100" width="130" height="130">
        <ellipse cx="0" cy="10" rx="35" ry="22" fill="#7f1d1d" />
        <polygon points="-10,-10 -40,-45 10,-20" fill="#991b1b" />
        <polygon points="10,-10 40,-45 20,-20" fill="#991b1b" />
        <circle cx="28" cy="-14" r="14" fill="#991b1b" />
        <circle cx="32" cy="-17" r="3" fill="#fef08a" />
        <circle cx="33" cy="-17" r="1.5" fill="#000" />
        <path d="M-30 15 Q-50 20 -45 5" stroke="#7f1d1d" strokeWidth="6" fill="none" />
      </svg>
    );
  }
  if (t.includes('lobo')) {
    return (
      <svg viewBox="-40 -40 80 80" width="100" height="100">
        <ellipse cx="0" cy="5" rx="25" ry="14" fill="#475569" />
        <circle cx="18" cy="-8" r="10" fill="#475569" />
        <polygon points="12,-16 16,-26 22,-16" fill="#334155" />
        <circle cx="21" cy="-9" r="2.5" fill="#ef4444" />
        <path d="M-22 5 Q-32 -5 -30 15" stroke="#475569" strokeWidth="4" fill="none" />
      </svg>
    );
  }
  if (t.includes('esqueleto')) {
    return (
      <svg viewBox="-30 -50 60 80" width="90" height="110">
        <circle cx="0" cy="-30" r="10" fill="#e2e8f0" />
        <circle cx="-3" cy="-31" r="2.5" fill="#000" />
        <circle cx="3" cy="-31" r="2.5" fill="#000" />
        <line x1="0" y1="-20" x2="0" y2="10" stroke="#e2e8f0" strokeWidth="3" />
        <line x1="-12" y1="-12" x2="12" y2="-12" stroke="#e2e8f0" strokeWidth="2.5" />
        <line x1="-10" y1="-5" x2="10" y2="-5" stroke="#e2e8f0" strokeWidth="2" />
        <line x1="-8" y1="10" x2="-8" y2="25" stroke="#e2e8f0" strokeWidth="2.5" />
        <line x1="8" y1="10" x2="8" y2="25" stroke="#e2e8f0" strokeWidth="2.5" />
      </svg>
    );
  }
  // Default Goblin / Demon / Creature
  return (
    <svg viewBox="-30 -40 60 70" width="85" height="100">
      <path d="M-12 15 L-9 -15 H9 L12 15 Z" fill="#14532d" />
      <circle cx="0" cy="-22" r="10" fill="#15803d" />
      <polygon points="-8,-26 -18,-30 -8,-20" fill="#15803d" />
      <polygon points="8,-26 18,-30 8,-20" fill="#15803d" />
      <circle cx="-3" cy="-23" r="2" fill="#facc15" />
      <circle cx="3" cy="-23" r="2" fill="#facc15" />
    </svg>
  );
};

// 2D NPC Sprite Renderer
const NpcSprite2D: FC<{ type: string }> = ({ type }) => {
  const t = type.toLowerCase();
  const cloakColor = t.includes('sabio') ? '#1e3a8a' : (t.includes('guarda') ? '#475569' : '#854d0e');
  return (
    <svg viewBox="-30 -50 60 80" width="85" height="110">
      <ellipse cx="0" cy="18" rx="18" ry="5" fill="#000" opacity="0.4" />
      <path d="M-14 -25 L-11 16 H11 L14 -25 Z" fill={cloakColor} />
      <circle cx="0" cy="-35" r="9" fill="#f8d7b8" />
      {t.includes('sabio') && (
        <path d="M-6 -30 Q0 -18 6 -30 Z" fill="#f8fafc" />
      )}
      <circle cx="-2.5" cy="-35" r="1.5" fill="#000" />
      <circle cx="2.5" cy="-35" r="1.5" fill="#000" />
      {/* Staff or Weapon */}
      <rect x="13" y="-45" width="2.5" height="60" fill="#78350f" rx="1" />
      <circle cx="14" cy="-46" r="3.5" fill="#fde047" />
    </svg>
  );
};
