import { useState, useEffect, type FC } from 'react';
import { 
  Scroll, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Sparkles, 
  Pin, 
  PinOff, 
  Compass, 
  Search, 
  Filter, 
  Plus, 
  Award,
  ChevronDown,
  ChevronUp,
  MapPin,
  Flame,
  AlertCircle
} from 'lucide-react';
import { soundFX } from '../utils/soundEffects';

export interface QuestItem {
  id: string;
  title: string;
  type: 'principal' | 'secundaria' | 'rumor';
  status: 'ativa' | 'concluida' | 'falha';
  description: string;
  giverOrOrigin?: string;
  requirements: string[];
  rewards: {
    xp?: number;
    items?: string[];
    title?: string;
  };
  progressPercent: number; // 0 to 100
  discoveredAtTurn: number;
  completedAtTurn?: number;
  isPinned?: boolean;
  playerNotes?: string[];
}

export const INITIAL_QUESTS: QuestItem[] = [
  {
    id: 'quest_main_1',
    title: 'O Despertar da Lenda & As Vozes do Vento',
    type: 'principal',
    status: 'ativa',
    description: 'Um sinal sobrenatural ecoa pelos limites conhecidos do mundo. Você precisa desvendar a origem do chamado e forjar sua primeira grande aliança.',
    giverOrOrigin: 'O Tecelão de Destinos',
    requirements: [
      'Investigar o primeiro marco ancestral',
      'Interrogar testemunhas ou aliados locais sobre a ameaça',
      'Alcançar o nível 2 e desbloquear novas perícias'
    ],
    rewards: {
      xp: 60,
      title: 'Despertador de Ecos',
      items: ['Amuleto dos Primeiros Passos']
    },
    progressPercent: 35,
    discoveredAtTurn: 1,
    isPinned: true
  },
  {
    id: 'quest_sec_1',
    title: 'A Bússola e os Metais Esquecidos',
    type: 'secundaria',
    status: 'ativa',
    description: 'Mercadores e batedores falam sobre minérios estelares ocultos nas fendas rochosas. Obter um fragmento pode reforçar seu equipamento.',
    giverOrOrigin: 'Batedora Renegada Sariel',
    requirements: [
      'Vasculhar uma caverna, mina ou fenda profunda',
      'Extrair ou recuperar um lingote de ferro estelar'
    ],
    rewards: {
      xp: 35,
      items: ['Lingote de Ferro Rúnico']
    },
    progressPercent: 10,
    discoveredAtTurn: 2,
    isPinned: false
  },
  {
    id: 'quest_rumor_1',
    title: 'O Rio de Mercúrio da Fonte Estelar',
    type: 'rumor',
    status: 'ativa',
    description: 'Dizem que nas profundezas proibidas corre um rio de mercúrio místico que altera o destino de quem beber de suas águas.',
    giverOrOrigin: 'Rumor Sussurrado em Tavernas',
    requirements: [
      'Descobrir a entrada para as Profundezas Silenciosas',
      'Encontrar os guardiões da nascente'
    ],
    rewards: {
      xp: 45,
      title: 'Bebedor das Estrelas'
    },
    progressPercent: 0,
    discoveredAtTurn: 1,
    isPinned: false
  }
];

interface QuestJournalProps {
  onBackToGame?: () => void;
}

export const QuestJournal: FC<QuestJournalProps> = ({ onBackToGame }) => {
  const [quests, setQuests] = useState<QuestItem[]>(() => {
    try {
      const saved = localStorage.getItem('forje_quest_journal');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_QUESTS;
  });

  const [activeFilter, setActiveFilter] = useState<'todas' | 'principal' | 'secundaria' | 'rumor' | 'concluida'>('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedQuestId, setExpandedQuestId] = useState<string | null>(quests[0]?.id || null);
  const [newNoteText, setNewNoteText] = useState<{ [key: string]: string }>({});

  // Play realistic parchment page flip on open
  useEffect(() => {
    soundFX.playPageFlip();
  }, []);

  // Sync with game state in localStorage if active save exists
  useEffect(() => {
    try {
      const saveStr = localStorage.getItem('forje-save');
      if (saveStr) {
        const gameSave = JSON.parse(saveStr);
        if (gameSave && gameSave.mis && Array.isArray(gameSave.mis)) {
          setQuests(prev => {
            const updated = [...prev];
            // Ingest missions from game
            gameSave.mis.forEach((m: any, idx: number) => {
              const name = m.n || m.nome || (typeof m === 'string' ? m : '');
              const req = m.r || m.requisito || '';
              if (!name) return;

              const existing = updated.find(q => q.title.toLowerCase() === name.toLowerCase());
              if (!existing) {
                updated.push({
                  id: `q_game_${Date.now()}_${idx}`,
                  title: name,
                  type: idx === 0 ? 'principal' : 'secundaria',
                  status: 'ativa',
                  description: req || 'Objetivo delineado pelo Mestre de RPG.',
                  giverOrOrigin: gameSave.loc || 'Terras Desconhecidas',
                  requirements: [req || 'Cumprir as exigências da jornada'],
                  rewards: { xp: 40 + idx * 10 },
                  progressPercent: 20,
                  discoveredAtTurn: gameSave.t || 1,
                  isPinned: idx === 0
                });
              }
            });

            // Ingest completed missions
            if (Array.isArray(gameSave.feitas)) {
              gameSave.feitas.forEach((fname: string) => {
                const match = updated.find(q => q.title.toLowerCase() === fname.toLowerCase());
                if (match && match.status !== 'concluida') {
                  match.status = 'concluida';
                  match.progressPercent = 100;
                  match.completedAtTurn = gameSave.t || 1;
                }
              });
            }

            // Ingest rumors/fios
            if (Array.isArray(gameSave.fios)) {
              gameSave.fios.forEach((fio: string, fIdx: number) => {
                const exists = updated.find(q => q.title.toLowerCase() === fio.toLowerCase());
                if (!exists) {
                  updated.push({
                    id: `q_fio_${Date.now()}_${fIdx}`,
                    title: fio,
                    type: 'rumor',
                    status: 'ativa',
                    description: 'Um mistério em aberto descoberto durante a jornada.',
                    giverOrOrigin: gameSave.loc || 'Exploração',
                    requirements: ['Investigar a verdade por trás deste rumor'],
                    rewards: { xp: 30 },
                    progressPercent: 0,
                    discoveredAtTurn: gameSave.t || 1
                  });
                }
              });
            }

            localStorage.setItem('forje_quest_journal', JSON.stringify(updated));
            return updated;
          });
        }
      }
    } catch (e) {
      console.warn('Error syncing quest journal:', e);
    }
  }, []);

  const saveQuests = (updated: QuestItem[]) => {
    setQuests(updated);
    try {
      localStorage.setItem('forje_quest_journal', JSON.stringify(updated));
    } catch {}
  };

  const handleTogglePin = (id: string) => {
    soundFX.playClick();
    const updated = quests.map(q => q.id === id ? { ...q, isPinned: !q.isPinned } : q);
    saveQuests(updated);
  };

  const handleToggleComplete = (id: string) => {
    const target = quests.find(q => q.id === id);
    if (!target) return;
    const isNowComplete = target.status !== 'concluida';

    if (isNowComplete) {
      soundFX.playQuestFanfare();
    } else {
      soundFX.playClick();
    }

    const updated = quests.map(q => {
      if (q.id === id) {
        return {
          ...q,
          status: isNowComplete ? ('concluida' as const) : ('ativa' as const),
          progressPercent: isNowComplete ? 100 : 50,
          completedAtTurn: isNowComplete ? (q.completedAtTurn || 2) : undefined
        };
      }
      return q;
    });
    saveQuests(updated);
  };

  const handleAddNote = (id: string) => {
    const note = (newNoteText[id] || '').trim();
    if (!note) return;
    soundFX.playClick();

    const updated = quests.map(q => {
      if (q.id === id) {
        return {
          ...q,
          playerNotes: [...(q.playerNotes || []), note]
        };
      }
      return q;
    });

    saveQuests(updated);
    setNewNoteText(prev => ({ ...prev, [id]: '' }));
  };

  // Filter & Search Logic
  const filteredQuests = quests.filter(q => {
    if (activeFilter === 'concluida' && q.status !== 'concluida') return false;
    if (activeFilter !== 'todas' && activeFilter !== 'concluida' && q.type !== activeFilter) return false;
    if (activeFilter !== 'concluida' && q.status === 'concluida' && activeFilter !== 'todas') return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchTitle = q.title.toLowerCase().includes(term);
      const matchDesc = q.description.toLowerCase().includes(term);
      const matchGiver = (q.giverOrOrigin || '').toLowerCase().includes(term);
      return matchTitle || matchDesc || matchGiver;
    }
    return true;
  });

  const activeCount = quests.filter(q => q.status === 'ativa').length;
  const completedCount = quests.filter(q => q.status === 'concluida').length;
  const pinnedQuests = quests.filter(q => q.isPinned && q.status === 'ativa');

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 text-[#efe6d2]">
      {/* Header Banner */}
      <div className="mb-6 p-6 rounded-xl border border-[#3a3626] bg-gradient-to-r from-[#17191a] via-[#1d1f1f] to-[#17191a] shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#e8c46a22] text-[#e8c46a] border border-[#e8c46a55] flex items-center gap-1.5">
                <Scroll className="w-3.5 h-3.5" /> Registro Narrativo Dinâmico
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-950/60 text-blue-300 border border-blue-500/40">
                {activeCount} Ativas · {completedCount} Concluídas
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-serif text-[#efe6d2]">
              Diário de Missões & Destinos
            </h1>
            <p className="text-[#9a927e] text-sm md:text-base mt-1">
              Todos os objetivos principais, secundários e rumores tecidos pelo Mestre de IA durante a sua jornada sem fim.
            </p>
          </div>

          {onBackToGame && (
            <button
              onClick={onBackToGame}
              className="px-4 py-2 rounded-lg bg-gradient-to-b from-[#c8161d] to-[#6e0a0e] text-[#efe6d2] font-semibold text-xs md:text-sm border border-[#e23a3a] shadow-md hover:shadow-[#e23a3a88] transition-all flex items-center gap-2"
            >
              <Compass className="w-4 h-4" /> Voltar ao Jogo
            </button>
          )}
        </div>
      </div>

      {/* Pinned Objectives Quick Bar (HUD Tracker) */}
      {pinnedQuests.length > 0 && (
        <div className="mb-6 p-4 rounded-xl border border-[#e8c46a44] bg-[#1a1712] shadow-lg">
          <div className="text-xs font-semibold text-[#e8c46a] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Pin className="w-3.5 h-3.5 text-[#e8c46a]" /> Objetivos Fixados em Destaque
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pinnedQuests.map(pq => (
              <div
                key={pq.id}
                onClick={() => setExpandedQuestId(pq.id)}
                className="p-3 rounded-lg bg-[#101211] border border-[#3a3626] hover:border-[#e8c46a] cursor-pointer transition-all flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#e8c46a] animate-pulse"></span>
                    <span className="font-semibold text-xs text-[#efe6d2]">{pq.title}</span>
                  </div>
                  <p className="text-[11px] text-[#9a927e] line-clamp-1 mt-0.5">{pq.requirements[0]}</p>
                </div>
                <div className="text-[11px] font-mono text-[#e8c46a]">{pq.progressPercent}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 mb-6">
        {/* Category Filters */}
        <div className="flex bg-[#101211] p-1 rounded-xl border border-[#3a3626] gap-1 overflow-x-auto text-xs">
          {[
            { id: 'todas', label: 'Todas' },
            { id: 'principal', label: 'Principais' },
            { id: 'secundaria', label: 'Secundárias' },
            { id: 'rumor', label: 'Rumores' },
            { id: 'concluida', label: 'Concluídas' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => {
                soundFX.playPageFlip();
                setActiveFilter(f.id as any);
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                activeFilter === f.id
                  ? 'bg-[#e8c46a22] text-[#e8c46a] border border-[#e8c46a44]'
                  : 'text-[#9a927e] hover:text-[#efe6d2]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#9a927e] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar missão, pista ou NPC..."
            className="w-full md:w-64 pl-9 pr-3 py-1.5 rounded-lg bg-[#101211] border border-[#3a3626] text-xs text-[#efe6d2] focus:border-[#e8c46a] focus:outline-none"
          />
        </div>
      </div>

      {/* Quest Cards List */}
      <div className="space-y-4">
        {filteredQuests.length === 0 ? (
          <div className="p-12 text-center rounded-xl border border-[#3a3626] bg-[#17191a]">
            <Scroll className="w-10 h-10 text-[#9a927e] mx-auto mb-3 opacity-50" />
            <h3 className="text-base font-bold text-[#efe6d2]">Nenhuma missão encontrada neste filtro</h3>
            <p className="text-xs text-[#9a927e] mt-1">
              À medida que você explora novos cenários e interage com NPCs, o Mestre adicionará objetivos automaticamente.
            </p>
          </div>
        ) : (
          filteredQuests.map(quest => {
            const isExpanded = expandedQuestId === quest.id;
            const isComplete = quest.status === 'concluida';

            const typeBadge = {
              principal: { bg: 'bg-[#b3141a33]', text: 'text-[#fca5a5]', border: 'border-[#e23a3a44]', label: 'Missão Principal' },
              secundaria: { bg: 'bg-blue-950/60', text: 'text-blue-300', border: 'border-blue-500/40', label: 'Missão Secundária' },
              rumor: { bg: 'bg-amber-950/60', text: 'text-amber-300', border: 'border-amber-500/40', label: 'Rumor / Pista' }
            }[quest.type];

            return (
              <div
                key={quest.id}
                className={`rounded-xl border transition-all ${
                  isComplete
                    ? 'border-[#2a2820] bg-[#101211]/80 opacity-80'
                    : quest.isPinned
                    ? 'border-[#e8c46a] bg-[#17191a] shadow-md shadow-[#e8c46a10]'
                    : 'border-[#3a3626] bg-[#17191a] hover:border-[#9a927e]'
                }`}
              >
                {/* Quest Card Header */}
                <div
                  onClick={() => {
                    soundFX.playPageFlip();
                    setExpandedQuestId(isExpanded ? null : quest.id);
                  }}
                  className="p-4 md:p-5 flex items-start justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleToggleComplete(quest.id);
                      }}
                      title={isComplete ? 'Reabrir missão' : 'Marcar como concluída'}
                      className="mt-0.5 text-[#9a927e] hover:text-[#e8c46a] transition-colors"
                    >
                      {isComplete ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${typeBadge.bg} ${typeBadge.text} ${typeBadge.border}`}>
                          {typeBadge.label}
                        </span>
                        {quest.giverOrOrigin && (
                          <span className="text-xs text-[#9a927e] flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#e8c46a]" /> {quest.giverOrOrigin}
                          </span>
                        )}
                        <span className="text-xs text-[#9a927e]">· Turno {quest.discoveredAtTurn}</span>
                      </div>

                      <h3 className={`text-base md:text-lg font-bold font-serif ${isComplete ? 'line-through text-[#9a927e]' : 'text-[#efe6d2]'}`}>
                        {quest.title}
                      </h3>
                      <p className="text-xs text-[#9a927e] line-clamp-1 mt-0.5">{quest.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleTogglePin(quest.id);
                      }}
                      title={quest.isPinned ? 'Desafixar' : 'Fixar no HUD'}
                      className="p-1.5 rounded-lg border border-[#3a3626] hover:border-[#e8c46a] text-[#9a927e] hover:text-[#e8c46a] transition-colors"
                    >
                      {quest.isPinned ? <PinOff className="w-3.5 h-3.5 text-[#e8c46a]" /> : <Pin className="w-3.5 h-3.5" />}
                    </button>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-[#9a927e]" /> : <ChevronDown className="w-4 h-4 text-[#9a927e]" />}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#101211] h-1.5 overflow-hidden">
                  <div
                    style={{ width: `${quest.progressPercent}%` }}
                    className={`h-full transition-all duration-500 ${
                      isComplete ? 'bg-emerald-400' : 'bg-gradient-to-r from-[#b3141a] to-[#e8c46a]'
                    }`}
                  />
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="p-5 border-t border-[#3a3626] bg-[#121413] space-y-4 text-xs">
                    <div>
                      <h4 className="font-semibold text-[#e8c46a] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5" /> Descrição da Jornada
                      </h4>
                      <p className="text-[#efe6d2] leading-relaxed">{quest.description}</p>
                    </div>

                    {/* Requirements checklist */}
                    <div>
                      <h4 className="font-semibold text-[#e8c46a] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5" /> Etapas & Requisitos
                      </h4>
                      <div className="space-y-1.5">
                        {quest.requirements.map((req, rIdx) => (
                          <div key={rIdx} className="flex items-start gap-2 p-2 rounded bg-[#101211] border border-[#2a2820]">
                            <span className="text-[#e8c46a] font-bold">›</span>
                            <span className="text-[#efe6d2]">{req}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Rewards */}
                    {(quest.rewards.xp || quest.rewards.items || quest.rewards.title) && (
                      <div className="p-3 rounded-lg bg-[#17191a] border border-[#3a3626] flex flex-wrap items-center gap-3">
                        <div className="font-semibold text-[#e8c46a] flex items-center gap-1">
                          <Award className="w-4 h-4" /> Recompensas:
                        </div>
                        {quest.rewards.xp && (
                          <span className="px-2 py-0.5 rounded bg-[#e8c46a22] text-[#e8c46a] font-mono font-bold">
                            +{quest.rewards.xp} XP
                          </span>
                        )}
                        {quest.rewards.title && (
                          <span className="px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-500/40">
                            Título: {quest.rewards.title}
                          </span>
                        )}
                        {(quest.rewards.items || []).map((it, iIdx) => (
                          <span key={iIdx} className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/40">
                            🎒 {it}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Player Notes Section */}
                    <div className="pt-2 border-t border-[#2a2820]">
                      <h4 className="font-semibold text-[#e8c46a] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Anotações & Deduções do Jogador
                      </h4>
                      {quest.playerNotes && quest.playerNotes.length > 0 && (
                        <div className="space-y-1.5 mb-2">
                          {quest.playerNotes.map((note, nIdx) => (
                            <div key={nIdx} className="p-2 rounded bg-[#101211] border border-[#2a2820] text-[#efe6d2] italic">
                              "{note}"
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newNoteText[quest.id] || ''}
                          onChange={e => setNewNoteText(prev => ({ ...prev, [quest.id]: e.target.value }))}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleAddNote(quest.id);
                          }}
                          placeholder="Anotar pista, suspeito ou ideia sobre esta missão..."
                          className="flex-1 bg-[#101211] border border-[#3a3626] rounded-lg px-3 py-1.5 text-xs text-[#efe6d2] focus:border-[#e8c46a] focus:outline-none"
                        />
                        <button
                          onClick={() => handleAddNote(quest.id)}
                          className="px-3 py-1.5 rounded-lg bg-[#2a2820] border border-[#3a3626] hover:border-[#e8c46a] text-xs font-semibold text-[#e8c46a] flex items-center gap-1 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Anotar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
