export type RPGTheme = 
  | 'dark_fantasy' 
  | 'cyberpunk' 
  | 'eldritch_horror' 
  | 'sci_fi' 
  | 'post_apocalyptic' 
  | 'steampunk' 
  | 'solarpunk'
  | 'hollow_earth'
  | 'mecha'
  | 'lovecraftian'
  | 'ice_age'
  | 'celestial'
  | 'dark_circus'
  | 'clockwork'
  | 'custom';

export interface CharacterAttributes {
  strength: number;      // Força física e combate corpo a corpo
  agility: number;       // Destreza, reflexos e furtividade
  intellect: number;     // Conhecimento, magia, lógica e tecnologia
  presence: number;      // Carisma, intuição, força de vontade
  vitality: number;      // Resistência, vigor e saúde
}

export interface InventoryItem {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'consumable' | 'relic' | 'quest' | 'misc';
  description: string;
  quantity?: number;
  properties?: string;
}

export interface NPC {
  name: string;
  role: string;
  attitude: 'friendly' | 'neutral' | 'hostile' | 'mysterious';
  description: string;
}

export interface Scenario {
  id: string;
  name: string;
  region: string;
  description: string;
  atmosphere: string;
  lighting: string;
  dangerLevel: number; // 1 (calm) to 5 (deadly)
  pointsOfInterest: string[];
  currentNPCs: NPC[];
  environmentalHazards?: string[];
  weatherOrClimate?: string;
}

export interface CharacterState {
  name: string;
  class: string;
  background: string;
  level: number;
  xp: number;
  hp: number;
  maxHp: number;
  manaOrEnergy: number;
  maxManaOrEnergy: number;
  attributes: CharacterAttributes;
  inventory: InventoryItem[];
  statusEffects: string[];
}

export interface SuggestedAction {
  id: string;
  title: string;
  description: string;
  attributeCheck?: keyof CharacterAttributes | 'none';
  riskLevel: 'baixo' | 'médio' | 'alto';
}

export interface TurnHistoryEntry {
  id: string;
  turnNumber: number;
  playerAction: string;
  diceRollResult?: {
    d20: number;
    modifier: number;
    total: number;
    attribute: string;
    successLevel: 'crítico' | 'sucesso' | 'falha' | 'desastre';
  };
  gmNarrative: string;
  scenarioName: string;
  timestamp: string;
  consequencesSummary?: string;
}

export interface Campaign {
  id: string;
  title: string;
  narrationMode?: 'ai' | 'offline';
  theme: RPGTheme;
  customThemePrompt?: string;
  tone: 'epic' | 'gritty' | 'mysterious' | 'tactical';
  language: string;
  createdAt: string;
  updatedAt: string;
  turnCount: number;
  character: CharacterState;
  currentScenario: Scenario;
  suggestedActions: SuggestedAction[];
  history: TurnHistoryEntry[];
  unresolvedRumors: string[]; // Hooks that ensure the world is infinite
  activeFactionsOrThreats: string[];
}

export interface CreateCampaignRequest {
  title?: string;
  theme: RPGTheme;
  customThemePrompt?: string;
  tone?: 'epic' | 'gritty' | 'mysterious' | 'tactical';
  language?: string;
  character: {
    name: string;
    class: string;
    background?: string;
    attributes?: Partial<CharacterAttributes>;
    startingItem?: string;
  };
  initialPremise?: string;
}

export interface TurnRequest {
  campaignId: string;
  action: string;
  playerMemory?: string;
  customDiceRoll?: {
    roll: number;
    attribute?: keyof CharacterAttributes;
  };
}

export interface GenerateScenarioRequest {
  campaignId: string;
  travelDirection?: string;
  explorationType?: 'travel' | 'dungeon_depths' | 'secret_portal' | 'strange_anomaly' | 'flee';
  intent?: string;
}

export interface RollDiceRequest {
  diceType?: 'd20' | 'd100' | 'd12' | 'd10' | 'd8' | 'd6' | 'd4';
  modifier?: number;
  attribute?: keyof CharacterAttributes;
  campaignId?: string;
  reason?: string;
}
