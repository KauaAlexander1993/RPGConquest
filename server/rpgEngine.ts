import { ai, RPG_MODEL } from './geminiClient.js';
import {
  Campaign,
  CreateCampaignRequest,
  TurnRequest,
  GenerateScenarioRequest,
  RollDiceRequest,
  Scenario,
  SuggestedAction,
  TurnHistoryEntry,
  CharacterState,
  InventoryItem,
} from './rpgTypes.js';

// In-memory campaign storage
const campaigns = new Map<string, Campaign>();

function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
}

// System prompt emphasizing endless open-world RPG storytelling
const RPG_MASTER_SYSTEM_INSTRUCTION = `
Você é o "Mestre Supremo de RPG" (Dungeon Master & World Weaver) de um motor de jogo de RPG dinâmico.
Sua função é guiar o jogador em uma jornada fascinante, reagir às suas escolhas com verossimilhança e profundidade literária, e gerar cenários vívidos continuamente.

DIRETRIZES FUNDAMENTAIS:
1. HISTÓRIA INFINITA (SEM FINAL DETERMINADO):
   - NUNCA conclua a narrativa com "FIM", "Game Over" ou um desfecho definitivo.
   - Cada vitória, derrota, resolução de enigma ou combate vencido DEVE desencadear uma nova ponta solta, um mistério mais profundo, uma consequência política ou a descoberta de uma nova terra/dimensão inexplorada.
   - Se o personagem do jogador perder todo o HP, ele NUNCA é simplesmente descartado: ele pode ser capturado por inimigos que querem informações, resgatado por uma criatura estranha com uma dívida misteriosa, acordar em uma ruína milenar com amnésia parcial, ou ser salvo por magia/cibernética com um custo.
2. REATIVIDADE ABSOLUTA:
   - Honre as decisões do jogador. Se ele tentar algo arrojado, descreva os efeitos colaterais reais no ambiente e nos NPCs.
   - Considere os atributos do personagem (Força, Agilidade, Intelecto, Presença, Vitalidade) e os resultados de dados rolados.
3. CENÁRIOS RICOS E IMERSIVOS:
   - Descreva iluminação, cheiros, ecos, detalhes arquitetônicos e o clima.
   - Cada cenário deve ter pontos de interesse investigáveis e NPCs com personalidades próprias.
4. EQUILÍBRIO MECÂNICO:
   - Conceda ou deduza HP (-3 a -15 em danos normais, cura com itens/descanso), Mana/Vigor, itens e efeitos de status com coerência.
   - Apresente sempre 3 a 4 ações sugeridas provocativas e estratégicas para o próximo turno, sabendo que o jogador também pode escrever qualquer ação livre.
5. FORMATO DE SAÍDA:
   - Você DEVE responder ESTRITAMENTE em formato JSON compatível com o schema requisitado, sem markdown de bloco de código (\`\`\`json) e sem texto antes ou depois.
`;

export class RPGEngine {
  // Get all campaigns
  static listCampaigns(): Array<Omit<Campaign, 'history'> & { historyCount: number }> {
    return Array.from(campaigns.values()).map(c => ({
      ...c,
      historyCount: c.history.length,
    }));
  }

  // Get a single campaign
  static getCampaign(id: string): Campaign | undefined {
    return campaigns.get(id);
  }

  // Delete a campaign
  static deleteCampaign(id: string): boolean {
    return campaigns.delete(id);
  }

  // Initialize a default starter campaign if none exists
  static seedInitialCampaignIfEmpty(): Campaign {
    if (campaigns.size > 0) {
      return campaigns.values().next().value!;
    }

    const starter: Campaign = {
      id: 'camp_valefrio_starter',
      title: 'O Vale dos Ecos Esquecidos',
      theme: 'dark_fantasy',
      tone: 'gritty',
      language: 'pt-BR',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      turnCount: 0,
      character: {
        name: 'Kaelen Thorne',
        class: 'Guardião Rúnico',
        background: 'Exilado da Ordem dos Pilares de Obsidiana',
        level: 1,
        xp: 0,
        hp: 30,
        maxHp: 30,
        manaOrEnergy: 20,
        maxManaOrEnergy: 20,
        attributes: {
          strength: 14,
          agility: 12,
          intellect: 13,
          presence: 11,
          vitality: 15,
        },
        inventory: [
          {
            id: 'item_1',
            name: 'Lâmina Rúnica Rachada',
            type: 'weapon',
            description: 'Espada de aço estelar com uma runa de luminescência quase gasta.',
          },
          {
            id: 'item_2',
            name: 'Frasco de Seiva de Vidoeiro Astral',
            type: 'consumable',
            description: 'Restaura 12 pontos de Vitalidade.',
            quantity: 2,
          },
          {
            id: 'item_3',
            name: 'Bússola de Ferro-Negro',
            type: 'relic',
            description: 'A agulha aponta sempre para anomalias arcanas em vez do norte magnético.',
          },
        ],
        statusEffects: ['Sentidos Aguçados'],
      },
      currentScenario: {
        id: 'scen_abismo_brumas',
        name: 'Garganta dos Lamentos',
        region: 'Fronteiras Esquecidas de Karst',
        description: 'Um desfiladeiro cavernoso cortado por brumas prateadas. Pilares ciclópios de basalto sustentam os restos de uma ponte pênsil em ruínas. Cristais de quartzo violeta cintilam nas fendas da rocha, emitindo um zumbido grave que reverbera no peito.',
        atmosphere: 'Tensão opressiva, névoa úmida e cheiro de ozônio e cinzas antigas',
        lighting: 'Penumbra azulada filtrada por musgos fosforescentes',
        dangerLevel: 3,
        pointsOfInterest: [
          'Ponte Pênsil Destroçada com inscrições em glifos pré-colapso',
          'Altar de Pedra Negra manchado por cera derretida e oferendas recentes',
          'Fenda nas paredes rochosas de onde emana um calor sobrenatural',
        ],
        currentNPCs: [
          {
            name: 'Sariel das Sombras',
            role: 'Batedora Renegada',
            attitude: 'mysterious',
            description: 'Envolta em mantos de couro de serpente das cinzas, observando do topo de uma pilastra.',
          },
        ],
        environmentalHazards: ['Bruma alucinógena suave nas áreas baixas', 'Chão escorregadio de xisto'],
        weatherOrClimate: 'Vento gelado sibilante entre as rochas pontiagudas',
      },
      suggestedActions: [
        {
          id: 'act_1',
          title: 'Examinar o Altar de Pedra Negra',
          description: 'Aproximar-se furtivamente para inspecionar a cera fresca e identificar a natureza das oferendas.',
          attributeCheck: 'intellect',
          riskLevel: 'médio',
        },
        {
          id: 'act_2',
          title: 'Estabelecer Contato com a Batedora',
          description: 'Sinalizar com a lâmina embainhada para demonstrar neutralidade e interrogá-la sobre o caminho à frente.',
          attributeCheck: 'presence',
          riskLevel: 'baixo',
        },
        {
          id: 'act_3',
          title: 'Descer pela Fenda Quente',
          description: 'Usar corda e ganchos para explorar a caverna termal que emana calor nas profundezas.',
          attributeCheck: 'agility',
          riskLevel: 'alto',
        },
      ],
      history: [
        {
          id: 'hist_init',
          turnNumber: 0,
          playerAction: 'Início da Jornada',
          gmNarrative: 'Você desperta na Garganta dos Lamentos. A bússola de ferro-negro vibra contra sua armadura, guiando seus passos até o sopé de pilares erguidos antes da era dos homens. O ar é espesso e o eco distante de sinos arcanos avisa que esta terra desconhece o repouso. Uma jornada sem fronteiras se inicia diante de você.',
          scenarioName: 'Garganta dos Lamentos',
          timestamp: new Date().toISOString(),
        },
      ],
      unresolvedRumors: [
        'A Ordem de Obsidiana enviou inquisidores para recuperar a Bússola de Ferro-Negro.',
        'Dizem que no fundo da Garganta reside a Fonte Estelar, um rio de mercúrio místico que altera o destino de quem beber de suas águas.',
      ],
      activeFactionsOrThreats: [
        'Inquisição dos Pilares de Obsidiana',
        'Habitantes das Fendas Cinzentas',
      ],
    };

    campaigns.set(starter.id, starter);
    return starter;
  }

  // Create a brand new campaign
  static async createCampaign(req: CreateCampaignRequest): Promise<Campaign> {
    const id = generateId('camp');
    const lang = req.language || 'pt-BR';
    const theme = req.theme || 'dark_fantasy';
    const tone = req.tone || 'gritty';

    const attrs = {
      strength: req.character?.attributes?.strength ?? 12,
      agility: req.character?.attributes?.agility ?? 12,
      intellect: req.character?.attributes?.intellect ?? 12,
      presence: req.character?.attributes?.presence ?? 12,
      vitality: req.character?.attributes?.vitality ?? 12,
    };

    const prompt = `
Crie o prólogo imersivo, cenário inicial e ganchos de uma campanha de RPG com as seguintes configurações:
- Idioma: ${lang}
- Tema: ${theme}
- Premissa Customizada: ${req.customThemePrompt || req.initialPremise || 'Mundo vasto e repleto de segredos antigos e facções conflitantes'}
- Tom narrativo: ${tone}
- Personagem do Jogador:
  - Nome: ${req.character?.name || 'Aventureiro'}
  - Classe: ${req.character?.class || 'Andarilho'}
  - Histórico: ${req.character?.background || 'Um viajante em busca de respostas'}
  - Atributos: Força ${attrs.strength}, Agilidade ${attrs.agility}, Intelecto ${attrs.intellect}, Presença ${attrs.presence}, Vitalidade ${attrs.vitality}
  - Item inicial: ${req.character?.startingItem || 'Um amuleto estranho que pulsa suavemente'}

IMPORTANTE: A história NÃO TEM FINAL DETERMINADO. Crie um cenário inicial vivo e intrigante, com 2 a 3 rumores que abrem infinitas possibilidades de exploração.

Responda EXCLUSIVAMENTE em formato JSON com esta estrutura:
{
  "title": "Título épico para a campanha",
  "openingNarrative": "Texto do Mestre situando o jogador no mundo, descrevendo o momento atual em 2-3 parágrafos envolventes",
  "scenario": {
    "name": "Nome do local",
    "region": "Nome da região/província/setor",
    "description": "Descrição detalhada dos arredores e atmosfera",
    "atmosphere": "Vibe sensorial (ex: névoa densa, cheiro de ferro e chuva ácida)",
    "lighting": "Tipo de iluminação",
    "dangerLevel": 2, // número de 1 a 5
    "pointsOfInterest": ["Ponto 1", "Ponto 2", "Ponto 3"],
    "currentNPCs": [
      {
        "name": "Nome do NPC",
        "role": "Função ou ofício",
        "attitude": "mysterious", // friendly | neutral | hostile | mysterious
        "description": "Breve descrição visual e comportamento"
      }
    ],
    "environmentalHazards": ["Perigo 1"],
    "weatherOrClimate": "Clima atual"
  },
  "suggestedActions": [
    {
      "id": "act_1",
      "title": "Ação Curta 1",
      "description": "O que o jogador tentará fazer",
      "attributeCheck": "intellect", // strength | agility | intellect | presence | vitality | none
      "riskLevel": "baixo" // baixo | médio | alto
    },
    {
      "id": "act_2",
      "title": "Ação Curta 2",
      "description": "O que o jogador tentará fazer",
      "attributeCheck": "agility",
      "riskLevel": "médio"
    },
    {
      "id": "act_3",
      "title": "Ação Curta 3",
      "description": "O que o jogador tentará fazer",
      "attributeCheck": "strength",
      "riskLevel": "alto"
    }
  ],
  "startingInventory": [
    {
      "id": "item_1",
      "name": "Nome do item",
      "type": "weapon", // weapon | armor | consumable | relic | misc
      "description": "Propriedade ou lore do item"
    }
  ],
  "unresolvedRumors": ["Rumor misterioso 1", "Rumor misterioso 2"],
  "activeFactionsOrThreats": ["Facção ou Ameaça 1", "Facção ou Ameaça 2"]
}
`;

    try {
      const response = await ai.models.generateContent({
        model: RPG_MODEL,
        contents: prompt,
        config: {
          systemInstruction: RPG_MASTER_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');

      const character: CharacterState = {
        name: req.character?.name || 'Aventureiro',
        class: req.character?.class || 'Andarilho',
        background: req.character?.background || 'Explorador',
        level: 1,
        xp: 0,
        hp: 20 + attrs.vitality,
        maxHp: 20 + attrs.vitality,
        manaOrEnergy: 15 + attrs.intellect,
        maxManaOrEnergy: 15 + attrs.intellect,
        attributes: attrs,
        inventory: parsed.startingInventory && Array.isArray(parsed.startingInventory) && parsed.startingInventory.length > 0
          ? parsed.startingInventory.map((it: Partial<InventoryItem>, i: number) => ({
              id: it.id || `item_${i + 1}`,
              name: it.name || 'Item de Sobrevivência',
              type: it.type || 'misc',
              description: it.description || 'Um pertence útil para viajantes.',
            }))
          : [
              {
                id: 'item_1',
                name: req.character?.startingItem || 'Lâmina de Aventureiro',
                type: 'weapon',
                description: 'Uma arma de boa forja com marcas de uso.',
              },
            ],
        statusEffects: [],
      };

      const scenario: Scenario = {
        id: generateId('scen'),
        name: parsed.scenario?.name || 'Clareira Esquecida',
        region: parsed.scenario?.region || 'Terras Selvagens',
        description: parsed.scenario?.description || 'Um ambiente repleto de relíquias do passado e silêncio sepulcral.',
        atmosphere: parsed.scenario?.atmosphere || 'Ar pesado e eletricidade latente no ar.',
        lighting: parsed.scenario?.lighting || 'Luz difusa do crepúsculo.',
        dangerLevel: Number(parsed.scenario?.dangerLevel) || 2,
        pointsOfInterest: Array.isArray(parsed.scenario?.pointsOfInterest) ? parsed.scenario.pointsOfInterest : ['Entrada de um túmulo ancestral', 'Fogueira apagada recentemente'],
        currentNPCs: Array.isArray(parsed.scenario?.currentNPCs) ? parsed.scenario.currentNPCs : [],
        environmentalHazards: Array.isArray(parsed.scenario?.environmentalHazards) ? parsed.scenario.environmentalHazards : [],
        weatherOrClimate: parsed.scenario?.weatherOrClimate || 'Brisa gélida e névoa rasteira',
      };

      const campaign: Campaign = {
        id,
        title: req.title || parsed.title || 'A Saga Interminável',
        narrationMode: 'ai',
        theme,
        customThemePrompt: req.customThemePrompt,
        tone,
        language: lang,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        turnCount: 0,
        character,
        currentScenario: scenario,
        suggestedActions: Array.isArray(parsed.suggestedActions) && parsed.suggestedActions.length > 0
          ? parsed.suggestedActions
          : [
              { id: 'act_1', title: 'Explorar os arredores', description: 'Investigar pegadas e marcas nas rochas.', attributeCheck: 'intellect', riskLevel: 'baixo' },
              { id: 'act_2', title: 'Avançar com cautela', description: 'Empunhar sua arma e seguir a trilha principal.', attributeCheck: 'agility', riskLevel: 'médio' },
              { id: 'act_3', title: 'Meditar e canalizar percepção', description: 'Sentir correntes arcanas ou energias na área.', attributeCheck: 'presence', riskLevel: 'baixo' },
            ],
        history: [
          {
            id: generateId('hist'),
            turnNumber: 0,
            playerAction: 'Criação da Campanha',
            gmNarrative: parsed.openingNarrative || 'Seus passos ecoam em um mundo repleto de mistérios sem fim. Diante de você ergue-se o primeiro vislumbre de um destino que jamais cessará de se transformar.',
            scenarioName: scenario.name,
            timestamp: new Date().toISOString(),
          },
        ],
        unresolvedRumors: Array.isArray(parsed.unresolvedRumors) ? parsed.unresolvedRumors : ['Uma presença antiga observa qualquer um que atravesse este limiar.'],
        activeFactionsOrThreats: Array.isArray(parsed.activeFactionsOrThreats) ? parsed.activeFactionsOrThreats : ['Sentinelas Errantes'],
      };

      campaigns.set(id, campaign);
      return campaign;
    } catch (err) {
      console.error('[RPGEngine] Error creating campaign via Gemini:', err);
      // Fallback robust campaign generation so API never crashes
      return this.createFallbackCampaign(id, req);
    }
  }

  // Fallback campaign generator
  private static createFallbackCampaign(id: string, req: CreateCampaignRequest): Campaign {
    const fallbackCamp: Campaign = {
      id,
      title: req.title || 'Crônicas do Andarilho Imortal',
      narrationMode: 'offline',
      theme: req.theme || 'dark_fantasy',
      customThemePrompt: req.customThemePrompt,
      tone: req.tone || 'gritty',
      language: req.language || 'pt-BR',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      turnCount: 0,
      character: {
        name: req.character?.name || 'Andarilho',
        class: req.character?.class || 'Guerreiro Errante',
        background: req.character?.background || 'Sobrevivente de guerras esquecidas',
        level: 1,
        xp: 0,
        hp: 30,
        maxHp: 30,
        manaOrEnergy: 20,
        maxManaOrEnergy: 20,
        attributes: {
          strength: req.character?.attributes?.strength ?? 13,
          agility: req.character?.attributes?.agility ?? 12,
          intellect: req.character?.attributes?.intellect ?? 11,
          presence: req.character?.attributes?.presence ?? 12,
          vitality: req.character?.attributes?.vitality ?? 14,
        },
        inventory: [
          {
            id: 'item_fb_1',
            name: req.character?.startingItem || 'Espada Longa de Ferro Cinzento',
            type: 'weapon',
            description: 'Forjada para suportar os terrores das terras sem lei.',
          },
          {
            id: 'item_fb_2',
            name: 'Pão de Viagem e Cantil Élfico',
            type: 'consumable',
            description: 'Recupera energias vitais nas noites frias.',
            quantity: 3,
          },
        ],
        statusEffects: [],
      },
      currentScenario: {
        id: generateId('scen'),
        name: 'Encruzilhada das Quatro Sombras',
        region: 'Planície dos Sussurros',
        description: 'Um marco antigo de granito ergue-se onde quatro estradas de terra batida se encontram. Árvores retorcidas cobrem os arredores com folhas carmesins que nunca caem completamente.',
        atmosphere: 'Silêncio denso pontuado pelo som de folhas secas ao vento.',
        lighting: 'Crepúsculo perpétuo com nuvens cinzentas e arroxeadas.',
        dangerLevel: 2,
        pointsOfInterest: [
          'Marco de Pedra com entalhes de uma deusa com os olhos vendados',
          'Carroça mercante abandonada tombada na beira da estrada',
          'Trilha oculta coberta por espinheiros luminosos',
        ],
        currentNPCs: [
          {
            name: 'Velho Corvo',
            role: 'Mendigo Vidente',
            attitude: 'mysterious',
            description: 'Um senhor idoso apoiado num bordão de carvalho entalhado, murmura charadas para o vento.',
          },
        ],
        environmentalHazards: ['Espinhos venenosos na vegetação rasteira'],
        weatherOrClimate: 'Vento cortante de outono e neblina baixa',
      },
      suggestedActions: [
        {
          id: 'act_1',
          title: 'Examinar a carroça abandonada',
          description: 'Vasculhar caixotes tombados procurando mantimentos ou pistas do que afugentou os condutores.',
          attributeCheck: 'agility',
          riskLevel: 'médio',
        },
        {
          id: 'act_2',
          title: 'Falar com o Velho Corvo',
          description: 'Aproximar-se respeitosamente e perguntar sobre os perigos da estrada norte.',
          attributeCheck: 'presence',
          riskLevel: 'baixo',
        },
        {
          id: 'act_3',
          title: 'Decifrar os entalhes do Marco',
          description: 'Estudar os glifos antigos no monólito para obter bênçãos de navegação.',
          attributeCheck: 'intellect',
          riskLevel: 'baixo',
        },
      ],
      history: [
        {
          id: generateId('hist'),
          turnNumber: 0,
          playerAction: 'Chegada à Encruzilhada',
          gmNarrative: 'Você para na Encruzilhada das Quatro Sombras. A estrada se abre em infinitas direções, cada uma guardando perigos e recompensas que nenhum mapa jamais registrou. Sua jornada está apenas começando.',
          scenarioName: 'Encruzilhada das Quatro Sombras',
          timestamp: new Date().toISOString(),
        },
      ],
      unresolvedRumors: [
        'A Besta das Quatro Sombras ronda as estradas sempre que a lua tinge-se de escarlate.',
      ],
      activeFactionsOrThreats: ['Bandidos da Rosa Negra'],
    };

    campaigns.set(id, fallbackCamp);
    return fallbackCamp;
  }

  // Process a player turn
  static async processTurn(req: TurnRequest): Promise<{
    campaign: Campaign;
    turnResult: {
      narrative: string;
      scenario: Scenario;
      suggestedActions: SuggestedAction[];
      characterDeltas: {
        hpDelta: number;
        manaDelta: number;
        xpGained: number;
        itemsGained: InventoryItem[];
        itemsLost: string[];
        newStatusEffects: string[];
        removedStatusEffects: string[];
      };
      diceEvaluation?: {
        roll: number;
        attribute: string;
        successLevel: string;
        gmComment: string;
      };
      newRumors: string[];
    };
  }> {
    const campaign = campaigns.get(req.campaignId);
    if (!campaign) {
      throw new Error(`Campanha com ID '${req.campaignId}' não foi encontrada.`);
    }

    const turnNumber = campaign.turnCount + 1;
    const playerAction = req.action?.trim() || 'Observar os arredores com cautela';

    // Calculate dice roll if provided or needed
    let diceResult: any = null;
    if (req.customDiceRoll && req.customDiceRoll.roll) {
      const roll = req.customDiceRoll.roll;
      const attrKey = req.customDiceRoll.attribute || 'agility';
      const attrVal = campaign.character.attributes[attrKey] ?? 10;
      const mod = Math.floor((attrVal - 10) / 2);
      const total = roll + mod;

      let successLevel: 'crítico' | 'sucesso' | 'falha' | 'desastre' = 'sucesso';
      if (roll === 20) successLevel = 'crítico';
      else if (roll === 1) successLevel = 'desastre';
      else if (total >= 14) successLevel = 'sucesso';
      else successLevel = 'falha';

      diceResult = {
        d20: roll,
        modifier: mod,
        total,
        attribute: attrKey,
        successLevel,
      };
    }

    // Recent history snippet for context (last 3 turns)
    const recentHistory = campaign.history.slice(-3).map(h => 
      `[Turno ${h.turnNumber}] Jogador: "${h.playerAction}" -> Resultado do Mestre: ${h.gmNarrative.substring(0, 200)}...`
    ).join('\n');

    const prompt = `
Você é o Mestre de RPG da campanha "${campaign.title}" (${campaign.theme}, tom: ${campaign.tone}, idioma: ${campaign.language}).
${campaign.customThemePrompt ? `PREMISSA E REGRAS DO MODO DE CAMPANHA:\n${campaign.customThemePrompt}` : ''}

SITUAÇÃO ATUAL DO MUNDO:
- Cenário atual: "${campaign.currentScenario.name}" (${campaign.currentScenario.region})
- Descrição do local: ${campaign.currentScenario.description}
- Pontos de interesse: ${campaign.currentScenario.pointsOfInterest.join(', ')}
- NPCs no local: ${campaign.currentScenario.currentNPCs.map(n => `${n.name} (${n.role})`).join('; ')}
- Perigos ambientais: ${(campaign.currentScenario.environmentalHazards || []).join(', ')}

ESTADO DO JOGADOR:
- Nome: ${campaign.character.name} | Classe: ${campaign.character.class} | Nível: ${campaign.character.level}
- HP: ${campaign.character.hp}/${campaign.character.maxHp} | Mana/Vigor: ${campaign.character.manaOrEnergy}/${campaign.character.maxManaOrEnergy}
- Atributos: Força ${campaign.character.attributes.strength}, Agilidade ${campaign.character.attributes.agility}, Intelecto ${campaign.character.attributes.intellect}, Presença ${campaign.character.attributes.presence}, Vitalidade ${campaign.character.attributes.vitality}
- Itens em mãos: ${campaign.character.inventory.map(i => i.name).join(', ')}
- Efeitos ativos: ${campaign.character.statusEffects.join(', ') || 'Nenhum'}

HISTÓRICO RECENTE:
${recentHistory}

AÇÃO DO JOGADOR NESTE TURNO:
"${playerAction}"
${diceResult ? `DADO ROLADO (D20): Resultado=${diceResult.d20}, Modificador=+${diceResult.modifier}, Total=${diceResult.total}, Grau=${diceResult.successLevel.toUpperCase()}` : 'Sem rolagem prévia de dado pelo jogador.'}

REGRA DE OURO IMPERATIVA:
- A HISTÓRIA NÃO TEM UM FINAL DETERMINADO.
- NUNCA encerre o jogo, mesmo se derrotar uma criatura imensa ou se o jogador for derrotado. Sempre abra novas ramificações, mistérios, passagens ou consequências.
- O cenário PODE mudar dinamicamente (se o jogador avançou, fugiu, entrou numa caverna, abriu um portal ou se o ambiente colapsou/se transformou). Se ele continuou no mesmo local, atualize os acontecimentos e o estado do local.
- Conceda pequenos ganhos de XP (15 a 50 xp por ação significativa).
- Se houver dano, reduza HP (-2 a -10) ou recupere se usou poção/descanso.
- Proponha sempre 3 a 4 novas ações estratégicas e variadas.

RESPONDA EXCLUSIVAMENTE EM JSON VÁLIDO COM A SEGUINTE ESTRUTURA:
{
  "narrative": "Narrativa rica, poética e descritiva do Mestre reagindo à ação do jogador (2 a 4 parágrafos imersivos)",
  "scenarioChanged": false, // true se o jogador mudou de área/sala/cenário, ou false se permaneceu no mesmo local atualizado
  "updatedScenario": {
    "name": "Nome do cenário",
    "region": "Região",
    "description": "Descrição detalhada do estado atual do ambiente",
    "atmosphere": "Sensação e sons presentes",
    "lighting": "Iluminação",
    "dangerLevel": 3,
    "pointsOfInterest": ["Ponto A", "Ponto B", "Ponto C"],
    "currentNPCs": [
      {
        "name": "Nome do NPC",
        "role": "Papel",
        "attitude": "friendly", // friendly | neutral | hostile | mysterious
        "description": "Comportamento atual"
      }
    ],
    "environmentalHazards": ["Perigo"],
    "weatherOrClimate": "Clima"
  },
  "characterUpdates": {
    "hpDelta": 0, // ex: -5 para dano sofrido, +8 para cura
    "manaDelta": 0, // ex: -3 para uso de magia/energia, +5 para recarga
    "xpGained": 25,
    "itemsGained": [
      // opcional: { "name": "Item achado", "type": "consumable", "description": "efeito..." }
    ],
    "itemsLost": [], // nomes de itens consumidos ou perdidos se houver
    "newStatusEffects": [], // ex: ["Envenenado", "Inspirado"]
    "removedStatusEffects": []
  },
  "suggestedActions": [
    {
      "id": "act_next_1",
      "title": "Ação 1",
      "description": "Descrição da ação",
      "attributeCheck": "strength", // strength | agility | intellect | presence | vitality | none
      "riskLevel": "baixo" // baixo | médio | alto
    },
    {
      "id": "act_next_2",
      "title": "Ação 2",
      "description": "Descrição da ação",
      "attributeCheck": "intellect",
      "riskLevel": "médio"
    },
    {
      "id": "act_next_3",
      "title": "Ação 3",
      "description": "Descrição da ação",
      "attributeCheck": "agility",
      "riskLevel": "alto"
    }
  ],
  "diceEvaluation": {
    "gmComment": "Comentário sobre como a rolagem influenciou o desfecho"
  },
  "newRumorsOrThreats": ["Novo mistério ou fação revelada que mantém o mundo infinito"]
}
`;

    try {
      const response = await ai.models.generateContent({
        model: RPG_MODEL,
        contents: prompt,
        config: {
          systemInstruction: RPG_MASTER_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');

      // Mutate campaign state
      const charUpdates = parsed.characterUpdates || {};
      const hpDelta = Number(charUpdates.hpDelta) || 0;
      const manaDelta = Number(charUpdates.manaDelta) || 0;
      const xpGained = Number(charUpdates.xpGained) || 15;

      // Apply HP change safely (if HP drops to 0, give narrative survival rescue)
      campaign.character.hp = Math.max(1, Math.min(campaign.character.maxHp, campaign.character.hp + hpDelta));
      campaign.character.manaOrEnergy = Math.max(0, Math.min(campaign.character.maxManaOrEnergy, campaign.character.manaOrEnergy + manaDelta));
      campaign.character.xp += xpGained;

      // Level up check (every 100 xp per level)
      const nextLevelXp = campaign.character.level * 100;
      if (campaign.character.xp >= nextLevelXp) {
        campaign.character.level += 1;
        campaign.character.maxHp += 5;
        campaign.character.hp = campaign.character.maxHp;
        campaign.character.maxManaOrEnergy += 3;
        campaign.character.manaOrEnergy = campaign.character.maxManaOrEnergy;
      }

      // Items gained
      const itemsGainedList: InventoryItem[] = [];
      if (Array.isArray(charUpdates.itemsGained)) {
        for (const it of charUpdates.itemsGained) {
          if (it && it.name) {
            const newItem: InventoryItem = {
              id: generateId('item'),
              name: it.name,
              type: it.type || 'misc',
              description: it.description || 'Um item recolhido durante sua jornada.',
              quantity: it.quantity || 1,
            };
            campaign.character.inventory.push(newItem);
            itemsGainedList.push(newItem);
          }
        }
      }

      // Items lost
      if (Array.isArray(charUpdates.itemsLost)) {
        for (const lostName of charUpdates.itemsLost) {
          const idx = campaign.character.inventory.findIndex(i => i.name.toLowerCase() === lostName.toLowerCase());
          if (idx !== -1) {
            campaign.character.inventory.splice(idx, 1);
          }
        }
      }

      // Status effects
      if (Array.isArray(charUpdates.newStatusEffects)) {
        for (const effect of charUpdates.newStatusEffects) {
          if (!campaign.character.statusEffects.includes(effect)) {
            campaign.character.statusEffects.push(effect);
          }
        }
      }
      if (Array.isArray(charUpdates.removedStatusEffects)) {
        campaign.character.statusEffects = campaign.character.statusEffects.filter(
          eff => !charUpdates.removedStatusEffects.includes(eff)
        );
      }

      // Update Scenario
      if (parsed.updatedScenario) {
        const u = parsed.updatedScenario;
        campaign.currentScenario = {
          id: parsed.scenarioChanged ? generateId('scen') : campaign.currentScenario.id,
          name: u.name || campaign.currentScenario.name,
          region: u.region || campaign.currentScenario.region,
          description: u.description || campaign.currentScenario.description,
          atmosphere: u.atmosphere || campaign.currentScenario.atmosphere,
          lighting: u.lighting || campaign.currentScenario.lighting,
          dangerLevel: Number(u.dangerLevel) || campaign.currentScenario.dangerLevel,
          pointsOfInterest: Array.isArray(u.pointsOfInterest) && u.pointsOfInterest.length > 0
            ? u.pointsOfInterest
            : campaign.currentScenario.pointsOfInterest,
          currentNPCs: Array.isArray(u.currentNPCs) ? u.currentNPCs : campaign.currentScenario.currentNPCs,
          environmentalHazards: Array.isArray(u.environmentalHazards) ? u.environmentalHazards : campaign.currentScenario.environmentalHazards,
          weatherOrClimate: u.weatherOrClimate || campaign.currentScenario.weatherOrClimate,
        };
      }

      // Update Suggested Actions
      if (Array.isArray(parsed.suggestedActions) && parsed.suggestedActions.length > 0) {
        campaign.suggestedActions = parsed.suggestedActions;
      }

      // Add Rumors (to guarantee infinite adventures)
      if (Array.isArray(parsed.newRumorsOrThreats)) {
        for (const r of parsed.newRumorsOrThreats) {
          if (!campaign.unresolvedRumors.includes(r)) {
            campaign.unresolvedRumors.push(r);
          }
        }
      }

      // Record Turn in History
      const narrativeText = parsed.narrative || 'Suas ações desencadeiam ondas de eventos pelo cenário, alterando o equilíbrio do local.';
      const historyEntry: TurnHistoryEntry = {
        id: generateId('turn'),
        turnNumber,
        playerAction,
        diceRollResult: diceResult,
        gmNarrative: narrativeText,
        scenarioName: campaign.currentScenario.name,
        timestamp: new Date().toISOString(),
        consequencesSummary: hpDelta !== 0 || itemsGainedList.length > 0 ? `HP: ${hpDelta > 0 ? `+${hpDelta}` : hpDelta} | XP: +${xpGained}` : undefined,
      };

      campaign.narrationMode = 'ai';
      campaign.history.push(historyEntry);
      campaign.turnCount = turnNumber;
      campaign.updatedAt = new Date().toISOString();

      return {
        campaign,
        turnResult: {
          narrative: narrativeText,
          scenario: campaign.currentScenario,
          suggestedActions: campaign.suggestedActions,
          characterDeltas: {
            hpDelta,
            manaDelta,
            xpGained,
            itemsGained: itemsGainedList,
            itemsLost: charUpdates.itemsLost || [],
            newStatusEffects: charUpdates.newStatusEffects || [],
            removedStatusEffects: charUpdates.removedStatusEffects || [],
          },
          diceEvaluation: diceResult ? {
            roll: diceResult.d20,
            attribute: diceResult.attribute,
            successLevel: diceResult.successLevel,
            gmComment: parsed.diceEvaluation?.gmComment || `Teste resolvido com ${diceResult.successLevel.toUpperCase()}.`,
          } : undefined,
          newRumors: parsed.newRumorsOrThreats || [],
        },
      };
    } catch (err) {
      console.error('[RPGEngine] Error processing turn via Gemini:', err);
      return this.processFallbackTurn(campaign, req, diceResult);
    }
  }

  // Fallback turn processor in case of network/quota interruption
  private static processFallbackTurn(campaign: Campaign, req: TurnRequest, diceResult: any) {
    const turnNumber = campaign.turnCount + 1;
    const playerAction = req.action || 'Avançar com cautela';
    const className = campaign.character.class.toLocaleLowerCase('pt-BR');
    const normalizedAction = playerAction.toLocaleLowerCase('pt-BR');
    let classFocus = '';
    let hpDelta = 0;
    let xpGained = 20;

    if (className.includes('necromante') && /atac|combate|defend|proteg|luta/.test(normalizedAction)) {
      classFocus = 'Seus esqueletos avançam à frente, prendendo a ameaça por tempo suficiente para abrir uma brecha.';
      xpGained += 5;
    } else if (className.includes('rei demônio') && /intimid|comand|negoci|ameaç|convoc/.test(normalizedAction)) {
      classFocus = 'Sua autoridade infernal pesa sobre a cena; as criaturas menores hesitam diante de você.';
      xpGained += 5;
    } else if (className.includes('herói lendário') && /prote|ajud|aliad|companheir/.test(normalizedAction)) {
      classFocus = 'Sua coragem inspira quem luta ao seu lado, e a pessoa que você protege encontra forças para continuar.';
      xpGained += 5;
    } else if (className.includes('santa') && /cur|trat|rez|oraç|abenço|proteger/.test(normalizedAction)) {
      hpDelta = 6;
      classFocus = 'Uma luz serena envolve você e seus aliados; sua bênção restaura 6 pontos de vida.';
    } else if (className.includes('rei dragão') && /atac|combate|fogo|dragão|intimid/.test(normalizedAction)) {
      classFocus = 'Um sopro dracônico rompe o ar e força seus adversários a recuar, revelando uma nova abertura.';
      xpGained += 5;
    } else if (className.includes('guerreiro') && /atac|golpe|combate|luta|defend/.test(normalizedAction)) {
      classFocus = 'Seu treino marcial transforma o movimento em uma manobra precisa e abre a guarda do oponente.';
      xpGained += 3;
    } else if (className.includes('maga') && /magia|feiti|arcano|runa|conjur/.test(normalizedAction)) {
      classFocus = 'As linhas arcanas respondem ao seu gesto e tornam o efeito mais claro e controlável.';
      xpGained += 3;
    } else if (className.includes('ladino') && /furtiv|esgueir|escond|invad|tranca|armadilha/.test(normalizedAction)) {
      classFocus = 'Você encontra uma passagem discreta e evita deixar sinais fáceis de seguir.';
      xpGained += 3;
    } else if (className.includes('bardo') && /convers|negoci|persuad|inspir|discurso|canç/.test(normalizedAction)) {
      classFocus = 'Sua presença muda o tom da conversa e conquista a atenção de quem estava hesitante.';
      xpGained += 3;
    } else if (className.includes('patrulheiro') && /rastro|explor|trilha|rast|observ|investig/.test(normalizedAction)) {
      classFocus = 'Seu olhar treinado identifica rastros e perigos que passariam despercebidos.';
      xpGained += 3;
    } else if (className.includes('sacerdote') && /cur|trat|rez|oraç|abenço|maldiç/.test(normalizedAction)) {
      hpDelta = 4;
      classFocus = 'Sua prece dissipa parte do mal-estar e restaura 4 pontos de vida.';
    }

    const previousHp = campaign.character.hp;
    campaign.character.hp = Math.min(campaign.character.maxHp, campaign.character.hp + hpDelta);
    hpDelta = campaign.character.hp - previousHp;
    const narrative = `O vento uiva através das frestas do ambiente enquanto sua ação ("${playerAction}") repercute pelo ar. Seus instintos como ${campaign.character.class} mantêm seus pés firmes. ${classFocus ? `${classFocus} ` : ''}Novas sombras se alongam nas paredes rochosas, e um brilho tênue parece indicar que há caminhos mais profundos ainda não descobertos. A aventura não cessa; o horizonte convida a um novo passo.`;

    const historyEntry: TurnHistoryEntry = {
      id: generateId('turn'),
      turnNumber,
      playerAction,
      diceRollResult: diceResult,
      gmNarrative: narrative,
      scenarioName: campaign.currentScenario.name,
      timestamp: new Date().toISOString(),
      consequencesSummary: `${hpDelta ? `HP: +${hpDelta} | ` : ''}XP: +${xpGained}`,
    };

    campaign.narrationMode = 'offline';
    campaign.character.xp += xpGained;
    campaign.history.push(historyEntry);
    campaign.turnCount = turnNumber;
    campaign.updatedAt = new Date().toISOString();

    return {
      campaign,
      turnResult: {
        narrative,
        scenario: campaign.currentScenario,
        suggestedActions: [
          {
            id: 'act_fb_1',
            title: 'Examinar detalhes ocultos',
            description: 'Inspecionar as superfícies em busca de inscrições secretas.',
            attributeCheck: 'intellect',
            riskLevel: 'baixo',
          },
          {
            id: 'act_fb_2',
            title: 'Avançar para nova área',
            description: 'Seguir a corrente de ar até uma câmara contígua.',
            attributeCheck: 'agility',
            riskLevel: 'médio',
          },
          {
            id: 'act_fb_3',
            title: 'Preparar postura de guarda',
            description: 'Aguardar qualquer movimentação estranha e recobrar o fôlego.',
            attributeCheck: 'vitality',
            riskLevel: 'baixo',
          },
        ] as SuggestedAction[],
        characterDeltas: {
          hpDelta,
          manaDelta: 0,
          xpGained,
          itemsGained: [],
          itemsLost: [],
          newStatusEffects: [],
          removedStatusEffects: [],
        },
        diceEvaluation: diceResult ? {
          roll: diceResult.d20,
          attribute: diceResult.attribute,
          successLevel: diceResult.successLevel,
          gmComment: 'Ação executada com determinação pelo jogador.',
        } : undefined,
        newRumors: ['Sussurros antigos afirmam que os limites deste reino continuam a se expandir.'],
      },
    };
  }

  // Explicitly generate a brand new scenario / realm
  static async generateNewScenario(req: GenerateScenarioRequest): Promise<{
    scenario: Scenario;
    travelNarrative: string;
    campaign: Campaign;
  }> {
    const campaign = campaigns.get(req.campaignId);
    if (!campaign) {
      throw new Error(`Campanha com ID '${req.campaignId}' não foi encontrada.`);
    }

    const prompt = `
O jogador na campanha de RPG "${campaign.title}" (${campaign.theme}) decidiu viajar para um NOVO CENÁRIO.
- Local anterior: "${campaign.currentScenario.name}" (${campaign.currentScenario.region})
- Intenção/Direção da viagem: ${req.travelDirection || req.intent || 'Adentrar territórios desconhecidos além dos mapas conhecidos'}
- Tipo de exploração: ${req.explorationType || 'travel'}

Crie um cenário totalmente NOVO, exótico e vibrante.
Lembre-se: O mundo é infinito e cada novo cenário deve despertar curiosidade e mistérios adicionais.

RESPONDA EXCLUSIVAMENTE EM JSON VÁLIDO:
{
  "travelNarrative": "Texto narrando a travessia, transição sensorial e chegada ao novo local (2 parágrafos)",
  "scenario": {
    "name": "Nome impactante do novo local",
    "region": "Nova região geográfica ou planar",
    "description": "Descrição panorâmica rica e detalhada",
    "atmosphere": "Atmosfera sensorial (vento, odores, reverberação)",
    "lighting": "Como a luz se comporta aqui",
    "dangerLevel": 3, // 1 a 5
    "pointsOfInterest": ["Ponto 1", "Ponto 2", "Ponto 3"],
    "currentNPCs": [
      {
        "name": "Nome de habitante ou guardião local",
        "role": "Papel social ou místico",
        "attitude": "mysterious",
        "description": "Aparência e comportamento inicial"
      }
    ],
    "environmentalHazards": ["Perigo ambiental"],
    "weatherOrClimate": "Clima característico"
  },
  "suggestedActions": [
    {
      "id": "act_new_1",
      "title": "Ação 1 no novo cenário",
      "description": "Explicação da ação",
      "attributeCheck": "intellect",
      "riskLevel": "baixo"
    },
    {
      "id": "act_new_2",
      "title": "Ação 2 no novo cenário",
      "description": "Explicação da ação",
      "attributeCheck": "agility",
      "riskLevel": "médio"
    },
    {
      "id": "act_new_3",
      "title": "Ação 3 no novo cenário",
      "description": "Explicação da ação",
      "attributeCheck": "strength",
      "riskLevel": "alto"
    }
  ],
  "unresolvedRumor": "Um segredo ou rumor antigo deste novo local"
}
`;

    try {
      const response = await ai.models.generateContent({
        model: RPG_MODEL,
        contents: prompt,
        config: {
          systemInstruction: RPG_MASTER_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      const newScenario: Scenario = {
        id: generateId('scen'),
        name: parsed.scenario?.name || 'Vastidão Sem Nome',
        region: parsed.scenario?.region || 'Fronteiras Além do Mapa',
        description: parsed.scenario?.description || 'Um horizonte infinito se abre diante de você, revelando arquiteturas que desafiam as leis conhecidas.',
        atmosphere: parsed.scenario?.atmosphere || 'Ar rarefeito e vibrações magnéticas.',
        lighting: parsed.scenario?.lighting || 'Brilho crepuscular iridescente.',
        dangerLevel: Number(parsed.scenario?.dangerLevel) || 3,
        pointsOfInterest: Array.isArray(parsed.scenario?.pointsOfInterest) ? parsed.scenario.pointsOfInterest : ['Monumento ao Infinito', 'Fosso de Névoa'],
        currentNPCs: Array.isArray(parsed.scenario?.currentNPCs) ? parsed.scenario.currentNPCs : [],
        environmentalHazards: Array.isArray(parsed.scenario?.environmentalHazards) ? parsed.scenario.environmentalHazards : [],
        weatherOrClimate: parsed.scenario?.weatherOrClimate || 'Vento sibilante e céu estrelado em pleno dia',
      };

      campaign.currentScenario = newScenario;
      if (Array.isArray(parsed.suggestedActions) && parsed.suggestedActions.length > 0) {
        campaign.suggestedActions = parsed.suggestedActions;
      }
      if (parsed.unresolvedRumor && !campaign.unresolvedRumors.includes(parsed.unresolvedRumor)) {
        campaign.unresolvedRumors.push(parsed.unresolvedRumor);
      }

      const travelNarrative = parsed.travelNarrative || `Você deixa para trás os velhos marcos e alcança ${newScenario.name}. Diante dos seus olhos, novos desafios e segredos inexplorados se descortinam.`;

      // Log in campaign history
      campaign.turnCount += 1;
      campaign.history.push({
        id: generateId('turn'),
        turnNumber: campaign.turnCount,
        playerAction: `Viagem / Exploração: "${req.travelDirection || req.intent || 'Rumo ao Desconhecido'}"`,
        gmNarrative: travelNarrative,
        scenarioName: newScenario.name,
        timestamp: new Date().toISOString(),
        consequencesSummary: `Novo Cenário: ${newScenario.name}`,
      });
      campaign.updatedAt = new Date().toISOString();

      return {
        scenario: newScenario,
        travelNarrative,
        campaign,
      };
    } catch (err) {
      console.error('[RPGEngine] Error generating new scenario via Gemini:', err);
      // Fallback procedural scenario
      const fallbackScen: Scenario = {
        id: generateId('scen'),
        name: 'Platô das Estrelas Cadentes',
        region: 'Estepes Setentrionais',
        description: 'Um platô elevado cercado por precipícios vertiginosos. Cráteres de impacto antigos abrigam poças de água prateada que refletem constelações desconhecidas.',
        atmosphere: 'Frio glacial, ar límpido e aroma de ozônio.',
        lighting: 'Luz prateada refletida pelo solo de obsidiana polida.',
        dangerLevel: 3,
        pointsOfInterest: ['Cratera Central com Fragmento Meteórico Estelar', 'Círculo de Menires Rúnicos'],
        currentNPCs: [],
        environmentalHazards: ['Rajadas súbitas de vento cortante'],
        weatherOrClimate: 'Noite límpida e congelante',
      };

      campaign.currentScenario = fallbackScen;
      campaign.turnCount += 1;
      const travelNarrative = `Após horas de caminhada sob o céu mutável, você atinge o ${fallbackScen.name}. A vista é vertiginosa, e os ventos trazem o aviso de que este mundo guarda mistérios sem fim.`;

      campaign.history.push({
        id: generateId('turn'),
        turnNumber: campaign.turnCount,
        playerAction: 'Exploração de Novo Cenário',
        gmNarrative: travelNarrative,
        scenarioName: fallbackScen.name,
        timestamp: new Date().toISOString(),
      });
      campaign.updatedAt = new Date().toISOString();

      return {
        scenario: fallbackScen,
        travelNarrative,
        campaign,
      };
    }
  }

  // Standard dice roller with GM interpretation
  static rollDice(req: RollDiceRequest): {
    diceType: string;
    roll: number;
    modifier: number;
    total: number;
    attribute?: string;
    successLevel: 'crítico' | 'sucesso' | 'falha' | 'desastre';
    narrativeInterpretation: string;
  } {
    const diceType = req.diceType || 'd20';
    let max = 20;
    if (diceType === 'd100') max = 100;
    else if (diceType === 'd12') max = 12;
    else if (diceType === 'd10') max = 10;
    else if (diceType === 'd8') max = 8;
    else if (diceType === 'd6') max = 6;
    else if (diceType === 'd4') max = 4;

    const roll = Math.floor(Math.random() * max) + 1;
    let modifier = req.modifier || 0;

    if (req.campaignId && req.attribute) {
      const camp = campaigns.get(req.campaignId);
      if (camp) {
        const val = camp.character.attributes[req.attribute] ?? 10;
        modifier = Math.floor((val - 10) / 2);
      }
    }

    const total = roll + modifier;

    let successLevel: 'crítico' | 'sucesso' | 'falha' | 'desastre' = 'sucesso';
    let narrativeInterpretation = '';

    if (diceType === 'd20') {
      if (roll === 20) {
        successLevel = 'crítico';
        narrativeInterpretation = 'Sucesso Crítico Magnífico! O destino sorri abertamente para o herói, superando qualquer expectativa com elegância e maestria.';
      } else if (roll === 1) {
        successLevel = 'desastre';
        narrativeInterpretation = 'Falha Crítica Desastrosa! Um tropeço imprevisível ou revés repentino complica gravemente a situação, abrindo uma nova brecha de perigo.';
      } else if (total >= 15) {
        successLevel = 'sucesso';
        narrativeInterpretation = 'Sucesso Sólido! A ação foi realizada com precisão e atinge o objetivo desejado.';
      } else if (total >= 10) {
        successLevel = 'sucesso';
        narrativeInterpretation = 'Sucesso com Custo! O objetivo é alcançado, porém com um pequeno contratempo, ruído a mais ou esforço dobrado.';
      } else {
        successLevel = 'falha';
        narrativeInterpretation = 'Falha Tática. A tentativa não surtiu o efeito pretendido, forçando o personagem a se adaptar imediatamente.';
      }
    } else {
      narrativeInterpretation = `Rolagem de ${diceType}: valor obtido ${roll} (Total com modificador: ${total}).`;
    }

    return {
      diceType,
      roll,
      modifier,
      total,
      attribute: req.attribute,
      successLevel,
      narrativeInterpretation,
    };
  }
}

// Auto-seed starter campaign on boot
RPGEngine.seedInitialCampaignIfEmpty();
