import { useState, useEffect, type FC } from 'react';
import { 
  Shield, 
  Swords, 
  FlaskConical, 
  Sparkles, 
  Key, 
  Package, 
  Search, 
  Check, 
  Flame, 
  Heart, 
  Zap, 
  Compass, 
  Trash2, 
  Info, 
  Award,
  ChevronRight,
  Plus
} from 'lucide-react';
import { soundFX } from '../utils/soundEffects';

export type ItemType = 'weapon' | 'armor' | 'consumable' | 'relic' | 'quest' | 'misc';
export type ItemRarity = 'comum' | 'incomum' | 'raro' | 'epico' | 'lendario';

export interface GameItem {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  description: string;
  effectDescription: string;
  quantity: number;
  isEquipped?: boolean;
  equipSlot?: 'weapon' | 'shield' | 'armor' | 'relic';
  healAmount?: number;
  valueGems?: number;
}

export const DEFAULT_ITEMS: GameItem[] = [
  {
    id: 'item_pot_1',
    name: 'Poção de Sangue de Dragão',
    type: 'consumable',
    rarity: 'raro',
    description: 'Um frasco carmesim que borbulha com calor suave. Foi destilado por alquimistas da ordem solar.',
    effectDescription: 'Restaura +8 PV e concede vigor renovado em combate.',
    quantity: 2,
    healAmount: 8,
    valueGems: 4
  },
  {
    id: 'item_wep_1',
    name: 'Lâmina de Aço Forjado',
    type: 'weapon',
    rarity: 'incomum',
    description: 'Espada balanceada com fio afiado e runas antigas gravadas ao longo da lâmina.',
    effectDescription: '+3 em testes de combate corpo a corpo e golpes decisivos.',
    quantity: 1,
    isEquipped: true,
    equipSlot: 'weapon',
    valueGems: 6
  },
  {
    id: 'item_arm_1',
    name: 'Cota de Malha Élfica',
    type: 'armor',
    rarity: 'raro',
    description: 'Anéis de metal prateado entrelaçados com fios lunares. Leve como seda, resistente como rocha.',
    effectDescription: '+2 em CA e resistência a danos físicos e elementais.',
    quantity: 1,
    isEquipped: true,
    equipSlot: 'armor',
    valueGems: 8
  },
  {
    id: 'item_relic_1',
    name: 'Amuleto dos Ecos Celestes',
    type: 'relic',
    rarity: 'epico',
    description: 'Um cristal pulsante que sussurra quando perigos ou portais místicos se aproximam.',
    effectDescription: 'Permite sentir presenças ocultas e dissipa ilusões menores.',
    quantity: 1,
    isEquipped: true,
    equipSlot: 'relic',
    valueGems: 12
  },
  {
    id: 'item_key_1',
    name: 'Chave Rúnica de Obsidiana',
    type: 'quest',
    rarity: 'raro',
    description: 'Chave esculpida em vidro vulcânico negro, ornamentada com sigilos proibidos.',
    effectDescription: 'Abre selos ancestrais, criptas trancadas e passagens subterrâneas.',
    quantity: 1,
    valueGems: 5
  },
  {
    id: 'item_pot_2',
    name: 'Elixir de Foco Arcano',
    type: 'consumable',
    rarity: 'incomum',
    description: 'Líquido luminescente azulado que clareia os pensamentos e purifica a mente.',
    effectDescription: 'Garante vantagem em testes de Intelecto e Sabedoria por 3 turnos.',
    quantity: 1,
    healAmount: 3,
    valueGems: 3
  }
];

interface InventoryManagerProps {
  onBackToGame?: () => void;
  onUseItemInNarrative?: (actionNarrative: string, item: GameItem) => void;
}

export const InventoryManager: FC<InventoryManagerProps> = ({
  onBackToGame, 
  onUseItemInNarrative 
}) => {
  const [items, setItems] = useState<GameItem[]>(() => {
    try {
      const saved = localStorage.getItem('forje_inventory_full');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_ITEMS;
  });

  const [activeCategory, setActiveCategory] = useState<'todos' | ItemType>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(items[0]?.id || null);
  const [heroHp, setHeroHp] = useState<number>(20);
  const [heroGems, setHeroGems] = useState<number>(5);
  const [notification, setNotification] = useState<string | null>(null);

  // Sync with current game save from localStorage
  useEffect(() => {
    try {
      const saveStr = localStorage.getItem('forje-save');
      if (saveStr) {
        const gameSave = JSON.parse(saveStr);
        if (gameSave) {
          if (typeof gameSave.hp === 'number') setHeroHp(gameSave.hp);
          if (typeof gameSave.gems === 'number') setHeroGems(gameSave.gems);

          // Ingest any bare string items from S.inv that are not yet in our full inventory
          if (Array.isArray(gameSave.inv)) {
            setItems(prevItems => {
              const updated = [...prevItems];
              gameSave.inv.forEach((invName: string | any, idx: number) => {
                const nameStr = typeof invName === 'string' ? invName : (invName?.name || '');
                if (!nameStr) return;

                const exists = updated.find(it => it.name.toLowerCase() === nameStr.toLowerCase());
                if (!exists) {
                  // Infer category and rarity based on keywords
                  const low = nameStr.toLowerCase();
                  let type: ItemType = 'misc';
                  let rarity: ItemRarity = 'comum';
                  let effect = 'Item descoberto durante a jornada.';
                  let heal = 0;

                  if (low.includes('poção') || low.includes('elixir') || low.includes('erva') || low.includes('frasco')) {
                    type = 'consumable';
                    rarity = 'incomum';
                    heal = 6;
                    effect = 'Restaura vitalidade e recupera fôlego.';
                  } else if (low.includes('espada') || low.includes('machado') || low.includes('arco') || low.includes('adaga') || low.includes('lâmina') || low.includes('cajado')) {
                    type = 'weapon';
                    rarity = 'incomum';
                    effect = 'Aumenta poder de ataque e combate.';
                  } else if (low.includes('armadura') || low.includes('escudo') || low.includes('cota') || low.includes('elmo') || low.includes('manto')) {
                    type = 'armor';
                    rarity = 'incomum';
                    effect = 'Protege contra golpes e ferimentos severos.';
                  } else if (low.includes('chave') || low.includes('pergaminho') || low.includes('mapa') || low.includes('selo')) {
                    type = 'quest';
                    rarity = 'raro';
                    effect = 'Objeto crucial para desvendar mistérios e passagens.';
                  } else if (low.includes('amuleto') || low.includes('anel') || low.includes('reliquia') || low.includes('cristal') || low.includes('orbe')) {
                    type = 'relic';
                    rarity = 'raro';
                    effect = 'Emana energia mágica ancestral.';
                  }

                  updated.push({
                    id: `item_gen_${Date.now()}_${idx}`,
                    name: nameStr,
                    type,
                    rarity,
                    description: `Item recuperado nas aventuras através das terras desconhecidas.`,
                    effectDescription: effect,
                    quantity: 1,
                    healAmount: heal,
                    valueGems: 4
                  });
                }
              });

              localStorage.setItem('forje_inventory_full', JSON.stringify(updated));
              return updated;
            });
          }
        }
      }
    } catch (e) {
      console.warn('Error reading inventory state:', e);
    }
  }, []);

  const saveInventory = (newItems: GameItem[]) => {
    setItems(newItems);
    try {
      localStorage.setItem('forje_inventory_full', JSON.stringify(newItems));

      // Also sync item names back into forje-save
      const saveStr = localStorage.getItem('forje-save');
      if (saveStr) {
        const gameSave = JSON.parse(saveStr);
        gameSave.inv = newItems.map(i => i.name);
        localStorage.setItem('forje-save', JSON.stringify(gameSave));
      }
    } catch {}
  };

  const triggerToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // --- USE ITEM IN CRITICAL MOMENT ---
  const handleUseItem = (item: GameItem) => {
    if (item.type === 'consumable') {
      soundFX.playPotionDrink();
      const heal = item.healAmount || 6;
      const newHp = Math.min(20, heroHp + heal);
      setHeroHp(newHp);

      // Decrement quantity or remove
      const updated = items.map(it => {
        if (it.id === item.id) {
          return { ...it, quantity: it.quantity - 1 };
        }
        return it;
      }).filter(it => it.quantity > 0);

      saveInventory(updated);

      // Update HP in forje-save
      try {
        const saveStr = localStorage.getItem('forje-save');
        if (saveStr) {
          const gameSave = JSON.parse(saveStr);
          gameSave.hp = newHp;
          localStorage.setItem('forje-save', JSON.stringify(gameSave));
        }
      } catch {}

      triggerToast(`✨ Usou ${item.name}! Recuperou +${heal} PV (Total: ${newHp}/20).`);

      // Trigger critical narrative turn if callback provided
      if (onUseItemInNarrative) {
        onUseItemInNarrative(`O herói bebe ${item.name} para regenerar suas forças (+${heal} PV)!`, item);
      }
    } else if (item.type === 'weapon' || item.type === 'armor' || item.type === 'relic') {
      soundFX.playEquipItem();
      const nextEquipped = !item.isEquipped;

      const updated = items.map(it => {
        if (it.id === item.id) {
          return { ...it, isEquipped: nextEquipped };
        }
        // If equipping a weapon or armor, unequip other items of the same slot
        if (nextEquipped && it.type === item.type && it.id !== item.id) {
          return { ...it, isEquipped: false };
        }
        return it;
      });

      saveInventory(updated);
      triggerToast(nextEquipped ? `⚔ Equipou: ${item.name}!` : `Desequipou: ${item.name}.`);

      if (nextEquipped && onUseItemInNarrative) {
        onUseItemInNarrative(`O herói empunha e se prepara com ${item.name} para o próximo embate!`, item);
      }
    } else {
      // Quest or misc item use
      soundFX.playMagic();
      triggerToast(`🔮 Usou ${item.name} no momento decisivo!`);
      if (onUseItemInNarrative) {
        onUseItemInNarrative(`O herói utiliza o item especial ${item.name}: ${item.effectDescription}`, item);
      }
    }
  };

  const handleDropItem = (item: GameItem) => {
    soundFX.playClick();
    if (confirm(`Descartar ${item.name} da mochila?`)) {
      const updated = items.filter(it => it.id !== item.id);
      saveInventory(updated);
      if (selectedItemId === item.id) {
        setSelectedItemId(updated[0]?.id || null);
      }
      triggerToast(`Item descartado: ${item.name}`);
    }
  };

  // Filter items
  const filteredItems = items.filter(it => {
    if (activeCategory !== 'todos' && it.type !== activeCategory) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return it.name.toLowerCase().includes(term) || it.description.toLowerCase().includes(term);
    }
    return true;
  });

  const selectedItem = items.find(it => it.id === selectedItemId) || filteredItems[0] || null;

  // Visual badges by rarity
  const rarityColors: Record<ItemRarity, { text: string; bg: string; border: string; label: string }> = {
    comum: { text: 'text-stone-300', bg: 'bg-stone-900/60', border: 'border-stone-700/50', label: 'Comum' },
    incomum: { text: 'text-emerald-400', bg: 'bg-emerald-950/60', border: 'border-emerald-600/50', label: 'Incomum' },
    raro: { text: 'text-cyan-400', bg: 'bg-cyan-950/60', border: 'border-cyan-500/50', label: 'Raro' },
    epico: { text: 'text-purple-400', bg: 'bg-purple-950/60', border: 'border-purple-500/50', label: 'Épico' },
    lendario: { text: 'text-amber-400', bg: 'bg-amber-950/60', border: 'border-amber-500/50', label: 'Lendário' }
  };

  const typeIcons: Record<ItemType, { icon: React.ReactNode; label: string }> = {
    weapon: { icon: <Swords className="w-4 h-4 text-rose-400" />, label: 'Arma' },
    armor: { icon: <Shield className="w-4 h-4 text-blue-400" />, label: 'Armadura' },
    consumable: { icon: <FlaskConical className="w-4 h-4 text-emerald-400" />, label: 'Consumível' },
    relic: { icon: <Sparkles className="w-4 h-4 text-purple-400" />, label: 'Relíquia' },
    quest: { icon: <Key className="w-4 h-4 text-amber-400" />, label: 'Missão' },
    misc: { icon: <Package className="w-4 h-4 text-stone-400" />, label: 'Diverso' }
  };

  const equippedCount = items.filter(i => i.isEquipped).length;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 text-[#efe6d2]">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-[#1a1712] border border-[#e8c46a] text-[#e8c46a] font-serif shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-semibold">{notification}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="mb-6 p-6 rounded-xl border border-[#3a3626] bg-gradient-to-r from-[#17191a] via-[#1d1f1f] to-[#17191a] shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#e8c46a22] text-[#e8c46a] border border-[#e8c46a55] flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" /> Mochila do Aventureiro
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <Heart className="w-3 h-3 text-rose-400" /> {heroHp}/20 PV
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-950/60 text-blue-300 border border-blue-500/40">
                💎 {heroGems} Cristais
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-serif text-[#efe6d2]">
              Gerenciamento de Inventário & Equipamentos
            </h1>
            <p className="text-[#9a927e] text-sm md:text-base mt-1">
              Organize armas, armaduras, poções e relíquias. Use itens nos momentos mais tensos da narrativa para mudar o destino.
            </p>
          </div>

          {onBackToGame && (
            <button
              onClick={() => {
                soundFX.playClick();
                onBackToGame();
              }}
              className="px-4 py-2 rounded-lg bg-gradient-to-b from-[#c8161d] to-[#6e0a0e] text-[#efe6d2] font-semibold text-xs md:text-sm border border-[#e23a3a] shadow-md hover:shadow-[#e23a3a88] transition-all flex items-center gap-2"
            >
              <Compass className="w-4 h-4" /> Voltar à Aventura
            </button>
          )}
        </div>
      </div>

      {/* Equipment Slots Quick Bar */}
      <div className="mb-6 p-4 rounded-xl border border-[#3a3626] bg-[#121413]">
        <div className="text-xs font-semibold text-[#e8c46a] uppercase tracking-wider mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#e8c46a]" /> Equipamento Ativo do Herói ({equippedCount} itens)
          </span>
          <span className="text-[11px] text-[#9a927e] font-sans">Efeitos ativos em combate</span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { slot: 'weapon', label: 'Arma Principal', defaultIcon: <Swords className="w-5 h-5 text-[#9a927e]" /> },
            { slot: 'armor', label: 'Armadura / Manto', defaultIcon: <Shield className="w-5 h-5 text-[#9a927e]" /> },
            { slot: 'relic', label: 'Relíquia / Amuleto', defaultIcon: <Sparkles className="w-5 h-5 text-[#9a927e]" /> },
            { slot: 'quest', label: 'Artefato / Chave', defaultIcon: <Key className="w-5 h-5 text-[#9a927e]" /> }
          ].map(slotInfo => {
            const eqItem = items.find(i => i.isEquipped && (i.equipSlot === slotInfo.slot || i.type === slotInfo.slot));
            return (
              <div
                key={slotInfo.slot}
                onClick={() => {
                  if (eqItem) {
                    soundFX.playClick();
                    setSelectedItemId(eqItem.id);
                  }
                }}
                className={`p-3 rounded-lg border flex flex-col justify-between transition-all ${
                  eqItem
                    ? 'border-[#e8c46a55] bg-[#1a1712] cursor-pointer hover:border-[#e8c46a]'
                    : 'border-[#2a2820] bg-[#101211] opacity-60'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] text-[#9a927e] font-sans uppercase font-bold">{slotInfo.label}</span>
                  {eqItem && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
                </div>
                {eqItem ? (
                  <div>
                    <div className="text-xs font-bold text-[#efe6d2] font-serif truncate">{eqItem.name}</div>
                    <div className="text-[10px] text-[#e8c46a] truncate mt-0.5">{eqItem.effectDescription}</div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-[#9a927e] italic py-1">
                    {slotInfo.defaultIcon}
                    <span>Vazio</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Item List + Detailed Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Categories, Search & Item Cards */}
        <div className="lg:col-span-2 space-y-4">
          {/* Categories & Search */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="flex bg-[#101211] p-1 rounded-xl border border-[#3a3626] gap-1 overflow-x-auto text-xs">
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'weapon', label: 'Armas' },
                { id: 'armor', label: 'Armaduras' },
                { id: 'consumable', label: 'Consumíveis' },
                { id: 'relic', label: 'Relíquias' },
                { id: 'quest', label: 'Missão' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    soundFX.playPageFlip();
                    setActiveCategory(cat.id as any);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                    activeCategory === cat.id
                      ? 'bg-[#e8c46a22] text-[#e8c46a] border border-[#e8c46a44]'
                      : 'text-[#9a927e] hover:text-[#efe6d2]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-[#9a927e] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar item ou poder..."
                className="w-full sm:w-56 pl-9 pr-3 py-1.5 rounded-lg bg-[#101211] border border-[#3a3626] text-xs text-[#efe6d2] focus:border-[#e8c46a] focus:outline-none"
              />
            </div>
          </div>

          {/* List of Item Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredItems.length === 0 ? (
              <div className="col-span-2 p-8 text-center rounded-xl border border-[#3a3626] bg-[#17191a]">
                <Package className="w-10 h-10 text-[#9a927e] mx-auto mb-2 opacity-50" />
                <h4 className="text-sm font-bold text-[#efe6d2]">Nenhum item nesta categoria</h4>
                <p className="text-xs text-[#9a927e] mt-1">Conforme você explora o mundo e vence desafios, novos itens aparecerão aqui.</p>
              </div>
            ) : (
              filteredItems.map(item => {
                const isSelected = selectedItem?.id === item.id;
                const rStyle = rarityColors[item.rarity];
                const tInfo = typeIcons[item.type];

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      soundFX.playClick();
                      setSelectedItemId(item.id);
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#e8c46a] bg-[#1d1f1f] shadow-lg shadow-[#e8c46a15]'
                        : 'border-[#3a3626] bg-[#17191a] hover:border-[#9a927e]'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="p-1.5 rounded-lg bg-[#101211] border border-[#3a3626]">
                            {tInfo.icon}
                          </span>
                          <div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${rStyle.bg} ${rStyle.text} ${rStyle.border}`}>
                              {rStyle.label}
                            </span>
                            {item.isEquipped && (
                              <span className="ml-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-500/40">
                                Equipado
                              </span>
                            )}
                          </div>
                        </div>

                        {item.quantity > 1 && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#101211] text-[#e8c46a] border border-[#3a3626]">
                            x{item.quantity}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold font-serif text-sm md:text-base text-[#efe6d2] mb-1">
                        {item.name}
                      </h3>
                      <p className="text-xs text-[#9a927e] line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#2a2820] flex items-center justify-between text-xs">
                      <span className="text-[#e8c46a] text-[11px] font-mono flex items-center gap-1">
                        <Zap className="w-3 h-3" /> {item.effectDescription.split('.')[0]}
                      </span>
                      <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-[#e8c46a] translate-x-1' : 'text-[#9a927e]'}`} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Item Inspector & Action Trigger */}
        <div className="space-y-4">
          {selectedItem ? (
            <div className="p-5 rounded-xl border border-[#e8c46a55] bg-gradient-to-b from-[#1a1712] to-[#121413] shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#3a3626]">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-[#101211] border border-[#e8c46a44]">
                    {typeIcons[selectedItem.type].icon}
                  </span>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#9a927e]">
                      {typeIcons[selectedItem.type].label}
                    </span>
                    <h3 className="text-lg font-bold font-serif text-[#efe6d2]">
                      {selectedItem.name}
                    </h3>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold border ${rarityColors[selectedItem.rarity].bg} ${rarityColors[selectedItem.rarity].text} ${rarityColors[selectedItem.rarity].border}`}>
                  {rarityColors[selectedItem.rarity].label}
                </span>
              </div>

              {/* Lore / Description */}
              <div>
                <h4 className="text-xs font-semibold text-[#e8c46a] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" /> Descrição & Origem
                </h4>
                <p className="text-xs text-[#efe6d2] leading-relaxed italic bg-[#101211] p-3 rounded-lg border border-[#2a2820]">
                  "{selectedItem.description}"
                </p>
              </div>

              {/* Magical / Mechanical Effect */}
              <div>
                <h4 className="text-xs font-semibold text-[#e8c46a] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Propriedades & Efeitos
                </h4>
                <div className="p-3 rounded-lg bg-[#141512] border border-[#e8c46a33] text-xs text-[#efe6d2]">
                  {selectedItem.effectDescription}
                </div>
              </div>

              {/* Stats summary */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2 rounded bg-[#101211] border border-[#2a2820]">
                  <span className="text-[10px] text-[#9a927e] block">Quantidade</span>
                  <span className="font-mono font-bold text-[#efe6d2]">{selectedItem.quantity} unidade(s)</span>
                </div>
                <div className="p-2 rounded bg-[#101211] border border-[#2a2820]">
                  <span className="text-[10px] text-[#9a927e] block">Valor Estimado</span>
                  <span className="font-mono font-bold text-[#e8c46a]">💎 {selectedItem.valueGems || 5} cristais</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#3a3626] space-y-2">
                <button
                  onClick={() => handleUseItem(selectedItem)}
                  className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-[#b3141a] to-[#e8c46a] text-white font-serif font-bold text-sm shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {selectedItem.type === 'consumable' ? (
                    <>
                      <FlaskConical className="w-4 h-4" /> Beber / Usar Agora
                    </>
                  ) : selectedItem.type === 'weapon' || selectedItem.type === 'armor' ? (
                    <>
                      <Swords className="w-4 h-4" /> {selectedItem.isEquipped ? 'Desequipar' : 'Equipar no Herói'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Ativar Efeito na Narrativa
                    </>
                  )}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleDropItem(selectedItem)}
                    className="flex-1 py-2 rounded-lg bg-[#101211] border border-[#3a3626] hover:border-red-500/50 text-[#9a927e] hover:text-red-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Descartar
                  </button>

                  {onBackToGame && (
                    <button
                      onClick={onBackToGame}
                      className="flex-1 py-2 rounded-lg bg-[#101211] border border-[#3a3626] hover:border-[#e8c46a] text-[#efe6d2] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Compass className="w-3.5 h-3.5" /> Voltar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center rounded-xl border border-[#3a3626] bg-[#17191a] text-[#9a927e]">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">Selecione um item para ver detalhes, lore e opções de uso.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
