import { useState, type FC } from 'react';
import { Compass, RefreshCw, Sparkles, MapPin, ShieldAlert, Users, CloudRain } from 'lucide-react';

export const ScenarioGenerator: FC = () => {
  const [theme, setTheme] = useState('dark_fantasy');
  const [travelIntent, setTravelIntent] = useState('Explorar ruínas submersas nas profundezas');
  const [explorationType, setExplorationType] = useState<'travel' | 'dungeon_depths' | 'secret_portal' | 'strange_anomaly'>('travel');
  const [scenario, setScenario] = useState<any>(null);
  const [travelNarrative, setTravelNarrative] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/rpg/scenario/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: 'camp_valefrio_starter',
          travelDirection: travelIntent,
          explorationType,
          intent: travelIntent,
        }),
      });
      const data = await res.json();
      if (data.scenario) {
        setScenario(data.scenario);
        setTravelNarrative(data.travelNarrative || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 text-[#efe6d2]">
      <div className="mb-6 p-6 rounded-xl border border-[#3a3626] bg-[#17191a]">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e8c46a22] text-[#e8c46a] border border-[#e8c46a55] flex items-center gap-1">
            <Compass className="w-3.5 h-3.5" /> Geração Dinâmica de Mundos
          </span>
        </div>
        <h1 className="text-2xl font-bold font-serif text-[#efe6d2]">
          Gerador de Cenários Procedurais Infinitos
        </h1>
        <p className="text-[#9a927e] text-sm mt-1">
          Demonstração de como a API cria novos reinos, biomas e passagens a qualquer momento, garantindo que o mundo nunca chegue a um fim.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div>
            <label className="block text-xs font-semibold text-[#e8c46a] mb-1">Tema do Mundo</label>
            <select
              value={theme}
              onChange={e => setTheme(e.target.value)}
              className="w-full bg-[#101211] border border-[#3a3626] rounded-lg p-2.5 text-sm text-[#efe6d2]"
            >
              <option value="dark_fantasy">Fantasia Sombria Medieval</option>
              <option value="cyberpunk">Cyberpunk & Distopia Neon</option>
              <option value="eldritch_horror">Terror Cósmico & Névoa</option>
              <option value="sci_fi">Ficção Científica Espacial</option>
              <option value="post_apocalyptic">Pós-Apocalipse & Ruínas</option>
              <option value="steampunk">Steampunk & Engrenagens</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#e8c46a] mb-1">Tipo de Travessia</label>
            <select
              value={explorationType}
              onChange={e => setExplorationType(e.target.value as any)}
              className="w-full bg-[#101211] border border-[#3a3626] rounded-lg p-2.5 text-sm text-[#efe6d2]"
            >
              <option value="travel">Viagem por Estradas / Trilha</option>
              <option value="dungeon_depths">Descida em Masmorra / Abismo</option>
              <option value="secret_portal">Atravessar Portal Arcano</option>
              <option value="strange_anomaly">Investigar Anomalia Estranha</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#e8c46a] mb-1">Rumo ou Intenção</label>
            <input
              type="text"
              value={travelIntent}
              onChange={e => setTravelIntent(e.target.value)}
              placeholder="Ex: Seguir o rio subterrâneo"
              className="w-full bg-[#101211] border border-[#3a3626] rounded-lg p-2.5 text-sm text-[#efe6d2]"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="px-6 py-2.5 rounded-lg bg-gradient-to-b from-[#c8161d] to-[#6e0a0e] text-[#efe6d2] font-semibold text-sm border border-[#e23a3a] shadow-lg shadow-[#b3141a44] hover:shadow-[#e23a3a66] flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isLoading ? 'Tecendo Cenário com IA...' : 'Gerar Novo Cenário'}
          </button>
        </div>
      </div>

      {travelNarrative && (
        <div className="mb-6 p-5 rounded-xl border border-[#3a3626] bg-[#1d1f1f] text-sm md:text-base leading-relaxed italic text-[#e8c46a] border-l-4 border-l-[#e8c46a]">
          "{travelNarrative}"
        </div>
      )}

      {scenario && (
        <div className="p-6 rounded-xl border border-[#e8c46a44] bg-[#17191a] space-y-4 shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-[#3a3626] pb-4">
            <div>
              <div className="text-xs text-[#9a927e] uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#e8c46a]" /> {scenario.region || 'Região Inexplorada'}
              </div>
              <h2 className="text-2xl font-bold font-serif text-[#efe6d2] mt-0.5">{scenario.name}</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs px-2.5 py-1 rounded-full bg-[#101211] border border-[#3a3626] flex items-center gap-1.5 text-[#9a927e]">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> Perigo: Nv {scenario.dangerLevel || 3}/5
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-[#101211] border border-[#3a3626] text-[#e8c46a]">
                {scenario.lighting || 'Luz Difusa'}
              </span>
            </div>
          </div>

          <p className="text-base text-[#efe6d2] leading-relaxed">
            {scenario.description}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-lg bg-[#101211] border border-[#3a3626]">
              <div className="text-xs font-semibold text-[#e8c46a] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5" /> Atmosfera & Clima
              </div>
              <p className="text-xs text-[#9a927e]">{scenario.atmosphere}</p>
              {scenario.weatherOrClimate && (
                <p className="text-xs text-[#9a927e] mt-1 italic font-serif">Clima: {scenario.weatherOrClimate}</p>
              )}
            </div>

            <div className="p-4 rounded-lg bg-[#101211] border border-[#3a3626]">
              <div className="text-xs font-semibold text-[#e8c46a] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Pontos de Interesse
              </div>
              <ul className="text-xs text-[#efe6d2] space-y-1 list-disc list-inside">
                {(scenario.pointsOfInterest || []).map((poi: string, i: number) => (
                  <li key={i}>{poi}</li>
                ))}
              </ul>
            </div>
          </div>

          {scenario.currentNPCs && scenario.currentNPCs.length > 0 && (
            <div className="p-4 rounded-lg bg-[#101211] border border-[#3a3626]">
              <div className="text-xs font-semibold text-[#e8c46a] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Habitantes / NPCs no Local
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {scenario.currentNPCs.map((npc: any, i: number) => (
                  <div key={i} className="p-2.5 rounded border border-[#2a2820] bg-[#17191a] text-xs">
                    <span className="font-semibold text-[#e8c46a]">{npc.name}</span>{' '}
                    <span className="text-[#9a927e]">({npc.role})</span>
                    <p className="text-[#efe6d2] mt-0.5">{npc.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
