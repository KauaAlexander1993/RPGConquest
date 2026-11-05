import React, { useEffect, useRef } from 'react';

interface ForjeSuaLendaProps {
  onOpenApiExplorer?: () => void;
  onOpenVisualCreator?: () => void;
  onOpenQuestJournal?: () => void;
  onOpenInventory?: () => void;
}

export const ForjeSuaLenda: React.FC<ForjeSuaLendaProps> = ({ 
  onOpenApiExplorer, 
  onOpenVisualCreator,
  onOpenQuestJournal,
  onOpenInventory
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // We inject the game HTML and run the game initialization
    container.innerHTML = `
<style>
.forje-root {
  --bg: #0b0d0c;
  --bg2: #17191a;
  --panel: #1d1f1f;
  --line: #3a3626;
  --gold: #e8c46a;
  --txt: #efe6d2;
  --mut: #9a927e;
  --red: #b3141a;
  --red2: #6e0a0e;
  box-sizing: border-box;
  color: var(--txt);
  font-family: 'Crimson Text', Georgia, serif;
  font-size: 19px;
  position: relative;
  min-height: calc(100vh - 65px);
  padding-bottom: 90px;
}
.forje-root * { box-sizing: border-box; }
.forje-root h1, .forje-root h2, .forje-root .cz { font-family: 'Cinzel', Georgia, serif; }
.forje-root button { font-family: inherit; color: inherit; cursor: pointer; }
.forje-root .screen { display: none; min-height: 100%; max-width: 680px; margin: 0 auto; padding: 18px; }
.forje-root .screen.on { display: flex; flex-direction: column; }
.forje-root .eyebrow { color: var(--gold); text-align: center; letter-spacing: .12em; text-transform: uppercase; font-size: 16px; margin-top: 10px; }
.forje-root h1 { text-align: center; font-size: 34px; margin: 6px 0 10px; }
.forje-root .div { height: 2px; background: linear-gradient(90deg, transparent, var(--gold), transparent); margin: 6px 0 18px; }
.forje-root ul.feat { list-style: none; padding: 0; margin: 0 0 18px; }
.forje-root ul.feat li { padding: 6px 0 6px 28px; position: relative; font-size: 20px; }
.forje-root ul.feat li:before { content: "›"; position: absolute; left: 4px; color: var(--gold); font-weight: 700; }
.forje-root .opts { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 14px; }
.forje-root .opt { background: var(--panel); border: 2px solid #34312a; border-radius: 8px; padding: 12px 8px; text-align: center; }
.forje-root .opt.sel { border-color: var(--gold); box-shadow: 0 0 0 1px var(--gold) inset; }
.forje-root .opt b { display: block; font-family: 'Cinzel', serif; font-size: 16px; color: var(--gold); }
.forje-root .opt small { color: var(--mut); font-size: 15px; }
.forje-root label { color: var(--gold); font-family: 'Cinzel', serif; font-size: 14px; letter-spacing: .08em; display: block; margin: 12px 0 6px; }
.forje-root input, .forje-root textarea, .forje-root select { width: 100%; background: #101211; border: 1px solid var(--line); border-radius: 8px; color: var(--txt); font: inherit; padding: 10px; }
.forje-root .cta { background: linear-gradient(#c8161d, var(--red2)); border: 2px solid #e23a3a; border-radius: 6px; padding: 14px; font-family: 'Cinzel', serif; font-weight: 700; font-size: 19px; letter-spacing: .06em; text-transform: uppercase; box-shadow: 0 0 18px #b3141a88; margin-top: 10px; width: 100%; transition: all 0.2s; }
.forje-root .cta:hover { transform: translateY(-1px); box-shadow: 0 0 24px #e23a3aaa; }
.forje-root .cta:disabled { opacity: .5; cursor: not-allowed; }
.forje-root .ghost { background: none; border: 1px solid var(--line); border-radius: 6px; padding: 6px 12px; font-size: 16px; color: var(--mut); transition: all 0.2s; }
.forje-root .ghost:hover { border-color: var(--gold); color: var(--txt); }
.forje-root .top { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding-bottom: 8px; border-bottom: 1px solid var(--line); flex-wrap: wrap; }
.forje-root .top .cz { color: var(--gold); font-size: 15px; }
.forje-root .hud { display: flex; gap: 8px; color: var(--mut); font-size: 16px; flex-wrap: wrap; padding: 8px 0; }
.forje-root .hud span { background: var(--panel); border: 1px solid var(--line); border-radius: 20px; padding: 2px 10px; }
.forje-root #log { flex: 1; overflow-y: auto; padding: 8px 0; min-height: 220px; max-height: 520px; }
.forje-root .n { margin: 0 0 16px; line-height: 1.48; white-space: pre-line; }
.forje-root .me { color: var(--gold); font-style: italic; border-left: 3px solid var(--gold); padding-left: 10px; }
.forje-root .ch { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; }
.forje-root .ch button { background: var(--panel); border: 1px solid var(--gold); border-radius: 8px; padding: 10px; text-align: left; font-size: 18px; transition: all 0.2s; }
.forje-root .ch button:hover { background: #2f2a1b; transform: translateX(3px); }
.forje-root .bar { display: flex; gap: 8px; padding-top: 8px; }
.forje-root .bar input { flex: 1; }
.forje-root .bar button { background: var(--red); border: 1px solid #e23a3a; border-radius: 8px; padding: 0 16px; font-family: 'Cinzel', serif; }
.forje-root .panel { background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: 14px; margin: 10px 0; }
.forje-root .panel h2 { margin: 0 0 8px; font-size: 17px; color: var(--gold); }
.forje-root .panel p, .forje-root .panel li { font-size: 18px; margin: 4px 0; }
.forje-root .dots::after { content: "…"; animation: b 1s infinite; }
@keyframes b { 50% { opacity: .2; } }
.forje-root .map { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.forje-root .map i { background: #101211; border: 1px solid var(--gold); border-radius: 6px; padding: 3px 9px; font-style: normal; font-size: 16px; }
.forje-root .map u { color: var(--gold); text-decoration: none; }
.forje-root .ill { width: 100%; border-radius: 10px; border: 1px solid var(--line); margin-bottom: 8px; display: block; box-shadow: 0 4px 16px rgba(0,0,0,0.5); }
.forje-root .ch button.sel { background: #3a3220; }
.forje-root .opt.hid { border-color: #c46aff; box-shadow: 0 0 12px #c46aff88; }
.forje-root .opt.lock { opacity: .55; border-style: dashed; }
.forje-root .row { display: flex; align-items: center; gap: 8px; padding: 6px 0; }
.forje-root .row span { flex: 1; font-family: 'Cinzel', serif; }
.forje-root .row button { width: 40px; height: 36px; border-radius: 8px; border: 1px solid var(--gold); background: var(--panel); font-size: 20px; }
.forje-root .map div { text-align: center; }
.forje-root .map small { display: block; color: var(--mut); }
.forje-root .sy { color: #8fe0ff; font-family: 'Cinzel', serif; font-size: 15px; border: 1px dashed #5ee0ff; border-radius: 8px; padding: 8px; white-space: pre-line; background: rgba(94, 224, 255, 0.05); }
.forje-root .hl { background: rgba(232,196,106,.3); border-radius: 4px; color: #fff; box-shadow: 0 0 0 2px rgba(232,196,106,.3); }
.forje-root .chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 6px; }
.forje-root .chip { background: var(--panel); border: 1px solid #34312a; border-radius: 20px; padding: 6px 12px; font-size: 17px; }
.forje-root .chip.sel { border-color: var(--gold); color: var(--gold); box-shadow: 0 0 0 1px var(--gold) inset; }
.forje-root #tabs { position: fixed; left: 0; right: 0; bottom: 0; display: none; background: #0a0a0af6; border-top: 1px solid var(--line); padding: 4px 0 calc(4px + env(safe-area-inset-bottom,0px)); z-index: 50; backdrop-filter: blur(8px); }
.forje-root #tabs.on { display: flex; }
.forje-root #tabs button { flex: 1; background: none; border: 0; display: flex; flex-direction: column; align-items: center; color: var(--mut); font-family: Cinzel, serif; font-size: 12px; padding: 6px 0; }
.forje-root #tabs button span { font-size: 22px; line-height: 1.2; }
.forje-root #tabs button.a { color: var(--gold); background: linear-gradient(#e8c46a22, transparent); }
.forje-root .hb { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.forje-root .logo { width: 42px; height: 42px; border-radius: 10px; background: linear-gradient(#c8161d, #6e0a0e); display: flex; align-items: center; justify-content: center; font-size: 24px; border: 1px solid #e23a3a; box-shadow: 0 0 14px rgba(200, 22, 29, 0.4); }
.forje-root .hb h2 { margin: 0; flex: 1; font-size: 24px; color: var(--gold); }
.forje-root .pill { background: var(--panel); border: 1px solid var(--line); border-radius: 20px; padding: 4px 12px; font-size: 15px; color: var(--gold); }
.forje-root .ban { border-radius: 14px; padding: 36px 16px 20px; text-align: center; background: radial-gradient(ellipse at 50% 0, #6e0a0e99, transparent 70%), linear-gradient(#1d1a14, #0b0d0c); border: 1px solid var(--line); }
.forje-root .ban h1 { font-size: 30px; margin: 0 0 6px; }
.forje-root .ban p { margin: 0 0 14px; color: var(--mut); }
.forje-root .ex { background: none; border: 0; color: var(--gold); font-family: Cinzel, serif; font-size: 20px; letter-spacing: .12em; border-bottom: 2px solid var(--gold); padding: 4px 10px; }
.forje-root .row2 { display: flex; gap: 10px; overflow-x: auto; scroll-snap-type: x mandatory; padding: 4px 0 10px; }
.forje-root .cd { flex: 0 0 62%; max-width: 230px; scroll-snap-align: start; border-radius: 12px; border: 1px solid var(--line); padding: 0; overflow: hidden; background: var(--panel); text-align: left; }
.forje-root .cd .im { height: 110px; display: flex; align-items: center; justify-content: center; font-size: 48px; }
.forje-root .cd b { display: block; padding: 8px 10px 0; font-family: Cinzel, serif; color: var(--gold); font-size: 15px; }
.forje-root .cd small { display: block; padding: 2px 10px 10px; color: var(--mut); font-size: 14px; }
.forje-root .sec { font-family: Cinzel, serif; font-size: 20px; margin: 16px 0 4px; color: var(--txt); }
.forje-root .bars { display: flex; flex-direction: column; gap: 6px; padding: 8px 0 0; }
.forje-root .bar2 { position: relative; height: 22px; border-radius: 12px; background: #101211; border: 1px solid var(--line); overflow: hidden; }
.forje-root .bar2 i { position: absolute; inset: 0 auto 0 0; transition: width .4s; }
.forje-root .bar2.hp i { background: linear-gradient(#e03a3a, #7a0d12); }
.forje-root .bar2.xp i { background: linear-gradient(#f2d37a, #a07a20); }
.forje-root .bar2 b { position: relative; display: block; text-align: center; font-size: 14px; line-height: 20px; font-family: Cinzel, serif; color: #fff; text-shadow: 0 1px 2px #000; }
.forje-root #dm { position: fixed; inset: 0; background: #000d; display: none; align-items: center; justify-content: center; z-index: 99; padding: 16px; }
.forje-root #dm.on { display: flex; }
.forje-root #dm .dc { background: var(--panel); border: 1px solid var(--gold); border-radius: 14px; padding: 16px; width: 100%; max-width: 420px; text-align: center; }
.forje-root #dm h2 { margin: 0 0 4px; color: var(--gold); }
.forje-root #d20 { width: 140px; height: 140px; margin: 8px auto; }
.forje-root #d20.spin { animation: sp .5s linear infinite; }
.forje-root #dr { min-height: 48px; font-family: Cinzel, serif; font-size: 18px; }
.forje-root #inv li { list-style: none; border-left: 4px solid var(--rc, #777); padding-left: 8px; margin: 6px 0; }
.forje-root #inv li em { font-style: normal; font-size: 13px; color: var(--rc, #777); margin-left: 8px; font-family: Cinzel, serif; }
.forje-root #inv { padding-left: 0; }
.forje-root .slot { display: flex; flex-direction: column; gap: 8px; }
.forje-root .slot .r { display: flex; gap: 8px; }
.forje-root .slot .r button { flex: 1; }
.forje-root #dsm, .forje-root #vz { position: fixed; inset: 0; background: #000d; display: none; align-items: center; justify-content: center; z-index: 99; padding: 16px; }
.forje-root #dsm.on, .forje-root #vz.on { display: flex; }
.forje-root #dsm .dc, .forje-root #vz .dc { background: var(--panel); border: 1px solid var(--gold); border-radius: 14px; padding: 16px; width: 100%; max-width: 460px; max-height: 92vh; overflow: auto; text-align: center; }
.forje-root #dsm h2, .forje-root #vz h2 { margin: 0 0 6px; color: var(--gold); }
.forje-root #dsd { width: 140px; height: 140px; margin: 8px auto; }
.forje-root #dsd.spin { animation: sp .5s linear infinite; }
.forje-root #dsr { min-height: 48px; font-family: Cinzel, serif; font-size: 18px; }
.forje-root #vzi { position: relative; border-radius: 10px; overflow: hidden; margin-bottom: 8px; }
.forje-root #vzi::after { content: ""; position: absolute; inset: 0; box-shadow: inset 0 0 60px 20px #000b; pointer-events: none; }
.forje-root #vzi svg { margin: 0; border: 0; border-radius: 0; animation: kb 12s ease-in-out infinite alternate; }
.forje-root #vzt { font-size: 17px; text-align: left; }
.forje-root #toast { position: fixed; left: 50%; bottom: 100px; transform: translateX(-50%); background: #000c; border: 1px solid var(--gold); color: var(--gold); padding: 8px 16px; border-radius: 20px; font-family: Cinzel, serif; z-index: 120; display: none; }
.forje-root #vmap svg { width: 100%; border-radius: 10px; border: 1px solid var(--line); display: block; }
.forje-root .gal { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.forje-root .gal svg { width: 100%; border-radius: 8px; }
.forje-root .shp { display: flex; flex-direction: column; gap: 8px; }
.forje-root .shp button { background: var(--bg2); border: 1px solid var(--gold); border-radius: 8px; padding: 10px; text-align: left; font-size: 17px; }
.forje-root .cx p { margin: 4px 0; border-bottom: 1px solid #2a2820; padding-bottom: 4px; }
.forje-root .api-badge-glow { background: rgba(232, 196, 106, 0.12); border: 1px solid var(--gold); padding: 4px 10px; border-radius: 14px; font-size: 13px; color: var(--gold); display: inline-flex; align-items: center; gap: 6px; }
</style>

<div class="forje-root">
  <!-- S0: HOME -->
  <div id="s0" class="screen on"></div>

  <!-- S1: CRIAÇÃO -->
  <div id="s1" class="screen">
    <div class="eyebrow">Comece sua jornada</div>
    <h1>Forje sua lenda</h1>
    <div class="div"></div>
    <ul class="feat">
      <li>Mestre IA Nativo (Gemini 3.8 Flash sem chave)</li>
      <li>Histórias infinitas sem fim determinado</li>
      <li>Cenários dinâmicos com gráficos procedurais</li>
      <li>Dados d20 com atributos e consequências reais</li>
      <li>API independente disponível para integração externa</li>
    </ul>
    <label>História</label>
    <div class="opts" id="modes"></div>
    <label>Mundo (destino do portal, no modo Academia)</label>
    <div class="opts" id="worlds"></div>
    <label>Nome do herói</label>
    <input id="nm" placeholder="Ex.: Aldric" maxlength="24">
    <label style="margin-top:18px">Monte sua história</label>
    <div id="plot"></div>
    <button class="cta" id="btnCustomVisual" style="background: linear-gradient(#b8860b, #704214); border-color: #facc15; margin-bottom: 8px;">🎨 Personalizar Aparência Visual 2D (Cabelo, Roupas, Cores)</button>
    <button class="cta" id="go">Criar personagem</button>
    <button class="ghost" id="cfg" style="width:100%;margin-top:10px"></button>
    <button class="ghost" id="cont" style="display:none;margin-top:10px">Continuar aventura salva</button>
  </div>

  <!-- S4: WIZARD PASSOS -->
  <div id="s4" class="screen">
    <div class="top"><span class="cz" id="wt">Criação</span><button class="ghost" id="wx">Cancelar</button></div>
    <div id="wp" style="text-align:center;padding-top:8px"></div>
    <div id="wz" style="flex:1"></div>
    <div class="bar"><button id="wb">Voltar</button><button id="wn" style="flex:1">Avançar</button></div>
  </div>

  <!-- S2: AVENTURA -->
  <div id="s2" class="screen">
    <div class="top">
      <span class="cz" id="ttl">Aventura</span>
      <span>
        <button class="ghost" id="bAvatar" title="Personalizar Visual 2D">🎨 Herói</button>
        <button class="ghost" id="bQuests" title="Diário de Missões">📜 Missões</button>
        <button class="ghost" id="bInv" title="Gerenciar Mochila & Inventário">🎒 Mochila</button>
        <button class="ghost" id="bAmbient" title="Ligar/Desligar Som Ambiente Imersivo">🌿 Som</button>
        <button class="ghost" id="bViz">🖼</button>
        <button class="ghost" id="bVoz">🔇</button>
        <button class="ghost" id="bPlay">▶</button>
        <button class="ghost" id="bCfg">⚙</button>
        <button class="ghost" id="bMem">Diário</button>
        <button class="ghost" id="bExit">Sair</button>
      </span>
    </div>
    <div class="hud" id="hud"></div>
    <div id="log"></div>
    <div class="ch" id="ch"></div>
    <div class="bar">
      <input id="act" placeholder="O que você faz?" autocomplete="off">
      <button id="dice">🎲</button>
      <button id="send">Enviar</button>
    </div>
  </div>

  <!-- S5: CONFIGURAÇÃO NARRADOR -->
  <div id="s5" class="screen">
    <div class="top"><span class="cz">⚙ Narrador (IA)</span><button class="ghost" id="cfBack">Voltar</button></div>
    <div class="panel">
      <h2>Quem narra a sua história?</h2>
      <p id="cfHint"></p>
    </div>
    <label>Fonte do narrador</label>
    <select id="cfP">
      <option value="native">👑 Chronicles AI (API Nativa Integrada - Gemini 3.8 Flash)</option>
      <option value="off">Mestre offline (sem internet, modo regras)</option>
      <option value="gemini">Google Gemini (chave própria)</option>
      <option value="openai">OpenAI / OpenRouter / Groq (compatível)</option>
    </select>
    <div id="cfK"><label>Chave de API</label><input id="cfKey" type="password" placeholder="Cole sua chave aqui" autocomplete="off"></div>
    <div id="cfM"><label>Modelo (opcional)</label><input id="cfMod" placeholder="deixe vazio para o padrão"></div>
    <div id="cfB"><label>URL base (só para OpenAI-compatível)</label><input id="cfBase" placeholder="https://api.openai.com/v1"></div>
    <button class="cta" id="cfT">Testar e salvar</button>
    <p id="cfS" style="min-height:24px"></p>
    <div class="panel" style="margin-top:14px">
      <h2>🔌 API Totalmente Independente</h2>
      <p style="font-size:15px;color:var(--mut);line-height:1.4">
        Esta inteligência artificial funciona em segundo plano como uma API REST independente (<code>/api/rpg/...</code>). Qualquer jogo, bot de Discord, Unity, Godot ou script pode consumi-la diretamente!
      </p>
      <button class="ghost" id="btnGoApi" style="width:100%;margin-top:8px">⚡ Abrir API Explorer & Documentação</button>
    </div>
  </div>

  <!-- S3: DIÁRIO -->
  <div id="s3" class="screen">
    <div class="top"><span class="cz">Diário do herói</span><button class="ghost" id="bBack">Voltar</button></div>
    <div class="panel" style="background: linear-gradient(135deg, #1d1a14, #121413); border-color: #e8c46a66;">
      <h2>📜 Diário de Missões & Destinos</h2>
      <p style="font-size:15px;color:var(--mut);line-height:1.4">Acompanhe objetivos principais, tarefas secundárias, pistas e anotações geradas em tempo real pela IA.</p>
      <button class="cta" id="btnS3Quests" style="margin-top:8px;width:100%">Abrir Diário de Missões Completo</button>
    </div>
    <div class="panel"><h2>Herói</h2><div id="sheet" style="overflow:hidden"></div></div>
    <div class="panel"><h2>Mapa-múndi</h2><div class="map" id="map"></div><div id="vmap"></div><div id="vmi" style="margin-top:8px"></div></div>
    <div class="panel" style="background: linear-gradient(135deg, #141618, #101211); border-color: #38bdf855;">
      <h2>🎒 Inventário & Equipamentos</h2>
      <ul id="inv"></ul>
      <button class="cta" id="btnS3Inv" style="margin-top:8px;width:100%;background:linear-gradient(#0284c7,#0369a1);border-color:#38bdf8">Abrir Gerenciador de Inventário Completo</button>
    </div>
    <div class="panel"><h2>Códice</h2><div class="chips" id="cdt"></div><div id="cdb" class="cx"></div></div>
    <div class="panel"><h2>Loja de cristais</h2><div id="shp" class="shp"></div></div>
    <div class="panel">
      <h2>Narração por voz</h2>
      <label>Narrador</label><select id="vn"></select>
      <label>Personagens (diálogos)</label><select id="vd"></select>
      <label>Velocidade</label><input type="range" id="vr" min="0.7" max="1.4" step="0.05" value="1">
      <button class="ghost" id="vt" style="margin-top:8px">Testar voz</button>
      <p id="vnote" style="font-size:15px;color:var(--mut)"></p>
    </div>
    <div class="panel"><h2>Sistema</h2><div id="sys"></div></div>
    <div class="panel"><h2>Companheiros</h2><div id="cia"></div></div>
    <div class="panel" id="armyp" style="display:none"><h2>Exército dos Mortos</h2><div id="army"></div></div>
    <div class="panel"><h2>Bestiário</h2><div class="map" id="bes"></div></div>
    <div class="panel"><h2>Memória narrativa</h2><p id="mem"></p></div>
  </div>

  <!-- S6: SLOTS SALVOS -->
  <div id="s6" class="screen"></div>

  <!-- TABS INFERIORES -->
  <div id="tabs">
    <button><span>🏠</span>Início</button>
    <button><span>⚔️</span>Criar</button>
    <button><span>📜</span>Salvos</button>
    <button><span>⚙️</span>Ajustes</button>
  </div>

  <!-- MODAL DADOS -->
  <div id="dm">
    <div class="dc">
      <h2>Teste de dados</h2>
      <label>Atributo</label><div class="chips" id="dA"></div>
      <label>Dificuldade (CD)</label><div class="chips" id="dD"></div>
      <div id="d20">
        <svg viewBox="-50 -50 100 100">
          <polygon points="0,-46 40,-23 40,23 0,46 -40,23 -40,-23" fill="#6e0a0e" stroke="#e8c46a" stroke-width="3"/>
          <polygon points="0,-46 40,23 -40,23" fill="none" stroke="#e8c46a55" stroke-width="1.5"/>
          <text id="dn" y="9" text-anchor="middle" font-size="28" font-family="Cinzel,serif" fill="#fff">20</text>
        </svg>
      </div>
      <p id="dr"></p>
      <button class="cta" id="dGo">Rolar d20</button>
      <button class="ghost" id="dX" style="margin-top:8px">Cancelar</button>
    </div>
  </div>

  <!-- MODAL TESTE DE MORTE -->
  <div id="dsm">
    <div class="dc">
      <h2>☠ Teste de morte</h2>
      <p>O herói caiu. Um único d20 decide: 10 ou mais e ele se levanta.</p>
      <div id="dsd">
        <svg viewBox="-50 -50 100 100">
          <polygon points="0,-46 40,-23 40,23 0,46 -40,23 -40,-23" fill="#6e0a0e" stroke="#e8c46a" stroke-width="3"/>
          <polygon points="0,-46 40,23 -40,23" fill="none" stroke="#e8c46a55" stroke-width="1.5"/>
          <text id="dsn" y="9" text-anchor="middle" font-size="28" font-family="Cinzel,serif" fill="#fff">20</text>
        </svg>
      </div>
      <p id="dsr"></p>
      <button class="cta" id="dsGo">Rolar contra a morte</button>
      <button class="ghost" id="dsRe" style="display:none;margin-top:8px">Rerrolar (2 💎)</button>
    </div>
  </div>

  <!-- MODAL VISUALIZAR CENA -->
  <div id="vz">
    <div class="dc">
      <h2>🖼 Visualizar cena</h2>
      <div id="vzi"></div>
      <p id="vzt"></p>
      <button class="cta" id="vzS">Guardar na galeria</button>
      <button class="ghost" id="vzD" style="margin-top:8px">Baixar PNG</button>
      <button class="ghost" id="vzX" style="margin-top:8px">Fechar</button>
    </div>
  </div>

  <div id="toast"></div>
</div>
`;

    // Hook up external API Explorer navigation
    const btnGoApi = container.querySelector('#btnGoApi');
    if (btnGoApi && onOpenApiExplorer) {
      btnGoApi.addEventListener('click', onOpenApiExplorer);
    }

    // Hook up 2D Visual Character Creator
    const btnCustomVisual = container.querySelector('#btnCustomVisual');
    if (btnCustomVisual && onOpenVisualCreator) {
      btnCustomVisual.addEventListener('click', onOpenVisualCreator);
    }
    const bAvatar = container.querySelector('#bAvatar');
    if (bAvatar && onOpenVisualCreator) {
      bAvatar.addEventListener('click', onOpenVisualCreator);
    }

    // Hook up Quest Journal with page flip sound
    const bQuests = container.querySelector('#bQuests');
    if (bQuests && onOpenQuestJournal) {
      bQuests.addEventListener('click', () => {
        if ((window as any).soundFX) (window as any).soundFX.playPageFlip();
        onOpenQuestJournal();
      });
    }
    const btnS3Quests = container.querySelector('#btnS3Quests');
    if (btnS3Quests && onOpenQuestJournal) {
      btnS3Quests.addEventListener('click', () => {
        if ((window as any).soundFX) (window as any).soundFX.playPageFlip();
        onOpenQuestJournal();
      });
    }

    // Hook up Inventory Manager
    const bInv = container.querySelector('#bInv');
    if (bInv && onOpenInventory) {
      bInv.addEventListener('click', () => {
        if ((window as any).soundFX) (window as any).soundFX.playEquipItem();
        onOpenInventory();
      });
    }
    const btnS3Inv = container.querySelector('#btnS3Inv');
    if (btnS3Inv && onOpenInventory) {
      btnS3Inv.addEventListener('click', () => {
        if ((window as any).soundFX) (window as any).soundFX.playEquipItem();
        onOpenInventory();
      });
    }

    // Hook up Ambient Sound toggle button
    const bAmbient = container.querySelector('#bAmbient');
    if (bAmbient) {
      bAmbient.addEventListener('click', () => {
        if ((window as any).soundFX) {
          const active = (window as any).soundFX.toggleAmbient('floresta');
          bAmbient.textContent = active ? '🌿 Som: ON' : '🔇 Som: OFF';
        }
      });
    }

    // Now execute the embedded RPG engine code
    // Dynamically create script so it runs within the scope of container
    const scriptEl = document.createElement('script');
    scriptEl.textContent = `
(function() {
  const root = document.querySelector('.forje-root');
  if (!root) return;

  function getHeroAvatar() {
    try {
      const saved = localStorage.getItem('forje_visual_avatar');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return {
      skinColor: '#f1d5b0',
      hairStyle: 'curto',
      hairColor: '#2b1b17',
      clothingStyle: 'armadura',
      clothingColor: '#8a2b2b',
      weapon: 'espada',
      eyeColor: '#38bdf8'
    };
  }

  const $ = sel => {
    if (!sel || !root) return null;
    try {
      if (typeof sel !== 'string') return sel;
      let s = sel.trim();
      if (s.startsWith('##')) {
        s = s.replace(/^#+/, '#');
      } else if (!s.startsWith('#') && !s.startsWith('.') && !s.includes(' ') && !s.includes('>') && !s.includes('[')) {
        s = '#' + s;
      }
      return root.querySelector(s);
    } catch (e) {
      return null;
    }
  };
  const el = (t, c, x) => {
    const e = document.createElement(t);
    if (c) e.className = c;
    if (x != null) e.textContent = x;
    return e;
  };

  const WORLDS = [
    ["Fantasia medieval","Reinos, dragões e magia antiga",["#14213d","#3b2f4a","#10190f","#f2c14e"]],
    ["Terror gótico","Névoa, maldições e segredos",["#0d0f14","#2a2233","#0b0b0e","#c9d6c9"]],
    ["Sci-fi","Estações espaciais e planetas distantes",["#050a1f","#2b1b5a","#1a2a4a","#5ee0ff"]],
    ["Piratas","Mares, tesouros e traições",["#1c3b5a","#e0925a","#0e2a40","#ffd27a"]],
    ["Cyberpunk","Neon, corporações e hackers",["#10002b","#ff2a8a","#14081f","#00f0ff"]],
    ["Faroeste sombrio","Pistoleiros, ouro e assombrações",["#5a2d12","#e8a35a","#3b1f0e","#fff0c0"]],
    ["Saga nórdica","Gelo, runas e deuses antigos",["#0b1d33","#4a7a9a","#1a2a38","#9ff0d0"]],
    ["Japão feudal","Samurais, espíritos e clãs",["#2b0f1a","#e0675a","#1a0a10","#fff2e0"]],
    ["Pós-apocalipse","Ruínas, sobreviventes e mutações",["#2a2a1a","#8a7a3a","#1b1a10","#e8d27a"]],
    ["Mitologia grega","Deuses, monstros e odisseias",["#1a3a6a","#f0c880","#3a4a5a","#fff8e0"]],
    ["Steampunk","Vapor, engrenagens e dirigíveis",["#2a1a10","#b87333","#1a1208","#ffd08a"]],
    ["Atlântida submersa","Cidades de coral sob as ondas",["#04283f","#1a8a9a","#021a2a","#9ff5ff"]],
    ["Noite dos vampiros","Clãs, sangue e eternidade",["#1a0508","#6e0a1e","#0b0205","#ffb0b8"]],
    ["Terra dos dinossauros","Selva perdida no tempo",["#10240f","#6aa02a","#0a1608","#ffe08a"]],
    ["Egito dos faraós","Areia, pirâmides e maldições",["#3a2a0e","#e0a83a","#1f1608","#fff0b0"]],
    ["Reino feérico","Fadas, glamour e pactos",["#1f1040","#c46aff","#0e0824","#ffd0ff"]],
    ["Academia de magia","Feitiços, rivais e segredos",["#101a3a","#6a7ae0","#080d20","#ffe9a0"]],
    ["Magia urbana","Mistérios sobrenaturais na cidade moderna",["#14141f","#4a5a8a","#0a0a12","#ffd27a"]],
    ["Mundo dos sonhos","Pesadelos e paisagens impossíveis",["#10102a","#8a5ae0","#06061a","#d0e8ff"]],
    ["Era dos cavaleiros","Juramentos, torneios e dragões",["#1c2a3a","#c0c0d0","#0e151e","#ffe9a0"]],
    ["Ilhas flutuantes","Arquipélago no céu, pontes de vento",["#0d3a6a","#8ad0ff","#0a2540","#fff4c0"]],
    ["Solarpunk Verdejante","Harmonia ecológica, autômatos solares e flores luminescentes",["#064e3b","#10b981","#022c22","#6ee7b7"]],
    ["Mundo Oco dos Fungos","Esporos fluorescentes, florestas subterrâneas e insetos titãs",["#3b0764","#a855f7","#1e1b4b","#e9d5ff"]],
    ["Guerra Cósmica Mecha","Titãs mecânicos, frotas estelares e reatores de antimatéria",["#1e1b4b","#6366f1","#0f172a","#93c5fd"]],
    ["Abismo Lovecraftiano","Monólitos ciclópicos, horrores ancestrais e segredos cósmicos",["#052e16","#047857","#022c22","#86efac"]],
    ["Idade do Gelo Eterna","Geleiras infindas, feras primitivas e fogueiras rúnicas",["#082f49","#0284c7","#0f172a","#bae6fd"]],
    ["Corte Celestial & Deuses","Palácios de nuvens, auréolas divinas e julgamentos sagrados",["#451a03","#d97706","#1c1917","#fde68a"]],
    ["Carnaval Sombrio & Ilusões","Tendas espectrais, marionetes vivas e labirintos de espelhos",["#4c0519","#e11d48","#1f1f1f","#fecdd3"]],
    ["Mundo Relógio de Bronze","Engrenagens planetárias, rio temporal e ordens mecânicas",["#3f2e16","#b45309","#1c1917","#fed7aa"]]
  ];

  const GAME_MODES = [
    ["⚔️ Aventura Livre", "Explore um mundo aberto sem limites com escolhas absolutas"],
    ["🎓 Academia Isekai", "Formatura mágica, despertar do Sistema de Status e portal místico"],
    ["🕵️ Detetive & Investigação", "Mistérios sombrios, assassinatos rituais, pistas e dedução"],
    ["🏕 Sobrevivência Implacável", "Recursos escassos, ferimentos severos, clima hostil e abrigo"],
    ["🐉 Caçador de Monstros", "Rastreamento de bestas colossais e forja de armaduras raras"],
    ["🗼 Torre Infinita dos Desafios", "Andares procedurais infinitos com guardiões e relíquias míticas"],
    ["👑 Guerra de Facções & Política", "Diplomacia, intrigas de corte, espiões e controle territorial"],
    ["👁 Terror Psicológico Cósmico", "Sanidade em risco, segredos proibidos e entidades celestes"],
    ["🕊 Caminho Diplomata / Pacifista", "Resolver todos os conflitos com astúcia, palavras e empatia"],
    ["🏰 Senhor de Feudo & Conquista", "Construa seu assentamento, lidere tropas e erga fortificações"]
  ];

  let S = null, world = 0, busy = false, mode = 0;
  const KEY = "forje-save";
  const SL = "forje-slots";

  function show(id) {
    root.querySelectorAll(".screen").forEach(e => e.classList.toggle("on", e.id === id));
    const m = { s0: 0, s1: 1, s6: 2, s5: 3 };
    const on = id in m;
    $("#tabs").classList.toggle("on", on);
    [...$("#tabs").children].forEach((b, i) => b.classList.toggle("a", m[id] === i));
    if (id === "s0") home();
    if (id === "s6") saves();
    window.scrollTo(0, 0);
  }

  function pick(elObj, arr, cb) {
    if (!elObj) return;
    elObj.innerHTML = "";
    arr.forEach((a, i) => {
      const d = document.createElement("button");
      d.className = "opt" + (i === 0 ? " sel" : "");
      d.innerHTML = "<b></b><small></small>";
      d.children[0].textContent = a[0];
      d.children[1].textContent = a[1];
      d.onclick = () => {
        [...elObj.children].forEach(c => c.classList.remove("sel"));
        d.classList.add("sel");
        cb(i);
      };
      elObj.appendChild(d);
    });
  }

  function slots() {
    try { return JSON.parse(localStorage.getItem(SL) || "{}"); } catch(e) { return {}; }
  }
  function wslots(o) {
    try { localStorage.setItem(SL, JSON.stringify(o)); } catch(e) {}
  }
  function save() {
    if (S) {
      if (!S.sid) S.sid = "s" + Date.now();
      const o = slots();
      o[S.sid] = { S: S, ts: Date.now() };
      wslots(o);
      try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e) {}
    }
  }
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch(e) { return null; }
  }
  const list = () => Object.values(slots()).sort((a, b) => b.ts - a.ts);

  // CONFIGURATION: Default to "native"
  const CFGKEY = "forje-cfg";
  let CFG = { prov: "native", key: "", model: "gemini-3.8-flash", base: "" };
  try {
    const loadedCfg = JSON.parse(localStorage.getItem(CFGKEY) || "{}");
    Object.assign(CFG, loadedCfg);
    if (!CFG.prov) CFG.prov = "native";
  } catch(e) {}

  function prov() {
    return CFG.prov || "native";
  }
  function cfSave() {
    try { localStorage.setItem(CFGKEY, JSON.stringify(CFG)); } catch(e) {}
  }

  const CFH = {
    native: "👑 Chronicles AI Nativa: conectada diretamente à API de backend com Gemini 3.8 Flash. Nenhuma chave necessária pelo usuário!",
    off: "O Mestre offline funciona sem internet e sem chave, através do motor procedural de regras e arcos.",
    gemini: "Conexão direta com Google Gemini utilizando chave de API pessoal.",
    openai: "Compatível com OpenAI, OpenRouter, Groq e modelos locais."
  };

  function cfLabel() {
    const p = prov();
    const lbl = {
      native: "👑 Chronicles AI Nativa (Gemini 3.8 Flash)",
      off: "Mestre offline",
      gemini: "Google Gemini (Chave pessoal)",
      openai: "OpenAI / Compatível"
    }[p] || "Chronicles AI";
    if ($("cfg")) $("cfg").textContent = "⚙ Narrador: " + lbl;
  }

  function cfSync() {
    const cfPEl = $("#cfP");
    if (!cfPEl) return;
    const p = cfPEl.value;
    if ($("#cfHint")) $("#cfHint").textContent = CFH[p] || "";
    if ($("#cfK")) $("#cfK").style.display = (p === "off" || p === "native") ? "none" : "block";
    if ($("#cfM")) $("#cfM").style.display = (p === "off" || p === "native") ? "none" : "block";
    if ($("#cfB")) $("#cfB").style.display = p === "openai" ? "block" : "none";
  }

  let cfFrom = "s1";
  function cfOpen(from) {
    cfFrom = from;
    if ($("#cfP")) $("#cfP").value = CFG.prov || "native";
    if ($("#cfKey")) $("#cfKey").value = CFG.key || "";
    if ($("#cfMod")) $("#cfMod").value = CFG.model || "";
    if ($("#cfBase")) $("#cfBase").value = CFG.base || "";
    if ($("#cfS")) $("#cfS").textContent = "";
    cfSync();
    show("s5");
  }

  if ($("#cfP")) $("#cfP").onchange = cfSync;
  if ($("cfg")) $("cfg").onclick = () => cfOpen("s1");
  if ($("#bCfg")) $("#bCfg").onclick = () => cfOpen("s2");
  if ($("#cfBack")) $("#cfBack").onclick = () => {
    cfLabel();
    show(cfFrom);
    if (cfFrom === "s2" && S) render();
  };

  if ($("#cfT")) $("#cfT").onclick = async () => {
    CFG = {
      prov: $("#cfP") ? $("#cfP").value : "native",
      key: $("#cfKey") ? $("#cfKey").value.trim() : "",
      model: $("#cfMod") ? $("#cfMod").value.trim() : "",
      base: $("#cfBase") ? $("#cfBase").value.trim() : "",
    };
    cfSave();
    cfLabel();
    const st = $("#cfS");

    if (CFG.prov === "native") {
      st.textContent = "Testando conexão com a API Chronicles AI...";
      try {
        const res = await fetch("/api/rpg/health");
        const data = await res.json();
        st.textContent = "✔ Conectado com sucesso à API Chronicles AI (" + data.model + "). Pronto para mestrar!";
      } catch (e) {
        st.textContent = "✖ Erro ao contactar a API: " + e.message;
      }
      return;
    }

    if (CFG.prov === "off") {
      st.textContent = "✔ Mestre offline ativo. Pode jogar sem internet.";
      return;
    }

    st.textContent = "Testando conexão...";
    try {
      const r = await callAI("Responda somente com JSON válido.", 'Responda exatamente: {"ok":true,"msg":"pronto"}');
      st.textContent = "✔ Conectado! A IA está pronta para narrar.";
    } catch(e) {
      st.textContent = "✖ Falha: " + e.message + ". O Mestre reserva segue ativo.";
    }
  };

  // NARRATOR CALL
  async function callAI(sys, user) {
    const p = prov();

    // 1. Native Standalone API Call (Preferred & Default)
    if (p === "native") {
      const res = await fetch("/api/rpg/narrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sys, user })
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "HTTP " + res.status);
      }
      const data = await res.json();
      return JSON.stringify(data);
    }

    // 2. Client-provided external Gemini key
    if (p === "gemini") {
      const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(CFG.model || "gemini-2.5-flash") + ":generateContent", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": CFG.key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: sys }] },
          contents: [{ role: "user", parts: [{ text: user }] }],
          generationConfig: { temperature: 1, maxOutputTokens: 3500, responseMimeType: "application/json" }
        })
      });
      const d = await res.json();
      const c = d.candidates && d.candidates[0];
      const tx = ((c && c.content && c.content.parts) || []).map(x => x.text || "").join("");
      if (!tx) throw new Error("Resposta vazia da IA");
      return tx;
    }

    // 3. OpenAI-compatible
    if (p === "openai") {
      const base = (CFG.base || "https://api.openai.com/v1").replace(/\\/+$/, "");
      const res = await fetch(base + "/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + CFG.key },
        body: JSON.stringify({
          model: CFG.model || "gpt-4o-mini",
          temperature: 1,
          max_tokens: 2000,
          messages: [{ role: "system", content: sys }, { role: "user", content: user }]
        })
      });
      const d = await res.json();
      const tx = d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content;
      if (!tx) throw new Error("Resposta vazia");
      return tx;
    }

    throw new Error("Nenhuma IA configurada");
  }

  // Robust JSON parser for AI replies
  function parseJ(t) {
    t = String(t || "").replace(/\`\`\`(?:json)?/gi, "");
    const a = t.indexOf("{");
    if (a < 0) return null;
    let o = "", st = [], q = false, e = false;
    for (let i = a; i < t.length; i++) {
      const c = t[i];
      if (q) {
        if (e) { e = false; o += c; }
        else if (c === "\\\\") { e = true; o += c; }
        else if (c === '"') { q = false; o += c; }
        else if (c === "\\n") { o += "\\\\n"; }
        else if (c === "\\r") {}
        else if (c === "\\t") { o += " "; }
        else o += c;
      } else {
        o += c;
        if (c === '"') q = true;
        else if (c === "{" || c === "[") st.push(c);
        else if (c === "}" || c === "]") {
          st.pop();
          if (!st.length) break;
        }
      }
    }
    if (q) o += '"';
    o = o.replace(/,\\s*$/, "");
    while (st.length) { o += st.pop() === "{" ? "}" : "]"; }
    o = o.replace(/,\\s*([}\\]])/g, "$1");
    try { return JSON.parse(o); } catch(x) { return null; }
  }

  const SCN = ["escola","floresta","taverna","castelo","caverna","mar","cidade","deserto","montanha","espaco","ruinas"];
  const SEM = ["um aliado revela um segredo constrangedor","um objeto perdido reaparece com um novo poder","o clima muda de forma sobrenatural","um rival inesperado pede ajuda","uma lenda local se mostra verdadeira","um NPC antigo volta com más notícias","um mapa mostra um lugar que não deveria existir","uma traição silenciosa é descoberta","um animal estranho segue o herói","um evento festivo vira armadilha","uma voz misteriosa dá um aviso enigmático","o herói é confundido com outra pessoa","uma porta secreta se abre sozinha","um mercador oferece um negócio perigoso demais","um sonho profético se mistura à realidade","um inimigo demonstra honra inesperada","um tesouro está amaldiçoado","uma criança sabe mais do que deveria","um duelo é desafiado em público","um eclipse, tremor ou tempestade muda as regras"];
  const R = a => a[Math.floor(Math.random() * a.length)];
  const RI = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

  function norm(j) {
    const num = (v, d, a, b) => { v = parseFloat(v); return isFinite(v) ? Math.max(a, Math.min(b, v)) : d; };
    const arr = v => Array.isArray(v) ? v : [];
    const str = v => typeof v === "string" ? v.trim() : (v == null ? "" : String(v).trim());
    const o = {};
    o.narrativa = str(j.narrativa) || str(j.narracao) || str(j.texto) || "O tempo parece suspenso por um instante. Você respira fundo e sente que a aventura ainda tem muito a revelar.";
    o.cena = str(j.cena).toLowerCase();
    if (!SCN.includes(o.cena)) o.cena = (S && S.story && S.fase === "escola") ? "escola" : R(["floresta","cidade","ruinas","caverna"]);
    o.criatura = str(j.criatura) || "";
    o.npc = str(j.npc) || "";
    o.opcoes = arr(j.opcoes).map(x => typeof x === "string" ? x : (x && (x.texto || x.acao || x.text)) || "").map(s => String(s).trim()).filter(Boolean).slice(0, 5);
    if (o.opcoes.length < 3) o.opcoes = ["Examinar os arredores atentamente", "Avançar pelo caminho com a arma pronta", "Buscar uma saída ou esconderijo estratégico"];
    o.hp = num(j.hp, S ? S.hp : 20, 0, 20);
    o.local = str(j.local) || (S ? S.loc : "Desconhecido");
    const iv = arr(j.inventario).map(str).filter(Boolean).slice(0, 24);
    o.inventario = (Array.isArray(j.inventario) && (iv.length || !(S && S.inv && S.inv.length))) ? iv : (S ? S.inv : []);
    o.xp = num(j.xp, 3, 0, 25);
    o.missoes = arr(j.missoes).map(m => typeof m === "string" ? { n: m, r: "" } : { n: str(m && (m.n || m.nome)), r: str(m && (m.r || m.requisito)) }).filter(m => m.n).slice(0, 3);
    o.feitas = arr(j.feitas).map(str).filter(Boolean);
    o.titulo = str(j.titulo);
    o.baixas = num(j.baixas, 0, 0, 99);
    o.cia = arr(j.cia).map(c => ({ n: str(c && (c.n || c.nome)), a: num(c && (c.a ?? c.afinidade), 50, 0, 100), d: str(c && (c.d || c.papel)) })).filter(c => c.n).slice(0, 8);
    o.memoria = str(j.memoria).slice(0, 900) || (S ? S.mem : "");
    o.arco = str(j.arco).slice(0, 60);
    o.fios = arr(j.fios).map(str).filter(Boolean).slice(0, 5);
    return o;
  }

  const SYS = \`Você é o MESTRE ANCIÃO, um narrador de RPG de mesa lendário. Narra em português do Brasil, em segunda pessoa ("você"), com prosa literária e sensorial.
REGRAS DE OURO DO MESTRE:
1. A HISTÓRIA NUNCA ACABA: Não há "fim" nem game over. Cada resolução abre um mistério novo.
2. TODO TURNO ENTREGA ALGO NOVO: Pistas, reviravoltas, NPCs, locais intrigantes.
3. SEMPRE 4 OPÇÕES: Curtas e variadas para o próximo passo.
4. NUNCA MORTE DEFINITIVA: Se hp chegar a zero, narre a queda dramática e resgate/despertar com pelo menos 6-8 hp.
5. Formato de resposta: Responda SOMENTE com um JSON válido com campos:
{"narrativa":"...", "cena":"floresta|caverna|castelo|cidade|ruinas|mar|deserto|montanha|espaco|taverna|escola", "criatura":"lobo|goblin|esqueleto|dragao|aranha|orc|fantasma|golem|serpente|slime|", "npc":"mercador|sabio|guarda|aldeao|nobre|taverneiro|", "opcoes":["opção 1", "opção 2", "opção 3", "opção 4"], "hp":15, "local":"Nome do local", "inventario":["itens"], "xp":10, "missoes":[{"n":"missão","r":"req"}], "feitas":[], "titulo":"", "baixas":0, "cia":[], "arco":"Nome do arco", "fios":["mistério 1"], "memoria":"resumo"}\`;

  function buildUser(text, first) {
    let h = (S.log || []).filter(m => !m.sys);
    if (!first) h = h.slice(0, -1);
    h = h.slice(-8);
    const hist = h.map(m => (m.role === "user" ? "Jogador: " : "Mestre: ") + String(m.text).slice(0, 650)).join("\\n");
    const turno = (S.t || 0) + 1;
    return \`Herói: \${S.hero}, \${S.race || ""} \${S.cls} (passado: \${S.bg || "?"}), atributos \${JSON.stringify(S.at || {})}.
Mundo: \${S.world}. \${S.idea ? "Ideia do jogador: " + S.idea + "." : ""}
Nível \${S.lv || 1}, XP \${S.xp || 0}. Missões ativas: \${JSON.stringify(S.mis || [])}.
Arco atual: \${S.arco || "(início)"}. Fios abertos: \${JSON.stringify(S.fios || [])}.
Estado: hp=\${S.hp}, local=\${S.loc}, inventário=\${JSON.stringify(S.inv)}.
Memória: \${S.mem || "(início)"}
Turno \${turno} da campanha. Semente deste turno: \${R(SEM)}.
\${hist ? "\\nÚltimos eventos:\\n" + hist + "\\n" : ""}
Ação do jogador: \${text}\`;
  }

  async function narrate(text, first) {
    if (prov() === "off") return null;
    const u = buildUser(text, first);
    let raw = await callAI(SYS, u);
    let j = parseJ(raw);
    if (!j || !j.narrativa) {
      throw new Error("Resposta fora do formato");
    }
    return norm(j);
  }

  // Fallback offline generator
  function offline(text) {
    const f = (S.t || 0) % 5;
    const sc = R(SCN);
    return norm({
      narrativa: "O eco dos seus passos reverbera enquanto você tenta: «" + text + "». O ar vibra com mistérios antigos, e uma nova trilha parece se desenhar sob seus pés.",
      cena: sc,
      criatura: (f === 2) ? "lobo" : "",
      npc: (f === 1) ? "sabio" : "",
      opcoes: [
        "Avançar com a arma empunhada",
        "Investigar pegadas e marcas estranhas",
        "Tentar contornar o obstáculo em silêncio",
        "Chamar por aliados ou observar com calma"
      ],
      hp: Math.max(6, S.hp),
      local: S.loc || "Trilha Desconhecida",
      inventario: S.inv,
      xp: 8,
      missoes: S.mis || [{ n: "Explorar o desconhecido", r: "Descubra a origem dos ecos" }],
      feitas: [],
      memoria: "A jornada continua através de " + (S.loc || "terras sem nome") + "."
    });
  }

  // ENHANCED 2D ANIMATED GRAPHICS GENERATOR (Custom Hero Sprite + Adversaries)
  let gid = 0;
  function art(scene, wn, m) {
    const av = getHeroAvatar();
    const id = "g" + (gid++);
    
    // Scene colors
    let skyCol = ["#0c192c", "#1f3a5f"];
    let groundCol = "#0b1f14";
    let moonCol = "#fde047";
    let particleCol = "#fde047";
    
    if (scene === "caverna") {
      skyCol = ["#0f0c1b", "#231834"];
      groundCol = "#171226";
      moonCol = "#c084fc";
      particleCol = "#e879f9";
    } else if (scene === "castelo") {
      skyCol = ["#1a102f", "#2e1b4d"];
      groundCol = "#111827";
      moonCol = "#fef08a";
      particleCol = "#fbbf24";
    } else if (scene === "ruinas") {
      skyCol = ["#18181b", "#27272a"];
      groundCol = "#1c1917";
      moonCol = "#a3e635";
      particleCol = "#bef264";
    } else if (scene === "mar") {
      skyCol = ["#082f49", "#0369a1"];
      groundCol = "#0284c7";
      moonCol = "#e0f2fe";
      particleCol = "#38bdf8";
    } else if (scene === "deserto") {
      skyCol = ["#451a03", "#7c2d12"];
      groundCol = "#78350f";
      moonCol = "#fdba74";
      particleCol = "#fb923c";
    } else if (scene === "espaco") {
      skyCol = ["#020617", "#0f172a"];
      groundCol = "#090d16";
      moonCol = "#38bdf8";
      particleCol = "#60a5fa";
    }

    // Hero Hair SVG
    let hairSvg = '';
    if (av.hairStyle === 'longo') {
      hairSvg = \`<path d="M-9 -38 Q-13 -48 0 -48 Q13 -48 9 -38 Q13 -22 11 -6 L8 -6 Q9 -24 8 -38 Q0 -42 -8 -38 Q-9 -24 -8 -6 L-11 -6 Q-13 -22 -9 -38 Z" fill="\${av.hairColor}"/>\`;
    } else if (av.hairStyle === 'tranca') {
      hairSvg = \`<path d="M-9 -38 Q-11 -48 0 -48 Q11 -48 9 -38 Z" fill="\${av.hairColor}"/><path d="M7 -36 Q13 -18 10 2 L7 0 Q9 -18 6 -36 Z" fill="\${av.hairColor}"/>\`;
    } else if (av.hairStyle === 'espetado') {
      hairSvg = \`<polygon points="0,-52 -6,-44 -1,-44" fill="\${av.hairColor}"/><polygon points="-7,-49 -11,-39 -4,-41" fill="\${av.hairColor}"/><polygon points="7,-49 4,-41 11,-39" fill="\${av.hairColor}"/><path d="M-9 -40 Q0 -46 9 -40 Z" fill="\${av.hairColor}"/>\`;
    } else if (av.hairStyle === 'coque') {
      hairSvg = \`<circle cx="0,-50" r="4.5" fill="\${av.hairColor}"/><path d="M-9 -38 Q-11 -48 0 -48 Q11 -48 9 -38 Z" fill="\${av.hairColor}"/>\`;
    } else if (av.hairStyle === 'mago') {
      hairSvg = \`<polygon points="-14,-44 0,-64 14,-44" fill="\${av.clothingColor}"/><ellipse cx="0" cy="-44" rx="16" ry="3.5" fill="\${av.clothingColor}"/><path d="M-9 -38 Q-11 -46 0 -46 Q11 -46 9 -38 Z" fill="\${av.hairColor}"/>\`;
    } else if (av.hairStyle === 'careca') {
      hairSvg = \`<circle cx="0" cy="-42" r="1.5" fill="#38bdf8" opacity="0.8"/>\`;
    } else {
      hairSvg = \`<path d="M-9 -38 Q-11 -48 0 -48 Q11 -48 9 -38 Q5 -42 0 -42 Q-5 -42 -9 -38 Z" fill="\${av.hairColor}"/>\`;
    }

    // Hero Weapon SVG
    let weaponSvg = '';
    if (av.weapon === 'cajado') {
      weaponSvg = \`<rect x="13" y="-52" width="2.5" height="54" fill="#78350f"/><circle cx="14" cy="-54" r="4.5" fill="#38bdf8"/><circle cx="14" cy="-54" r="2.5" fill="#ffffff" opacity="0.8"/>\`;
    } else if (av.weapon === 'adagas') {
      weaponSvg = \`<polygon points="12,-10 15,-10 13.5,-24" fill="#cbd5e1"/><polygon points="-12,-10 -15,-10 -13.5,-24" fill="#cbd5e1"/>\`;
    } else if (av.weapon === 'arco') {
      weaponSvg = \`<path d="M13 -36 Q24 -18 13 0" stroke="#78350f" stroke-width="2.5" fill="none"/><line x1="13" y1="-36" x2="13" y2="0" stroke="#fff" stroke-width="0.8" opacity="0.8"/>\`;
    } else if (av.weapon === 'livro') {
      weaponSvg = \`<rect x="11" y="-20" width="9" height="13" fill="#581c87" rx="1"/><circle cx="15.5" cy="-13.5" r="1.8" fill="#e8c46a"/>\`;
    } else if (av.weapon === 'escudo') {
      weaponSvg = \`<path d="M11 -26 H21 V-12 L16 -5 L11 -12 Z" fill="#64748b" stroke="#e8c46a" stroke-width="1.2"/>\`;
    } else {
      weaponSvg = \`<rect x="12" y="-34" width="2.5" height="30" fill="#cbd5e1"/><rect x="9" y="-12" width="8.5" height="2" fill="#ca8a04"/><circle cx="13" cy="-36" r="1.5" fill="#e8c46a"/>\`;
    }

    // Monster SVG
    let monsterSvg = '';
    const criat = m && m.criatura ? m.criatura.toLowerCase() : '';
    if (criat.includes('dragao') || criat.includes('dragão')) {
      monsterSvg = \`<g transform="translate(320 168) scale(1.1)">
        <animateTransform attributeName="transform" type="translate" values="320,168; 320,165; 320,168" dur="3s" repeatCount="indefinite"/>
        <ellipse cx="0" cy="5" rx="32" ry="18" fill="#7f1d1d"/>
        <polygon points="-8,-10 -35,-42 8,-18" fill="#991b1b"/>
        <polygon points="8,-10 35,-42 18,-18" fill="#991b1b"/>
        <circle cx="26" cy="-12" r="12" fill="#991b1b"/>
        <circle cx="29" cy="-14" r="2.5" fill="#fef08a"/>
        <path d="M-26 10 Q-45 15 -40 2" stroke="#7f1d1d" stroke-width="5" fill="none"/>
      </g>\`;
    } else if (criat.includes('lobo')) {
      monsterSvg = \`<g transform="translate(325 174) scale(1.05)">
        <animateTransform attributeName="transform" type="translate" values="325,174; 325,172; 325,174" dur="2.2s" repeatCount="indefinite"/>
        <ellipse cx="0" cy="5" rx="22" ry="12" fill="#475569"/>
        <circle cx="16" cy="-6" r="9" fill="#475569"/>
        <polygon points="10,-13 14,-22 19,-13" fill="#334155"/>
        <circle cx="19" cy="-7" r="2.2" fill="#ef4444"/>
      </g>\`;
    } else if (criat.includes('esqueleto')) {
      monsterSvg = \`<g transform="translate(330 172) scale(1.3)">
        <circle cx="0" cy="-30" r="9" fill="#e2e8f0"/>
        <circle cx="-3" cy="-31" r="2.2" fill="#000"/>
        <circle cx="3" cy="-31" r="2.2" fill="#000"/>
        <line x1="0" y1="-20" x2="0" y2="8" stroke="#e2e8f0" stroke-width="2.5"/>
        <line x1="-10" y1="-12" x2="10" y2="-12" stroke="#e2e8f0" stroke-width="2"/>
        <line x1="-8" y1="8" x2="-8" y2="22" stroke="#e2e8f0" stroke-width="2"/>
        <line x1="8" y1="8" x2="8" y2="22" stroke="#e2e8f0" stroke-width="2"/>
      </g>\`;
    } else if (criat) {
      monsterSvg = \`<g transform="translate(330 172) scale(1.3)">
        <path d="M-10 12 L-8 -12 H8 L10 12 Z" fill="#14532d"/>
        <circle cx="0" cy="-18" r="8" fill="#15803d"/>
        <polygon points="-6,-22 -14,-26 -6,-17" fill="#15803d"/>
        <polygon points="6,-22 14,-26 6,-17" fill="#15803d"/>
        <circle cx="-2.5" cy="-19" r="1.5" fill="#facc15"/>
        <circle cx="2.5" cy="-19" r="1.5" fill="#facc15"/>
      </g>\`;
    } else if (m && m.npc) {
      monsterSvg = \`<g transform="translate(325 172) scale(1.4)">
        <path d="M-10 -20 L-8 14 H8 L10 -20 Z" fill="#1e3a8a"/>
        <circle cx="0" cy="-28" r="7.5" fill="#f8d7b8"/>
        <circle cx="-2" cy="-28" r="1" fill="#000"/>
        <circle cx="2" cy="-28" r="1" fill="#000"/>
        <rect x="10" y="-36" width="2" height="50" fill="#78350f"/>
        <circle cx="11" cy="-37" r="3" fill="#fde047"/>
      </g>\`;
    }

    let s = \`<svg class="ill" viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="\${id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="\${skyCol[0]}"/>
          <stop offset="100%" stop-color="\${skyCol[1]}"/>
        </linearGradient>
      </defs>
      <rect width="400" height="200" fill="url(#\${id})"/>\`;

    // Ambient twinkling stars
    for (let i = 0; i < 20; i++) {
      s += \`<circle cx="\${(i * 37 + 12) % 400}" cy="\${(i * 23 + 5) % 85}" r="\${0.6 + (i % 3) * 0.4}" fill="#ffffff" opacity="\${0.4 + (i % 4) * 0.15}"/>\`;
    }

    // Moon / Sun / Arcane Orb
    s += \`<circle cx="330" cy="42" r="18" fill="\${moonCol}" opacity="0.85"/>\`;

    // Atmospheric mountains / landscape
    s += \`<path d="M0 162 Q100 148 200 162 T400 156 V200 H0Z" fill="\${groundCol}"/>\`;

    // Specific scene features
    if (scene === "floresta") {
      for (let i = 0; i < 11; i++) {
        const x = i * 38 - 10;
        s += \`<polygon points="\${x},168 \${x + 16},105 \${x + 32},168" fill="#000" opacity="0.6"/>\`;
      }
    } else if (scene === "castelo") {
      s += \`<rect x="110" y="90" width="45" height="75" fill="#000" opacity="0.8"/>
            <rect x="235" y="100" width="45" height="65" fill="#000" opacity="0.8"/>
            <rect x="160" y="65" width="68" height="100" fill="#000" opacity="0.8"/>
            <rect x="190" y="125" width="10" height="16" fill="\${moonCol}"/>\`;
    } else if (scene === "caverna") {
      s += \`<polygon points="0,0 400,0 400,55 310,25 210,60 110,20 0,55Z" fill="#000" opacity="0.88"/>
            <circle cx="200" cy="138" r="16" fill="\${moonCol}" opacity="0.75"/>\`;
    } else {
      for (let i = 0; i < 8; i++) {
        const x = i * 50;
        s += \`<rect x="\${x}" y="105" width="38" height="60" fill="#000" opacity="0.75"/>\`;
      }
    }

    // Floating particles (embers / fireflies)
    for (let i = 0; i < 8; i++) {
      s += \`<circle cx="\${30 + i * 45}" cy="\${130 + (i % 3) * 15}" r="1.5" fill="\${particleCol}" opacity="0.75"/>\`;
    }

    // 2D CUSTOM HERO SPRITE (Animated with breathing)
    s += \`<g transform="translate(75 172) scale(1.65)">
      <animateTransform attributeName="transform" type="translate" values="75,172; 75,170; 75,172" dur="3s" repeatCount="indefinite"/>
      <!-- Shadow -->
      <ellipse cx="0" cy="2" rx="14" ry="3.5" fill="#000000" opacity="0.45"/>
      <!-- Body / Outfit -->
      <path d="M-8 0 L-6 -30 H6 L8 0Z" fill="\${av.clothingColor}"/>
      <!-- Head / Skin -->
      <circle cy="-38" r="7.5" fill="\${av.skinColor}"/>
      <!-- Eyes -->
      <circle cx="-2.5" cy="-38" r="1.2" fill="\${av.eyeColor}"/>
      <circle cx="2.5" cy="-38" r="1.2" fill="\${av.eyeColor}"/>
      <!-- Hair -->
      \${hairSvg}
      <!-- Weapon -->
      \${weaponSvg}
    </g>\`;

    // Encountered Monster or NPC
    s += monsterSvg;

    return s + "</svg>";
  }

  function add(role, text, m) {
    if (m && role !== "user" && !m.sys) {
      const f = document.createElement("div");
      f.innerHTML = art(m.scene, S ? S.world : "", m);
      $("#log").appendChild(f.firstChild);
    }
    const p = document.createElement("p");
    p.className = "n" + (role === "user" ? " me" : (m && m.sys ? " sy" : ""));
    p.textContent = text;
    $("#log").appendChild(p);
    $("#log").scrollTop = 1e6;
    return p;
  }

  function render() {
    $("#hud").innerHTML = "";
    const pName = prov() === "native" ? "👑 Chronicles AI" : (prov() === "off" ? "Mestre offline" : "IA Externa");
    [
      ["❤ " + S.hp],
      ["⭐ Nv " + (S.lv || 1) + " · " + ((S.xp || 0) % 40) + "/40"],
      ["📍 " + S.loc],
      ["🎒 " + S.inv.length],
      ["🎭 " + pName],
      ["💎 " + (S.gems || 0)]
    ].concat(S.arco ? [["🧭 " + S.arco]] : []).forEach(x => {
      const s = document.createElement("span");
      s.textContent = x[0];
      $("#hud").appendChild(s);
    });

    // Bars
    const mx = Math.max(20, S.hp || 0);
    const xp = (S.xp || 0) % 40;
    const oldBars = $("#hud").parentNode.querySelector(".bars");
    if (oldBars) oldBars.remove();
    const b = el("div", "bars");
    b.innerHTML = '<div class="bar2 hp"><i style="width:' + (Math.max(0, S.hp) / mx * 100) + '%"></i><b>❤ ' + S.hp + '/' + mx + '</b></div><div class="bar2 xp"><i style="width:' + (xp / 40 * 100) + '%"></i><b>⭐ Nv ' + (S.lv || 1) + ' · ' + xp + '/40</b></div>';
    $("#hud").parentNode.insertBefore(b, $("#hud"));

    $("#log").innerHTML = "";
    (S.log || []).forEach(m => add(m.role, m.text, m));
    $("#ch").innerHTML = "";
    (S.ch || []).forEach(c => {
      const btn = document.createElement("button");
      btn.textContent = c;
      btn.onclick = () => {
        if ((window as any).soundFX) {
          const lct = c.toLowerCase();
          if (/atacar|lutar|combater|golpe|arma|espada|machado|arco|disparar|matar/.test(lct)) {
            (window as any).soundFX.playSwordClash();
          } else {
            (window as any).soundFX.playClick();
          }
        }
        turn(c);
      };
      $("#ch").appendChild(btn);
    });

    const surprise = document.createElement("button");
    surprise.textContent = "🎲 Surpreenda-me (Reviravolta do Mestre)";
    surprise.style.borderStyle = "dashed";
    surprise.onclick = () => {
      if ((window as any).soundFX) (window as any).soundFX.playDiceRoll();
      turn("O Mestre decide: surpreenda o herói com uma reviravolta inesperada e novos mistérios");
    };
    $("#ch").appendChild(surprise);

    $("#log").scrollTop = 1e6;
  }

  // TURN ENGINE
  async function turn(text) {
    if (busy) return;
    busy = true;
    $("#act").value = "";
    $("#ch").innerHTML = "";
    const first = /^Comece a /.test(text);

    if (!first) {
      S.log.push({ role: "user", text });
      add("user", text);
    }

    const p = add("ai", "");
    p.classList.add("dots");
    let j = null, er = "";

    try {
      j = await narrate(text, first);
    } catch(e) {
      er = e.message || "IA indisponível";
    }

    if (!j) {
      j = offline(text);
    }

    try {
      p.classList.remove("dots");
      p.textContent = j.narrativa;

      // Dynamic Contextual Sound Effects
      try {
        if ((window as any).soundFX) {
          const lowerText = (text + " " + (j.narrativa || "")).toLowerCase();
          const isCombat = /atacar|espada|golpe|lutar|batalha|arma|flecha|machado|adaga|escudo|matar|cortar|golpear|investida/.test(lowerText);
          const hasMonster = j.criatura && j.criatura.length > 0;

          if (hasMonster && Math.random() > 0.35) {
            (window as any).soundFX.playMonsterRoar();
          } else if (isCombat) {
            (window as any).soundFX.playSwordClash();
          } else if (j.cena && j.cena !== (S.lastCena || "")) {
            (window as any).soundFX.playAmbientTransition(j.cena);
          }

          if ((window as any).soundFX.ambientEnabled && j.cena) {
            (window as any).soundFX.startAmbient(j.cena);
          }
        }
      } catch (sErr) {}
      S.lastCena = j.cena;

      S.log.push({ role: "ai", text: j.narrativa, scene: j.cena, criatura: j.criatura, npc: j.npc });
      S.ch = j.opcoes;
      S.hp = j.hp;
      S.loc = j.local;
      S.inv = j.inventario;
      S.mem = j.memoria;
      if (j.arco) S.arco = j.arco;
      if (j.fios && j.fios.length) S.fios = j.fios;

      S.places = S.places || [];
      if (!S.places.includes(S.loc)) S.places.push(S.loc);

      const ol = S.lv || 1;
      const nfe = (j.feitas || []).length;
      const gx = (j.xp || 5) + 15 * nfe;
      S.t = (S.t || 0) + 1;
      S.xp = (S.xp || 0) + gx;
      S.mis = j.missoes;

      // Sync into forje_quest_journal in localStorage
      try {
        const curQStr = localStorage.getItem('forje_quest_journal');
        let qList = curQStr ? JSON.parse(curQStr) : [];
        if (!Array.isArray(qList)) qList = [];

        // Ingest new active missions
        if (Array.isArray(j.missoes)) {
          j.missoes.forEach((m, idx) => {
            const mTitle = m.n || m.nome || (typeof m === 'string' ? m : '');
            const mReq = m.r || m.requisito || '';
            if (!mTitle) return;
            const exists = qList.find(q => q.title.toLowerCase() === mTitle.toLowerCase());
            if (!exists) {
              qList.push({
                id: 'q_ai_' + Date.now() + '_' + idx,
                title: mTitle,
                type: idx === 0 ? 'principal' : 'secundaria',
                status: 'ativa',
                description: mReq || 'Objetivo delineado pelo Mestre da IA.',
                giverOrOrigin: j.local || S.loc || 'Terras Desconhecidas',
                requirements: [mReq || 'Cumprir as exigências da jornada'],
                rewards: { xp: 40 + idx * 10 },
                progressPercent: 20,
                discoveredAtTurn: S.t || 1,
                isPinned: idx === 0
              });
            }
          });
        }

        // Ingest completed missions
        if (Array.isArray(j.feitas)) {
          j.feitas.forEach(fname => {
            const match = qList.find(q => q.title.toLowerCase() === fname.toLowerCase());
            if (match && match.status !== 'concluida') {
              match.status = 'concluida';
              match.progressPercent = 100;
              match.completedAtTurn = S.t || 1;
            }
          });
        }

        // Ingest rumors/fios
        if (Array.isArray(j.fios)) {
          j.fios.forEach((fio, fIdx) => {
            const exists = qList.find(q => q.title.toLowerCase() === fio.toLowerCase());
            if (!exists) {
              qList.push({
                id: 'q_fio_' + Date.now() + '_' + fIdx,
                title: fio,
                type: 'rumor',
                status: 'ativa',
                description: 'Um mistério aberto descoberto durante a narrativa.',
                giverOrOrigin: j.local || S.loc || 'Exploração',
                requirements: ['Investigar a verdade por trás deste rumor'],
                rewards: { xp: 30 },
                progressPercent: 0,
                discoveredAtTurn: S.t || 1
              });
            }
          });
        }

        localStorage.setItem('forje_quest_journal', JSON.stringify(qList));
      } catch (qErr) {}

      const nl = 1 + Math.floor(S.xp / 40);
      let up = "";
      if (nl > ol) {
        S.lv = nl;
        S.pts = (S.pts || 0) + 2 * (nl - ol);
        up = "✦ [SISTEMA] Nível " + nl + "! +2 pontos de atributo conquistados.";
        if ((window as any).soundFX) (window as any).soundFX.playSuccess();
      }
      if (nfe) {
        up += (up ? "\n" : "") + "✔ Missão concluída: " + j.feitas.join(", ");
        if ((window as any).soundFX) (window as any).soundFX.playQuestFanfare();
      }
      if (er) up += (up ? "\n" : "") + "⚠ Aviso (" + er + "): O Mestre alternativo manteve a história viva sem interrupção.";

      if (up) S.log.push({ role: "ai", text: up, sys: 1 });
      if (S.log.length > 40) S.log = S.log.slice(-40);

      save();
      render();
    } catch(err) {
      p.classList.remove("dots");
      p.textContent = "Uma névoa cobre o horizonte, mas sua lenda prossegue.";
      S.ch = ["Avançar pelo caminho", "Procurar pistas nos arredores", "Recobrar o fôlego e observar"];
      render();
    }
    busy = false;
  }

  function openGame() {
    // Reload state from save in case inventory or HP was altered
    const fresh = load();
    if (fresh) {
      if (Array.isArray(fresh.inv)) S.inv = fresh.inv;
      if (typeof fresh.hp === 'number') S.hp = fresh.hp;
      if (typeof fresh.gems === 'number') S.gems = fresh.gems;
    }
    S.places = S.places || [];
    S.log = S.log || [];
    S.inv = S.inv || [];
    show("s2");
    $("#ttl").textContent = S.hero + " · " + S.cls;
    render();

    // Check for critical item use triggered from Inventory component
    try {
      const pendingAction = localStorage.getItem('forje_pending_action');
      if (pendingAction) {
        localStorage.removeItem('forje_pending_action');
        setTimeout(() => {
          turn(pendingAction);
        }, 350);
      }
    } catch(e) {}
  }

  // HOME SCREEN
  function home() {
    const h = $("#s0");
    h.innerHTML = "";
    const L = list();
    const hb = el("div", "hb");
    hb.append(el("div", "logo", "🐉"), el("h2", "cz", "Forje sua lenda"), el("span", "pill", "📜 " + L.length));
    h.appendChild(hb);

    const bn = el("div", "ban");
    bn.append(
      el("h1", "", "Escolha o seu destino"),
      el("p", "", "API de RPG com IA Nativa, dados de verdade e histórias sem fim")
    );
    const ex = el("button", "ex", "NOVA AVENTURA");
    ex.onclick = () => show("s1");
    bn.appendChild(ex);
    h.appendChild(bn);

    if (L.length) {
      const s = L[0].S;
      const c = el("button", "cta", "▶ Continuar: " + s.hero + " · Nv " + (s.lv || 1));
      c.onclick = () => { S = s; openGame(); };
      h.appendChild(c);
    }

    const cards = el("div");
    cards.id = "cards";
    const sM = el("div");
    sM.appendChild(el("div", "sec", "Modos de Jogo"));
    const r = el("div", "row2");
    const modeGradients = [
      "linear-gradient(#3a1a1a,#140a0a)",
      "linear-gradient(#1a2a4a,#0a0f1a)",
      "linear-gradient(#2a2233,#0d0f14)",
      "linear-gradient(#451a03,#1c1917)",
      "linear-gradient(#14532d,#052e16)",
      "linear-gradient(#1e1b4b,#0f172a)",
      "linear-gradient(#831843,#1f0a10)",
      "linear-gradient(#052e16,#021a0e)",
      "linear-gradient(#1e3a5f,#0f172a)",
      "linear-gradient(#5a2d12,#1a1208)"
    ];
    GAME_MODES.forEach((gm, idx) => {
      const b = el("button", "cd");
      const icon = gm[0].split(" ")[0];
      const name = gm[0].split(" ").slice(1).join(" ");
      const i = el("div", "im", icon);
      i.style.background = modeGradients[idx % modeGradients.length];
      b.append(i, el("b", "", name), el("small", "", gm[1]));
      b.onclick = () => { mode = idx; show("s1"); };
      r.appendChild(b);
    });
    sM.appendChild(r);

    const sW = el("div");
    sW.appendChild(el("div", "sec", "Mundos & Dimensões"));
    const rW = el("div", "row2");
    WORLDS.forEach((w, i) => {
      const b = el("button", "cd");
      const im = el("div", "im", "🌌");
      im.style.background = "linear-gradient(160deg," + w[2][0] + "," + w[2][1] + ")";
      b.append(im, el("b", "", w[0]), el("small", "", w[1]));
      b.onclick = () => { world = i; show("s1"); };
      rW.appendChild(b);
    });
    sW.appendChild(rW);

    cards.append(sM, sW);
    h.appendChild(cards);
  }

  // SAVES SCREEN
  function saves() {
    const h = $("#s6");
    h.innerHTML = "";
    h.appendChild(el("h2", "cz", "Crônicas Salvas"));
    const L = list();
    if (!L.length) {
      h.appendChild(el("div", "panel", "Nenhuma aventura salva ainda. Toque em Criar para começar a sua jornada."));
    }
    L.forEach(x => {
      const s = x.S;
      const p = el("div", "panel slot");
      p.append(el("b", "cz", s.hero + " · " + s.cls), el("small", "", (s.race || "") + " · Nv " + (s.lv || 1) + " · " + s.loc));
      const r = el("div", "r");
      const a = el("button", "cta", "Continuar");
      a.style.marginTop = "0";
      a.onclick = () => { S = s; openGame(); };
      const d = el("button", "ghost", "Excluir");
      d.onclick = () => {
        if (confirm("Excluir esta aventura?")) {
          const o = slots();
          delete o[s.sid];
          wslots(o);
          saves();
        }
      };
      r.append(a, d);
      p.appendChild(r);
      h.appendChild(p);
    });
  }

  // CHARACTER CREATION (WIZARD)
  const RACES = [
    ["Humano", "Adaptável e ambicioso", { FOR: 1, DES: 1, CAR: 1 }, "#e0b48a"],
    ["Elfo", "Ágil, sentidos aguçados e magia antiga", { DES: 2, SAB: 1 }, "#f1d5b0"],
    ["Anão", "Resistente, mestre da forja e pedra", { CON: 2, FOR: 1 }, "#d0a07a"],
    ["Tiefling", "Sangue misterioso e presença marcante", { CAR: 2, INT: 1 }, "#b86a7a"]
  ];
  const CLASSES = [
    { n: "Guerreiro", d: "Mestre das armas e combate", i: ["Espada de Aço", "Escudo Forjado", "Armadura de Malha"] },
    { n: "Mago", d: "Estudioso dos segredos arcanos", i: ["Cajado Rúnico", "Grimório Antigo", "Poção de Mana"] },
    { n: "Ladino", d: "Furtivo, ágil e perspicaz", i: ["Lâminas Gêmeas", "Gazuas", "Capa Noturna"] },
    { n: "Paladino", d: "Guerreiro sagrado da retidão", i: ["Espada da Luz", "Símbolo Sagrado", "Armadura Reluzente"] }
  ];

  let W = { race: 0, cl: 0, at: { FOR: 12, DES: 12, CON: 12, INT: 12, SAB: 12, CAR: 12 } };
  let ST = 0;

  function wz() {
    $("#wz").innerHTML = "";
    $("#wt").textContent = "Criação · Passo " + (ST + 1) + "/3";
    if (ST === 0) {
      const p = el("div", "panel");
      p.append(el("h2", "", "Escolha sua Origem"), el("p", "", "Sua ascendência concede traços e história."));
      $("#wz").appendChild(p);
      const g = el("div", "opts");
      RACES.forEach((r, i) => {
        const b = el("button", "opt" + (W.race === i ? " sel" : ""));
        b.innerHTML = "<b>" + r[0] + "</b><small>" + r[1] + "</small>";
        b.onclick = () => { W.race = i; wz(); };
        g.appendChild(b);
      });
      $("#wz").appendChild(g);
    } else if (ST === 1) {
      const p = el("div", "panel");
      p.append(el("h2", "", "Escolha sua Classe"), el("p", "", "Sua profissão e foco em combate ou mistério."));
      $("#wz").appendChild(p);
      const g = el("div", "opts");
      CLASSES.forEach((c, i) => {
        const b = el("button", "opt" + (W.cl === i ? " sel" : ""));
        b.innerHTML = "<b>" + c.n + "</b><small>" + c.d + "</small>";
        b.onclick = () => { W.cl = i; wz(); };
        g.appendChild(b);
      });
      $("#wz").appendChild(g);
    } else if (ST === 2) {
      const p = el("div", "panel");
      p.append(el("h2", "", "Revisão do Herói"), el("p", "", "Tudo pronto para dar o primeiro passo na lenda."));
      $("#wz").appendChild(p);
      const rev = el("div", "panel");
      rev.innerHTML = "<p><b>Herói:</b> " + ($("#nm").value.trim() || "Andarilho") + "</p>" +
                      "<p><b>Origem:</b> " + RACES[W.race][0] + "</p>" +
                      "<p><b>Classe:</b> " + CLASSES[W.cl].n + "</p>" +
                      "<p><b>Modo de Jogo:</b> " + GAME_MODES[mode][0] + "</p>" +
                      "<p><b>Mundo:</b> " + WORLDS[world][0] + "</p>";
      $("#wz").appendChild(rev);
    }
    $("#wn").textContent = ST === 2 ? "Começar Aventura!" : "Avançar";
  }

  $("#go").onclick = () => {
    ST = 0;
    show("s4");
    wz();
  };
  $("#wb").onclick = () => { if (ST > 0) { ST--; wz(); } else show("s1"); };
  $("#wx").onclick = () => show("s1");
  $("#wn").onclick = () => {
    if (ST < 2) {
      ST++;
      wz();
    } else {
      // Start Game
      const cl = CLASSES[W.cl];
      const rc = RACES[W.race];
      const initialMissionName = "O Despertar: " + GAME_MODES[mode][0].replace(/^[^\w\s]+\s*/, '');
      const initialMissionReq = "Descubra seu primeiro rumo no mundo de " + WORLDS[world][0];
      S = {
        hero: $("#nm").value.trim() || "Andarilho",
        world: WORLDS[world][0],
        mode: GAME_MODES[mode][0],
        cls: cl.n,
        race: rc[0],
        at: { FOR: 13, DES: 12, CON: 14, INT: 11, SAB: 12, CAR: 10 },
        hp: 20,
        loc: "Portões da Aventura",
        inv: [...cl.i],
        gems: 3,
        lv: 1,
        xp: 0,
        mis: [{ n: initialMissionName, r: initialMissionReq }],
        places: [],
        log: [],
        ch: []
      };

      // Seed quest journal in localStorage
      try {
        const initQuests = [
          {
            id: 'quest_init_' + Date.now(),
            title: initialMissionName,
            type: 'principal',
            status: 'ativa',
            description: 'Você iniciou sua jornada sob as leis de ' + GAME_MODES[mode][0] + ' nas terras de ' + WORLDS[world][0] + '.',
            giverOrOrigin: 'O Destino',
            requirements: [initialMissionReq, 'Explorar o cenário e interagir com as escolhas'],
            rewards: { xp: 50, title: 'Iniciador da Lenda' },
            progressPercent: 10,
            discoveredAtTurn: 1,
            isPinned: true
          }
        ];
        localStorage.setItem('forje_quest_journal', JSON.stringify(initQuests));
      } catch(qErr) {}

      openGame();
      turn("Comece a aventura no modo «" + GAME_MODES[mode][0] + "» ambientada no mundo «" + WORLDS[world][0] + "», com uma cena de abertura vívida e sensorial.");
    }
  };

  // SEND & ACTIONS
  $("#send").onclick = () => {
    const v = $("#act").value.trim();
    if (v) turn(v);
  };
  $("#act").onkeydown = e => {
    if (e.key === "Enter") $("#send").click();
  };

  // DICE ROLLER MODAL
  $("#dice").onclick = () => {
    if ((window as any).soundFX) (window as any).soundFX.playClick();
    $("#dm").classList.add("on");
    $("#dr").textContent = "";
    $("#dn").textContent = "20";
    $("#dGo").disabled = false;
  };
  $("#dX").onclick = () => $("#dm").classList.remove("on");
  $("#dGo").onclick = () => {
    $("#dGo").disabled = true;
    if ((window as any).soundFX) (window as any).soundFX.playDiceRoll();
    const d = $("#d20");
    d.classList.add("spin");
    let n = 0;
    const iv = setInterval(() => {
      $("#dn").textContent = 1 + Math.floor(Math.random() * 20);
      if (++n > 14) {
        clearInterval(iv);
        d.classList.remove("spin");
        const roll = 1 + Math.floor(Math.random() * 20);
        $("#dn").textContent = roll;
        const res = roll === 20 ? "CRÍTICO ÉPICO!" : (roll === 1 ? "FALHA CRÍTICA!" : (roll >= 10 ? "SUCESSO!" : "FALHA!"));
        $("#dr").textContent = "d20 = " + roll + " → " + res;
        if ((window as any).soundFX) {
          if (roll === 20) (window as any).soundFX.playSuccess();
          else if (roll === 1) (window as any).soundFX.playHeavyImpact();
        }
        setTimeout(() => {
          $("#dm").classList.remove("on");
          turn(($("#act").value.trim() || "Tento uma ação decisiva") + " (🎲 d20 = " + roll + " - " + res + ")");
        }, 1400);
      }
    }, 60);
  };

  // TOP BUTTONS
  $("#bExit").onclick = () => show("s0");
  $("#bBack").onclick = () => {
    if ((window as any).soundFX) (window as any).soundFX.playPageFlip();
    show("s2");
  };
  $("#bMem").onclick = () => {
    if ((window as any).soundFX) (window as any).soundFX.playPageFlip();
    $("#sheet").innerHTML = "<p><b>" + S.hero + "</b> — " + S.race + " " + S.cls + " (Nv " + (S.lv || 1) + ")</p>" +
                            "<p><b>Atributos:</b> FOR 13 · DES 12 · CON 14 · INT 11 · SAB 12 · CAR 10</p>";
    $("#inv").innerHTML = "";
    (S.inv.length ? S.inv : ["Vazio"]).forEach(it => {
      const li = document.createElement("li");
      li.textContent = "🎒 " + it;
      $("#inv").appendChild(li);
    });
    $("#mem").textContent = S.mem || "A saga acabou de começar.";
    show("s3");
  };

  // TABS NAVIGATION
  const tabs = $("#tabs").children;
  tabs[0].onclick = () => show("s0");
  tabs[1].onclick = () => show("s1");
  tabs[2].onclick = () => show("s6");
  tabs[3].onclick = () => cfOpen("s0");

  // WORLD PICKERS
  pick($("#worlds"), WORLDS, i => world = i);
  pick($("#modes"), GAME_MODES, i => mode = i);

  cfLabel();
  show("s0");
})();
    `;

    container.appendChild(scriptEl);

    return () => {
      // Cleanup on unmount
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return <div ref={containerRef} className="w-full" />;
};
