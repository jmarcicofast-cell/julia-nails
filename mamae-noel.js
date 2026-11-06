// Júlia de Mamãe Noel — ilustrações animadas (SVG) do modo Natal.
// Para mudar cabelo/pele, troque as cores em CORES.
(function () {
  const CORES = { pele: '#dba57f', pele2: '#c58763', cabelo: '#6e3d1e', cabelo2: '#4a2611', mecha: '#c48a4a', roupa: '#c8202c', roupa2: '#9b1620', pelo: '#fffaf2', ouro: '#e2bd6b', unha: '#c8202c' };
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

  // cachos: bolinhas sobrepostas com mechas douradas, até os ombros
  const cachos = (pts, r, cor) => pts.map(([x, y], k) => `<circle cx="${x}" cy="${y}" r="${r + (k % 3) - 1}" fill="${cor}"/>`).join('');
  const ladoE = [[50,64],[44,76],[42,90],[44,104],[48,116],[54,126],[40,112],[46,130]];
  const ladoD = ladoE.map(([x, y]) => [160 - x, y]);
  const topo = [[56,52],[66,46],[78,44],[90,45],[102,50],[110,58]];
  const cabeca = (sorriso) => `
    <g>${cachos(ladoE, 10, c.cabelo2)}${cachos(ladoD, 10, c.cabelo2)}</g>
    <g>${cachos(ladoE.map(([x, y]) => [x + 3, y - 2]), 7, c.cabelo)}${cachos(ladoD.map(([x, y]) => [x - 3, y - 2]), 7, c.cabelo)}</g>
    <ellipse cx="80" cy="78" rx="27" ry="31" fill="${c.pele}"/>
    <g>${cachos(topo, 9, c.cabelo)}</g>
    <g stroke="${c.mecha}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".95">${[[44,74],[40,100],[50,122],[116,74],[120,100],[110,122],[64,46],[92,44]].map(([x, y]) => `<path d="M${x - 4} ${y + 2}q4-6 8 0"/>`).join('')}</g>
    <path d="M60 72q7-5 14-1M86 71q7-4 14 1" stroke="#3a1d10" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <g class="olho"><ellipse cx="68" cy="80" rx="3.4" ry="4.2" fill="#2b1a14"/><circle cx="69.2" cy="78.6" r="1.1" fill="#fff"/></g>
    <g class="olho"><ellipse cx="92" cy="80" rx="3.4" ry="4.2" fill="#2b1a14"/><circle cx="93.2" cy="78.6" r="1.1" fill="#fff"/></g>
    <path d="M63.5 76.5l-2.5-2M96.5 76.5l2.5-2" stroke="#2b1a14" stroke-width="1.4" stroke-linecap="round"/>
    <circle cx="61" cy="91" r="5" fill="#e0726f" opacity=".45"/><circle cx="99" cy="91" r="5" fill="#e0726f" opacity=".45"/>
    ${sorriso}
    <!-- gorro -->
    <path d="M50 58c4-26 34-38 58-26 12 6 22 0 28-2-2 10-10 18-22 22z" fill="${c.roupa}"/>
    <path d="M104 34c10-4 22-6 30-4" stroke="${c.roupa2}" stroke-width="3" fill="none"/>
    <rect x="46" y="52" width="72" height="13" rx="6.5" fill="${c.pelo}" stroke="#e2cfb4" stroke-width="1.4" transform="rotate(-6 81 58)"/>
    <g class="pompom"><circle cx="136" cy="32" r="8" fill="${c.pelo}" stroke="#e2cfb4" stroke-width="1.4"/></g>`;
  const boca = '<path d="M71 95q9 3 18 0q-1 7-9 7t-9-7z" fill="#b51f2b"/><path d="M73 95.6q7 1.6 14 0" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
  const colar = `<path d="M70 108q10 8 20 0" stroke="${c.ouro}" stroke-width="1.4" fill="none"/><path d="M80 114l-2.4-2.4a1.7 1.7 0 0 1 2.4-2.4 1.7 1.7 0 0 1 2.4 2.4z" fill="${c.ouro}"/>`;

  const vestido = `
    <path d="M58 116c-12 24-20 52-22 74h88c-2-22-10-50-22-74z" fill="${c.roupa}"/>
    <path d="M36 184h88v8a4 4 0 0 1-4 4H40a4 4 0 0 1-4-4z" fill="${c.pelo}" stroke="#e2cfb4" stroke-width="1.4"/>
    <rect x="44" y="140" width="72" height="9" fill="#2b1a14"/>
    <rect x="73" y="138" width="14" height="13" rx="2" fill="none" stroke="${c.ouro}" stroke-width="3"/>
    <path d="M60 110h40c4 0 8 4 8 8H52c0-4 4-8 8-8z" fill="${c.pelo}" stroke="#e2cfb4" stroke-width="1.4"/>
    <rect x="73" y="104" width="14" height="8" fill="${c.pele}"/>${colar}`;

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
  const acenando = () => svg('mn-hero', `<g class="corpo">${vestido}${bracoEsq}${cabeca(boca)}${bracoAceno}</g>`);

  // 2) Comemorando e mandando beijo (horário pedido)
  const comemorando = () => svg('mn-ok', `<g class="pulo">${vestido}
      ${cabeca('<ellipse cx="80" cy="98" rx="4.2" ry="4.6" fill="#b51f2b"/>')}
      <path d="M60 118c-10-6-18-20-20-36" stroke="${c.roupa}" stroke-width="13" fill="none" stroke-linecap="round"/><circle cx="39" cy="74" r="8" fill="${c.pele}"/>
      <path d="M100 118c10-6 18-20 20-36" stroke="${c.roupa}" stroke-width="13" fill="none" stroke-linecap="round"/><circle cx="121" cy="74" r="8" fill="${c.pele}"/></g>
      <text x="100" y="96" font-size="14" class="beijo">💋</text><text x="104" y="92" font-size="12" class="beijo b2">❤️</text>
      <text x="22" y="40" font-size="12" class="brilho" fill="${c.ouro}">✦</text><text x="128" y="120" font-size="10" class="brilho" fill="${c.ouro}" style="animation-delay:.8s">✦</text>`);

  // 3) Mini, só o rosto (avisos)
  const mini = () => `<svg class="mn mn-mini" viewBox="28 20 120 118" aria-hidden="true"><g class="corpo">${cabeca(boca)}</g></svg>`;

  window.MamaeNoel = { acenando, comemorando, mini };
})();
