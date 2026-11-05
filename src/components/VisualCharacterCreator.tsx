import { useState, type FC } from 'react';
import { 
  CharacterAvatar2D, 
  VisualCharacterConfig, 
  DEFAULT_AVATAR,
  SKIN_PALETTES,
  HAIR_STYLES,
  HAIR_COLORS,
  CLOTHING_STYLES,
  CLOTHING_COLORS,
  WEAPONS,
  EYE_COLORS 
} from './CharacterAvatar2D';
import { Sparkles, Dices, Check, User, Shield, Wand2, Eye } from 'lucide-react';
import { soundFX } from '../utils/soundEffects';

interface VisualCreatorProps {
  initialConfig?: VisualCharacterConfig;
  onSave: (config: VisualCharacterConfig) => void;
  onCancel?: () => void;
}

export const VisualCharacterCreator: FC<VisualCreatorProps> = ({
  initialConfig = DEFAULT_AVATAR,
  onSave,
  onCancel,
}) => {
  const [config, setConfig] = useState<VisualCharacterConfig>({ ...initialConfig });
  const [activeTab, setActiveTab] = useState<'corpo' | 'cabelo' | 'roupa' | 'arma'>('cabelo');

  const handleRandomize = () => {
    soundFX.playDiceRoll();
    const randomSkin = SKIN_PALETTES[Math.floor(Math.random() * SKIN_PALETTES.length)].color;
    const randomHair = HAIR_STYLES[Math.floor(Math.random() * HAIR_STYLES.length)].id;
    const randomHairColor = HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)].color;
    const randomClothing = CLOTHING_STYLES[Math.floor(Math.random() * CLOTHING_STYLES.length)].id;
    const randomClothingColor = CLOTHING_COLORS[Math.floor(Math.random() * CLOTHING_COLORS.length)].color;
    const randomWeapon = WEAPONS[Math.floor(Math.random() * WEAPONS.length)].id;
    const randomEye = EYE_COLORS[Math.floor(Math.random() * EYE_COLORS.length)].color;

    setConfig({
      skinColor: randomSkin,
      hairStyle: randomHair,
      hairColor: randomHairColor,
      clothingStyle: randomClothing,
      clothingColor: randomClothingColor,
      weapon: randomWeapon,
      eyeColor: randomEye,
      animation: 'idle',
    });
  };

  const handleSelect = (key: keyof VisualCharacterConfig, val: any) => {
    soundFX.playClick();
    setConfig(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div className="bg-[#17191a] border border-[#e8c46a66] rounded-2xl p-5 md:p-7 max-w-3xl mx-auto shadow-2xl text-[#efe6d2]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#3a3626] pb-4 mb-5">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-serif text-[#e8c46a] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#e8c46a]" /> Forja Visual do Herói (2D)
          </h2>
          <p className="text-xs text-[#9a927e] mt-0.5">
            Personalize a aparência do seu personagem: pele, estilo de cabelo, cores e vestimentas.
          </p>
        </div>
        <button
          onClick={handleRandomize}
          className="px-3.5 py-1.5 rounded-lg bg-[#101211] border border-[#3a3626] hover:border-[#e8c46a] text-xs font-semibold text-[#e8c46a] flex items-center gap-1.5 transition-all"
        >
          <Dices className="w-3.5 h-3.5" /> Aleatório
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left: 2D Live Character Stage */}
        <div className="md:col-span-5 flex flex-col items-center justify-center bg-gradient-to-b from-[#101211] to-[#1e1c16] border border-[#3a3626] rounded-xl p-5 relative overflow-hidden">
          {/* Ambient magical aura */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(232,196,106,0.15),transparent_70%)] pointer-events-none" />
          
          <CharacterAvatar2D config={config} size={190} />

          {/* Pedestal Tag */}
          <div className="mt-2 text-center">
            <span className="text-xs font-serif font-bold text-[#e8c46a] uppercase tracking-wider block">
              Visual em Tempo Real
            </span>
            <span className="text-[11px] text-[#9a927e]">
              Aparecerá animado nas cenas da história
            </span>
          </div>
        </div>

        {/* Right: Customization Controls */}
        <div className="md:col-span-7 space-y-4">
          {/* Subtabs */}
          <div className="flex bg-[#101211] p-1 rounded-lg border border-[#3a3626] gap-1 text-xs">
            <button
              onClick={() => setActiveTab('cabelo')}
              className={`flex-1 py-1.5 rounded font-semibold transition-all flex items-center justify-center gap-1 ${
                activeTab === 'cabelo'
                  ? 'bg-[#e8c46a22] text-[#e8c46a] border border-[#e8c46a44]'
                  : 'text-[#9a927e] hover:text-[#efe6d2]'
              }`}
            >
              <User className="w-3.5 h-3.5" /> Cabelo & Pele
            </button>
            <button
              onClick={() => setActiveTab('roupa')}
              className={`flex-1 py-1.5 rounded font-semibold transition-all flex items-center justify-center gap-1 ${
                activeTab === 'roupa'
                  ? 'bg-[#e8c46a22] text-[#e8c46a] border border-[#e8c46a44]'
                  : 'text-[#9a927e] hover:text-[#efe6d2]'
              }`}
            >
              <Shield className="w-3.5 h-3.5" /> Roupas
            </button>
            <button
              onClick={() => setActiveTab('arma')}
              className={`flex-1 py-1.5 rounded font-semibold transition-all flex items-center justify-center gap-1 ${
                activeTab === 'arma'
                  ? 'bg-[#e8c46a22] text-[#e8c46a] border border-[#e8c46a44]'
                  : 'text-[#9a927e] hover:text-[#efe6d2]'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" /> Arma & Olhos
            </button>
          </div>

          {/* TAB 1: Cabelo & Pele */}
          {activeTab === 'cabelo' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#e8c46a] block mb-1.5">
                  Tom de Pele
                </label>
                <div className="flex flex-wrap gap-2">
                  {SKIN_PALETTES.map(p => (
                    <button
                      key={p.color}
                      onClick={() => handleSelect('skinColor', p.color)}
                      style={{ backgroundColor: p.color }}
                      title={p.name}
                      className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                        config.skinColor === p.color ? 'border-white ring-2 ring-[#e8c46a] scale-110' : 'border-black/40'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#e8c46a] block mb-1.5">
                  Estilo de Cabelo
                </label>
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {HAIR_STYLES.map(h => (
                    <button
                      key={h.id}
                      onClick={() => handleSelect('hairStyle', h.id)}
                      className={`px-2.5 py-1.5 rounded text-xs text-left border transition-all ${
                        config.hairStyle === h.id
                          ? 'border-[#e8c46a] bg-[#e8c46a22] text-[#e8c46a] font-semibold'
                          : 'border-[#3a3626] bg-[#101211] text-[#9a927e] hover:border-[#e8c46a66]'
                      }`}
                    >
                      {h.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#e8c46a] block mb-1.5">
                  Cor do Cabelo
                </label>
                <div className="flex flex-wrap gap-2">
                  {HAIR_COLORS.map(c => (
                    <button
                      key={c.color}
                      onClick={() => handleSelect('hairColor', c.color)}
                      style={{ backgroundColor: c.color }}
                      title={c.name}
                      className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                        config.hairColor === c.color ? 'border-white ring-2 ring-[#e8c46a] scale-110' : 'border-black/50'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Roupas */}
          {activeTab === 'roupa' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#e8c46a] block mb-1.5">
                  Estilo de Traje / Armadura
                </label>
                <div className="space-y-1.5">
                  {CLOTHING_STYLES.map(cl => (
                    <button
                      key={cl.id}
                      onClick={() => handleSelect('clothingStyle', cl.id)}
                      className={`w-full px-3 py-2 rounded text-xs text-left border transition-all flex items-center justify-between ${
                        config.clothingStyle === cl.id
                          ? 'border-[#e8c46a] bg-[#e8c46a22] text-[#e8c46a] font-semibold'
                          : 'border-[#3a3626] bg-[#101211] text-[#9a927e] hover:border-[#e8c46a66]'
                      }`}
                    >
                      <span>{cl.name}</span>
                      {config.clothingStyle === cl.id && <Check className="w-3.5 h-3.5 text-[#e8c46a]" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#e8c46a] block mb-1.5">
                  Cor Principal do Traje
                </label>
                <div className="flex flex-wrap gap-2">
                  {CLOTHING_COLORS.map(cc => (
                    <button
                      key={cc.color}
                      onClick={() => handleSelect('clothingColor', cc.color)}
                      style={{ backgroundColor: cc.color }}
                      title={cc.name}
                      className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                        config.clothingColor === cc.color ? 'border-white ring-2 ring-[#e8c46a] scale-110' : 'border-black/50'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Arma & Olhos */}
          {activeTab === 'arma' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#e8c46a] block mb-1.5">
                  Arma Empunhada
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {WEAPONS.map(w => (
                    <button
                      key={w.id}
                      onClick={() => handleSelect('weapon', w.id)}
                      className={`px-3 py-2 rounded text-xs text-left border transition-all ${
                        config.weapon === w.id
                          ? 'border-[#e8c46a] bg-[#e8c46a22] text-[#e8c46a] font-semibold'
                          : 'border-[#3a3626] bg-[#101211] text-[#9a927e] hover:border-[#e8c46a66]'
                      }`}
                    >
                      {w.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#e8c46a] block mb-1.5 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> Cor dos Olhos
                </label>
                <div className="flex flex-wrap gap-2">
                  {EYE_COLORS.map(e => (
                    <button
                      key={e.color}
                      onClick={() => handleSelect('eyeColor', e.color)}
                      style={{ backgroundColor: e.color }}
                      title={e.name}
                      className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                        config.eyeColor === e.color ? 'border-white ring-2 ring-[#e8c46a] scale-110' : 'border-black/50'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-3 flex justify-end gap-2 border-t border-[#3a3626]">
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-lg bg-transparent border border-[#3a3626] hover:border-[#9a927e] text-xs font-semibold text-[#9a927e]"
              >
                Voltar
              </button>
            )}
            <button
              onClick={() => {
                soundFX.playSuccess();
                onSave(config);
              }}
              className="px-5 py-2 rounded-lg bg-gradient-to-b from-[#c8161d] to-[#6e0a0e] text-[#efe6d2] font-semibold text-xs border border-[#e23a3a] shadow-md shadow-[#b3141a44] hover:shadow-[#e23a3a66] flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" /> Confirmar Aparência
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
