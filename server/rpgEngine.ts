import { ThinkingLevel } from '@google/genai';
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
import {
  deleteStoredCampaign,
  getStoredCampaign,
  listStoredCampaigns,
  saveCampaign,
} from './database.js';

const CLASS_PLAY_GUIDANCE: Array<{ name: string; guidance: string }> = [
  { name: 'guerreiro', guidance: 'Conceda manobras de combate e proteção a aliados com efeitos concretos e proporcionais ao perigo.' },
  { name: 'maga', guidance: 'Deixe a personagem perceber e manipular fenômenos arcanos, consumindo energia quando um feitiço alterar a cena.' },
  { name: 'ladino', guidance: 'Ofereça rotas furtivas, desarme de armadilhas e vantagens por preparação, sem tornar riscos invisíveis.' },
  { name: 'bardo', guidance: 'Permita mudar relações por diálogo, música ou inspiração e mostre a reação dos NPCs.' },
  { name: 'patrulheiro', guidance: 'Revele rastros, rotas e sinais de criaturas que criem escolhas de exploração.' },
  { name: 'sacerdote', guidance: 'Permita identificar maldições e curar ou proteger com custo coerente de energia.' },
  { name: 'necromante', guidance: 'Dê ao séquito esquelético funções úteis de proteção, reconhecimento e combate, com riscos e consequências.' },
  { name: 'rei demônio', guidance: 'Faça criaturas menores reagirem à autoridade infernal; convocações devem alterar a situação e ter custo ou consequência.' },
  { name: 'herói lendário', guidance: 'Transforme proteção e liderança em apoio real de aliados; honre o sacrifício sem apagar consequências.' },
  { name: 'santa', guidance: 'Faça curas e bênçãos ajudarem de forma visível, respeitando a energia disponível e a gravidade da situação.' },
  { name: 'rei dragão', guidance: 'Use resistência dracônica e sopro como recursos marcantes que mudam o campo de batalha, sem resolver tudo automaticamente.' },
];

interface FallbackWorldProfile {
  title: string;
  location: string;
  region: string;
  description: string;
  atmosphere: string;
  lighting: string;
  pointsOfInterest: string[];
  hazard: string;
  climate: string;
  npcName: string;
  npcRole: string;
  npcDescription: string;
  threat: string;
  rumor: string;
}

const FALLBACK_WORLD_PROFILES: Record<string, FallbackWorldProfile> = {
  dark_fantasy: {
    title: 'As Cinzas do Trono Partido',
    location: 'Ponte dos Sinos Afogados',
    region: 'Marca de Vespera',
    description: 'Uma ponte de pedra atravessa um rio escuro sob as muralhas de um reino em guerra. Sinos rachados tocam sem vento, e pegadas recentes terminam abruptamente diante de um portão selado.',
    atmosphere: 'Ferro molhado, água funda e o eco de sinos que ninguém admite ter ouvido.',
    lighting: 'Última luz rubra filtrada pela fumaça das torres sitiadas.',
    pointsOfInterest: ['Portão real coberto por selos de cera', 'Barca vazia presa sob a ponte', 'Sinos rachados com nomes gravados no bronze'],
    hazard: 'A correnteza sobe sempre que um sino toca.',
    climate: 'Chuva fria e cinzas sopradas do campo de batalha.',
    npcName: 'Maera Vell',
    npcRole: 'Mensageira da corte desaparecida',
    npcDescription: 'Esconde um brasão ensanguentado sob o manto e observa a estrada antes de responder.',
    threat: 'Guardas do regente procuram testemunhas do cerco.',
    rumor: 'O herdeiro desaparecido enviou uma mensagem escondida dentro de um dos sinos.',
  },
  eldritch_horror: {
    title: 'O Mar que Sonha sob a Névoa',
    location: 'Farol de Nacre',
    region: 'Costa das Marés Imóveis',
    description: 'Um farol inclinado domina uma praia sem ondas. A luz gira mesmo com a chama apagada, e as conchas na areia repetem em sussurros os últimos sonhos de quem se aproxima.',
    atmosphere: 'Sal, algas frias e um murmúrio grave vindo debaixo da areia.',
    lighting: 'Clarões esverdeados atravessam uma névoa que esconde o horizonte.',
    pointsOfInterest: ['Escadaria submersa que aparece na maré baixa', 'Livro de vigia com páginas ainda úmidas', 'Poço de maré com reflexo de um céu diferente'],
    hazard: 'A névoa imita vozes conhecidas e desorienta viajantes.',
    climate: 'Névoa espessa, sem vento, apesar do mar agitado.',
    npcName: 'Iria Sal',
    npcRole: 'Última guardiã do farol',
    npcDescription: 'Conta os clarões da torre e se recusa a olhar para o mar.',
    threat: 'A coisa que responde aos clarões sob a costa.',
    rumor: 'A luz do farol marca uma porta que só existe para quem já sonhou com ela.',
  },
  sci_fi: {
    title: 'Órbita dos Últimos Sinais',
    location: 'Estação Helix-9',
    region: 'Cinturão de Ícaro',
    description: 'Uma estação orbital gira lentamente fora de sincronia com o planeta abaixo. Nos corredores sem gravidade, ferramentas flutuam ao lado de uma sequência de portas abertas que o registro afirma nunca terem sido construídas.',
    atmosphere: 'Ozônio, metal aquecido e alarmes abafados pelo vácuo.',
    lighting: 'Luzes de emergência azuis intercaladas por painéis que piscam em código.',
    pointsOfInterest: ['Módulo de comunicações recebendo uma resposta impossível', 'Jardim hidropônico com plantas desconhecidas', 'Cápsula de fuga lacrada por dentro'],
    hazard: 'Uma falha de gravidade desloca objetos e pessoas entre os módulos.',
    climate: 'Vácuo externo e temperatura irregular nos setores sem energia.',
    npcName: 'N-7',
    npcRole: 'Técnico de manutenção sintético',
    npcDescription: 'Reinicia uma transmissão interrompida e pergunta por uma tripulação que não consta nos registros.',
    threat: 'O protocolo de quarentena da estação trata qualquer pessoa como intrusa.',
    rumor: 'Um sinal vindo do planeta contém as coordenadas de uma estação que desapareceu há duzentos anos.',
  },
  cyberpunk: {
    title: 'Neon sob a Chuva Ácida',
    location: 'Mercado Vertical de Shinjuku-13',
    region: 'Distrito Baixo de Nova Kyoto',
    description: 'Passarelas estreitas cruzam um mercado vertical sob letreiros de neon. Um apagão setoriza o distrito em blocos; em cada tela desligada aparece por um segundo o mesmo rosto desconhecido.',
    atmosphere: 'Chuva ácida, fritura de rua e anúncios disputando espaço com sirenes.',
    lighting: 'Neon magenta e ciano refletido em poças oleosas.',
    pointsOfInterest: ['Quiosque de implantes com a memória apagada', 'Elevador de carga parado entre andares', 'Painel público exibindo mensagens que ninguém publicou'],
    hazard: 'Drones de vigilância identificam rostos durante os apagões.',
    climate: 'Chuva morna contaminada e névoa de motores.',
    npcName: 'Kira-9',
    npcRole: 'Corretora de dados clandestina',
    npcDescription: 'Negocia de trás de um visor espelhado e reconhece o sinal em suas mensagens.',
    threat: 'Uma equipe corporativa tenta apagar o rastro de um vazamento.',
    rumor: 'O apagão foi acionado por alguém que ainda não nasceu nos registros da cidade.',
  },
  post_apocalyptic: {
    title: 'A Última Água do Ermo',
    location: 'Reservatório de Vidro',
    region: 'Deserto da Linha Morta',
    description: 'Um reservatório rachado guarda a última água limpa de uma região de estradas soterradas. Marcas de pneus recentes levam para dentro da estrutura, mas nenhuma trilha retorna.',
    atmosphere: 'Areia abrasiva, ferrugem quente e o silêncio de um rádio sem pilhas.',
    lighting: 'Sol branco filtrado por tempestades de poeira.',
    pointsOfInterest: ['Cisterna com lacre militar intacto', 'Ônibus soterrado com luzes acesas', 'Torre de rádio transmitindo coordenadas antigas'],
    hazard: 'Uma tempestade de areia aproxima-se e reduz a visibilidade.',
    climate: 'Calor seco durante o dia e frio cortante após o pôr do sol.',
    npcName: 'Dara Fio',
    npcRole: 'Cartógrafa de caravanas',
    npcDescription: 'Marca rotas na própria luva e guarda um filtro de água vazio.',
    threat: 'Uma caravana armada reivindica o reservatório.',
    rumor: 'A transmissão da torre prevê uma chuva numa região que não vê água há décadas.',
  },
  steampunk: {
    title: 'O Vapor sob a Cidade Suspensa',
    location: 'Estação Terminal de Brumaférrea',
    region: 'Distrito das Caldeiras',
    description: 'Uma estação de trem a vapor suspensa sobre um abismo recebe um comboio sem maquinista. O relógio principal anda para trás e cada apito apaga uma luz da cidade.',
    atmosphere: 'Carvão, óleo de máquina e o sopro ritmado de válvulas antigas.',
    lighting: 'Lampiões de cobre sob nuvens de vapor dourado.',
    pointsOfInterest: ['Locomotiva sem identificação', 'Oficina lacrada com projetos vivos', 'Relógio público marcando uma hora impossível'],
    hazard: 'Caldeiras instáveis soltam jatos de vapor pelas passarelas.',
    climate: 'Chuva fina e vapor quente nas ruas elevadas.',
    npcName: 'Doutora Vika Brass',
    npcRole: 'Engenheira de locomotivas',
    npcDescription: 'Escuta o motor com um estetoscópio de cobre e diz reconhecer um passageiro invisível.',
    threat: 'A Companhia de Trilhos quer confiscar qualquer peça encontrada no comboio.',
    rumor: 'O trem sem maquinista chega sempre um dia antes de um acidente industrial.',
  },
  solarpunk: {
    title: 'O Jardim que Reconstrói o Mundo',
    location: 'Estufa das Chuvas Claras',
    region: 'Vale das Comunas Verdes',
    description: 'Uma estufa comunitária cobre as ruínas de uma antiga metrópole. Videiras conduzem energia pelas paredes e uma espécie de semente cresce dentro de uma bateria recuperada.',
    atmosphere: 'Terra molhada, folhas novas e o zumbido suave de painéis solares.',
    lighting: 'Luz dourada filtrada por vidro coberto de trepadeiras.',
    pointsOfInterest: ['Banco de sementes com uma gaveta recém-aberta', 'Canal de irrigação correndo contra a inclinação', 'Bateria viva pulsando sob as raízes'],
    hazard: 'As raízes alteram as passagens e podem isolar quem entra.',
    climate: 'Chuva morna e ar fresco de jardim.',
    npcName: 'Noa das Abelhas',
    npcRole: 'Cuidadora da estufa',
    npcDescription: 'Carrega uma colmeia portátil e procura a origem de um novo sinal verde.',
    threat: 'O conselho da comuna teme que a descoberta desequilibre o ecossistema local.',
    rumor: 'A semente dentro da bateria floresce apenas quando alguém compartilha uma lembrança.',
  },
  hollow_earth: {
    title: 'Sob a Crosta, um Segundo Céu',
    location: 'Lago de Basalto Oco',
    region: 'Mundo Interior de Abar',
    description: 'Um oceano subterrâneo reflete um céu feito de cristais no teto da caverna. Ilhas de basalto movem-se contra a corrente, aproximando-se de uma cidade talhada no avesso da crosta.',
    atmosphere: 'Minerais úmidos, ecos longos e o rumor de água em grande profundidade.',
    lighting: 'Cristais violetas iluminam um falso firmamento subterrâneo.',
    pointsOfInterest: ['Ilha de basalto coberta por pegadas recentes', 'Elevador de pedra que desce sem cordas', 'Muralha da cidade interior com portões abertos'],
    hazard: 'A maré subterrânea muda de direção sem aviso.',
    climate: 'Calor úmido junto ao lago e correntes frias nos túneis.',
    npcName: 'Tarek das Profundezas',
    npcRole: 'Guia das rotas internas',
    npcDescription: 'Reconhece o som dos cristais e alerta que a cidade está acordada.',
    threat: 'Sentinelas da cidade interior patrulham as ilhas móveis.',
    rumor: 'O mapa gravado no teto mostra uma passagem que muda com as marés.',
  },
  mecha: {
    title: 'Titãs no Campo de Íon',
    location: 'Hangar dos Colossos',
    region: 'Fronteira Orbital de Varda',
    description: 'Um hangar militar aberto para o céu guarda um mecha desligado, ainda coberto por poeira de uma batalha que terminou há gerações. O cockpit acaba de reconhecer um piloto que não está na lista.',
    atmosphere: 'Combustível, metal frio e estática de comunicações interrompidas.',
    lighting: 'Luzes de pista vermelhas sob um céu cortado por descargas azuis.',
    pointsOfInterest: ['Cockpit que responde a um nome desconhecido', 'Braço mecânico preso sob destroços', 'Mapa de batalha projetado sem fonte de energia'],
    hazard: 'Armas automáticas antigas ainda protegem o hangar.',
    climate: 'Ventos de altitude e tempestades eletromagnéticas.',
    npcName: 'Tenente Sora Vale',
    npcRole: 'Piloto de resgate',
    npcDescription: 'Tenta impedir que o reator do hangar desperte e reconhece a assinatura do mecha.',
    threat: 'Um drone de combate considera qualquer aproximação uma invasão.',
    rumor: 'O colosso guarda em sua memória a última ordem de uma guerra que ainda não aconteceu.',
  },
  ice_age: {
    title: 'A Fenda sob o Gelo Azul',
    location: 'Estação de Degelo Boreal',
    region: 'Planície do Último Inverno',
    description: 'Uma estação de pesquisa presa num glaciar recebe sinais de calor vindo de baixo. No gelo transparente, uma floresta inteira aparece preservada — e as luzes de suas árvores acendem uma por uma.',
    atmosphere: 'Ar congelado, estalos profundos e cheiro de pinho sob a neve.',
    lighting: 'Aurora verde refletida em paredes de gelo azul.',
    pointsOfInterest: ['Fenda recém-aberta no glaciar', 'Acampamento de pesquisa abandonado', 'Árvore fossilizada com seiva ainda morna'],
    hazard: 'O gelo cede perto das correntes de calor.',
    climate: 'Nevasca intermitente e rajadas abaixo de zero.',
    npcName: 'Edda Nival',
    npcRole: 'Pesquisadora glacial',
    npcDescription: 'Mantém uma chama acesa dentro de uma lanterna e tenta decifrar as marcas no gelo.',
    threat: 'Uma criatura desperta sob o glaciar segue o calor dos vivos.',
    rumor: 'A floresta congelada muda de posição sempre que a aurora desaparece.',
  },
  celestial: {
    title: 'O Julgamento da Aurora Partida',
    location: 'Tribunal das Sete Asas',
    region: 'Limiar Celeste de Aster',
    description: 'Um tribunal suspenso entre nuvens recebe uma audiência sem acusador. As balanças de ouro inclinam-se para um nome ainda não pronunciado e as portas do salão se abrem para o vazio.',
    atmosphere: 'Incenso frio, cânticos distantes e o silêncio pesado de uma sentença iminente.',
    lighting: 'Aurora branca e dourada atravessando vitrais sem imagens.',
    pointsOfInterest: ['Balança que pesa promessas em vez de ouro', 'Arquivo de sentenças com uma página arrancada', 'Escadaria suspensa que termina numa nuvem escura'],
    hazard: 'Juramentos ditos no salão ganham força e podem cobrar um preço.',
    climate: 'Ventos altos e chuva de luz sobre as nuvens.',
    npcName: 'Ariom, o Escrivão',
    npcRole: 'Guardião dos juramentos',
    npcDescription: 'Escreve em páginas vazias e aguarda que alguém reconheça o próprio nome.',
    threat: 'Um julgamento celestial foi iniciado sem que os envolvidos saibam o motivo.',
    rumor: 'A sentença apagada do arquivo ainda pode ser ouvida durante a aurora.',
  },
  dark_circus: {
    title: 'O Espetáculo sem Plateia',
    location: 'Picadeiro da Lua de Papel',
    region: 'Estrada das Lanternas Mortas',
    description: 'Um circo inteiro está montado numa clareira, embora não haja pegadas na grama. As cortinas se abrem sozinhas e os bonecos no palco representam a chegada do próximo visitante.',
    atmosphere: 'Açúcar queimado, serragem úmida e uma melodia tocada ao contrário.',
    lighting: 'Lanternas vermelhas iluminam um picadeiro cercado por escuridão.',
    pointsOfInterest: ['Bilheteria com ingressos assinados pelo visitante', 'Espelho que mostra o picadeiro vazio', 'Caravana trancada por dentro'],
    hazard: 'A música altera a percepção de distância entre as tendas.',
    climate: 'Ar parado e frio repentino quando as cortinas se movem.',
    npcName: 'Madame Mirra',
    npcRole: 'Apresentadora mascarada',
    npcDescription: 'Anuncia atos que ainda não aconteceram e oferece escolher o próximo número.',
    threat: 'Os marionetistas invisíveis não permitem que o espetáculo seja interrompido.',
    rumor: 'Quem encontra o próprio ingresso pode mudar o final de um ato — mas não sair dele.',
  },
  clockwork: {
    title: 'A Cidade Presa no Próximo Minuto',
    location: 'Praça do Pêndulo Partido',
    region: 'Meridiano de Latão',
    description: 'Uma cidade mecânica repete o mesmo minuto com pequenos erros: uma janela muda de cor, um transeunte envelhece, uma engrenagem aparece onde antes havia uma fonte.',
    atmosphere: 'Óleo doce, metal vibrando e o tique-taque de milhares de relógios desalinhados.',
    lighting: 'Luz âmbar de um sol imóvel atrás de engrenagens gigantes.',
    pointsOfInterest: ['Pêndulo parado no meio do movimento', 'Fonte despejando areia para cima', 'Oficina que só aparece no primeiro segundo do minuto'],
    hazard: 'Mudanças no ciclo temporal podem repetir ou deslocar ações.',
    climate: 'Ar morno e imóvel, interrompido por sopros de vapor.',
    npcName: 'Mestre Oru',
    npcRole: 'Relojoeiro da praça',
    npcDescription: 'Lembra versões diferentes do mesmo minuto e pede que o pêndulo não seja tocado.',
    threat: 'Os guardas mecânicos corrigem qualquer pessoa que saia do ciclo.',
    rumor: 'Uma engrenagem ausente está contando os minutos de uma vida que ainda não começou.',
  },
};

const CUSTOM_FALLBACK_PROFILE: FallbackWorldProfile = {
  title: 'A Primeira Fronteira de {world}',
  location: 'Limiar de {world}',
  region: 'Territórios de {world}',
  description: 'O primeiro sinal de vida deste mundo rompe a quietude do horizonte. Estruturas, paisagens e vestígios únicos de {world} indicam que alguém chegou antes e deixou uma escolha por fazer.',
  atmosphere: 'O ar traz sinais desconhecidos e uma sensação de que este lugar reage à presença de quem o atravessa.',
  lighting: 'A luz revela formas e cores próprias de {world}, sem esconder os perigos adiante.',
  pointsOfInterest: ['Vestígio recente deixado por um habitante de {world}', 'Passagem que leva a uma região ainda sem nome', 'Objeto que reage à presença do herói'],
  hazard: 'O ambiente desconhecido muda quando alguém se aproxima do vestígio.',
  climate: 'Condições estranhas próprias de {world}.',
  npcName: 'A Vigia do Limiar',
  npcRole: 'Primeira habitante encontrada',
  npcDescription: 'Observa o herói como se já soubesse a razão de sua chegada.',
  threat: 'Uma força local tenta impedir que o primeiro segredo de {world} seja revelado.',
  rumor: 'O primeiro sinal encontrado em {world} pode apontar para uma região que ainda não existe nos mapas.',
};

const CUSTOM_GENRE_FALLBACKS: Array<{ matches: RegExp; profile: FallbackWorldProfile }> = [
  {
    matches: /pirata|marítim|maritimo|corsári|corsari/i,
    profile: {
      title: 'A Carta das Águas Proibidas',
      location: 'Enseada do Dente Negro',
      region: 'Arquipélago da Maré Partida',
      description: 'Um navio sem bandeira está encalhado numa enseada cercada por recifes. Há luzes acesas no convés, mas a tripulação desapareceu e um mapa recém-molhado aponta para uma ilha que não consta em nenhuma carta náutica.',
      atmosphere: 'Sal, cordame úmido e o rangido de madeira sob uma maré inquieta.',
      lighting: 'Últimos raios de sol cortados por nuvens de tempestade.',
      pointsOfInterest: ['Navio sem bandeira preso ao recife', 'Mapa náutico que muda com a maré', 'Caverna aberta apenas durante a vazante'],
      hazard: 'A maré sobe depressa e fecha a saída da enseada.',
      climate: 'Vento marítimo forte antes de uma tempestade.',
      npcName: 'Capitã Iara Vento-Sul',
      npcRole: 'Navegadora sem embarcação',
      npcDescription: 'Guarda uma bússola quebrada e reconhece o navio encalhado.',
      threat: 'Caçadores de recompensa bloqueiam a rota para o mar aberto.',
      rumor: 'A ilha no mapa aparece somente quando alguém pronuncia o nome de um navio perdido.',
    },
  },
  {
    matches: /faroeste|velho oeste|western/i,
    profile: {
      title: 'A Lei Enterrada de Poeira Alta',
      location: 'Estação de Poeira Alta',
      region: 'Território da Fronteira Seca',
      description: 'Uma estação ferroviária no meio do deserto mantém as luzes acesas embora a linha tenha sido removida. Um trem apita no horizonte, e o cartaz de procurado na parede acaba de ganhar um retrato novo.',
      atmosphere: 'Poeira, couro aquecido e o estalo de uma placa solta ao vento.',
      lighting: 'Sol baixo, laranja, refletido nas janelas da estação.',
      pointsOfInterest: ['Trilho interrompido diante de um túnel', 'Cartaz de procurado com tinta ainda fresca', 'Poço seco com marcas de botas recentes'],
      hazard: 'A água restante é pouca e alguém observa do alto da estação.',
      climate: 'Calor seco de dia e frio repentino ao anoitecer.',
      npcName: 'Xerife Alma Rios',
      npcRole: 'Xerife da estação',
      npcDescription: 'Mantém uma mão perto do coldre e pergunta de que lado da lei você está.',
      threat: 'Uma quadrilha espera o trem que não deveria mais passar.',
      rumor: 'O apito do trem anuncia crimes que ainda não foram cometidos.',
    },
  },
  {
    matches: /nórd|nord|viking/i,
    profile: {
      title: 'As Runas sob o Gelo dos Juramentos',
      location: 'Salão das Quilhas Quebradas',
      region: 'Fiorde de Hrafn',
      description: 'Um salão comunal está soterrado até as vigas por neve azulada. Runas recém-gravadas brilham no casco de um navio enterrado, e a fogueira central queima sem produzir calor.',
      atmosphere: 'Resina, neve e o canto distante de corvos sobre o fiorde.',
      lighting: 'Aurora verde refletida nas lâminas penduradas nas vigas.',
      pointsOfInterest: ['Navio funerário preso sob o salão', 'Runas que se alteram ao serem lidas', 'Trilha de pegadas que termina no gelo intacto'],
      hazard: 'O gelo do fiorde estala sob passos e pode se abrir sem aviso.',
      climate: 'Nevasca forte e ventos cortantes vindos do mar.',
      npcName: 'Yrsa Mão-de-Ferro',
      npcRole: 'Escudeira do clã',
      npcDescription: 'Vigia as runas e evita dizer o nome de quem foi enterrado sob o salão.',
      threat: 'Dois clãs rivais reivindicam o mesmo juramento antigo.',
      rumor: 'Uma runa no navio descreve um juramento que ainda não foi feito.',
    },
  },
  {
    matches: /japão feudal|japao feudal|samurai|clãs|clas/i,
    profile: {
      title: 'A Ponte entre os Dois Crepúsculos',
      location: 'Portão do Santuário Carmesim',
      region: 'Província de Aokiri',
      description: 'Um santuário entre bambuzais está vazio, mas duas xícaras de chá ainda soltam vapor. Uma ponte vermelha atravessa o vale; do outro lado, estandartes de um clã desaparecido voltaram a tremular.',
      atmosphere: 'Chuva leve, bambu rangendo e o tilintar de um sino ritual.',
      lighting: 'Lanternas vermelhas contra o azul profundo do crepúsculo.',
      pointsOfInterest: ['Santuário com duas xícaras recém-servidas', 'Ponte marcada por lâminas antigas', 'Estandarte de um clã dado como extinto'],
      hazard: 'O caminho muda de direção quando o sino toca.',
      climate: 'Chuva fina e névoa entre as montanhas.',
      npcName: 'Ren Akiyama',
      npcRole: 'Mensageiro de um clã sem senhor',
      npcDescription: 'Carrega uma carta selada e observa se você respeita o protocolo do santuário.',
      threat: 'Patrulheiros procuram quem ergueu novamente o estandarte.',
      rumor: 'A carta selada contém a ordem de um senhor que morreu antes de escrevê-la.',
    },
  },
  {
    matches: /mitologia grega|olimp|odisse|grega/i,
    profile: {
      title: 'A Odisseia da Ilha sem Sombra',
      location: 'Oráculo das Colunas Afundadas',
      region: 'Mar de Egeu',
      description: 'Colunas de mármore emergem do mar ao redor de uma ilha onde ninguém projeta sombra. Uma oferenda ainda fumega diante do oráculo, cuja água mostra um navio chegando antes de deixar o porto.',
      atmosphere: 'Azeitonas, sal e o rumor de versos ditos sob a água.',
      lighting: 'Sol dourado que não se move sobre o horizonte.',
      pointsOfInterest: ['Bacia oracular com uma visão invertida', 'Coluna submersa coberta de nomes riscados', 'Barco de oferendas preso sem âncora'],
      hazard: 'Uma promessa feita na ilha pode chamar a atenção dos deuses.',
      climate: 'Brisa marítima quente sob um céu imóvel.',
      npcName: 'Mélia',
      npcRole: 'Intérprete do oráculo',
      npcDescription: 'Responde às perguntas com versos e não revela qual deus a enviou.',
      threat: 'Um guardião marinho protege os nomes gravados nas colunas.',
      rumor: 'O oráculo prevê o retorno de uma pessoa que ainda não partiu.',
    },
  },
  {
    matches: /academia de magia|escola de magia|academia/i,
    profile: {
      title: 'O Exame que a Academia Esqueceu',
      location: 'Ala Norte da Academia de Vesper',
      region: 'Campus das Sete Torres',
      description: 'Uma sala de aula lacrada surge no mapa da academia entre duas torres que sempre estiveram lado a lado. As carteiras estão ocupadas por sombras, e no quadro aparece uma prova com o nome do herói.',
      atmosphere: 'Papel antigo, ozônio e o murmúrio de uma aula atrás das paredes.',
      lighting: 'Luz azul de cristais arcanos com lampejos violetas.',
      pointsOfInterest: ['Quadro com uma pergunta ainda sem resposta', 'Arquivo de feitiços proibidos', 'Porta que abre apenas durante o toque do sino'],
      hazard: 'A magia instável repete feitiços lançados dentro da ala.',
      climate: 'Ar frio e descargas arcanas ocasionais.',
      npcName: 'Professora Selene Varo',
      npcRole: 'Mestra de disciplinas arcanas',
      npcDescription: 'Traz anotações sobre uma turma que oficialmente nunca existiu.',
      threat: 'Um feitiço de contenção interpreta visitantes como parte do exame.',
      rumor: 'A academia apagou do registro uma turma que ainda frequenta as aulas.',
    },
  },
];

const getFallbackWorldProfile = (req: CreateCampaignRequest): { worldName: string; profile: FallbackWorldProfile } => {
  const prompt = req.customThemePrompt || req.initialPremise || '';
  const customWorldName = prompt.match(/^(.+?)(?:\. Modo de campanha:|\.|$)/)?.[1]?.trim();
  const worldName = customWorldName || req.theme || 'Fantasia medieval';
  const customGenre = CUSTOM_GENRE_FALLBACKS.find(({ matches }) => matches.test(worldName));
  const profile = FALLBACK_WORLD_PROFILES[req.theme] || customGenre?.profile || CUSTOM_FALLBACK_PROFILE;
  const replaceWorld = (value: string) => value.replaceAll('{world}', worldName);
  return {
    worldName,
    profile: {
      title: replaceWorld(profile.title),
      location: replaceWorld(profile.location),
      region: replaceWorld(profile.region),
      description: replaceWorld(profile.description),
      atmosphere: replaceWorld(profile.atmosphere),
      lighting: replaceWorld(profile.lighting),
      pointsOfInterest: profile.pointsOfInterest.map(replaceWorld),
      hazard: replaceWorld(profile.hazard),
      climate: replaceWorld(profile.climate),
      npcName: replaceWorld(profile.npcName),
      npcRole: replaceWorld(profile.npcRole),
      npcDescription: replaceWorld(profile.npcDescription),
      threat: replaceWorld(profile.threat),
      rumor: replaceWorld(profile.rumor),
    },
  };
};

const guidanceForClass = (className: string): string => {
  const normalized = className.toLocaleLowerCase('pt-BR');
  return CLASS_PLAY_GUIDANCE.find(({ name }) => normalized.includes(name))?.guidance
    || 'Crie oportunidades que usem a especialidade da classe e ofereçam escolhas que outras classes resolveriam de outro modo.';
};

function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
}

class JsonNarrativeStream {
  private searchBuffer = '';
  private started = false;
  private escaped = false;
  private unicodeEscape = '';
  private closed = false;

  constructor(private readonly onChunk?: (text: string) => void) {}

  push(chunk: string): void {
    if (!this.onChunk || this.closed || !chunk) return;

    if (!this.started) {
      this.searchBuffer += chunk;
      const field = this.searchBuffer.match(/"narrative"\s*:\s*"/);
      if (!field || field.index === undefined) {
        this.searchBuffer = this.searchBuffer.slice(-32);
        return;
      }
      this.searchBuffer = this.searchBuffer.slice(field.index + field[0].length);
      this.started = true;
    } else {
      this.searchBuffer += chunk;
    }

    let decoded = '';
    let consumed = 0;
    for (const char of this.searchBuffer) {
      consumed += char.length;
      if (this.unicodeEscape) {
        if (!/[0-9a-f]/i.test(char)) {
          this.unicodeEscape = '';
          continue;
        }
        this.unicodeEscape += char;
        if (this.unicodeEscape.length === 5) {
          decoded += String.fromCharCode(Number.parseInt(this.unicodeEscape.slice(1), 16));
          this.unicodeEscape = '';
        }
      } else if (this.escaped) {
        this.escaped = false;
        if (char === 'u') {
          this.unicodeEscape = 'u';
        } else {
          const escapes: Record<string, string> = {
            '"': '"',
            '\\': '\\',
            '/': '/',
            b: '\b',
            f: '\f',
            n: '\n',
            r: '\r',
            t: '\t',
          };
          decoded += escapes[char] || char;
        }
      } else if (char === '\\') {
        this.escaped = true;
      } else if (char === '"') {
        this.closed = true;
        break;
      } else {
        decoded += char;
      }
    }
    this.searchBuffer = this.searchBuffer.slice(consumed);
    if (decoded) this.onChunk(decoded);
  }
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
6. IDENTIDADE E CONTINUIDADE DO MUNDO:
   - Nunca reutilize automaticamente um prólogo, cenário, NPC ou conflito de outra campanha.
   - Trate o mundo, gênero e premissa fornecidos como cânone. Não converta ficção científica, cyberpunk, steampunk, horror ou qualquer mundo personalizado para fantasia medieval.
   - Faça cada consequência nascer da ação do jogador, da cena atual e do histórico; evite frases genéricas que serviriam para qualquer campanha.
   - Escreva narrativas com frases completas e ritmo natural; evite fragmentos telegráficos ou respostas de uma única frase.
`;

export class RPGEngine {
  // Get all campaigns
  static async listCampaigns(): Promise<Array<Omit<Campaign, 'history'> & { historyCount: number }>> {
    const campaigns = await listStoredCampaigns();
    return campaigns.map(c => ({
      ...c,
      historyCount: c.history.length,
    }));
  }

  // Get a single campaign
  static getCampaign(id: string): Promise<Campaign | undefined> {
    return getStoredCampaign(id);
  }

  // Delete a campaign
  static deleteCampaign(id: string): Promise<boolean> {
    return deleteStoredCampaign(id);
  }

  // Initialize a default starter campaign if none exists
  static async seedInitialCampaignIfEmpty(): Promise<Campaign> {
    const existing = await listStoredCampaigns();
    if (existing.length > 0) {
      return existing[0];
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

    await saveCampaign(starter);
    return starter;
  }

  // Create a brand new campaign
  static async createCampaign(req: CreateCampaignRequest): Promise<Campaign> {
    const id = generateId('camp');
    const lang = req.language || 'pt-BR';
    const theme = req.theme || 'dark_fantasy';
    const tone = req.tone || 'gritty';
    const worldProfile = getFallbackWorldProfile(req);

    const attrs = {
      strength: req.character?.attributes?.strength ?? 12,
      agility: req.character?.attributes?.agility ?? 12,
      intellect: req.character?.attributes?.intellect ?? 12,
      presence: req.character?.attributes?.presence ?? 12,
      vitality: req.character?.attributes?.vitality ?? 12,
    };

    const prompt = `
Crie o prólogo imersivo, cenário inicial e ganchos de uma campanha de RPG com as seguintes configurações:
- Identificador único desta criação (use como inspiração de variação, não o repita na narrativa): ${id}
- Idioma: ${lang}
- Gênero interno: ${theme}
- Mundo escolhido pelo jogador: ${worldProfile.worldName}
- Premissa Customizada: ${req.customThemePrompt || req.initialPremise || 'Mundo vasto e repleto de segredos antigos e facções conflitantes'}
- Identidade obrigatória do mundo: ${worldProfile.profile.description}
- Tom narrativo: ${tone}
- Personagem do Jogador:
  - Nome: ${req.character?.name || 'Aventureiro'}
  - Classe: ${req.character?.class || 'Andarilho'}
  - Histórico: ${req.character?.background || 'Um viajante em busca de respostas'}
  - Atributos: Força ${attrs.strength}, Agilidade ${attrs.agility}, Intelecto ${attrs.intellect}, Presença ${attrs.presence}, Vitalidade ${attrs.vitality}
  - Item inicial: ${req.character?.startingItem || 'Um amuleto estranho que pulsa suavemente'}

IMPORTANTE:
- A história NÃO TEM FINAL DETERMINADO. Crie um cenário inicial vivo e intrigante, com 2 a 3 rumores que abrem infinitas possibilidades.
- Respeite literalmente o mundo escolhido e sua premissa. Não substitua por fantasia medieval genérica nem reutilize cenários, NPCs ou ganchos de outro gênero.
- Os detalhes do cenário, itens, ameaças e ações sugeridas devem ser próprios de "${worldProfile.worldName}" e coerentes com "${theme}".
- Não use florestas, ruínas, castelos ou magia medieval, salvo se fizerem parte explícita do mundo escolhido.
- Crie nomes e conflitos inéditos para esta campanha, conectando a primeira cena à classe, ao passado e ao item do herói.

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
                description: `Um pertence singular para a jornada em ${worldProfile.worldName}.`,
              },
            ],
        statusEffects: [],
      };

      const scenario: Scenario = {
        id: generateId('scen'),
        name: parsed.scenario?.name || worldProfile.profile.location,
        region: parsed.scenario?.region || worldProfile.profile.region,
        description: parsed.scenario?.description || worldProfile.profile.description,
        atmosphere: parsed.scenario?.atmosphere || worldProfile.profile.atmosphere,
        lighting: parsed.scenario?.lighting || worldProfile.profile.lighting,
        dangerLevel: Number(parsed.scenario?.dangerLevel) || 2,
        pointsOfInterest: Array.isArray(parsed.scenario?.pointsOfInterest) ? parsed.scenario.pointsOfInterest : worldProfile.profile.pointsOfInterest,
        currentNPCs: Array.isArray(parsed.scenario?.currentNPCs) ? parsed.scenario.currentNPCs : [{
          name: worldProfile.profile.npcName,
          role: worldProfile.profile.npcRole,
          attitude: 'mysterious',
          description: worldProfile.profile.npcDescription,
        }],
        environmentalHazards: Array.isArray(parsed.scenario?.environmentalHazards) ? parsed.scenario.environmentalHazards : [worldProfile.profile.hazard],
        weatherOrClimate: parsed.scenario?.weatherOrClimate || worldProfile.profile.climate,
      };

      const campaign: Campaign = {
        id,
        title: req.title || parsed.title || worldProfile.profile.title,
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
              { id: 'act_1', title: `Investigar ${worldProfile.profile.pointsOfInterest[0]}`, description: `Descobrir o que mudou em ${scenario.name}.`, attributeCheck: 'intellect', riskLevel: 'baixo' },
              { id: 'act_2', title: `Falar com ${worldProfile.profile.npcName}`, description: worldProfile.profile.npcDescription, attributeCheck: 'presence', riskLevel: 'médio' },
              { id: 'act_3', title: `Usar sua experiência de ${req.character?.class || 'aventureiro'}`, description: guidanceForClass(req.character?.class || ''), attributeCheck: 'none', riskLevel: 'baixo' },
            ],
        history: [
          {
            id: generateId('hist'),
            turnNumber: 0,
            playerAction: 'Criação da Campanha',
            gmNarrative: parsed.openingNarrative || `${req.character?.name || 'Aventureiro'}, sua chegada a ${scenario.name} muda o ritmo de ${worldProfile.worldName}. ${scenario.description} ${worldProfile.profile.rumor}`,
            scenarioName: scenario.name,
            timestamp: new Date().toISOString(),
          },
        ],
        unresolvedRumors: Array.isArray(parsed.unresolvedRumors) ? parsed.unresolvedRumors : [worldProfile.profile.rumor],
        activeFactionsOrThreats: Array.isArray(parsed.activeFactionsOrThreats) ? parsed.activeFactionsOrThreats : [worldProfile.profile.threat],
      };

      await saveCampaign(campaign);
      return campaign;
    } catch (err) {
      console.error('[RPGEngine] Error creating campaign via Gemini:', err);
      // Fallback robust campaign generation so API never crashes
      return this.createFallbackCampaign(id, req);
    }
  }

  // Fallback campaign generator
  private static async createFallbackCampaign(id: string, req: CreateCampaignRequest): Promise<Campaign> {
    const { worldName, profile } = getFallbackWorldProfile(req);
    const heroName = req.character?.name || 'Andarilho';
    const heroClass = req.character?.class || 'Guerreiro Errante';
    const premise = req.initialPremise?.trim();
    const openingNarrative = `Você é ${heroName}, ${heroClass}. Ao chegar a ${profile.location}, encontra ${profile.npcName}, que parece precisar de ajuda. ${premise ? `Você veio por este motivo: ${premise}` : `Você carrega ${req.character?.startingItem || 'um item especial'}. Talvez ele ajude a descobrir o que está acontecendo.`}`;
    const fallbackCamp: Campaign = {
      id,
      title: req.title || profile.title,
      narrationMode: 'offline',
      theme: req.theme || 'dark_fantasy',
      customThemePrompt: req.customThemePrompt,
      tone: req.tone || 'gritty',
      language: req.language || 'pt-BR',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      turnCount: 0,
      character: {
        name: heroName,
        class: heroClass,
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
            name: req.character?.startingItem || 'Relíquia da Fronteira',
            type: 'weapon',
            description: `Um pertence singular que reage aos sinais de ${worldName}.`,
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
        name: profile.location,
        region: profile.region,
        description: profile.description,
        atmosphere: profile.atmosphere,
        lighting: profile.lighting,
        dangerLevel: 2,
        pointsOfInterest: profile.pointsOfInterest,
        currentNPCs: [
          {
            name: profile.npcName,
            role: profile.npcRole,
            attitude: 'mysterious',
            description: profile.npcDescription,
          },
        ],
        environmentalHazards: [profile.hazard],
        weatherOrClimate: profile.climate,
      },
      suggestedActions: [
        {
          id: 'act_fb_1',
          title: `Investigar ${profile.pointsOfInterest[0]}`,
          description: 'Olhe ao redor e procure uma pista.',
          attributeCheck: 'intellect',
          riskLevel: 'médio',
        },
        {
          id: 'act_fb_2',
          title: `Conversar com ${profile.npcName}`,
          description: `Pergunte a ${profile.npcName} o que está acontecendo.`,
          attributeCheck: 'presence',
          riskLevel: 'baixo',
        },
        {
          id: 'act_fb_3',
          title: 'Usar uma habilidade especial',
          description: 'Use o que sua classe sabe fazer para mudar a situação.',
          attributeCheck: 'none',
          riskLevel: 'médio',
        },
      ],
      history: [
        {
          id: generateId('hist'),
          turnNumber: 0,
          playerAction: `Chegada a ${profile.location}`,
          gmNarrative: openingNarrative,
          scenarioName: profile.location,
          timestamp: new Date().toISOString(),
        },
      ],
      unresolvedRumors: [
        profile.rumor,
      ],
      activeFactionsOrThreats: [profile.threat],
    };

    await saveCampaign(fallbackCamp);
    return fallbackCamp;
  }

  // Process a player turn
  static async processTurn(req: TurnRequest, onNarrativeChunk?: (text: string) => void): Promise<{
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
    const campaign = await getStoredCampaign(req.campaignId);
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
- Especialidade que deve aparecer em cena: ${guidanceForClass(campaign.character.class)}
- HP: ${campaign.character.hp}/${campaign.character.maxHp} | Mana/Vigor: ${campaign.character.manaOrEnergy}/${campaign.character.maxManaOrEnergy}
- Atributos: Força ${campaign.character.attributes.strength}, Agilidade ${campaign.character.attributes.agility}, Intelecto ${campaign.character.attributes.intellect}, Presença ${campaign.character.attributes.presence}, Vitalidade ${campaign.character.attributes.vitality}
- Itens em mãos: ${campaign.character.inventory.map(i => i.name).join(', ')}
- Efeitos ativos: ${campaign.character.statusEffects.join(', ') || 'Nenhum'}

HISTÓRICO RECENTE:
${recentHistory}
${req.playerMemory ? `MEMÓRIA DE PREFERÊNCIAS DO JOGADOR (aprendida localmente com escolhas anteriores):\n${req.playerMemory}\nUse-a para variar ganchos e opções, sem repetir ações já tentadas nem limitar a liberdade do jogador.` : ''}

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
- Faça a classe escolhida mudar oportunidades, reações e soluções disponíveis. Classes ocultas devem demonstrar sua vantagem especial de forma clara, sem tornar o personagem invencível.
- Retome consequências de ações anteriores; não reinicie a cena com descrições genéricas.
- Narre a consequência em 2 a 4 parágrafos envolventes, com cerca de 120 a 200 palavras no total. Use detalhes sensoriais, uma reação concreta à ação e, quando fizer sentido, uma fala ou reação de NPC.
- Coloque "narrative" como o primeiro campo do JSON para que a história possa começar a aparecer enquanto o restante do turno é processado.
- Mantenha os campos mecânicos objetivos: descrição do cenário em até 2 frases e no máximo 3 pontos de interesse; não repita detalhes que já estejam iguais.

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
      const responseStream = await ai.models.generateContentStream({
        model: RPG_MODEL,
        contents: prompt,
        config: {
          systemInstruction: RPG_MASTER_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          maxOutputTokens: 4096,
          ...(RPG_MODEL.startsWith('gemini-3.')
            ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
            : {}),
        },
      });

      let responseText = '';
      const narrativeStream = new JsonNarrativeStream(onNarrativeChunk);
      for await (const chunk of responseStream) {
        const text = chunk.text || '';
        responseText += text;
        narrativeStream.push(text);
      }
      const parsed = JSON.parse(responseText || '{}');

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
      await saveCampaign(campaign);

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
  private static async processFallbackTurn(campaign: Campaign, req: TurnRequest, diceResult: any) {
    const turnNumber = campaign.turnCount + 1;
    const playerAction = req.action || 'Avançar com cautela';
    const className = campaign.character.class.toLocaleLowerCase('pt-BR');
    const normalizedAction = playerAction.toLocaleLowerCase('pt-BR');
    let classFocus = '';
    let hpDelta = 0;
    let manaDelta = 0;
    let xpGained = 20;

    if (className.includes('necromante') && /atac|combate|defend|proteg|luta/.test(normalizedAction)) {
      classFocus = 'Seus esqueletos avançam e distraem os inimigos.';
      xpGained += 5;
    } else if (className.includes('rei demônio') && /intimid|comand|negoci|ameaç|convoc/.test(normalizedAction)) {
      classFocus = 'Os inimigos hesitam quando você dá uma ordem.';
      xpGained += 5;
    } else if (className.includes('herói lendário') && /prote|ajud|aliad|companheir/.test(normalizedAction)) {
      classFocus = 'Sua coragem anima quem está ao seu lado.';
      xpGained += 5;
    } else if (className.includes('santa') && /cur|trat|rez|oraç|abenço|proteger/.test(normalizedAction)) {
      if (campaign.character.manaOrEnergy >= 4 && campaign.character.hp < campaign.character.maxHp) {
        hpDelta = 6;
        manaDelta = -4;
        classFocus = 'Sua luz cura 6 pontos de vida. Você gasta 4 de energia.';
      } else {
        classFocus = 'Sua bênção brilha, mas você precisa de energia e de alguém ferido.';
      }
    } else if (className.includes('rei dragão') && /atac|combate|fogo|dragão|intimid/.test(normalizedAction)) {
      classFocus = 'Seu sopro de fogo faz os inimigos recuarem.';
      xpGained += 5;
    } else if (className.includes('guerreiro') && /atac|golpe|combate|luta|defend/.test(normalizedAction)) {
      classFocus = 'Seu golpe acerta o inimigo e abre espaço.';
      xpGained += 3;
    } else if (className.includes('maga') && /magia|feiti|arcano|runa|conjur/.test(normalizedAction)) {
      classFocus = 'Sua magia funciona e revela uma nova chance.';
      xpGained += 3;
    } else if (className.includes('ladino') && /furtiv|esgueir|escond|invad|tranca|armadilha/.test(normalizedAction)) {
      classFocus = 'Você encontra um caminho escondido.';
      xpGained += 3;
    } else if (className.includes('bardo') && /convers|negoci|persuad|inspir|discurso|canç/.test(normalizedAction)) {
      classFocus = 'Sua fala chama a atenção de quem estava em dúvida.';
      xpGained += 3;
    } else if (className.includes('patrulheiro') && /rastro|explor|trilha|rast|observ|investig/.test(normalizedAction)) {
      classFocus = 'Você vê rastros que os outros não notam.';
      xpGained += 3;
    } else if (className.includes('sacerdote') && /cur|trat|rez|oraç|abenço|maldiç/.test(normalizedAction)) {
      hpDelta = 4;
      classFocus = 'Sua prece cura 4 pontos de vida.';
    }

    const previousHp = campaign.character.hp;
    const previousMana = campaign.character.manaOrEnergy;
    campaign.character.hp = Math.min(campaign.character.maxHp, campaign.character.hp + hpDelta);
    hpDelta = campaign.character.hp - previousHp;
    campaign.character.manaOrEnergy = Math.max(0, Math.min(
      campaign.character.maxManaOrEnergy,
      campaign.character.manaOrEnergy + manaDelta,
    ));
    manaDelta = campaign.character.manaOrEnergy - previousMana;

    const points = campaign.currentScenario.pointsOfInterest;
    const clue = points.length > 0 ? points[(turnNumber - 1) % points.length] : 'uma marca recente no cenário';
    const npc = campaign.currentScenario.currentNPCs[0];
    const focusMatch = req.playerMemory?.match(/Foco mais frequente: (combate|exploração|magia|diplomacia|furtividade)/i);
    const focus = focusMatch?.[1]?.toLocaleLowerCase('pt-BR')
      || (/atac|combate|golpe|luta|arma/.test(normalizedAction) ? 'combate'
        : /magia|feiti|runa|conjur|arcano|ritual/.test(normalizedAction) ? 'magia'
          : /convers|negoci|persuad|convenc|pergunt|dialog/.test(normalizedAction) ? 'diplomacia'
            : /furt|esgueir|escond|silenc|invad/.test(normalizedAction) ? 'furtividade'
              : 'exploração');
    const openings = [
      `Em ${campaign.currentScenario.name}, sua ação muda a situação.`,
      `Algo muda em ${campaign.currentScenario.name} quando você age.`,
      `Sua escolha muda o que acontece em ${campaign.currentScenario.name}.`,
      `Em ${campaign.currentScenario.name}, algo novo acontece.`,
    ];
    const focusReactions: Record<string, string> = {
      combate: 'Seu movimento abre espaço, mas os inimigos ainda estão por perto.',
      exploração: `Você encontra uma pista: ${clue}.`,
      magia: `Sua magia brilha perto de ${clue}.`,
      diplomacia: npc
        ? `${npc.name} responde: “Nem toda verdade é segura por aqui.”`
        : 'Quem está por perto escuta o que você diz.',
      furtividade: `Você avança sem ser visto e encontra ${clue.toLocaleLowerCase('pt-BR')}.`,
    };
    const rollResult = diceResult
      ? diceResult.successLevel === 'crítico'
        ? 'Você tem um grande sucesso e encontra uma nova chance.'
        : diceResult.successLevel === 'desastre'
          ? 'A tentativa falha, mas você vê uma nova pista.'
          : diceResult.successLevel === 'sucesso'
            ? 'Você consegue avançar, mas o perigo continua.'
            : 'Você não consegue agora. Tente outro caminho.'
      : 'A próxima escolha depende de você.';
    const narrative = [
      `${openings[(turnNumber - 1) % openings.length]} ${focusReactions[focus]}${classFocus ? ` ${classFocus}` : ''} ${rollResult}`,
      `O lugar ao seu redor continua presente em cada detalhe: ${campaign.currentScenario.description} ${campaign.currentScenario.atmosphere}`,
      npc
        ? `${npc.name}, ${npc.role.toLocaleLowerCase('pt-BR')}, acompanha o resultado em silêncio antes de voltar os olhos para você. ${clue} permanece como uma pista concreta, mas seu significado ainda depende do próximo passo.`
        : `${clue} permanece como uma pista concreta, enquanto o ambiente guarda sinais de que essa escolha terá consequências além deste instante.`,
    ].join('\n\n');

    const focusActions: Record<string, SuggestedAction> = {
      combate: {
        id: `act_fb_${turnNumber}_focus`,
        title: 'Tomar a iniciativa no confronto',
        description: 'Aproveite o espaço e enfrente os inimigos.',
        attributeCheck: 'strength',
        riskLevel: 'alto',
      },
      exploração: {
        id: `act_fb_${turnNumber}_focus`,
        title: `Investigar: ${clue}`,
        description: 'Procure uma pista e decida se quer segui-la.',
        attributeCheck: 'intellect',
        riskLevel: 'médio',
      },
      magia: {
        id: `act_fb_${turnNumber}_focus`,
        title: 'Testar a energia arcana',
        description: 'Use sua magia para ver o que acontece.',
        attributeCheck: 'intellect',
        riskLevel: 'médio',
      },
      diplomacia: {
        id: `act_fb_${turnNumber}_focus`,
        title: npc ? `Questionar ${npc.name}` : 'Buscar uma trégua',
        description: 'Faça uma pergunta e ouça a resposta.',
        attributeCheck: 'presence',
        riskLevel: 'baixo',
      },
      furtividade: {
        id: `act_fb_${turnNumber}_focus`,
        title: 'Aproveitar a rota discreta',
        description: 'Siga pelo caminho escondido.',
        attributeCheck: 'agility',
        riskLevel: 'médio',
      },
    };
    const suggestions: SuggestedAction[] = [
      focusActions[focus],
      {
        id: `act_fb_${turnNumber}_clue`,
        title: `Examinar ${clue}`,
        description: 'Olhe com atenção e procure uma pista.',
        attributeCheck: 'intellect',
        riskLevel: 'baixo',
      },
      npc
        ? {
            id: `act_fb_${turnNumber}_npc`,
            title: `Falar com ${npc.name}`,
            description: `Pergunte a ${npc.name} o que está acontecendo.`,
            attributeCheck: 'presence',
            riskLevel: 'médio',
          }
        : {
            id: `act_fb_${turnNumber}_route`,
            title: 'Escolher uma rota adiante',
            description: 'Escolha por onde seguir.',
            attributeCheck: 'agility',
            riskLevel: 'médio',
          },
      {
        id: `act_fb_${turnNumber}_class`,
        title: 'Usar uma habilidade especial',
        description: 'Use o que sua classe sabe fazer para mudar a situação.',
        attributeCheck: 'none',
        riskLevel: 'baixo',
      },
    ];

    const historyEntry: TurnHistoryEntry = {
      id: generateId('turn'),
      turnNumber,
      playerAction,
      diceRollResult: diceResult,
      gmNarrative: narrative,
      scenarioName: campaign.currentScenario.name,
      timestamp: new Date().toISOString(),
      consequencesSummary: `${hpDelta ? `HP: +${hpDelta} | ` : ''}${manaDelta ? `Energia: ${manaDelta} | ` : ''}XP: +${xpGained}`,
    };

    campaign.narrationMode = 'offline';
    campaign.character.xp += xpGained;
    campaign.history.push(historyEntry);
    campaign.turnCount = turnNumber;
    campaign.updatedAt = new Date().toISOString();
    campaign.suggestedActions = suggestions;
    await saveCampaign(campaign);

    return {
      campaign,
      turnResult: {
        narrative,
        scenario: campaign.currentScenario,
        suggestedActions: suggestions,
        characterDeltas: {
          hpDelta,
          manaDelta,
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
          gmComment: 'Você tentou com coragem.',
        } : undefined,
        newRumors: ['Há um novo caminho além desta região.'],
      },
    };
  }

  // Explicitly generate a brand new scenario / realm
  static async generateNewScenario(req: GenerateScenarioRequest): Promise<{
    scenario: Scenario;
    travelNarrative: string;
    campaign: Campaign;
  }> {
    const campaign = await getStoredCampaign(req.campaignId);
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
      await saveCampaign(campaign);

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
        description: 'Um lugar alto, cercado por penhascos. Há poças de água que brilham sob as estrelas.',
        atmosphere: 'Faz muito frio e venta bastante.',
        lighting: 'A luz das estrelas reflete no chão.',
        dangerLevel: 3,
        pointsOfInterest: ['Cratera com uma pedra brilhante', 'Círculo de pedras antigas'],
        currentNPCs: [],
        environmentalHazards: ['Vento forte'],
        weatherOrClimate: 'Noite fria e sem nuvens',
      };

      campaign.currentScenario = fallbackScen;
      campaign.narrationMode = 'offline';
      campaign.turnCount += 1;
      const travelNarrative = `Você chega ao ${fallbackScen.name}. O lugar é frio e ventoso. Uma pedra brilhante chama sua atenção.`;

      campaign.history.push({
        id: generateId('turn'),
        turnNumber: campaign.turnCount,
        playerAction: 'Exploração de Novo Cenário',
        gmNarrative: travelNarrative,
        scenarioName: fallbackScen.name,
        timestamp: new Date().toISOString(),
      });
      campaign.updatedAt = new Date().toISOString();
      await saveCampaign(campaign);

      return {
        scenario: fallbackScen,
        travelNarrative,
        campaign,
      };
    }
  }

  // Standard dice roller with GM interpretation
  static async rollDice(req: RollDiceRequest): Promise<{
    diceType: string;
    roll: number;
    modifier: number;
    total: number;
    attribute?: string;
    successLevel: 'crítico' | 'sucesso' | 'falha' | 'desastre';
    narrativeInterpretation: string;
  }> {
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
      const camp = await getStoredCampaign(req.campaignId);
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
