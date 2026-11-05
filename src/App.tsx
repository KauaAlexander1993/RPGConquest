import { useState } from 'react';
import { ForjeSuaLenda } from './components/ForjeSuaLenda';
import { ApiExplorer } from './components/ApiExplorer';
import { ScenarioGenerator } from './components/ScenarioGenerator';
import { VisualCharacterCreator } from './components/VisualCharacterCreator';
import { QuestJournal } from './components/QuestJournal';
import { InventoryManager } from './components/InventoryManager';
import { VisualCharacterConfig, DEFAULT_AVATAR } from './components/CharacterAvatar2D';
import { Backpack, Code2, Compass, House, Palette, ScrollText, Volume2, VolumeX, Sparkles, type LucideIcon } from 'lucide-react';
import { soundFX } from './utils/soundEffects';

type ActiveTab = 'game' | 'creator' | 'quests' | 'inventory' | 'api' | 'scenarios';

const navigationItems: Array<{ id: ActiveTab; label: string; icon: LucideIcon }> = [
  { id: 'game', label: 'Aventura', icon: House },
  { id: 'creator', label: 'Herói', icon: Palette },
  { id: 'quests', label: 'Missões', icon: ScrollText },
  { id: 'inventory', label: 'Mochila', icon: Backpack },
  { id: 'api', label: 'API', icon: Code2 },
  { id: 'scenarios', label: 'Mundos', icon: Compass },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('game');
  const [isMuted, setIsMuted] = useState<boolean>(!soundFX.enabled);
  const [ambientPlaying, setAmbientPlaying] = useState<boolean>(soundFX.ambientEnabled);
  const [savedAvatar, setSavedAvatar] = useState<VisualCharacterConfig>(() => {
    try {
      const saved = localStorage.getItem('forje_visual_avatar');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_AVATAR;
  });

  const handleTabChange = (tab: ActiveTab) => {
    if (tab === 'quests') {
      soundFX.playPageFlip();
    } else if (tab === 'inventory') {
      soundFX.playEquipItem();
    } else {
      soundFX.playClick();
    }
    setActiveTab(tab);
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundFX.setMuted(nextMuted);
    if (!nextMuted) {
      soundFX.playClick();
    }
  };

  const toggleAmbientSound = () => {
    const active = soundFX.toggleAmbient('floresta');
    setAmbientPlaying(active);
    if (active) {
      soundFX.playAmbientTransition('floresta');
    }
  };

  const handleSaveAvatar = (cfg: VisualCharacterConfig) => {
    setSavedAvatar(cfg);
    try {
      localStorage.setItem('forje_visual_avatar', JSON.stringify(cfg));
    } catch {}
    handleTabChange('game');
  };

  return (
    <div className="app-shell min-h-screen bg-[#0b0d0c] text-[#efe6d2] flex flex-col font-serif">
      <header className="app-header sticky top-0 z-40 border-b border-[#3a3626] bg-[#0b0d0ce8] px-4 py-2.5 backdrop-blur-md">
        <div className="app-header-inner mx-auto flex max-w-7xl items-center justify-between gap-3">
          <a className="app-brand flex items-center gap-2.5" href="/" onClick={(event) => {
            event.preventDefault();
            handleTabChange('game');
          }}>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e23a3a] bg-gradient-to-br from-[#c8161d] to-[#6e0a0e] text-xl shadow-md shadow-[#b3141a44]" aria-hidden="true">🐉</span>
            <span>
              <span className="block font-serif text-base font-bold tracking-wide text-[#efe6d2]">Chronicles</span>
              <span className="hidden text-[10px] uppercase tracking-[0.2em] text-[#9a927e] sm:block">Sua lenda começa aqui</span>
            </span>
          </a>

          <nav className="app-navigation flex items-center gap-1" aria-label="Navegação principal">
            {navigationItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => handleTabChange(id)}
                aria-current={activeTab === id ? 'page' : undefined}
                className={`app-navigation-link flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                  activeTab === id
                    ? 'border border-[#e8c46a55] bg-gradient-to-r from-[#e8c46a28] to-[#e8c46a10] text-[#e8c46a] shadow-sm'
                    : 'text-[#9a927e] hover:bg-[#17191a] hover:text-[#efe6d2]'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="app-audio-controls flex items-center gap-1 rounded-xl border border-[#3a3626] bg-[#101211] p-1">
              <button
                onClick={toggleAmbientSound}
                title={ambientPlaying ? "Desativar som ambiente" : "Ativar som ambiente imersivo"}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  ambientPlaying 
                    ? 'bg-[#14532d] text-emerald-300 border border-emerald-500/50 shadow-sm animate-pulse'
                    : 'text-[#9a927e] hover:text-[#efe6d2]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">{ambientPlaying ? "Ambiente: ON" : "Ambiente"}</span>
              </button>

              <button
                onClick={toggleMute}
                title={isMuted ? "Ativar efeitos sonoros" : "Desativar efeitos sonoros"}
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  isMuted ? 'text-red-400 hover:text-red-300' : 'text-[#e8c46a] hover:text-[#fff]'
                }`}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main w-full flex-1">
        {activeTab === 'game' && (
          <ForjeSuaLenda
            onOpenApiExplorer={() => handleTabChange('api')}
            onOpenVisualCreator={() => handleTabChange('creator')}
            onOpenQuestJournal={() => handleTabChange('quests')}
            onOpenInventory={() => handleTabChange('inventory')}
          />
        )}
        {activeTab === 'creator' && (
          <div className="py-6 px-4">
            <VisualCharacterCreator
              initialConfig={savedAvatar}
              onSave={handleSaveAvatar}
              onCancel={() => handleTabChange('game')}
            />
          </div>
        )}
        {activeTab === 'quests' && (
          <div className="py-6 px-4">
            <QuestJournal onBackToGame={() => handleTabChange('game')} />
          </div>
        )}
        {activeTab === 'inventory' && (
          <div className="py-6 px-4">
            <InventoryManager
              onBackToGame={() => handleTabChange('game')}
              onUseItemInNarrative={(actionNarrative) => {
                try {
                  localStorage.setItem('forje_pending_action', actionNarrative);
                } catch {}
                handleTabChange('game');
              }}
            />
          </div>
        )}
        {activeTab === 'api' && <ApiExplorer />}
        {activeTab === 'scenarios' && <ScenarioGenerator />}
      </main>
    </div>
  );
}
