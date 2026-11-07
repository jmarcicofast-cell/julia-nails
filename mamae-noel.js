// Júlia — caricaturas realistas animadas do link (modo Natal).
// As imagens ficam na pasta img/. Para trocar, substitua os arquivos mantendo os nomes.
(function () {
  const IMG = { natal: 'img/julia-natal.webp', beijo: 'img/julia-beijo.webp', rosto: 'img/julia-rosto-natal.webp' };

  const css = `
  .jc{position:relative;display:block;margin:0 auto;isolation:isolate}
  .jc .fr{position:relative;border-radius:50%;overflow:hidden;background:#f3e3cf;box-shadow:0 0 0 4px #e2bd6b,0 0 0 7px rgba(255,246,230,.55),0 14px 30px rgba(0,0,0,.3);animation:jcFlutua 4.5s ease-in-out infinite}
  .jc .fr img{display:block;width:100%;height:100%;object-fit:cover;object-position:50% 18%}
  .jc .fr:after{content:"";position:absolute;inset:0;background:linear-gradient(115deg,transparent 35%,rgba(255,255,255,.35) 50%,transparent 65%);transform:translateX(-120%);animation:jcBrilho 5.5s ease-in-out infinite 1.2s}
  .jc .gorro{position:absolute;z-index:2;pointer-events:none;animation:jcGorro 4.5s ease-in-out infinite;transform-origin:30% 90%}
  .jc .sp{position:absolute;z-index:3;color:#f3d58c;font-size:16px;line-height:1;animation:jcPisca 2.2s ease-in-out infinite;text-shadow:0 0 8px rgba(255,220,140,.9)}
  .jc .bj{position:absolute;z-index:3;font-size:22px;opacity:0;animation:jcBeijo 3s ease-out infinite}
  .jc-hero{width:150px;margin-bottom:10px}
  .jc-hero .fr{width:150px;height:150px}
  .jc-hero .gorro{width:86px;left:-20px;top:-34px;transform:rotate(-24deg)}
  .jc-ok{width:170px;margin:4px auto 6px}
  .jc-ok .fr{width:170px;height:170px;border-radius:28px;box-shadow:0 0 0 4px #e2bd6b,0 12px 26px rgba(80,20,10,.22);animation:jcPulo 2.4s ease-in-out infinite}
  .jc-ok .fr img{object-position:50% 25%}
  .jc-mini{width:58px;flex:none}
  .jc-mini .fr{width:58px;height:58px;box-shadow:0 0 0 2px #e2bd6b,0 4px 10px rgba(0,0,0,.15)}
  @keyframes jcFlutua{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
  @keyframes jcPulo{0%,100%{transform:translateY(0) rotate(0)}30%{transform:translateY(-8px) rotate(-2deg)}60%{transform:translateY(0) rotate(1.5deg)}}
  @keyframes jcGorro{0%,100%{translate:0 0}50%{translate:0 -5px}}
  @keyframes jcBrilho{0%,70%{transform:translateX(-120%)}100%{transform:translateX(120%)}}
  @keyframes jcPisca{0%,100%{opacity:.15;transform:scale(.6) rotate(0)}50%{opacity:1;transform:scale(1.15) rotate(20deg)}}
  @keyframes jcBeijo{0%{opacity:0;transform:translate(0,0) scale(.4)}15%{opacity:1}100%{opacity:0;transform:translate(var(--dx,30px),-70px) scale(1.25) rotate(12deg)}}
  @media (prefers-reduced-motion:reduce){.jc *,.jc .fr:after{animation:none!important}.jc .bj{opacity:1}}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  // Gorro de Papai Noel por cima da moldura
  const gorro = `<svg class="gorro" viewBox="0 0 120 90" aria-hidden="true">
    <path d="M14 70C20 32 52 8 86 18c10 3 18 10 22 22-8-4-16-3-22 2-8-14-30-10-38 4-10 6-22 14-34 24z" fill="#c8202c"/>
    <path d="M86 18c10 3 18 10 22 22-8-4-16-3-22 2" fill="#9b1620"/>
    <rect x="4" y="62" width="92" height="20" rx="10" fill="#fffaf2" stroke="#e2cfb4" stroke-width="1.5" transform="rotate(-8 50 72)"/>
    <circle cx="108" cy="42" r="11" fill="#fffaf2" stroke="#e2cfb4" stroke-width="1.5"/></svg>`;
  const brilhos = pos => pos.map(([l, t, d, s]) => `<span class="sp" style="left:${l}%;top:${t}%;animation-delay:${d}s;font-size:${s || 16}px">✦</span>`).join('');
  const alt = 'Júlia Marcico';

  // 1) Topo do link: retrato de Natal com gorro e brilhos
  const acenando = () => `<div class="jc jc-hero"><div class="fr"><img src="${IMG.natal}" alt="${alt}" loading="eager"></div>${gorro}${brilhos([[92, 8, 0, 18], [-8, 62, .8, 14], [96, 70, 1.4, 12], [12, 96, 2, 10]])}</div>`;

  // 2) Pedido enviado: a do beijinho, com beijos e corações voando
  const comemorando = () => `<div class="jc jc-ok"><div class="fr"><img src="${IMG.beijo}" alt="${alt} mandando um beijo"></div>
    <span class="bj" style="left:58%;top:52%;--dx:46px">💋</span><span class="bj" style="left:56%;top:56%;--dx:20px;animation-delay:1s">❤️</span><span class="bj" style="left:60%;top:50%;--dx:60px;animation-delay:2s">💕</span>
    ${brilhos([[-6, 10, .3, 16], [98, 18, 1.1, 14], [-4, 80, 1.7, 12]])}</div>`;

  // 3) Rostinho redondo (login e avisos)
  const mini = () => `<div class="jc jc-mini"><div class="fr"><img src="${IMG.rosto}" alt="${alt}"></div></div>`;

  window.MamaeNoel = { acenando, comemorando, mini };
})();
