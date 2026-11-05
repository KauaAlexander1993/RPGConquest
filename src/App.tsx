import React, { useState, useEffect } from 'react';
import { ForjeSuaLenda } from './components/ForjeSuaLenda';
import { ApiExplorer } from './components/ApiExplorer';
import { ScenarioGenerator } from './components/ScenarioGenerator';
import { VisualCharacterCreator } from './components/VisualCharacterCreator';
import { QuestJournal } from './components/QuestJournal';
import { InventoryManager, GameItem } from './components/InventoryManager';
import { VisualCharacterConfig, DEFAULT_AVATAR } from './components/CharacterAvatar2D';
import { Swords, Code2, Compass, Palette, Scroll, Package, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { soundFX } from './utils/soundEffects';

export default function App() {
  const [activeTab, setActiveTab] = useState<'game' | 'creator' | 'quests' | 'inventory' | 'api' | 'scenarios'>('game');
  const [isMuted, setIsMuted] = useState<boolean>(!soundFX.enabled);
  const [ambientPlaying, setAmbientPlaying] = useState<boolean>(soundFX.ambientEnabled);
  const [savedAvatar, setSavedAvatar] = useState<VisualCharacterConfig>(() => {
    try {
      const saved = localStorage.getItem('forje_visual_avatar');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_AVATAR;
  });

  const handleTabChange = (tab: 'game' | 'creator' | 'quests' | 'inventory' | 'api' | 'scenarios') => {
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
    <div className="min-h-screen bg-[#0b0d0c] text-[#efe6d2] flex flex-col font-serif">
      {/* Top Header & Mode Switcher */}
      <header className="sticky top-0 z-40 bg-[#0b0d0ce8] backdrop-blur-md border-b border-[#3a3626] px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#c8161d] to-[#6e0a0e] border border-[#e23a3a] flex items-center justify-center text-lg shadow-md shadow-[#b3141a44]">
              🐉
            </div>
            <div>
              <span className="font-bold text-base tracking-wide text-[#efe6d2] font-serif">
                Chronicles AI
              </span>
              <span className="hidden md:inline-block ml-2 text-xs text-[#9a927e] font-sans">
                · Motor de RPG & Animação 2D
              </span>
            </div>
          </div>

          {/* Navigation Switcher */}
          <div className="flex items-center bg-[#101211] p-1 rounded-xl border border-[#3a3626] gap-1 flex-wrap justify-center">
            <button
              onClick={() => handleTabChange('game')}
              className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'game'
                  ? 'bg-gradient-to-r from-[#e8c46a28] to-[#e8c46a10] text-[#e8c46a] border border-[#e8c46a55] shadow-sm'
                  : 'text-[#9a927e] hover:text-[#efe6d2] hover:bg-[#17191a]'
              }`}
            >
              <Swords className="w-3.5 h-3.5" />
              <span>Jogar Jogo</span>
            </button>

            <button
              onClick={() => handleTabChange('creator')}
              className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'creator'
                  ? 'bg-gradient-to-r from-[#e8c46a28] to-[#e8c46a10] text-[#e8c46a] border border-[#e8c46a55] shadow-sm'
                  : 'text-[#9a927e] hover:text-[#efe6d2] hover:bg-[#17191a]'
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-[#e8c46a]" />
              <span>Criador Visual 2D</span>
            </button>

            <button
              onClick={() => handleTabChange('quests')}
              className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'quests'
                  ? 'bg-gradient-to-r from-[#e8c46a28] to-[#e8c46a10] text-[#e8c46a] border border-[#e8c46a55] shadow-sm'
                  : 'text-[#9a927e] hover:text-[#efe6d2] hover:bg-[#17191a]'
              }`}
            >
              <Scroll className="w-3.5 h-3.5 text-[#e8c46a]" />
              <span>Diário de Missões</span>
            </button>

            <button
              onClick={() => handleTabChange('inventory')}
              className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'inventory'
                  ? 'bg-gradient-to-r from-[#e8c46a28] to-[#e8c46a10] text-[#e8c46a] border border-[#e8c46a55] shadow-sm'
                  : 'text-[#9a927e] hover:text-[#efe6d2] hover:bg-[#17191a]'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-[#e8c46a]" />
              <span>Inventário</span>
            </button>

            <button
              onClick={() => handleTabChange('api')}
              className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'api'
                  ? 'bg-gradient-to-r from-[#e8c46a28] to-[#e8c46a10] text-[#e8c46a] border border-[#e8c46a55] shadow-sm'
                  : 'text-[#9a927e] hover:text-[#efe6d2] hover:bg-[#17191a]'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>API Explorer</span>
            </button>

            <button
              onClick={() => handleTabChange('scenarios')}
              className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'scenarios'
                  ? 'bg-gradient-to-r from-[#e8c46a28] to-[#e8c46a10] text-[#e8c46a] border border-[#e8c46a55] shadow-sm'
                  : 'text-[#9a927e] hover:text-[#efe6d2] hover:bg-[#17191a]'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Cenários</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Audio Soundscape Controls */}
            <div className="flex items-center bg-[#101211] border border-[#3a3626] rounded-xl p-1 gap-1">
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

            <div className="hidden lg:flex items-center gap-2 text-xs font-sans text-[#9a927e]">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Gemini 3.8 Flash</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full">
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
