import { type FC } from 'react';

export interface VisualCharacterConfig {
  skinColor: string;
  hairStyle: 'curto' | 'longo' | 'tranca' | 'espetado' | 'coque' | 'mago' | 'careca';
  hairColor: string;
  clothingStyle: 'andarilho' | 'armadura' | 'manto' | 'couro' | 'nobre';
  clothingColor: string;
  weapon: 'espada' | 'cajado' | 'adagas' | 'arco' | 'livro' | 'escudo';
  eyeColor: string;
  animation?: 'idle' | 'attack' | 'cast' | 'hurt';
}

export const DEFAULT_AVATAR: VisualCharacterConfig = {
  skinColor: '#f1d5b0',
  hairStyle: 'curto',
  hairColor: '#2b1b17',
  clothingStyle: 'armadura',
  clothingColor: '#8a2b2b',
  weapon: 'espada',
  eyeColor: '#38bdf8',
  animation: 'idle',
};

export const SKIN_PALETTES = [
  { name: 'Clara', color: '#f8e0cd' },
  { name: 'Bronzeada', color: '#d2a078' },
  { name: 'Negra', color: '#663a1e' },
  { name: 'Élfica Pálida', color: '#eef2ff' },
  { name: 'Acinzentada', color: '#a3a3a3' },
  { name: 'Orc Esmeralda', color: '#65a30d' },
  { name: 'Tiefling Carmesim', color: '#b91c1c' },
];

export const HAIR_STYLES = [
  { id: 'curto', name: 'Curto Aventureiro' },
  { id: 'longo', name: 'Longo Selvagem' },
  { id: 'tranca', name: 'Trança Guerreira' },
  { id: 'espetado', name: 'Espetado Anime' },
  { id: 'coque', name: 'Coque de Nobre' },
  { id: 'mago', name: 'Ondulado Arcano' },
  { id: 'careca', name: 'Careca & Rúnico' },
] as const;

export const HAIR_COLORS = [
  { name: 'Preto Ébano', color: '#171717' },
  { name: 'Castanho Terra', color: '#543310' },
  { name: 'Loiro Dourado', color: '#eab308' },
  { name: 'Ruivo Chama', color: '#c2410c' },
  { name: 'Prata Celestial', color: '#e2e8f0' },
  { name: 'Azul Arcano', color: '#2563eb' },
  { name: 'Roxo Místico', color: '#7c3aed' },
  { name: 'Verde Sombrio', color: '#15803d' },
];

export const CLOTHING_STYLES = [
  { id: 'andarilho', name: 'Túnica de Andarilho' },
  { id: 'armadura', name: 'Armadura de Placas de Aço' },
  { id: 'manto', name: 'Manto Arcano com Capuz' },
  { id: 'couro', name: 'Colete de Couro Furtivo' },
  { id: 'nobre', name: 'Vestes Reais Cerimoniais' },
] as const;

export const CLOTHING_COLORS = [
  { name: 'Escarlate Sangue', color: '#991b1b' },
  { name: 'Azul Meia-Noite', color: '#1e3a8a' },
  { name: 'Verde Floresta', color: '#14532d' },
  { name: 'Preto Sombra', color: '#1f2937' },
  { name: 'Dourado Imperial', color: '#ca8a04' },
  { name: 'Púrpura Régio', color: '#581c87' },
  { name: 'Branco Prateado', color: '#f3f4f6' },
];

export const WEAPONS = [
  { id: 'espada', name: 'Lâmina Rúnica' },
  { id: 'cajado', name: 'Cajado de Cristal' },
  { id: 'adagas', name: 'Lâminas Gêmeas' },
  { id: 'arco', name: 'Arco de Teixo' },
  { id: 'livro', name: 'Grimório Arcano' },
  { id: 'escudo', name: 'Escudo Brasão' },
] as const;

export const EYE_COLORS = [
  { name: 'Azul Celeste', color: '#0284c7' },
  { name: 'Dourado Solar', color: '#eab308' },
  { name: 'Verde Esmeralda', color: '#16a34a' },
  { name: 'Rubi Carmesim', color: '#dc2626' },
  { name: 'Violeta Arcano', color: '#9333ea' },
  { name: 'Cinza Tempestade', color: '#94a3b8' },
];

interface AvatarProps {
  config: VisualCharacterConfig;
  size?: number;
  className?: string;
  showShadow?: boolean;
}

export const CharacterAvatar2D: FC<AvatarProps> = ({
  config,
  size = 180,
  className = '',
  showShadow = true,
}) => {
  const { skinColor, hairStyle, hairColor, clothingStyle, clothingColor, weapon, eyeColor, animation = 'idle' } = config;

  return (
    <div
      style={{ width: size, height: size * 1.25 }}
      className={`relative select-none flex items-center justify-center ${className}`}
    >
      <svg
        viewBox="-60 -110 120 150"
        className="w-full h-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="charMetalGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="50%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>

          <linearGradient id="charGoldGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>

          <filter id="charGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Shadow under feet */}
        {showShadow && (
          <ellipse cx="0" cy="18" rx="26" ry="7" fill="#000" opacity="0.45" />
        )}

        {/* Breathing / Animation Container */}
        <g
          className={`transition-all duration-300 ${
            animation === 'idle'
              ? 'animate-[pulse_3.5s_ease-in-out_infinite]'
              : animation === 'attack'
              ? 'translate-x-3 -rotate-6'
              : animation === 'cast'
              ? '-translate-y-2 scale-105'
              : 'translate-x-[-4px] opacity-80'
          }`}
        >
          {/* Cape (for nobile or manto) */}
          {(clothingStyle === 'manto' || clothingStyle === 'nobre') && (
            <path
              d="M-22 -45 Q-34 0 -24 16 L24 16 Q34 0 22 -45 Z"
              fill={clothingColor}
              opacity="0.85"
              className="origin-top animate-[wiggle_4s_ease-in-out_infinite]"
            />
          )}

          {/* Legs & Boots */}
          <g>
            <rect x="-14" y="0" width="10" height="18" rx="3" fill="#1e293b" />
            <rect x="4" y="0" width="10" height="18" rx="3" fill="#1e293b" />
            {/* Boots cuffs */}
            <path d="M-15 12 H-3 V18 H-15 Z" fill="#0f172a" />
            <path d="M3 12 H15 V18 H3 Z" fill="#0f172a" />
          </g>

          {/* Torso & Clothing */}
          <g>
            {clothingStyle === 'armadura' ? (
              // Plate armor
              <g>
                <path d="M-18 -48 L-14 2 H14 L18 -48 Z" fill="url(#charMetalGrad)" stroke="#334155" strokeWidth="1.5" />
                <path d="M-12 -38 L0 -24 L12 -38 L0 -48 Z" fill={clothingColor} opacity="0.9" />
                {/* Pauldrons (Shoulder pads) */}
                <ellipse cx="-20" cy="-44" rx="7" ry="5" fill="url(#charGoldGrad)" stroke="#854d0e" strokeWidth="1" />
                <ellipse cx="20" cy="-44" rx="7" ry="5" fill="url(#charGoldGrad)" stroke="#854d0e" strokeWidth="1" />
                {/* Belt */}
                <rect x="-15" y="-3" width="30" height="6" fill="#78350f" rx="1.5" />
                <rect x="-4" y="-4" width="8" height="8" fill="url(#charGoldGrad)" stroke="#854d0e" strokeWidth="1" />
              </g>
            ) : clothingStyle === 'manto' ? (
              // Wizard / Mystic Robe
              <g>
                <path d="M-18 -48 Q-22 -10 -18 10 H18 Q22 -10 18 -48 Z" fill={clothingColor} stroke="#172554" strokeWidth="1.5" />
                <path d="M-6 -48 L0 -10 L6 -48 Z" fill="url(#charGoldGrad)" opacity="0.8" />
                <rect x="-16" y="-3" width="32" height="5" fill="#451a03" />
              </g>
            ) : clothingStyle === 'couro' ? (
              // Rogue Leather
              <g>
                <path d="M-16 -46 L-13 2 H13 L16 -46 Z" fill="#451a03" stroke="#291203" strokeWidth="1.5" />
                <path d="M-16 -42 L16 -24 L13 -18 L-13 -36 Z" fill={clothingColor} opacity="0.9" />
                <rect x="-14" y="-3" width="28" height="5" fill="#1c1917" />
              </g>
            ) : clothingStyle === 'nobre' ? (
              // Royal attire
              <g>
                <path d="M-18 -48 L-15 4 H15 L18 -48 Z" fill={clothingColor} stroke="#450a0a" strokeWidth="1.5" />
                <path d="M-10 -48 L0 -30 L10 -48 Z" fill="#ffffff" />
                <circle cx="0" cy="-26" r="3" fill="url(#charGoldGrad)" />
                <circle cx="0" cy="-14" r="3" fill="url(#charGoldGrad)" />
              </g>
            ) : (
              // Wanderer Tunic
              <g>
                <path d="M-16 -46 L-14 4 H14 L16 -46 Z" fill={clothingColor} stroke="#3f3f46" strokeWidth="1.5" />
                <path d="M-7 -46 L0 -34 L7 -46 Z" fill={skinColor} />
                <rect x="-14" y="-2" width="28" height="5" fill="#52525b" />
              </g>
            )}
          </g>

          {/* Head & Neck */}
          <g>
            {/* Neck */}
            <rect x="-5" y="-55" width="10" height="9" fill={skinColor} />

            {/* Head oval */}
            <ellipse cx="0" cy="-66" rx="14" ry="16" fill={skinColor} stroke="#00000022" strokeWidth="1" />

            {/* Facial Eyes */}
            <g>
              <ellipse cx="-5" cy="-65" rx="3.5" ry="2.5" fill="#ffffff" />
              <ellipse cx="5" cy="-65" rx="3.5" ry="2.5" fill="#ffffff" />
              {/* Pupils */}
              <circle cx="-5" cy="-65" r="1.8" fill={eyeColor} />
              <circle cx="5" cy="-65" r="1.8" fill={eyeColor} />
              <circle cx="-4.5" cy="-66" r="0.7" fill="#ffffff" />
              <circle cx="5.5" cy="-66" r="0.7" fill="#ffffff" />
              {/* Eyebrows */}
              <path d="M-8 -70 Q-5 -72 -2 -70" stroke={hairColor} strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <path d="M2 -70 Q5 -72 8 -70" stroke={hairColor} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </g>

            {/* Mouth */}
            <path d="M-3 -58 Q0 -56 3 -58" stroke="#713f12" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          </g>

          {/* Hair Styles */}
          <g>
            {hairStyle === 'curto' ? (
              <g>
                <path
                  d="M-16 -70 Q-18 -85 0 -85 Q18 -85 16 -70 Q14 -60 14 -72 Q8 -76 0 -76 Q-8 -76 -14 -72 Z"
                  fill={hairColor}
                />
                <path d="M-12 -75 Q-6 -69 -2 -75" fill={hairColor} />
              </g>
            ) : hairStyle === 'longo' ? (
              <g>
                <path
                  d="M-17 -68 Q-22 -86 0 -86 Q22 -86 17 -68 Q22 -30 18 -18 L14 -18 Q16 -40 14 -68 Q0 -74 -14 -68 Q-16 -40 -14 -18 L-18 -18 Q-22 -30 -17 -68 Z"
                  fill={hairColor}
                />
              </g>
            ) : hairStyle === 'tranca' ? (
              <g>
                <path d="M-16 -70 Q-18 -85 0 -85 Q18 -85 16 -70 Z" fill={hairColor} />
                <path d="M12 -65 Q20 -40 16 -12 L11 -14 Q14 -40 10 -65 Z" fill={hairColor} />
                <circle cx="14" cy="-25" r="2.5" fill="url(#charGoldGrad)" />
                <circle cx="15" cy="-14" r="2.5" fill="url(#charGoldGrad)" />
              </g>
            ) : hairStyle === 'espetado' ? (
              <g>
                <polygon points="0,-95 -10,-82 -4,-82" fill={hairColor} />
                <polygon points="-12,-90 -16,-76 -8,-78" fill={hairColor} />
                <polygon points="12,-90 8,-78 16,-76" fill={hairColor} />
                <polygon points="-5,-88 -12,-72 12,-72" fill={hairColor} />
              </g>
            ) : hairStyle === 'coque' ? (
              <g>
                <path d="M-16 -70 Q-18 -85 0 -85 Q18 -85 16 -70 Z" fill={hairColor} />
                <circle cx="0" cy="-90" r="7" fill={hairColor} />
                {/* Hairpin */}
                <line x1="-10" y1="-88" x2="10" y2="-92" stroke="url(#charGoldGrad)" strokeWidth="2" />
              </g>
            ) : hairStyle === 'mago' ? (
              <g>
                <path
                  d="M-18 -68 Q-22 -86 0 -86 Q22 -86 18 -68 Q24 -45 20 -25 Q14 -55 12 -70 Q-12 -70 -14 -55 Q-20 -45 -18 -68 Z"
                  fill={hairColor}
                />
                {/* Wizard Hat if wanted */}
                <polygon points="-24,-76 0,-115 24,-76" fill={clothingColor} opacity="0.9" />
                <ellipse cx="0" cy="-76" rx="26" ry="6" fill={clothingColor} />
                <circle cx="0" cy="-76" r="3" fill="url(#charGoldGrad)" />
              </g>
            ) : (
              // Careca & Runic Tattoos
              <g>
                <path d="M-6 -76 Q0 -79 6 -76" stroke="#38bdf8" strokeWidth="1.2" fill="none" opacity="0.8" />
                <circle cx="0" cy="-76" r="1.5" fill="#38bdf8" opacity="0.9" filter="url(#charGlow)" />
              </g>
            )}
          </g>

          {/* Weapon / Accessory */}
          <g className="origin-center transition-transform">
            {weapon === 'espada' ? (
              // Sword
              <g transform="translate(24, -30)">
                <rect x="-2" y="-36" width="4" height="42" fill="url(#charMetalGrad)" rx="1" />
                <polygon points="0,-42 -3,-36 3,-36" fill="url(#charMetalGrad)" />
                <rect x="-8" y="6" width="16" height="3" fill="url(#charGoldGrad)" rx="1" />
                <rect x="-2" y="9" width="4" height="9" fill="#78350f" />
                <circle cx="0" cy="19" r="2.5" fill="url(#charGoldGrad)" />
                {/* Magic rune glow */}
                <line x1="0" y1="-30" x2="0" y2="-10" stroke="#38bdf8" strokeWidth="1.2" filter="url(#charGlow)" />
              </g>
            ) : weapon === 'cajado' ? (
              // Wizard Staff
              <g transform="translate(22, -35)">
                <rect x="-2" y="-30" width="4" height="70" fill="#713f12" rx="2" />
                {/* Spiral head */}
                <circle cx="0" cy="-35" r="8" fill="url(#charGoldGrad)" />
                <circle cx="0" cy="-35" r="5" fill="#a855f7" filter="url(#charGlow)" className="animate-pulse" />
              </g>
            ) : weapon === 'adagas' ? (
              // Twin Daggers
              <g>
                <g transform="translate(-24, -15) rotate(-35)">
                  <polygon points="0,-20 -3,0 3,0" fill="url(#charMetalGrad)" />
                  <rect x="-5" y="0" width="10" height="2" fill="url(#charGoldGrad)" />
                  <rect x="-1.5" y="2" width="3" height="6" fill="#18181b" />
                </g>
                <g transform="translate(24, -15) rotate(35)">
                  <polygon points="0,-20 -3,0 3,0" fill="url(#charMetalGrad)" />
                  <rect x="-5" y="0" width="10" height="2" fill="url(#charGoldGrad)" />
                  <rect x="-1.5" y="2" width="3" height="6" fill="#18181b" />
                </g>
              </g>
            ) : weapon === 'arco' ? (
              // Bow
              <g transform="translate(24, -20)">
                <path d="M0 -35 Q18 0 0 35" stroke="#713f12" strokeWidth="3" fill="none" />
                <line x1="0" y1="-35" x2="0" y2="35" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
              </g>
            ) : weapon === 'livro' ? (
              // Arcane Tome
              <g transform="translate(20, -15) rotate(-15)">
                <rect x="-10" y="-12" width="20" height="24" fill="#4c0519" stroke="url(#charGoldGrad)" strokeWidth="1.5" rx="2" />
                <circle cx="0" cy="0" r="4" fill="#38bdf8" filter="url(#charGlow)" />
              </g>
            ) : (
              // Shield
              <g transform="translate(22, -18)">
                <path d="M-12 -16 H12 V6 L0 18 L-12 6 Z" fill="url(#charMetalGrad)" stroke="url(#charGoldGrad)" strokeWidth="2" />
                <circle cx="0" cy="0" r="4" fill={clothingColor} />
              </g>
            )}
          </g>
        </g>
      </svg>
    </div>
  );
};
