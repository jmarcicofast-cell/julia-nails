// Júlia de Mamãe Noel — ilustrações animadas (SVG) do modo Natal.
// Para mudar cabelo/pele, troque as cores em CORES.
(function () {
  const CORES = { pele: '#f2c4a2', pele2: '#e3a987', cabelo: '#5a3220', cabelo2: '#3f2215', roupa: '#c8202c', roupa2: '#9b1620', pelo: '#fffaf2', ouro: '#e2bd6b', unha: '#c8202c' };
  const c = CORES;

  const css = `
  .mn{display:block;overflow:visible}
  .mn .corpo{animation:mnBob 3s ease-in-out infinite;transform-origin:80px 190px}
  .mn .braco{animation:mnAceno 1.6s ease-in-out infinite;transform-origin:118px 112px}
  .mn .pompom{animation:mnPom 1.8s ease-in-out infinite;transform-origin:134px 30px}
  .mn .olho{animation:mnPisca 4.5s infinite;transform-origin:center;transform-box:fill-box}
  .mn .brilho{animation:mnBrilho 1.6s ease-in-out infinite;transform-origin:center;transform-box:fill-box}
  .mn .beijo{animation:mnBeijo 2.4s ease-out infinite;transform-box:fill-box}
  .mn .beijo.b2{animation-delay:1.2s}
  .mn .pulo{animation:mnPulo 1.1s ease-in-out infinite;transform-origin:80px 190px}
  @keyframes mnBob{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-3px) rotate(-1.5deg)}}
  @keyframes mnAceno{0%,100%{transform:rotate(0)}50%{transform:rotate(-22deg)}}
  @keyframes mnPom{0%,100%{transform:rotate(0)}50%{transform:rotate(14deg)}}
  @keyframes mnPisca{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
  @keyframes mnBrilho{0%,100%{opacity:.2;transform:scale(.6)}50%{opacity:1;transform:scale(1.15)}}
  @keyframes mnBeijo{0%{opacity:0;transform:translate(0,0) scale(.5)}20%{opacity:1}100%{opacity:0;transform:translate(26px,-40px) scale(1.2)}}
  @keyframes mnPulo{0%,100%{transform:translateY(0)}40%{transform:translateY(-12px)}60%{transform:translateY(-12px)}}
  @media (prefers-reduced-motion:reduce){.mn *{animation:none!important}}
  .mn-hero{width:132px;height:auto;margin:0 auto -6px;filter:drop-shadow(0 6px 10px rgba(0,0,0,.25))}
  .mn-ok{width:150px;height:auto;margin:0 auto}
  .mn-mini{width:64px;height:auto;flex:none}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const cabeca = (sorriso) => `
    <path d="M44 74c-6 22-4 52 6 70 8-6 12-30 12-30z" fill="${c.cabelo2}"/>
    <path d="M116 74c6 22 4 52-6 70-8-6-12-30-12-30z" fill="${c.cabelo2}"/>
    <ellipse cx="80" cy="76" rx="30" ry="33" fill="${c.pele}"/>
    <path d="M50 70c4-22 22-30 34-28 16 2 26 12 27 28-14-2-28-10-34-18-6 10-16 16-27 18z" fill="${c.cabelo}"/>
    <ellipse cx="68" cy="78" rx="3.2" ry="4.2" fill="#2b1a14" class="olho"/>
    <ellipse cx="92" cy="78" rx="3.2" ry="4.2" fill="#2b1a14" class="olho"/>
    <path d="M62 70q6-4 11 0M87 70q6-4 11 0" stroke="${c.cabelo2}" stroke-width="2" fill="none" stroke-linecap="round"/>
    <circle cx="61" cy="89" r="5" fill="#f08f8f" opacity=".55"/><circle cx="99" cy="89" r="5" fill="#f08f8f" opacity=".55"/>
    ${sorriso}
    <!-- gorro -->
    <path d="M48 58c4-26 34-38 58-26 12 6 22 0 28-2-2 10-10 18-22 22z" fill="${c.roupa}"/>
    <path d="M104 34c10-4 22-6 30-4" stroke="${c.roupa2}" stroke-width="3" fill="none"/>
    <rect x="44" y="52" width="74" height="13" rx="6.5" fill="${c.pelo}" stroke="#e2cfb4" stroke-width="1.4" transform="rotate(-6 81 58)"/>
    <g class="pompom"><circle cx="136" cy="32" r="8" fill="${c.pelo}" stroke="#e2cfb4" stroke-width="1.4"/></g>`;

  const vestido = `
    <path d="M58 116c-12 24-20 52-22 74h88c-2-22-10-50-22-74z" fill="${c.roupa}"/>
    <path d="M36 184h88v8a4 4 0 0 1-4 4H40a4 4 0 0 1-4-4z" fill="${c.pelo}" stroke="#e2cfb4" stroke-width="1.4"/>
    <rect x="44" y="140" width="72" height="9" fill="#2b1a14"/>
    <rect x="73" y="138" width="14" height="13" rx="2" fill="none" stroke="${c.ouro}" stroke-width="3"/>
    <path d="M60 110h40c4 0 8 4 8 8H52c0-4 4-8 8-8z" fill="${c.pelo}" stroke="#e2cfb4" stroke-width="1.4"/>
    <rect x="73" y="104" width="14" height="8" fill="${c.pele}"/>`;

  const bracoEsq = `
    <path d="M60 118c-10 8-16 22-16 34" stroke="${c.roupa}" stroke-width="13" fill="none" stroke-linecap="round"/>
    <circle cx="44" cy="156" r="7" fill="${c.pele}"/>
    <!-- esmalte -->
    <rect x="36" y="160" width="15" height="17" rx="3" fill="${c.unha}" stroke="${c.roupa2}" stroke-width="1.5"/>
    <rect x="40" y="150" width="7" height="11" rx="1.5" fill="#2b1a14"/>
    <path d="M39 164h3v9" stroke="#fff" stroke-width="1.6" opacity=".6" fill="none" stroke-linecap="round"/>
    <text x="22" y="160" font-size="11" class="brilho" fill="${c.ouro}">✦</text>`;

  const bracoAceno = `
    <g class="braco">
      <path d="M100 118c10-6 18-20 20-36" stroke="${c.roupa}" stroke-width="13" fill="none" stroke-linecap="round"/>
      <rect x="112" y="80" width="16" height="7" rx="3.5" fill="${c.pelo}" stroke="#e2cfb4" stroke-width="1.4" transform="rotate(-10 120 83)"/>
      <circle cx="121" cy="72" r="8" fill="${c.pele}"/>
      <path d="M116 64v-5M120 63v-7M124 63v-6M128 66v-4" stroke="${c.pele2}" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M116 59.5v-.5M120 56.5v-.5M124 57.5v-.5M128 62.5v-.5" stroke="${c.unha}" stroke-width="3.6" stroke-linecap="round"/>
    </g>`;

  const svg = (cls, inner) => `<svg class="mn ${cls}" viewBox="0 0 160 200" role="img" aria-label="Júlia vestida de Mamãe Noel">${inner}</svg>`;

  // 1) Acenando com o esmalte (topo do link)
  const acenando = () => svg('mn-hero', `<g class="corpo">${vestido}${bracoEsq}${bracoAceno}${cabeca('<path d="M70 94q10 9 20 0" stroke="#8a2e2e" stroke-width="2.6" fill="#fff" stroke-linecap="round"/>')}</g>`);

  // 2) Comemorando e mandando beijo (horário pedido)
  const comemorando = () => svg('mn-ok', `<g class="pulo">${vestido}
      <path d="M60 118c-10-6-18-20-20-36" stroke="${c.roupa}" stroke-width="13" fill="none" stroke-linecap="round"/><circle cx="39" cy="74" r="8" fill="${c.pele}"/>
      <path d="M100 118c10-6 18-20 20-36" stroke="${c.roupa}" stroke-width="13" fill="none" stroke-linecap="round"/><circle cx="121" cy="74" r="8" fill="${c.pele}"/>
      ${cabeca('<ellipse cx="80" cy="96" rx="4" ry="4.5" fill="#b8323a"/>')}</g>
      <text x="100" y="96" font-size="14" class="beijo">💋</text><text x="104" y="92" font-size="12" class="beijo b2">❤️</text>
      <text x="22" y="40" font-size="12" class="brilho" fill="${c.ouro}">✦</text><text x="128" y="120" font-size="10" class="brilho" fill="${c.ouro}" style="animation-delay:.8s">✦</text>`);

  // 3) Mini, só o rosto (avisos)
  const mini = () => `<svg class="mn mn-mini" viewBox="40 20 110 100" aria-hidden="true"><g class="corpo">${cabeca('<path d="M72 94q8 7 16 0" stroke="#8a2e2e" stroke-width="2.6" fill="none" stroke-linecap="round"/>')}</g></svg>`;

  window.MamaeNoel = { acenando, comemorando, mini };
})();
