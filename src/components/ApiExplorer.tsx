import { useState, useEffect, type FC } from 'react';
import { 
  Terminal, 
  Send, 
  Copy, 
  Check, 
  Sparkles, 
  Globe, 
  Compass, 
  Dices, 
  BookOpen, 
  RefreshCw,
  Code2
} from 'lucide-react';

interface EndpointDoc {
  method: 'POST' | 'GET' | 'DELETE';
  path: string;
  title: string;
  description: string;
  category: 'Narrador' | 'Campanhas' | 'Cenários' | 'Mecânicas';
  sampleBody?: any;
}

const ENDPOINTS: EndpointDoc[] = [
  {
    method: 'POST',
    path: '/api/rpg/narrate',
    title: 'Mestre Narrador Direto',
    category: 'Narrador',
    description: 'Endpoint direto para jogos (como "Forje sua lenda") e bots. Recebe o estado do herói, mundo e ação, gerando a narrativa literária contínua e 4 novas opções.',
    sampleBody: {
      user: 'Herói: Aldric, Humano Guerreiro. Mundo: Fantasia medieval. Estado: hp=18, local=Masmorra Ancestral. Ação do jogador: Acendo uma tocha e avanço em direção ao som de correntes.',
    },
  },
  {
    method: 'POST',
    path: '/api/rpg/campaign/new',
    title: 'Criar Nova Campanha Infinita',
    category: 'Campanhas',
    description: 'Cria uma nova campanha com cenário procedural inicial, atributos e ganchos de rumores que garantem aventura sem final determinado.',
    sampleBody: {
      title: 'A Queda dos Arcanos de Éter',
      theme: 'dark_fantasy',
      tone: 'gritty',
      language: 'pt-BR',
      character: {
        name: 'Vaelen',
        class: 'Guardião Espectral',
        background: 'Cavaleiro Renegado',
        attributes: { strength: 14, agility: 12, intellect: 13, presence: 11, vitality: 15 },
        startingItem: 'Espada de Ferro Estelar',
      },
      customThemePrompt: 'Mundo pós-convergência planar onde relíquias caídas alteram o clima.',
    },
  },
  {
    method: 'POST',
    path: '/api/rpg/turn',
    title: 'Processar Turno & Consequências',
    category: 'Campanhas',
    description: 'Recebe a ação do jogador e rolagem opcional. A IA avalia os riscos, atualiza o cenário ou transporta para novos ambientes, calcula HP/XP e propõe novos passos.',
    sampleBody: {
      campaignId: 'camp_valefrio_starter',
      action: 'Salto sobre o abismo tentando alcançar a borda oposta segurando na raiz antiga',
      customDiceRoll: {
        roll: 17,
        attribute: 'agility',
      },
    },
  },
  {
    method: 'POST',
    path: '/api/rpg/scenario/generate',
    title: 'Gerar Novo Cenário Procedural',
    category: 'Cenários',
    description: 'Cria um novo cenário, reino ou plano conectado ao mundo existente com iluminação, atmosfera, perigos ambientais e NPCs com voz própria.',
    sampleBody: {
      campaignId: 'camp_valefrio_starter',
      travelDirection: 'Atravessar o portal de quartzo violeta rumo às Profundezas Silenciosas',
      explorationType: 'travel',
      intent: 'Encontrar a fonte do rio de mercúrio místico',
    },
  },
  {
    method: 'POST',
    path: '/api/rpg/dice/roll',
    title: 'Rolador de Dados do Mestre',
    category: 'Mecânicas',
    description: 'Rola d20, d100 ou outros dados com cálculo de modificador de atributos e interpretação do grau de sucesso pelo Mestre.',
    sampleBody: {
      diceType: 'd20',
      modifier: 2,
      attribute: 'agility',
      reason: 'Furtividade ao passar pelo vigia da torre',
    },
  },
  {
    method: 'GET',
    path: '/api/rpg/campaigns',
    title: 'Listar Campanhas Ativas',
    category: 'Campanhas',
    description: 'Retorna a lista de todas as campanhas em andamento com contagem de turnos e sumário.',
  },
  {
    method: 'GET',
    path: '/api/rpg/openapi.json',
    title: 'Especificação OpenAPI 3.0',
    category: 'Mecânicas',
    description: 'Retorna o contrato de API completo em OpenAPI 3.0 para importação no Postman, Insomnia ou geração de SDKs.',
  },
];

export const ApiExplorer: FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointDoc>(ENDPOINTS[0]);
  const [requestBody, setRequestBody] = useState<string>(
    JSON.stringify(ENDPOINTS[0].sampleBody || {}, null, 2)
  );
  const [responseOutput, setResponseOutput] = useState<string | null>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [codeLanguage, setCodeLanguage] = useState<'curl' | 'javascript' | 'python' | 'godot'>('curl');
  const [healthStatus, setHealthStatus] = useState<{ status: string; model: string } | null>(null);

  useEffect(() => {
    // Check health on mount
    fetch('/api/rpg/health')
      .then(res => res.json())
      .then(data => setHealthStatus(data))
      .catch(() => setHealthStatus({ status: 'offline', model: 'indisponível' }));
  }, []);

  const handleSelectEndpoint = (ep: EndpointDoc) => {
    setSelectedEndpoint(ep);
    setRequestBody(ep.sampleBody ? JSON.stringify(ep.sampleBody, null, 2) : '');
    setResponseOutput(null);
    setResponseStatus(null);
    setResponseTime(null);
  };

  const handleExecuteRequest = async () => {
    setIsLoading(true);
    const start = performance.now();
    try {
      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (selectedEndpoint.method === 'POST' && requestBody.trim()) {
        options.body = requestBody;
      }

      const res = await fetch(selectedEndpoint.path, options);
      const elapsed = Math.round(performance.now() - start);
      setResponseTime(elapsed);
      setResponseStatus(res.status);

      const json = await res.json();
      setResponseOutput(JSON.stringify(json, null, 2));
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - start);
      setResponseTime(elapsed);
      setResponseStatus(500);
      setResponseOutput(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  const getCodeSnippet = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://sua-app.com';
    const fullUrl = `${origin}${selectedEndpoint.path}`;

    if (codeLanguage === 'curl') {
      if (selectedEndpoint.method === 'GET') {
        return `curl -X GET "${fullUrl}" \\
  -H "Accept: application/json"`;
      }
      return `curl -X POST "${fullUrl}" \\
  -H "Content-Type: application/json" \\
  -d '${requestBody.replace(/\n/g, '').replace(/\s+/g, ' ')}'`;
    }

    if (codeLanguage === 'javascript') {
      if (selectedEndpoint.method === 'GET') {
        return `const response = await fetch("${fullUrl}");
const data = await response.json();
console.log(data);`;
      }
      return `const response = await fetch("${fullUrl}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(${requestBody})
});
const result = await response.json();
console.log(result);`;
    }

    if (codeLanguage === 'python') {
      if (selectedEndpoint.method === 'GET') {
        return `import requests

response = requests.get("${fullUrl}")
print(response.json())`;
      }
      return `import requests

payload = ${requestBody}
response = requests.post("${fullUrl}", json=payload)
print(response.json())`;
    }

    if (codeLanguage === 'godot') {
      return `# GDScript (Godot 4)
func call_rpg_api():
    var http = HTTPRequest.new()
    add_child(http)
    http.request_completed.connect(_on_completed)
    var url = "${fullUrl}"
    var headers = ["Content-Type: application/json"]
    ${selectedEndpoint.method === 'POST' ? `var body = JSON.stringify(${requestBody})
    http.request(url, headers, HTTPClient.METHOD_POST, body)` : `http.request(url, headers, HTTPClient.METHOD_GET)`}

func _on_completed(result, response_code, headers, body):
    var json = JSON.parse_string(body.get_string_from_utf8())
    print("RPG AI Response:", json)`;
    }

    return '';
  };

  const copyToClipboard = (text: string, format: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 text-[#efe6d2]">
      {/* Header Banner */}
      <div className="mb-6 p-6 rounded-xl border border-[#3a3626] bg-gradient-to-r from-[#17191a] via-[#1d1f1f] to-[#17191a] shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#e8c46a22] text-[#e8c46a] border border-[#e8c46a55] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> API Totalmente Independente & REST
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {healthStatus?.status === 'online' ? `Online · ${healthStatus.model}` : 'Verificando status...'}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-serif text-[#efe6d2]">
              Chronicles RPG Master Engine API
            </h1>
            <p className="text-[#9a927e] text-sm md:text-base mt-1">
              Motor de inteligência artificial de RPG com narrativas infinitas, geração contínua de cenários e respostas adaptativas baseadas nas escolhas do jogador.
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="/api/rpg/openapi.json"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-lg bg-[#101211] border border-[#3a3626] text-xs font-mono hover:border-[#e8c46a] hover:text-[#e8c46a] transition-colors flex items-center gap-1.5"
            >
              <Code2 className="w-4 h-4" /> OpenAPI JSON
            </a>
          </div>
        </div>
      </div>

      {/* Grid: Endpoint list on left, tester on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Endpoints Sidebar */}
        <div className="lg:col-span-4 space-y-3">
          <h2 className="text-xs uppercase tracking-wider text-[#9a927e] font-semibold flex items-center gap-2 px-1">
            <BookOpen className="w-4 h-4 text-[#e8c46a]" /> Endpoints Disponíveis
          </h2>
          <div className="space-y-2">
            {ENDPOINTS.map((ep, idx) => {
              const isSelected = selectedEndpoint.path === ep.path && selectedEndpoint.method === ep.method;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectEndpoint(ep)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'border-[#e8c46a] bg-[#1d1f1f] shadow-md shadow-[#e8c46a15]'
                      : 'border-[#3a3626] bg-[#101211] hover:border-[#9a927e] hover:bg-[#17191a]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                        ep.method === 'POST'
                          ? 'bg-[#b3141a33] text-[#fca5a5] border border-[#e23a3a44]'
                          : 'bg-blue-950/60 text-blue-300 border border-blue-500/40'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className="text-xs font-mono text-[#9a927e] truncate">{ep.path}</span>
                  </div>
                  <div className="font-semibold text-sm text-[#efe6d2]">{ep.title}</div>
                </button>
              );
            })}
          </div>

          {/* Golden Rules Box */}
          <div className="p-4 rounded-xl border border-[#3a3626] bg-[#101211] text-xs text-[#9a927e] space-y-2">
            <div className="font-semibold text-[#e8c46a] flex items-center gap-1.5">
              <Compass className="w-4 h-4" /> Regra do Mestre Infinito
            </div>
            <p>
              A API foi desenhada com restrições explícitas de prompts: ela <strong>NUNCA</strong> conclui com "Fim" ou "Game Over". Cada resolução ou queda do personagem desencadeia novos mistérios, passagens ou consequências, mantendo o jogo eternamente aberto.
            </p>
          </div>
        </div>

        {/* Interactive Request & Response Panel */}
        <div className="lg:col-span-8 space-y-6">
          {/* Endpoint Details Card */}
          <div className="p-5 rounded-xl border border-[#3a3626] bg-[#17191a]">
            <div className="flex items-center gap-3 mb-2">
              <span
                className={`px-2.5 py-1 rounded font-mono text-xs font-bold ${
                  selectedEndpoint.method === 'POST'
                    ? 'bg-[#b3141a33] text-[#fca5a5] border border-[#e23a3a44]'
                    : 'bg-blue-950/60 text-blue-300 border border-blue-500/40'
                }`}
              >
                {selectedEndpoint.method}
              </span>
              <span className="font-mono text-sm text-[#e8c46a]">{selectedEndpoint.path}</span>
            </div>
            <h2 className="text-lg font-bold text-[#efe6d2]">{selectedEndpoint.title}</h2>
            <p className="text-[#9a927e] text-sm mt-1">{selectedEndpoint.description}</p>
          </div>

          {/* Request Body (if POST) */}
          {selectedEndpoint.method === 'POST' && (
            <div className="p-5 rounded-xl border border-[#3a3626] bg-[#17191a]">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-[#e8c46a] uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" /> Corpo da Requisição (JSON Payload)
                </label>
                <button
                  onClick={() => setRequestBody(JSON.stringify(selectedEndpoint.sampleBody || {}, null, 2))}
                  className="text-xs text-[#9a927e] hover:text-[#e8c46a] flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Restaurar Padrão
                </button>
              </div>
              <textarea
                value={requestBody}
                onChange={e => setRequestBody(e.target.value)}
                rows={8}
                className="w-full bg-[#101211] border border-[#3a3626] rounded-lg p-3 font-mono text-xs text-[#efe6d2] focus:border-[#e8c46a] focus:outline-none focus:ring-1 focus:ring-[#e8c46a]"
              />
            </div>
          )}

          {/* Action Trigger */}
          <div className="flex justify-end">
            <button
              onClick={handleExecuteRequest}
              disabled={isLoading}
              className="px-6 py-3 rounded-lg bg-gradient-to-b from-[#c8161d] to-[#6e0a0e] text-[#efe6d2] font-semibold text-sm border border-[#e23a3a] shadow-lg shadow-[#b3141a44] hover:shadow-[#e23a3a66] flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Processando com IA...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Executar Requisição (Testar ao Vivo)
                </>
              )}
            </button>
          </div>

          {/* Response Inspector */}
          {responseStatus !== null && (
            <div className="p-5 rounded-xl border border-[#3a3626] bg-[#17191a]">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-[#e8c46a] uppercase tracking-wider">
                    Resposta do Servidor
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                      responseStatus >= 200 && responseStatus < 300
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
                        : 'bg-red-950/80 text-red-400 border border-red-500/40'
                    }`}
                  >
                    HTTP {responseStatus}
                  </span>
                  {responseTime !== null && (
                    <span className="text-xs text-[#9a927e] font-mono">{responseTime} ms</span>
                  )}
                </div>
                {responseOutput && (
                  <button
                    onClick={() => copyToClipboard(responseOutput, 'response')}
                    className="text-xs text-[#9a927e] hover:text-[#e8c46a] flex items-center gap-1"
                  >
                    {copiedFormat === 'response' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedFormat === 'response' ? 'Copiado!' : 'Copiar JSON'}
                  </button>
                )}
              </div>
              <pre className="bg-[#101211] border border-[#3a3626] rounded-lg p-3 font-mono text-xs text-[#efe6d2] overflow-x-auto max-h-96">
                {responseOutput}
              </pre>
            </div>
          )}

          {/* Ready-to-copy code snippets */}
          <div className="p-5 rounded-xl border border-[#3a3626] bg-[#17191a]">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#e8c46a] uppercase tracking-wider">
                  Código de Integração
                </span>
                <div className="flex gap-1 bg-[#101211] p-1 rounded border border-[#3a3626]">
                  {(['curl', 'javascript', 'python', 'godot'] as const).map(lang => (
                    <button
                      key={lang}
                      onClick={() => setCodeLanguage(lang)}
                      className={`px-2 py-0.5 rounded text-xs font-mono uppercase ${
                        codeLanguage === lang
                          ? 'bg-[#e8c46a22] text-[#e8c46a] font-bold'
                          : 'text-[#9a927e] hover:text-[#efe6d2]'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(getCodeSnippet(), 'snippet')}
                className="text-xs text-[#9a927e] hover:text-[#e8c46a] flex items-center gap-1"
              >
                {copiedFormat === 'snippet' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedFormat === 'snippet' ? 'Copiado!' : 'Copiar Código'}
              </button>
            </div>
            <pre className="bg-[#101211] border border-[#3a3626] rounded-lg p-3 font-mono text-xs text-[#efe6d2] overflow-x-auto">
              {getCodeSnippet()}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
