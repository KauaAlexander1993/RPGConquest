import { Component, useEffect, useRef, useState, type FC, type FormEvent, type ReactNode } from 'react';
import {
  Backpack,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Compass,
  Dice5,
  Heart,
  LoaderCircle,
  ScrollText,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { AnimatedStoryStage2D } from './AnimatedStoryStage2D';
import { DEFAULT_AVATAR, type VisualCharacterConfig } from './CharacterAvatar2D';
import { readApiResponse } from '../utils/readApiResponse';

const ACTIVE_CAMPAIGN_KEY = 'forje_active_campaign_id';

type AttributeName = 'strength' | 'agility' | 'intellect' | 'presence' | 'vitality';
type Alignment = 'luz' | 'sombra' | 'ordem' | 'caos';

interface ClassUnlockContext {
  attributes: Record<AttributeName, number>;
  alignment: Alignment;
  race: string;
  background: string;
}

interface ClassDefinition {
  name: string;
  description: string;
  item: string;
  bonus: Partial<Record<AttributeName, number>>;
  hidden?: boolean;
  requirement?: string;
  advantage?: string;
  unlock?: (context: ClassUnlockContext) => boolean;
}

interface SuggestedAction {
  id: string;
  title: string;
  description: string;
  attributeCheck?: AttributeName | 'none';
  riskLevel?: string;
}

interface Campaign {
  id: string;
  title: string;
  narrationMode?: 'ai' | 'offline';
  theme: string;
  customThemePrompt?: string;
  turnCount: number;
  character: {
    name: string;
    class: string;
    level: number;
    hp: number;
    maxHp: number;
    xp: number;
    manaOrEnergy: number;
    maxManaOrEnergy: number;
    attributes: Record<AttributeName, number>;
    inventory: Array<{ id: string; name: string; quantity?: number }>;
  };
  currentScenario: {
    name: string;
    region: string;
    description: string;
    atmosphere: string;
    dangerLevel: number;
    currentNPCs: Array<{ name: string; role: string }>;
  };
  suggestedActions: SuggestedAction[];
  history: Array<{
    id: string;
    turnNumber: number;
    playerAction: string;
    gmNarrative: string;
    diceRollResult?: {
      d20: number;
      modifier: number;
      total: number;
      attribute: AttributeName;
      successLevel: string;
    };
  }>;
}

interface TurnResponse {
  campaign: Campaign;
  turnResult?: { narrative?: string | null };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isTurnResponse(value: unknown): value is TurnResponse {
  if (!isRecord(value) || !isRecord(value.campaign)) return false;
  const campaign = value.campaign;
  return typeof campaign.id === 'string'
    && typeof campaign.title === 'string'
    && typeof campaign.turnCount === 'number'
    && isRecord(campaign.character)
    && isRecord(campaign.currentScenario)
    && Array.isArray(campaign.suggestedActions)
    && Array.isArray(campaign.history);
}

interface ForjeSuaLendaProps {
  onOpenApiExplorer?: () => void;
  onOpenVisualCreator?: () => void;
  onOpenQuestJournal?: () => void;
  onOpenInventory?: () => void;
}

const worlds = [
  { name: 'Fantasia medieval', theme: 'dark_fantasy', icon: '⚔️', description: 'Reinos, dragões e magia antiga' },
  { name: 'Terror gótico', theme: 'eldritch_horror', icon: '🌘', description: 'Névoa, maldições e segredos' },
  { name: 'Sci-fi', theme: 'sci_fi', icon: '🚀', description: 'Estações e mundos distantes' },
  { name: 'Piratas', theme: 'custom', icon: '🏴‍☠️', description: 'Mares, tesouros e traições' },
  { name: 'Cyberpunk', theme: 'cyberpunk', icon: '🌃', description: 'Neon, corporações e hackers' },
  { name: 'Faroeste sombrio', theme: 'custom', icon: '🤠', description: 'Pistoleiros e assombrações' },
  { name: 'Saga nórdica', theme: 'custom', icon: 'ᚱ', description: 'Gelo, runas e deuses antigos' },
  { name: 'Japão feudal', theme: 'custom', icon: '🏯', description: 'Samurais, espíritos e clãs' },
  { name: 'Pós-apocalipse', theme: 'post_apocalyptic', icon: '☢️', description: 'Ruínas e sobreviventes' },
  { name: 'Mitologia grega', theme: 'custom', icon: '🏛️', description: 'Deuses, monstros e odisseias' },
  { name: 'Steampunk', theme: 'steampunk', icon: '⚙️', description: 'Vapor, engrenagens e dirigíveis' },
  { name: 'Academia de magia', theme: 'custom', icon: '✦', description: 'Feitiços, rivais e segredos' },
  { name: 'Solarpunk', theme: 'solarpunk', icon: '🌱', description: 'Natureza e tecnologia limpa' },
  { name: 'Mundo subterrâneo', theme: 'hollow_earth', icon: '🪨', description: 'Civilizações sob a superfície' },
  { name: 'Guerra de mechas', theme: 'mecha', icon: '🤖', description: 'Titãs mecânicos e frotas' },
  { name: 'Era do gelo', theme: 'ice_age', icon: '❄️', description: 'Geleiras, feras e sobrevivência' },
  { name: 'Corte celestial', theme: 'celestial', icon: '☀️', description: 'Deuses, pactos e julgamentos' },
  { name: 'Carnaval sombrio', theme: 'dark_circus', icon: '🎭', description: 'Ilusões e marionetes vivas' },
  { name: 'Mundo relógio', theme: 'clockwork', icon: '🕰️', description: 'Engrenagens e rios temporais' },
];

const modes = [
  { name: 'Aventura livre', description: 'Explore sem limites e escolha seu caminho.', tone: 'epic' },
  { name: 'Academia Isekai', description: 'Formatura, sistema de status e portal místico.', tone: 'epic' },
  { name: 'Detetive & investigação', description: 'Pistas, suspeitos e dedução.', tone: 'mysterious' },
  { name: 'Sobrevivência', description: 'Recursos escassos e ambiente hostil.', tone: 'gritty' },
  { name: 'Caçador de monstros', description: 'Rastreie criaturas e conquiste troféus.', tone: 'tactical' },
  { name: 'Torre infinita', description: 'Suba andares com guardiões e relíquias.', tone: 'tactical' },
];

const featuredWorlds = [
  { worldIndex: 0, category: 'Fantasia', art: 'castle', badge: 'Mais popular' },
  { worldIndex: 1, category: 'Mistério', art: 'gothic', badge: 'Sombrio' },
  { worldIndex: 11, category: 'Fantasia', art: 'arcane', badge: 'Magia & mistério' },
  { worldIndex: 7, category: 'Outros', art: 'eastern', badge: 'Nova jornada' },
  { worldIndex: 2, category: 'Outros', art: 'cosmic', badge: 'Outro mundo' },
  { worldIndex: 10, category: 'Outros', art: 'clockwork', badge: 'Aventura' },
];

const worldCategories = ['Todos', 'Fantasia', 'Mistério', 'Outros'];

type StoryFocus = 'combate' | 'exploração' | 'magia' | 'diplomacia' | 'furtividade';

interface CampaignLearning {
  preferences: Record<StoryFocus, number>;
  recentActions: string[];
  recentConsequences: string[];
}

const LEARNING_KEY = 'forje_campaign_learning_v1';
const STORY_FOCI: StoryFocus[] = ['combate', 'exploração', 'magia', 'diplomacia', 'furtividade'];

const emptyLearning = (): CampaignLearning => ({
  preferences: { combate: 0, exploração: 0, magia: 0, diplomacia: 0, furtividade: 0 },
  recentActions: [],
  recentConsequences: [],
});

const readLearning = (): CampaignLearning => {
  try {
    const saved = localStorage.getItem(LEARNING_KEY);
    if (!saved) return emptyLearning();
    const parsed = JSON.parse(saved) as Partial<CampaignLearning>;
    return {
      preferences: Object.fromEntries(STORY_FOCI.map((focus) => [
        focus,
        Math.max(0, Number(parsed.preferences?.[focus]) || 0),
      ])) as CampaignLearning['preferences'],
      recentActions: Array.isArray(parsed.recentActions)
        ? parsed.recentActions.filter((entry): entry is string => typeof entry === 'string').slice(-6)
        : [],
      recentConsequences: Array.isArray(parsed.recentConsequences)
        ? parsed.recentConsequences.filter((entry): entry is string => typeof entry === 'string').slice(-4)
        : [],
    };
  } catch {
    return emptyLearning();
  }
};

const classifyActionFocus = (action: string): StoryFocus => {
  const normalized = action.toLocaleLowerCase('pt-BR');
  if (/atac|combate|golpe|luta|defend|arma/.test(normalized)) return 'combate';
  if (/magia|feiti|runa|conjur|arcano|ritual/.test(normalized)) return 'magia';
  if (/convers|negoci|persuad|convenc|pergunt|dialog/.test(normalized)) return 'diplomacia';
  if (/furt|esgueir|escond|silenc|invad/.test(normalized)) return 'furtividade';
  return 'exploração';
};

const formatLearning = (learning: CampaignLearning): string => {
  const mostPlayed = STORY_FOCI
    .map((focus) => ({ focus, count: learning.preferences[focus] }))
    .sort((left, right) => right.count - left.count)[0];
  const preferences = STORY_FOCI
    .filter((focus) => learning.preferences[focus] > 0)
    .map((focus) => `${focus} (${learning.preferences[focus]})`)
    .join(', ');
  const recentActions = learning.recentActions.slice(-4).join(' | ');
  const consequences = learning.recentConsequences.slice(-2).join(' | ');
  return [
    preferences ? `Preferências observadas: ${preferences}.` : '',
    mostPlayed?.count ? `Foco mais frequente: ${mostPlayed.focus}.` : '',
    recentActions ? `Ações recentes: ${recentActions}.` : '',
    consequences ? `Consequências recentes: ${consequences}.` : '',
  ].filter(Boolean).join('\n').slice(0, 1200);
};

const races = [
  { name: 'Humano', detail: 'Versátil e determinado', bonus: { presence: 1 } },
  { name: 'Elfo', detail: 'Ágil e atento à magia', bonus: { agility: 1, intellect: 1 } },
  { name: 'Anão', detail: 'Resistente e tenaz', bonus: { vitality: 2 } },
  { name: 'Meio-orc', detail: 'Forte e destemido', bonus: { strength: 2 } },
  { name: 'Halfling', detail: 'Discreto e sortudo', bonus: { agility: 1, presence: 1 } },
  { name: 'Tiefling', detail: 'Carismático e arcano', bonus: { presence: 1, intellect: 1 } },
];

const classes: ClassDefinition[] = [
  { name: 'Guerreiro', description: 'Mestre das armas na linha de frente', item: 'Espada longa', bonus: { strength: 2 }, advantage: 'Manobras de combate ficam mais eficazes e você protege aliados próximos.' },
  { name: 'Maga', description: 'Estudiosa das artes arcanas', item: 'Cajado rúnico', bonus: { intellect: 2 }, advantage: 'Feitiços e fenômenos arcanos ficam mais fáceis de compreender.' },
  { name: 'Ladino', description: 'Furtivo, ágil e perspicaz', item: 'Adagas', bonus: { agility: 2 }, advantage: 'Pode encontrar rotas discretas, armadilhas e oportunidades de ataque.' },
  { name: 'Bardo', description: 'Voz que move aliados e destinos', item: 'Alaúde', bonus: { presence: 2 }, advantage: 'Pode inspirar aliados e abrir conversas que outras classes não alcançam.' },
  { name: 'Patrulheiro', description: 'Rastreador das terras selvagens', item: 'Arco longo', bonus: { agility: 1, vitality: 1 }, advantage: 'Rastros, perigos naturais e criaturas deixam sinais mais claros.' },
  { name: 'Sacerdote', description: 'Guardião da fé e da cura', item: 'Símbolo sagrado', bonus: { vitality: 1, presence: 1 }, advantage: 'Pode reconhecer maldições e encontrar oportunidades para curar ou proteger.' },
];

const hiddenClasses: ClassDefinition[] = [
  {
    name: 'Necromante', description: 'Comanda os mortos e converte quedas em poder.', item: 'Cajado de osso',
    bonus: { intellect: 2, vitality: 1 }, hidden: true, requirement: 'Intelecto 13+ e afinidade Sombra, ou passado Erudito.',
    advantage: 'Começa com três esqueletos aliados. Mortos-vivos podem proteger, rastrear e lutar; derrotas de inimigos podem fortalecer o séquito.',
    unlock: ({ attributes, alignment, background }) => attributes.intellect >= 13 && (alignment === 'sombra' || background === 'Erudito'),
  },
  {
    name: 'Rei Demônio', description: 'Lidera criaturas das trevas por poder e presença.', item: 'Coroa infernal',
    bonus: { strength: 1, presence: 2 }, hidden: true, requirement: 'Tiefling com afinidade Sombra, ou Força 13+ e Presença 14+ com afinidade Caos.',
    advantage: 'Criaturas menores podem hesitar ou negociar. Uma vez por arco, pode convocar um subordinado para virar uma batalha ou abrir um caminho.',
    unlock: ({ attributes, alignment, race }) => (race === 'Tiefling' && alignment === 'sombra') || (attributes.strength >= 13 && attributes.presence >= 14 && alignment === 'caos'),
  },
  {
    name: 'Herói Lendário', description: 'Inspira aliados e encontra força quando tudo parece perdido.', item: 'Insígnia do herói',
    bonus: { strength: 1, agility: 1, intellect: 1, presence: 1, vitality: 1 }, hidden: true, requirement: 'Todos os atributos 11+ e afinidade Luz ou Ordem.',
    advantage: 'Aliados ganham coragem ao seu lado. Uma vez por arco, pode transformar uma falha crítica ao proteger alguém em um sucesso com custo.',
    unlock: ({ attributes, alignment }) => Object.values(attributes).every((value) => value >= 11) && (alignment === 'luz' || alignment === 'ordem'),
  },
  {
    name: 'Santa', description: 'Uma guia divina que cura e afasta maldições.', item: 'Relíquia da aurora',
    bonus: { intellect: 1, presence: 2 }, hidden: true, requirement: 'Afinidade Luz, Presença 13+, Intelecto 13+ e passado Acólito.',
    advantage: 'Curas restauram mais energia; espíritos e pessoas desesperadas podem reconhecer sua presença e oferecer ajuda ou revelações.',
    unlock: ({ attributes, alignment, background }) => alignment === 'luz' && attributes.presence >= 13 && attributes.intellect >= 13 && background === 'Acólito',
  },
  {
    name: 'Rei Dragão', description: 'Herdeiro de uma linhagem dracônica soberana.', item: 'Selo do dragão ancestral',
    bonus: { strength: 2, vitality: 2 }, hidden: true, requirement: 'Força 14+, Vitalidade 14+ e afinidade Caos ou Ordem.',
    advantage: 'Resiste a fogo e intimida monstros. Uma vez por arco, pode despertar um sopro dracônico para superar um obstáculo ou alterar o campo de batalha.',
    unlock: ({ attributes, alignment }) => attributes.strength >= 14 && attributes.vitality >= 14 && (alignment === 'caos' || alignment === 'ordem'),
  },
];

const classOptions = [...classes, ...hiddenClasses];

const alignments: Array<{ key: Alignment; name: string; description: string }> = [
  { key: 'luz', name: 'Luz', description: 'Proteger os outros, mesmo com sacrifício.' },
  { key: 'sombra', name: 'Sombra', description: 'Buscar poder e agir fora das regras.' },
  { key: 'ordem', name: 'Ordem', description: 'Cumprir promessas e preservar equilíbrio.' },
  { key: 'caos', name: 'Caos', description: 'Desafiar destinos e quebrar limites.' },
];

const backgrounds = [
  { name: 'Soldado', description: 'Anos de disciplina e combate', bonus: { strength: 1, vitality: 1 } },
  { name: 'Erudito', description: 'Conhecimento acumulado em livros', bonus: { intellect: 2 } },
  { name: 'Criminoso', description: 'Sobreviveu nas sombras da cidade', bonus: { agility: 1, presence: 1 } },
  { name: 'Nobre caído', description: 'Perdeu título, mas não influência', bonus: { presence: 2 } },
  { name: 'Órfão das ruas', description: 'Aprendeu a sobreviver sozinho', bonus: { agility: 1, vitality: 1 } },
  { name: 'Acólito', description: 'Serviu um templo e seus mistérios', bonus: { intellect: 1, presence: 1 } },
];

const attributes: Array<{ key: AttributeName; label: string }> = [
  { key: 'strength', label: 'Força' },
  { key: 'agility', label: 'Agilidade' },
  { key: 'vitality', label: 'Vitalidade' },
  { key: 'intellect', label: 'Intelecto' },
  { key: 'presence', label: 'Presença' },
];

const emptyAllocation = (): Record<AttributeName, number> => ({
  strength: 0,
  agility: 0,
  vitality: 0,
  intellect: 0,
  presence: 0,
});

const sceneFromCampaign = (campaign: Campaign) => {
  const scene = `${campaign.currentScenario.name} ${campaign.currentScenario.description}`.toLowerCase();
  if (/escola|academia/.test(scene)) return 'castelo';
  if (/mar|porto|navio|ilha/.test(scene)) return 'mar';
  if (/cidade|rua|mercado/.test(scene)) return 'cidade';
  if (/castelo|torre|fortaleza/.test(scene)) return 'castelo';
  if (/caverna|gruta|mina/.test(scene)) return 'caverna';
  if (/deserto|duna/.test(scene)) return 'deserto';
  if (/ruína|ruina|templo/.test(scene)) return 'ruinas';
  if (/espaço|espaco|estação|estacao|planeta/.test(scene)) return 'espaco';
  return 'floresta';
};

class StoryStageBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error('[ForjeSuaLenda] Story stage failed to render:', error);
  }

  render() {
    if (this.state.failed) {
      return (
        <div role="status" className="mb-4 flex min-h-40 flex-col justify-center border border-[#3a3626] bg-[#101211] px-5 py-6 text-center">
          <p className="cz text-[#e8c46a]">A cena visual está indisponível</p>
          <p className="mt-2 text-sm text-[#9a927e]">O diário e as escolhas da aventura continuam funcionando abaixo.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

class GameRenderBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('[ForjeSuaLenda] Game screen failed to render:', error);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="mx-auto max-w-2xl px-5 py-10 text-[#efe6d2]" role="alert">
          <div className="border border-red-900 bg-[#101211] p-5">
            <h1 className="cz text-xl text-[#e8c46a]">A aventura encontrou um erro</h1>
            <p className="mt-3 break-words text-sm text-red-200">{this.state.error.message}</p>
            <button type="button" onClick={() => {
              try { localStorage.removeItem(ACTIVE_CAMPAIGN_KEY); } catch {}
              window.location.reload();
            }} className="mt-5 border border-[#e23a3a] bg-[#6e0a0e] px-4 py-2.5 font-semibold text-white">
              Limpar campanha e reabrir
            </button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}

const ForjeSuaLendaContent: FC<ForjeSuaLendaProps> = ({
  onOpenApiExplorer,
  onOpenVisualCreator,
  onOpenQuestJournal,
  onOpenInventory,
}) => {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [creationStep, setCreationStep] = useState(0);
  const [showCampaignCreator, setShowCampaignCreator] = useState(false);
  const [worldCategory, setWorldCategory] = useState('Todos');
  const [heroName, setHeroName] = useState('');
  const [premise, setPremise] = useState('');
  const [selectedWorld, setSelectedWorld] = useState(0);
  const [selectedMode, setSelectedMode] = useState(0);
  const [selectedRace, setSelectedRace] = useState(0);
  const [selectedClass, setSelectedClass] = useState(0);
  const [selectedBackground, setSelectedBackground] = useState(0);
  const [selectedAlignment, setSelectedAlignment] = useState<Alignment>('luz');
  const [allocation, setAllocation] = useState<Record<AttributeName, number>>(emptyAllocation);
  const [action, setAction] = useState('');
  const [busy, setBusy] = useState(false);
  const [streamingNarrative, setStreamingNarrative] = useState('');
  const [restoring, setRestoring] = useState(true);
  const [error, setError] = useState('');
  const [diceOpen, setDiceOpen] = useState(false);
  const [diceAttribute, setDiceAttribute] = useState<AttributeName>('agility');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceStyle, setVoiceStyle] = useState<'feminina' | 'masculina'>(() => {
    try {
      return localStorage.getItem('forje_voice_style') === 'masculina' ? 'masculina' : 'feminina';
    } catch {
      return 'feminina';
    }
  });
  const [voiceURI, setVoiceURI] = useState(() => {
    try {
      return localStorage.getItem('forje_voice_uri') || '';
    } catch {
      return '';
    }
  });
  const [speechVoices, setSpeechVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [avatar, setAvatar] = useState<VisualCharacterConfig>(DEFAULT_AVATAR);
  const [learning, setLearning] = useState<CampaignLearning>(readLearning);
  const latestEntryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const updateVoices = () => {
      setSpeechVoices(window.speechSynthesis.getVoices().filter((voice) => voice.lang.toLocaleLowerCase().startsWith('pt')));
    };
    updateVoices();
    window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
  }, []);

  useEffect(() => {
    try {
      const savedAvatar = localStorage.getItem('forje_visual_avatar');
      if (savedAvatar) {
        const parsedAvatar = JSON.parse(savedAvatar);
        if (parsedAvatar && typeof parsedAvatar === 'object') {
          setAvatar({ ...DEFAULT_AVATAR, ...parsedAvatar });
        }
      }
    } catch {
      setAvatar(DEFAULT_AVATAR);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const restoreCampaign = async () => {
      const campaignId = localStorage.getItem(ACTIVE_CAMPAIGN_KEY);
      if (!campaignId) {
        setRestoring(false);
        return;
      }
      try {
        const response = await fetch(`/api/rpg/campaign/${encodeURIComponent(campaignId)}`);
        if (response.status === 404) localStorage.removeItem(ACTIVE_CAMPAIGN_KEY);
        const data = await readApiResponse<{ campaign: Campaign }>(response);
        if (!cancelled) setCampaign(data.campaign);
      } catch (restoreError) {
        if (!cancelled) setError(restoreError instanceof Error ? restoreError.message : 'Falha ao recuperar a campanha salva.');
      } finally {
        if (!cancelled) setRestoring(false);
      }
    };
    void restoreCampaign();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    latestEntryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [campaign?.history.length, busy]);

  const selectedRaceData = races[selectedRace];
  const selectedClassData = classOptions[selectedClass] || classes[0];
  const selectedBackgroundData = backgrounds[selectedBackground];
  const pointsSpent = Object.values(allocation).reduce((total, points) => total + points, 0);
  const pointsRemaining = 15 - pointsSpent;

  const unlockAttributes = attributes.reduce((result, { key }) => {
    result[key] = 8 + allocation[key]
      + (selectedRaceData.bonus[key as keyof typeof selectedRaceData.bonus] || 0)
      + (selectedBackgroundData.bonus[key as keyof typeof selectedBackgroundData.bonus] || 0);
    return result;
  }, {} as Record<AttributeName, number>);
  const unlockContext: ClassUnlockContext = {
    attributes: unlockAttributes,
    alignment: selectedAlignment,
    race: selectedRaceData.name,
    background: selectedBackgroundData.name,
  };
  const unlockedHiddenClasses = hiddenClasses.filter((heroClass) => heroClass.unlock?.(unlockContext));

  useEffect(() => {
    const chosenClass = classOptions[selectedClass];
    if (chosenClass?.hidden && !chosenClass.unlock?.(unlockContext)) setSelectedClass(0);
  }, [selectedClass, selectedRace, selectedBackground, selectedAlignment, allocation]);

  const getFinalAttributes = () => attributes.reduce((result, { key }) => {
    result[key] = 8 + allocation[key]
      + (selectedRaceData.bonus[key as keyof typeof selectedRaceData.bonus] || 0)
      + (selectedClassData.bonus[key as keyof typeof selectedClassData.bonus] || 0)
      + (selectedBackgroundData.bonus[key as keyof typeof selectedBackgroundData.bonus] || 0);
    return result;
  }, {} as Record<AttributeName, number>);

  const changeAttribute = (key: AttributeName, delta: number) => {
    setAllocation((current) => {
      const nextValue = current[key] + delta;
      const spent = Object.values(current).reduce((total, points) => total + points, 0);
      if (nextValue < 0 || (delta > 0 && (spent >= 15 || 8 + nextValue >= 16))) return current;
      return { ...current, [key]: nextValue };
    });
  };

  const startCampaign = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedClassData.hidden && !selectedClassData.unlock?.(unlockContext)) {
      setSelectedClass(0);
      setError('Essa classe oculta não atende mais aos requisitos. Escolha outra ou ajuste seu herói.');
      return;
    }
    if (pointsRemaining > 0) {
      setError(`Distribua os ${pointsRemaining} pontos de atributo restantes antes de começar.`);
      setCreationStep(2);
      return;
    }
    setBusy(true);
    setStreamingNarrative('');
    setError('');
    const selectedWorldData = worlds[selectedWorld];
    const selectedModeData = modes[selectedMode];
    const modePremise = `Modo de campanha: ${selectedModeData.name}. ${selectedModeData.description}`;
    try {
      const response = await fetch('/api/rpg/campaign/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: selectedWorldData.theme,
          customThemePrompt: `${selectedWorldData.name}. Modo de campanha: ${selectedModeData.name}. ${selectedModeData.description}. Afinidade: ${selectedAlignment}. Classe: ${selectedClassData.name}. Vantagem de campanha: ${selectedClassData.advantage || selectedClassData.description}.${premise.trim() ? ` Ideia do jogador: ${premise.trim()}` : ''}`,
          tone: selectedModeData.tone,
          language: 'pt-BR',
          initialPremise: [modePremise, premise.trim()].filter(Boolean).join('\nIdeia do jogador: '),
          character: {
            name: heroName.trim() || 'Aventureiro',
            class: `${selectedRaceData.name} ${selectedClassData.name}`,
            background: selectedBackgroundData.name,
            attributes: getFinalAttributes(),
            startingItem: selectedClassData.item,
          },
        }),
      });
      const data = await readApiResponse<{ campaign: Campaign }>(response);
      setCampaign(data.campaign);
      localStorage.setItem(ACTIVE_CAMPAIGN_KEY, data.campaign.id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Falha ao conectar com o servidor do jogo.');
    } finally {
      setBusy(false);
    }
  };

  const sendAction = async (playerAction: string, diceRoll?: { roll: number; attribute: AttributeName }) => {
    if (!campaign || busy || !playerAction.trim()) return;
    setBusy(true);
    setError('');
    setAction('');
    setDiceOpen(false);
    const nextLearning = readLearning();
    const actionFocus = classifyActionFocus(playerAction);
    nextLearning.preferences[actionFocus] += 1;
    nextLearning.recentActions = [...nextLearning.recentActions, playerAction.trim().slice(0, 100)].slice(-6);
    setLearning(nextLearning);
    window.speechSynthesis?.cancel();
    try {
      const response = await fetch('/api/rpg/turn/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaign.id,
          action: playerAction.trim(),
          playerMemory: formatLearning(nextLearning),
          ...(diceRoll ? { customDiceRoll: diceRoll } : {}),
        }),
      });
      if (!response.ok) {
        await readApiResponse<never>(response);
      }
      if (!response.body) {
        throw new Error('O navegador não conseguiu abrir o fluxo da narrativa. Tente novamente.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const completedTurns: TurnResponse[] = [];
      const handleEvent = (block: string) => {
        const dataLine = block.split(/\r?\n/).find((line) => line.startsWith('data:'));
        if (!dataLine) return;

        let payload: unknown;
        try {
          payload = JSON.parse(dataLine.slice(5).trim());
        } catch {
          throw new Error('O servidor enviou um evento de narrativa inválido.');
        }
        if (!isRecord(payload) || typeof payload.event !== 'string') {
          throw new Error('O servidor enviou um evento de narrativa incompleto.');
        }
        if (payload.event === 'narrative') {
          const eventData = payload.data;
          if (isRecord(eventData) && typeof eventData.text === 'string') {
            setStreamingNarrative((current) => current + eventData.text);
          }
        } else if (payload.event === 'complete' && isTurnResponse(payload.data)) {
          completedTurns.push(payload.data);
        } else if (payload.event === 'error') {
          const message = isRecord(payload.data) && typeof payload.data.error === 'string'
            ? payload.data.error
            : 'O narrador não conseguiu concluir este turno.';
          throw new Error(message);
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        let separator = buffer.indexOf('\n\n');
        while (separator !== -1) {
          handleEvent(buffer.slice(0, separator));
          buffer = buffer.slice(separator + 2);
          separator = buffer.indexOf('\n\n');
        }
        if (done) break;
      }
      if (buffer.trim()) handleEvent(buffer);
      const data = completedTurns.at(-1);
      if (!data) {
        throw new Error('O servidor encerrou a narrativa antes de concluir o turno. Tente novamente.');
      }

      const consequence = String(data.turnResult?.narrative || '').trim().replace(/\s+/g, ' ').slice(0, 180);
      if (consequence) {
        nextLearning.recentConsequences = [...nextLearning.recentConsequences, consequence].slice(-4);
        setLearning(nextLearning);
        try {
          localStorage.setItem(LEARNING_KEY, JSON.stringify(nextLearning));
        } catch {
          setError('A aventura continuou, mas não foi possível salvar as preferências de jogo neste navegador.');
        }
      }
      setCampaign({
        ...data.campaign,
        history: [...campaign.history, ...data.campaign.history],
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Falha ao conectar com o narrador.');
    } finally {
      setStreamingNarrative('');
      setBusy(false);
    }
  };

  const newAdventure = () => {
    localStorage.removeItem(ACTIVE_CAMPAIGN_KEY);
    setCampaign(null);
    setCreationStep(0);
    setShowCampaignCreator(false);
    setAllocation(emptyAllocation());
    setError('');
    window.speechSynthesis?.cancel();
  };

  const speakLatest = () => {
    if (!campaign) return;
    if (voiceEnabled && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setVoiceEnabled(false);
      return;
    }
    const latestNarrative = [...campaign.history].reverse().find((entry) => entry.gmNarrative)?.gmNarrative;
    if (!latestNarrative || !('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(latestNarrative);
    utterance.lang = 'pt-BR';
    utterance.pitch = voiceStyle === 'feminina' ? 1.08 : 0.88;
    utterance.rate = voiceStyle === 'feminina' ? 0.96 : 0.92;
    utterance.voice = speechVoices.find((voice) => voice.voiceURI === voiceURI)
      || speechVoices[0]
      || null;
    utterance.onend = () => setVoiceEnabled(false);
    utterance.onerror = () => setVoiceEnabled(false);
    window.speechSynthesis.speak(utterance);
    setVoiceEnabled(true);
  };

  if (restoring && !campaign) {
    return <div className="mx-auto w-full max-w-2xl px-4 py-8 text-sm text-[#9a927e]" role="status">Recuperando sua aventura...</div>;
  }

  if (!campaign && !showCampaignCreator) {
    const visibleWorlds = featuredWorlds.filter((featured) => (
      worldCategory === 'Todos' || featured.category === worldCategory
    ));
    const openCreator = (worldIndex?: number) => {
      if (worldIndex !== undefined) setSelectedWorld(worldIndex);
      setCreationStep(0);
      setShowCampaignCreator(true);
    };

    return (
      <div className="game-home mx-auto w-full max-w-7xl px-4 pb-12 pt-4 sm:px-6 lg:px-8">
        <section className="game-home-hero relative isolate flex min-h-[420px] items-end overflow-hidden rounded-[1.75rem] border border-[#665735]/70 px-6 pb-8 pt-24 shadow-2xl sm:min-h-[490px] sm:px-10 sm:pb-10 lg:px-14">
          <div className="hero-ruins" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="hero-moon" aria-hidden="true" />
          <div className="hero-stars" aria-hidden="true">✦　 ·　 ✧　　·　　 ✦　 ·　 ✧</div>
          <div className="relative z-10 max-w-2xl">
            <p className="cz mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[#f0cf83] sm:text-xs">
              <Sparkles className="h-4 w-4" aria-hidden="true" /> Uma aventura só sua
            </p>
            <h1 className="cz max-w-xl text-4xl font-bold leading-[1.1] text-[#fff3d4] drop-shadow-lg sm:text-6xl">
              Sua lenda começa <span className="text-[#e8c46a]">aqui.</span>
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-[#e2d7bd] sm:text-lg">
              Escolha um mundo, crie seu herói e descubra para onde cada decisão vai levar você.
            </p>
            <button type="button" onClick={() => openCreator()} className="game-primary-button mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:brightness-110 sm:text-base">
              Começar aventura <Compass className="h-4 w-4" aria-hidden="true" />
            </button>
            <p className="mt-3 text-xs text-[#b8aa8a]">Grátis para começar · Sem caminhos predeterminados</p>
          </div>
          <div className="hero-seal" aria-hidden="true">✦</div>
        </section>

        <section className="mt-9 sm:mt-12" aria-labelledby="featured-worlds-title">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="cz text-[10px] uppercase tracking-[0.25em] text-[#a88b4c]">Encontre seu destino</p>
              <h2 id="featured-worlds-title" className="cz mt-1 text-2xl font-bold text-[#fff3d4] sm:text-3xl">Explore os mundos</h2>
            </div>
            <button type="button" onClick={() => openCreator()} className="hidden items-center gap-1 text-sm font-semibold text-[#e8c46a] transition hover:text-[#fff3d4] sm:inline-flex">
              Criar minha própria história <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="world-category-list mb-5 flex gap-2 overflow-x-auto pb-2" aria-label="Filtrar mundos">
            {worldCategories.map((category) => (
              <button
                key={category}
                type="button"
                aria-pressed={worldCategory === category}
                onClick={() => setWorldCategory(category)}
                className={`world-category-chip shrink-0 rounded-full border px-5 py-2.5 text-sm font-semibold transition ${
                  worldCategory === category
                    ? 'border-[#a51b1d] bg-gradient-to-b from-[#c51c20] to-[#760d11] text-[#fff3d4] shadow-[0_4px_18px_#8f111544]'
                    : 'border-white/10 bg-white/[0.06] text-[#b9b19f] hover:border-[#8d7749] hover:text-[#fff3d4]'
                }`}
              >
                {category === 'Todos' ? 'Todos os mundos' : category}
              </button>
            ))}
          </div>

          <div className="featured-worlds-grid">
            {visibleWorlds.map(({ worldIndex, category, art, badge }) => {
              const world = worlds[worldIndex];
              return (
                <button
                  key={world.name}
                  type="button"
                  onClick={() => openCreator(worldIndex)}
                  className="featured-world-card group overflow-hidden rounded-2xl border border-white/10 bg-[#11110f] text-left transition duration-300 hover:-translate-y-1 hover:border-[#c5a85f]/70 hover:shadow-[0_16px_40px_#0009]"
                  aria-label={`Começar aventura: ${world.name}`}
                >
                  <span className={`campaign-card-art campaign-art-${art}`} aria-hidden="true">
                    <span className="campaign-art-sparkles">✦　 ·　 ✧　 ·</span>
                    <span className="campaign-art-icon">{world.icon}</span>
                    <span className="campaign-art-title">{world.name}</span>
                    <span className="campaign-art-badge">{badge}</span>
                  </span>
                  <span className="block p-4">
                    <span className="block text-xs uppercase tracking-[0.18em] text-[#a88b4c]">{category}</span>
                    <span className="mt-1 block font-serif text-lg font-bold text-[#f2ead8]">{world.name}</span>
                    <span className="mt-1 block text-sm text-[#9a927e]">{world.description}</span>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#e8c46a]">
                      Jogar agora <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <button type="button" onClick={() => openCreator()} className="game-primary-button mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold uppercase tracking-wider text-white sm:hidden">
            Criar minha própria história <Sparkles className="h-4 w-4" aria-hidden="true" />
          </button>
        </section>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="campaign-creator-shell mx-auto w-full max-w-3xl px-4 pb-8 pt-5 text-[#efe6d2]">
        <button type="button" onClick={() => setShowCampaignCreator(false)} className="mb-3 inline-flex min-h-10 items-center gap-1 text-sm text-[#b8aa8a] transition hover:text-[#e8c46a]">
          <ChevronLeft size={17} aria-hidden="true" /> Voltar aos mundos
        </button>
        <form onSubmit={startCampaign} className="campaign-creator-form overflow-hidden border border-[#3a3626] bg-[#101211]/95 shadow-2xl shadow-black/40">
          <div className="border-b border-[#3a3626] bg-[radial-gradient(ellipse_at_50%_0%,_#3a251b_0%,_#101211_76%)] px-5 pb-6 pt-7 text-center sm:px-8">
            <p className="cz text-xs uppercase tracking-[0.18em] text-[#e8c46a]">Comece sua jornada</p>
            <h1 className="cz mt-2 text-3xl font-bold text-[#fff1cb] sm:text-4xl">Escolha o início da sua saga</h1>
            <div className="mx-auto mt-4 h-px max-w-xs bg-gradient-to-r from-transparent via-[#e8c46a] to-transparent" />
            <div className="mt-4 flex justify-center gap-2" aria-label={`Etapa ${creationStep + 1} de 3`}>
              {[0, 1, 2].map((step) => <span key={step} className={`h-1 w-12 ${step <= creationStep ? 'bg-[#e8c46a]' : 'bg-[#3a3626]'}`} />)}
            </div>
            <p className="mt-2 text-xs text-[#9a927e]">{['História e mundo', 'Seu herói', 'Classe e atributos'][creationStep]}</p>
          </div>

          <div className="px-5 py-5 sm:px-8">
            {creationStep === 0 && (
              <div className="space-y-5">
                <section>
                  <h2 className="cz mb-3 text-base text-[#e8c46a]">História</h2>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {modes.map((mode, index) => (
                      <button key={mode.name} type="button" aria-pressed={selectedMode === index} onClick={() => setSelectedMode(index)} className={`creator-mode-card mode-art-${index} min-h-[150px] border p-3 text-left transition-colors sm:min-h-[170px] ${selectedMode === index ? 'border-[#e8c46a] bg-[#e8c46a14]' : 'border-[#34312a] bg-[#1d1f1f] hover:border-[#8a7950]'}`}>
                        <span className="creator-card-kicker">{mode.tone === 'epic' ? 'Imersivo' : mode.tone === 'tactical' ? 'Estratégico' : mode.tone === 'mysterious' ? 'Investigação' : 'Livre'}</span>
                        <span className={`block text-sm font-bold ${selectedMode === index ? 'text-[#e8c46a]' : 'text-[#efe6d2]'}`}>{mode.name}</span>
                        <span className="mt-1 block text-xs leading-snug text-[#9a927e]">{mode.description}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="cz mb-3 text-base text-[#e8c46a]">Mundo</h2>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {worlds.map((world, index) => (
                      <button key={world.name} type="button" aria-pressed={selectedWorld === index} onClick={() => setSelectedWorld(index)} className={`creator-world-card world-art-${index} min-h-[104px] border p-2.5 text-left transition-colors ${selectedWorld === index ? 'border-[#e8c46a] bg-[#e8c46a14]' : 'border-[#34312a] bg-[#1d1f1f] hover:border-[#8a7950]'}`}>
                        <span className="creator-world-icon" aria-hidden="true">{world.icon}</span>
                        <span className="block text-sm font-semibold text-[#efe6d2]">{world.name}</span>
                        <span className="block text-xs text-[#9a927e]">{world.description}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <label className="block text-sm text-[#e8c46a]">
                  Ideia para sua história <span className="text-[#827b6b]">(opcional)</span>
                  <textarea value={premise} onChange={(event) => setPremise(event.target.value)} maxLength={400} rows={3} placeholder="Uma pista, objetivo ou segredo para o mestre..." className="mt-1 w-full resize-y rounded-md border border-[#3a3626] bg-[#0b0d0c] px-3 py-2.5 font-serif text-base text-[#efe6d2] outline-none focus:border-[#e8c46a]" />
                </label>
              </div>
            )}

            {creationStep === 1 && (
              <div className="space-y-5">
                <label className="block text-sm text-[#e8c46a]">
                  Nome do herói
                  <input value={heroName} onChange={(event) => setHeroName(event.target.value)} maxLength={24} placeholder="Ex.: Aldric" className="mt-1 w-full rounded-md border border-[#3a3626] bg-[#0b0d0c] px-3 py-2.5 font-serif text-base text-[#efe6d2] outline-none focus:border-[#e8c46a]" />
                </label>
                <section>
                  <h2 className="cz mb-2 text-base text-[#e8c46a]">Raça</h2>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {races.map((race, index) => <button key={race.name} type="button" aria-pressed={selectedRace === index} onClick={() => setSelectedRace(index)} className={`border p-3 text-left ${selectedRace === index ? 'border-[#e8c46a] bg-[#e8c46a14]' : 'border-[#34312a] bg-[#1d1f1f]'}`}><b className="block text-sm text-[#e8c46a]">{race.name}</b><small className="text-xs text-[#9a927e]">{race.detail}</small></button>)}
                  </div>
                </section>
                <section>
                  <h2 className="cz mb-2 text-base text-[#e8c46a]">Passado</h2>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {backgrounds.map((background, index) => <button key={background.name} type="button" aria-pressed={selectedBackground === index} onClick={() => setSelectedBackground(index)} className={`border p-3 text-left ${selectedBackground === index ? 'border-[#e8c46a] bg-[#e8c46a14]' : 'border-[#34312a] bg-[#1d1f1f]'}`}><b className="block text-sm text-[#e8c46a]">{background.name}</b><small className="text-xs text-[#9a927e]">{background.description}</small></button>)}
                  </div>
                </section>
                <section>
                  <h2 className="cz mb-2 text-base text-[#e8c46a]">Afinidade</h2>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {alignments.map((alignment) => <button key={alignment.key} type="button" aria-pressed={selectedAlignment === alignment.key} onClick={() => setSelectedAlignment(alignment.key)} className={`border p-3 text-left ${selectedAlignment === alignment.key ? 'border-[#e8c46a] bg-[#e8c46a14]' : 'border-[#34312a] bg-[#1d1f1f]'}`}><b className="block text-sm text-[#e8c46a]">{alignment.name}</b><small className="text-xs text-[#9a927e]">{alignment.description}</small></button>)}
                  </div>
                </section>
                <button type="button" onClick={onOpenVisualCreator} className="rounded-md border border-[#3a3626] px-3 py-2 text-sm text-[#c8c0ad] hover:border-[#e8c46a]">🎨 Personalizar aparência 2D</button>
              </div>
            )}

            {creationStep === 2 && (
              <section>
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div><h2 className="cz text-base text-[#e8c46a]">Atributos e classe</h2><p className="mt-1 text-sm text-[#9a927e]">Distribua 15 pontos; escolhas do herói liberam classes raras.</p></div>
                  <span className={`cz whitespace-nowrap text-sm ${pointsRemaining === 0 ? 'text-emerald-300' : 'text-[#e8c46a]'}`}>{pointsRemaining} pts</span>
                </div>
                <div className="divide-y divide-[#34312a] border-y border-[#34312a]">
                  {attributes.map(({ key, label }) => {
                    const value = getFinalAttributes()[key];
                    return <div key={key} className="flex items-center gap-3 py-3"><span className="flex-1 text-sm text-[#efe6d2]">{label}</span><span className="cz w-8 text-center text-[#e8c46a]">{value}</span><button type="button" aria-label={`Diminuir ${label}`} disabled={allocation[key] === 0} onClick={() => changeAttribute(key, -1)} className="h-9 w-9 border border-[#3a3626] text-lg text-[#c8c0ad] disabled:opacity-30">−</button><button type="button" aria-label={`Aumentar ${label}`} disabled={pointsRemaining === 0 || 8 + allocation[key] >= 15} onClick={() => changeAttribute(key, 1)} className="h-9 w-9 border border-[#e8c46a] bg-[#e8c46a14] text-lg text-[#e8c46a] disabled:opacity-30">+</button></div>;
                  })}
                </div>
                <section className="mt-5">
                  <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                    <div><h3 className="cz text-base text-[#e8c46a]">Escolha sua classe</h3><p className="mt-1 text-xs text-[#9a927e]">Classes ocultas são liberadas pelas escolhas e atributos do personagem.</p></div>
                    <span className="text-xs text-[#e8c46a]">{unlockedHiddenClasses.length} de {hiddenClasses.length} ocultas liberadas</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {classOptions.map((heroClass, index) => {
                      const available = !heroClass.hidden || Boolean(heroClass.unlock?.(unlockContext));
                      return (
                        <button key={heroClass.name} type="button" disabled={!available} aria-pressed={selectedClass === index} onClick={() => setSelectedClass(index)} className={`border p-3 text-left transition-colors ${selectedClass === index ? 'border-[#e8c46a] bg-[#e8c46a18]' : available ? 'border-[#34312a] bg-[#1d1f1f] hover:border-[#8a7950]' : 'border-dashed border-[#3a3626] bg-[#141514] opacity-60'}`}>
                          <span className="flex items-center justify-between gap-2"><b className={`text-sm ${available ? 'text-[#e8c46a]' : 'text-[#9a927e]'}`}>{heroClass.hidden && !available ? '🔒 ' : heroClass.hidden ? '✦ ' : ''}{heroClass.name}</b>{heroClass.hidden && available && <span className="text-[10px] uppercase text-emerald-300">Liberada</span>}</span>
                          <span className="mt-1 block text-xs text-[#b8b09e]">{heroClass.description}</span>
                          <span className="mt-2 block text-xs leading-snug text-[#9a927e]">{available ? `Vantagem: ${heroClass.advantage}` : `Requisito: ${heroClass.requirement}`}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>
                <div className="mt-5 border-l-2 border-[#e8c46a] bg-[#1d1f1f] px-4 py-3 text-sm text-[#c8c0ad]">
                  <p className="cz text-[#e8c46a]">{heroName.trim() || 'Aventureiro'} · {selectedRaceData.name} {selectedClassData.name}</p>
                  <p className="mt-1">{worlds[selectedWorld].name} · {modes[selectedMode].name} · {selectedBackgroundData.name} · Afinidade {selectedAlignment}</p>
                  <p className="mt-1">Item inicial: {selectedClassData.item}</p>
                  <p className="mt-1">Vantagem: {selectedClassData.advantage}</p>
                </div>
              </section>
            )}
          </div>

          {error && <p role="alert" className="mx-5 mb-4 border-l-2 border-red-500 bg-red-950/30 px-3 py-2 text-sm text-red-200 sm:mx-8">{error}</p>}
          <footer className="flex items-center justify-between gap-3 border-t border-[#3a3626] bg-[#0d0f0e] px-5 py-4 sm:px-8">
            <button type="button" onClick={() => { setError(''); setCreationStep((step) => Math.max(0, step - 1)); }} disabled={creationStep === 0 || busy} className="flex items-center gap-1 px-2 py-2 text-sm text-[#9a927e] hover:text-[#efe6d2] disabled:invisible"><ChevronLeft size={17} /> Voltar</button>
            {creationStep < 2 ? (
              <button type="button" onClick={() => { setError(''); setCreationStep((step) => Math.min(2, step + 1)); }} className="flex items-center gap-2 border border-[#e23a3a] bg-gradient-to-b from-[#c8161d] to-[#6e0a0e] px-5 py-2.5 font-bold text-white">Continuar <ChevronRight size={17} /></button>
            ) : (
              <button type="submit" disabled={busy || pointsRemaining !== 0} className="flex items-center gap-2 border border-[#e23a3a] bg-gradient-to-b from-[#c8161d] to-[#6e0a0e] px-5 py-2.5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? <><LoaderCircle size={17} className="animate-spin" /> O mestre prepara o mundo...</> : <><Sparkles size={17} /> Criar personagem</>}</button>
            )}
          </footer>
        </form>
      </div>
    );
  }

  const hpPercent = Math.max(0, Math.min(100, (campaign.character.hp / campaign.character.maxHp) * 100));
  const xpPercent = Math.max(0, Math.min(100, campaign.character.xp % 100));
  const latestAction = [...campaign.history].reverse().find((entry) => entry.turnNumber > 0)?.playerAction || '';
  const scene = sceneFromCampaign(campaign);
  const currentNpc = campaign.currentScenario.currentNPCs[0];
  const customWorldName = campaign.customThemePrompt?.match(/^(.+?)\. Modo de campanha:/)?.[1];
  const campaignClass = classOptions.find((heroClass) => campaign.character.class
    .toLocaleLowerCase('pt-BR')
    .includes(heroClass.name.toLocaleLowerCase('pt-BR')));

  return (
    <div className="game-campaign mx-auto w-full max-w-5xl px-3 pb-24 pt-4 text-[#efe6d2] sm:px-5 sm:pb-8">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-[#3a3626] pb-3">
        <div className="min-w-0">
          <p className="cz truncate text-xs uppercase tracking-[0.15em] text-[#e8c46a]">{campaign.title}</p>
          <h1 className="cz mt-1 truncate text-lg font-bold">{campaign.character.name} <span className="font-normal text-[#9a927e]">· {campaign.character.class}</span></h1>
        </div>
        <div className="flex items-center gap-1.5">
          <details className="story-voice-settings">
            <summary aria-label="Configurações de voz">Voz</summary>
            <div className="story-voice-panel">
              <label>
                Timbre
                <select
                  value={voiceStyle}
                  onChange={(event) => {
                    const style = event.target.value as 'feminina' | 'masculina';
                    setVoiceStyle(style);
                    try {
                      localStorage.setItem('forje_voice_style', style);
                    } catch {}
                  }}
                >
                  <option value="feminina">Feminino</option>
                  <option value="masculina">Masculino</option>
                </select>
              </label>
              <label>
                Voz do dispositivo
                <select
                  value={voiceURI}
                  onChange={(event) => {
                    setVoiceURI(event.target.value);
                    try {
                      localStorage.setItem('forje_voice_uri', event.target.value);
                    } catch {}
                  }}
                >
                  <option value="">Padrão em português</option>
                  {speechVoices.map((voice) => (
                    <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} · {voice.lang}</option>
                  ))}
                </select>
              </label>
              <p>As vozes disponíveis dependem do navegador e do dispositivo.</p>
            </div>
          </details>
          <button type="button" onClick={speakLatest} title={voiceEnabled ? 'Parar narração' : 'Ouvir narração'} className="border border-[#3a3626] bg-[#17191a] p-2 text-[#e8c46a] hover:border-[#e8c46a]">{voiceEnabled ? <VolumeX size={17} /> : <Volume2 size={17} />}</button>
          <button type="button" onClick={onOpenQuestJournal} title="Diário de missões" className="border border-[#3a3626] bg-[#17191a] p-2 text-[#c8c0ad] hover:border-[#e8c46a]"><ScrollText size={17} /></button>
          <button type="button" onClick={onOpenInventory} title="Inventário" className="border border-[#3a3626] bg-[#17191a] p-2 text-[#c8c0ad] hover:border-[#e8c46a]"><Backpack size={17} /></button>
        </div>
      </header>

      <div className="mb-3 grid grid-cols-3 gap-2 text-xs sm:text-sm">
        <div className="border border-[#3a3626] bg-[#17191a] px-3 py-2">
          <div className="mb-1 flex items-center justify-between gap-2"><span className="flex items-center gap-1 text-red-200"><Heart size={13} /> Vida</span><span>{campaign.character.hp}/{campaign.character.maxHp}</span></div>
          <div className="h-1.5 bg-[#0b0d0c]"><div className="h-full bg-gradient-to-r from-[#9e171e] to-[#e34b43]" style={{ width: `${hpPercent}%` }} /></div>
        </div>
        <div className="border border-[#3a3626] bg-[#17191a] px-3 py-2">
          <div className="mb-1 flex items-center justify-between gap-2"><span className="text-[#e8c46a]">Experiência</span><span>Nv {campaign.character.level}</span></div>
          <div className="h-1.5 bg-[#0b0d0c]"><div className="h-full bg-gradient-to-r from-[#a07a20] to-[#f2d37a]" style={{ width: `${xpPercent}%` }} /></div>
        </div>
        <div className="border border-[#3a3626] bg-[#17191a] px-3 py-2"><span className="block text-[#9a927e]">Local</span><span className="mt-1 block truncate text-[#efe6d2]">{campaign.currentScenario.name}</span></div>
      </div>

      {campaignClass && (
        <section className={`campaign-class-feature ${campaignClass.hidden ? 'campaign-class-feature--hidden' : ''}`} aria-label="Habilidade da classe">
          <div className="campaign-class-feature__icon" aria-hidden="true">{campaignClass.hidden ? '✦' : '➤'}</div>
          <div>
            <p className="campaign-class-feature__eyebrow">{campaignClass.hidden ? 'Classe oculta · vantagem especial' : 'Destaque da classe'}</p>
            <h2>{campaignClass.name}</h2>
            <p>{campaignClass.advantage || campaignClass.description}</p>
          </div>
        </section>
      )}

      <StoryStageBoundary>
        <AnimatedStoryStage2D
          scene={scene}
          worldName={customWorldName || worlds.find((world) => world.theme === campaign.theme)?.name || worlds[selectedWorld].name}
          characterConfig={avatar}
          npc={currentNpc?.name || ''}
          lastAction={latestAction}
          dangerLevel={campaign.currentScenario.dangerLevel}
        />
      </StoryStageBoundary>

      {campaign.narrationMode === 'offline' && <p role="status" className="mb-3 border-l-2 border-amber-500 bg-amber-950/30 px-3 py-2 text-sm text-amber-200">O narrador está em modo de contingência porque o Gemini não respondeu. A aventura continua, mas estas falas não foram geradas pela IA.</p>}
      {Object.values(learning.preferences).some((count) => count > 0) && <p className="mb-3 text-xs text-[#9a927e]">O mestre está adaptando os próximos ganchos às suas escolhas. Essa memória fica somente neste navegador.</p>}
      {error && <p role="alert" className="mb-3 border-l-2 border-red-500 bg-red-950/30 px-3 py-2 text-sm text-red-200">{error}</p>}

      <section className="border border-[#3a3626] bg-[#101211]/95">
        <div className="flex items-center justify-between border-b border-[#3a3626] px-4 py-2.5">
          <h2 className="cz text-sm text-[#e8c46a]">Diário da aventura</h2>
          <span className="text-xs text-[#9a927e]">Turno {campaign.turnCount}</span>
        </div>
        <div className="max-h-[36vh] min-h-32 space-y-4 overflow-y-auto px-4 py-4 sm:px-5" aria-live="polite">
          {campaign.history.map((entry) => (
            <article key={entry.id} className="border-l-2 border-[#665735] pl-3">
              {entry.turnNumber > 0 && <p className="mb-1 text-sm italic text-[#e8c46a]">{campaign.character.name}: {entry.playerAction}</p>}
              <p className="whitespace-pre-line text-base leading-relaxed text-[#e5ddcb]">{entry.gmNarrative}</p>
              {entry.diceRollResult && <p className="mt-1 text-xs text-[#9a927e]">D20 {entry.diceRollResult.d20} + {entry.diceRollResult.modifier} ({entry.diceRollResult.attribute}) = {entry.diceRollResult.total} · {entry.diceRollResult.successLevel}</p>}
            </article>
          ))}
          {streamingNarrative && (
            <article className="border-l-2 border-[#665735] pl-3" aria-label="Narrativa em andamento">
              <p className="whitespace-pre-line text-base leading-relaxed text-[#e5ddcb]">{streamingNarrative}</p>
            </article>
          )}
          <div ref={latestEntryRef} />
          {busy && !streamingNarrative && <p className="animate-pulse text-sm text-[#9a927e]">O mestre está narrando...</p>}
        </div>

        <div className="border-t border-[#3a3626] px-4 py-3 sm:px-5">
          <h3 className="cz mb-2 text-xs uppercase tracking-[0.12em] text-[#9a927e]">O que você faz?</h3>
          <div className="mb-3 flex flex-col gap-2">
            {campaign.suggestedActions.slice(0, 4).map((suggestion, index) => (
              <button key={suggestion.id} type="button" disabled={busy} onClick={() => void sendAction(suggestion.title)} className="flex items-start gap-3 border border-[#3a3626] bg-[#1d1f1f] px-3 py-2.5 text-left transition-colors hover:border-[#e8c46a] disabled:opacity-50">
                <span className="cz mt-0.5 text-sm text-[#e8c46a]">{index + 1}.</span>
                <span className="min-w-0"><span className="block text-sm font-semibold text-[#efe6d2]">{suggestion.title}</span><span className="mt-0.5 block text-xs leading-snug text-[#9a927e]">{suggestion.description}</span></span>
                {suggestion.riskLevel && <span className="ml-auto shrink-0 pt-0.5 text-[10px] uppercase text-[#9a927e]">{suggestion.riskLevel}</span>}
              </button>
            ))}
          </div>
          <form onSubmit={(event) => { event.preventDefault(); void sendAction(action); }} className="flex gap-2">
            <input value={action} onChange={(event) => setAction(event.target.value)} disabled={busy} maxLength={300} placeholder="Ou escreva qualquer ação..." className="min-w-0 flex-1 border border-[#3a3626] bg-[#0b0d0c] px-3 py-2.5 text-base text-[#efe6d2] outline-none placeholder:text-[#756f61] focus:border-[#e8c46a] disabled:opacity-60" />
            <button type="button" title="Rolar d20" disabled={busy} onClick={() => setDiceOpen(true)} className="border border-[#665735] bg-[#1d1f1f] px-3 text-[#e8c46a] hover:border-[#e8c46a] disabled:opacity-50"><Dice5 size={20} /></button>
            <button type="submit" title="Enviar ação" disabled={busy || !action.trim()} className="bg-[#b3141a] px-3 text-white hover:bg-[#d11d25] disabled:opacity-40"><Send size={18} /></button>
          </form>
        </div>
      </section>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[#9a927e]">
        <span className="flex items-center gap-1"><Sparkles size={13} /> {campaign.character.inventory.length} item(ns) · {campaign.character.manaOrEnergy}/{campaign.character.maxManaOrEnergy} energia</span>
        <div className="flex flex-wrap gap-4">
          {Object.values(learning.preferences).some((count) => count > 0) && <button type="button" onClick={() => {
            const cleared = emptyLearning();
            setLearning(cleared);
            try {
              localStorage.removeItem(LEARNING_KEY);
            } catch {
              setError('Não foi possível limpar a memória local neste navegador.');
            }
          }} className="border-b border-[#665735] pb-0.5 hover:text-[#e8c46a]">Limpar memória do mestre</button>}
          <button type="button" onClick={newAdventure} className="border-b border-[#665735] pb-0.5 hover:text-[#e8c46a]">Começar outra aventura</button>
        </div>
      </div>

      <nav aria-label="Navegação do jogo" className="fixed inset-x-0 bottom-0 z-30 flex border-t border-[#3a3626] bg-[#0a0a0af2] pb-[env(safe-area-inset-bottom)] md:hidden">
        <button type="button" onClick={() => latestEntryRef.current?.scrollIntoView({ behavior: 'smooth' })} className="flex flex-1 flex-col items-center gap-1 py-2 text-[#e8c46a]"><BookOpen size={18} /><span className="text-[10px]">Aventura</span></button>
        <button type="button" onClick={onOpenQuestJournal} className="flex flex-1 flex-col items-center gap-1 py-2 text-[#9a927e]"><ScrollText size={18} /><span className="text-[10px]">Missões</span></button>
        <button type="button" onClick={onOpenInventory} className="flex flex-1 flex-col items-center gap-1 py-2 text-[#9a927e]"><Backpack size={18} /><span className="text-[10px]">Mochila</span></button>
        <button type="button" onClick={onOpenApiExplorer} className="flex flex-1 flex-col items-center gap-1 py-2 text-[#9a927e]"><Sparkles size={18} /><span className="text-[10px]">Mestre</span></button>
      </nav>

      {diceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-labelledby="dice-title">
          <div className="w-full max-w-sm border border-[#e8c46a] bg-[#1d1f1f] p-5 text-center shadow-2xl shadow-black/70">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center border border-[#665735] text-[#e8c46a]"><Dice5 size={27} /></div>
            <h2 id="dice-title" className="cz text-lg text-[#e8c46a]">Teste de dados</h2>
            <p className="mt-1 text-sm text-[#9a927e]">Escolha o atributo e role um d20 para sua ação.</p>
            <label className="mt-5 block text-left text-sm text-[#c8c0ad]">Atributo</label>
            <select value={diceAttribute} onChange={(event) => setDiceAttribute(event.target.value as AttributeName)} className="mt-1 w-full border border-[#3a3626] bg-[#0b0d0c] px-3 py-2.5 text-[#efe6d2]">
              {attributes.map(({ key, label }) => <option key={key} value={key}>{label} ({campaign.character.attributes[key]})</option>)}
            </select>
            <p className="mt-3 text-xs text-[#9a927e]">Sua rolagem será enviada junto com a ação para o mestre.</p>
            <button type="button" disabled={busy} onClick={() => {
              const roll = Math.floor(Math.random() * 20) + 1;
              const selectedAction = action.trim() || 'Observar os arredores com cautela';
              void sendAction(selectedAction, { roll, attribute: diceAttribute });
            }} className="mt-5 flex w-full items-center justify-center gap-2 border border-[#e23a3a] bg-gradient-to-b from-[#c8161d] to-[#6e0a0e] px-4 py-3 font-bold text-white disabled:opacity-50"><Dice5 size={18} /> Rolar d20</button>
            <button type="button" onClick={() => setDiceOpen(false)} className="mt-3 inline-flex items-center gap-1 px-3 py-2 text-sm text-[#9a927e] hover:text-[#efe6d2]"><ChevronLeft size={16} /> Voltar à aventura</button>
          </div>
        </div>
      )}
    </div>
  );
};

export const ForjeSuaLenda: FC<ForjeSuaLendaProps> = (props) => (
  <GameRenderBoundary>
    <ForjeSuaLendaContent {...props} />
  </GameRenderBoundary>
);