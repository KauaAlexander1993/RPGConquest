import { Router, Request, Response } from 'express';
import { ai, RPG_MODEL } from './geminiClient.js';
import { RPGEngine } from './rpgEngine.js';
import { campaignDatabaseEnabled } from './database.js';

export const rpgRouter = Router();

// Health Check
rpgRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    service: 'Chronicles RPG AI Engine & Master API',
    model: RPG_MODEL,
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    persistentCampaigns: campaignDatabaseEnabled,
    timestamp: new Date().toISOString(),
  });
});

// Dedicated Narrator endpoint for game integrations (e.g., "Forje sua lenda" and custom clients)
rpgRouter.post('/narrate', async (req: Request, res: Response) => {
  try {
    const { sys, user } = req.body;

    if (!user) {
      return res.status(400).json({ error: 'Parâmetro "user" é obrigatório com a ação e contexto do jogo.' });
    }

    const defaultSys = `
Você é o MESTRE ANCIÃO, um narrador supremo de RPG de mesa.
Narra em português do Brasil, em segunda pessoa ("você"), com prosa literária, sensorial e imersiva: cheiros, sons, luz, clima e detalhes que dão vida ao mundo.

REGRAS DE OURO DO MESTRE:
1. A HISTÓRIA NUNCA ACABA. Quando um arco termina, a recompensa já planta o gancho de um novo arco, maior e diferente. Nunca escreva "fim" nem encerre a aventura.
2. TODO TURNO ENTREGA ALGO NOVO: uma pista, um NPC, uma complicação, um segredo, um item, um lugar ou uma reviravolta. Nunca repita cenas ou descrições idênticas.
3. RITMO DE CAMPANHA em ciclos: gancho, investigação, complicação, reviravolta, clímax, recompensa, novo arco.
4. SEMPRE 4 OPÇÕES realmente diferentes entre si (combate, diplomacia, furtividade, exploração/magia/criatividade), específicas da cena, curtas (até 9 palavras). O jogador também pode escrever qualquer ação livre.
5. NPCs VIVOS: nome próprio, desejo, segredo e voz própria.
6. O JOGADOR É O PROTAGONISTA: respeite classe, atributos e passado.
7. NUNCA encerre a campanha por morte: se hp chegar a 0, narre a queda e uma reviravolta dramática (capturado, resgatado com uma dívida) e devolva o herói à ação com pelo menos 6-8 hp.
8. DADOS: se houver d20 informado, respeite o resultado (1 = falha dramática, 2-9 = custo, 10-19 = sucesso, 20 = crítico épico).
9. Narre cada turno em 2 a 4 parágrafos envolventes, com cerca de 120 a 200 palavras. Use frases completas, ritmo natural e detalhes que façam a história avançar; evite fragmentos telegráficos.
10. Responda ESTRITAMENTE em formato JSON com campos válidos.
`;

    const systemInstruction = sys || defaultSys;

    const response = await ai.models.generateContent({
      model: RPG_MODEL,
      contents: user,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      // If slight markdown formatting slipped through, extract JSON substring
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Formato JSON não pôde ser interpretado da resposta da IA');
      }
    }

    res.json(parsed);
  } catch (error: any) {
    console.error('[rpgRouter /narrate] Erro ao gerar narrativa:', error);
    res.status(500).json({
      error: error.message || 'Erro ao processar narrativa da IA',
      fallbackRequired: true,
    });
  }
});

// List all active campaigns
rpgRouter.get('/campaigns', async (_req: Request, res: Response) => {
  try {
    const list = await RPGEngine.listCampaigns();
    res.json({ campaigns: list });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single campaign with full history
rpgRouter.get('/campaign/:id', async (req: Request, res: Response) => {
  try {
    const campaign = await RPGEngine.getCampaign(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: `Campanha com ID '${req.params.id}' não foi encontrada.` });
    }
    res.json({ campaign });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new campaign
rpgRouter.post('/campaign/new', async (req: Request, res: Response) => {
  try {
    const campaign = await RPGEngine.createCampaign(req.body);
    res.status(201).json({
      message: 'Campanha de RPG criada com sucesso!',
      campaign,
    });
  } catch (error: any) {
    console.error('[rpgRouter /campaign/new] Erro:', error);
    res.status(500).json({ error: error.message });
  }
});

// Process a turn in a campaign
rpgRouter.post('/turn/stream', async (req: Request, res: Response) => {
  const { campaignId, action, customDiceRoll, playerMemory } = req.body;
  if (!campaignId) {
    return res.status(400).json({ error: 'campaignId é obrigatório' });
  }

  res.status(200).set({
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  const sendEvent = (event: string, data: unknown) => {
    if (!res.destroyed) res.write(`data: ${JSON.stringify({ event, data })}\n\n`);
  };

  try {
    const result = await RPGEngine.processTurn({
      campaignId,
      action: action || 'Observar os arredores',
      playerMemory: typeof playerMemory === 'string' ? playerMemory.slice(0, 1200) : undefined,
      customDiceRoll,
    }, (text) => sendEvent('narrative', { text }));
    const latestTurn = result.campaign.history.at(-1);
    sendEvent('complete', {
      ...result,
      campaign: {
        ...result.campaign,
        history: latestTurn ? [latestTurn] : [],
      },
    });
  } catch (error) {
    console.error('[rpgRouter /turn/stream] Erro:', error);
    sendEvent('error', {
      error: error instanceof Error ? error.message : 'Erro ao processar o turno.',
    });
  } finally {
    res.end();
  }
});

rpgRouter.post('/turn', async (req: Request, res: Response) => {
  try {
    const { campaignId, action, customDiceRoll, playerMemory } = req.body;
    if (!campaignId) {
      return res.status(400).json({ error: 'campaignId é obrigatório' });
    }
    const result = await RPGEngine.processTurn({
      campaignId,
      action: action || 'Observar os arredores',
      playerMemory: typeof playerMemory === 'string' ? playerMemory.slice(0, 1200) : undefined,
      customDiceRoll,
    });
    res.json(result);
  } catch (error: any) {
    console.error('[rpgRouter /turn] Erro:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate a new connected scenario
rpgRouter.post('/scenario/generate', async (req: Request, res: Response) => {
  try {
    const { campaignId, travelDirection, explorationType, intent } = req.body;
    if (!campaignId) {
      return res.status(400).json({ error: 'campaignId é obrigatório' });
    }
    const result = await RPGEngine.generateNewScenario({
      campaignId,
      travelDirection,
      explorationType,
      intent,
    });
    res.json(result);
  } catch (error: any) {
    console.error('[rpgRouter /scenario/generate] Erro:', error);
    res.status(500).json({ error: error.message });
  }
});

// Virtual dice roller with GM check evaluation
rpgRouter.post('/dice/roll', async (req: Request, res: Response) => {
  try {
    const result = await RPGEngine.rollDice(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a campaign
rpgRouter.delete('/campaign/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await RPGEngine.deleteCampaign(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Campanha não encontrada para exclusão.' });
    }
    res.json({ message: 'Campanha excluída com sucesso.', id: req.params.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Full OpenAPI 3.0.0 Specification for external independent integration
rpgRouter.get('/openapi.json', (_req: Request, res: Response) => {
  res.json({
    openapi: '3.0.3',
    info: {
      title: 'Chronicles AI - RPG Master Engine & Independent API',
      version: '1.0.0',
      description: 'API independente de IA para mestrar e gerar aventuras infinitas de RPG de mesa, cenários procedurais contínuos e respostas baseadas nas escolhas do jogador.',
    },
    servers: [
      { url: '/api/rpg', description: 'Servidor Local / Base RPG API' },
    ],
    paths: {
      '/narrate': {
        post: {
          summary: 'Narra o próximo turno para motores de jogos e clientes RPG',
          description: 'Recebe as instruções do mestre e o estado/ação do jogador e retorna a narrativa e opções estruturadas.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    sys: { type: 'string', description: 'Instruções de sistema opcionais' },
                    user: { type: 'string', description: 'Contexto e ação do jogador' },
                  },
                  required: ['user'],
                },
              },
            },
          },
          responses: {
            200: { description: 'Narrativa gerada com sucesso em JSON estruturado' },
          },
        },
      },
      '/campaign/new': {
        post: {
          summary: 'Cria uma nova campanha infinita de RPG',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    theme: { type: 'string', enum: ['dark_fantasy', 'cyberpunk', 'eldritch_horror', 'sci_fi', 'post_apocalyptic', 'steampunk', 'custom'] },
                    tone: { type: 'string', enum: ['epic', 'gritty', 'mysterious', 'tactical'] },
                    language: { type: 'string', default: 'pt-BR' },
                    character: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        class: { type: 'string' },
                        background: { type: 'string' },
                        startingItem: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Campanha criada' },
          },
        },
      },
      '/turn': {
        post: {
          summary: 'Processa o turno do jogador e atualiza o mundo',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    campaignId: { type: 'string' },
                    action: { type: 'string' },
                    customDiceRoll: {
                      type: 'object',
                      properties: {
                        roll: { type: 'integer', minimum: 1, maximum: 20 },
                        attribute: { type: 'string' },
                      },
                    },
                  },
                  required: ['campaignId', 'action'],
                },
              },
            },
          },
          responses: { 200: { description: 'Turno resolvido com desfecho e novo cenário' } },
        },
      },
      '/turn/stream': {
        post: {
          summary: 'Processa um turno e transmite a narrativa enquanto é gerada',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    campaignId: { type: 'string' },
                    action: { type: 'string' },
                    playerMemory: { type: 'string' },
                    customDiceRoll: {
                      type: 'object',
                      properties: {
                        roll: { type: 'integer', minimum: 1, maximum: 20 },
                        attribute: { type: 'string' },
                      },
                    },
                  },
                  required: ['campaignId', 'action'],
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Eventos SSE com trechos da narrativa e o resultado final do turno',
              content: {
                'text/event-stream': {
                  schema: { type: 'string' },
                },
              },
            },
          },
        },
      },
      '/scenario/generate': {
        post: {
          summary: 'Gera um cenário novo proceduralmente conectado à campanha',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    campaignId: { type: 'string' },
                    travelDirection: { type: 'string' },
                    explorationType: { type: 'string' },
                  },
                  required: ['campaignId'],
                },
              },
            },
          },
          responses: { 200: { description: 'Novo cenário revelado' } },
        },
      },
      '/dice/roll': {
        post: {
          summary: 'Rola dados de RPG e obtém avaliação do Mestre',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    diceType: { type: 'string', default: 'd20' },
                    modifier: { type: 'integer', default: 0 },
                    attribute: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Resultado do dado com grau de sucesso' } },
        },
      },
      '/health': {
        get: {
          summary: 'Verifica saúde da API e status do modelo Gemini',
          responses: { 200: { description: 'Status do serviço' } },
        },
      },
    },
  });
});
