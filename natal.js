// ============================================================
//  NATAL + ENTRADA VIA PIX — usado pelo painel e pelo link
// ============================================================
(function () {
  const REGRAS_PADRAO = [
    'Chegar no horário correto agendado',
    'Sair de casa com antecedência',
    'Tolerância de atraso de 10 min',
    'Para agendamento será necessário 50% do valor do serviço',
    'O pagamento da entrada é feito por Pix ou cartão direto no link de agendamento',
    'Em caso de falta o valor não será devolvido',
    'Para um novo agendamento consulte a disponibilidade no link ou entre na lista de encaixe',
    'Decorações devem já ter sido previamente escolhidas antes do serviço',
    'Reajuste natalino de R$10 adicional por serviço'
  ];
  const PADRAO = {
    natal: { ativo: true, adicional: 10, titulo: 'Agenda de Natal' },
    entrada: { ativo: true, percentual: 50, tipoChave: 'celular', chavePix: '', recebedor: 'Julia Marcico', cidade: 'Rio de Janeiro', cartaoAtivo: false, linkCartao: '', linksCartao: {} },
    regras: REGRAS_PADRAO
  };

  const r2 = n => Math.round((Number(n) || 0) * 100) / 100;
  const natal = cfg => ({ ...PADRAO.natal, ...((cfg && cfg.natal) || {}) });
  const entradaCfg = cfg => ({ ...PADRAO.entrada, ...((cfg && cfg.entrada) || {}) });
  const regras = cfg => (cfg && Array.isArray(cfg.regras) && cfg.regras.length ? cfg.regras : REGRAS_PADRAO);

  /** Preço que a cliente paga (com o adicional natalino, se ligado) */
  const precoFinal = (cfg, s) => r2((Number(s && s.preco) || 0) + (natal(cfg).ativo ? Number(natal(cfg).adicional) || 0 : 0));
  /** Entrada exigida (0 se a entrada estiver desligada ou sem chave Pix) */
  const temPix = cfg => !!String(entradaCfg(cfg).chavePix || '').trim();
  const url = u => /^https?:\/\//i.test(String(u || '').trim()) ? String(u).trim() : '';
  /** Link de cartão para um serviço: o link próprio do serviço ou o link geral */
  const linkCartao = (cfg, servicoId) => { const e = entradaCfg(cfg); if (!e.cartaoAtivo) return null; const proprio = url((e.linksCartao || {})[servicoId]); if (proprio) return { url: proprio, fixo: true }; const geral = url(e.linkCartao); return geral ? { url: geral, fixo: false } : null; };
  const temCartao = cfg => { const e = entradaCfg(cfg); return !!(e.cartaoAtivo && (url(e.linkCartao) || Object.values(e.linksCartao || {}).some(url))); };
  const entradaAtiva = cfg => { const e = entradaCfg(cfg); return !!(e.ativo && (temPix(cfg) || temCartao(cfg))); };
  const valorEntrada = (cfg, preco) => entradaAtiva(cfg) ? r2(Number(preco) * (Number(entradaCfg(cfg).percentual) || 0) / 100) : 0;

  /* ---------- Pix "copia e cola" (padrão BR Code do Banco Central) ---------- */
  const semAcento = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9 .\-]/g, '').trim();
  function chaveNormalizada(tipo, chave) {
    const c = String(chave || '').trim(); const d = c.replace(/\D/g, '');
    if (tipo === 'cpf') return d;
    if (tipo === 'email') return c.toLowerCase();
    if (tipo === 'celular') { if (c.startsWith('+')) return '+' + d; return '+55' + d.replace(/^55(?=\d{10,11}$)/, ''); }
    return c; // aleatória
  }
  const tlv = (id, v) => id + String(v.length).padStart(2, '0') + v;
  function crc16(s) {
    let crc = 0xFFFF;
    for (let i = 0; i < s.length; i++) {
      crc ^= s.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }
  /** Gera o código Pix com valor já preenchido */
  function pixCodigo(cfg, valor, txid, descricao) {
    const e = entradaCfg(cfg);
    const conta = tlv('00', 'br.gov.bcb.pix') + tlv('01', chaveNormalizada(e.tipoChave, e.chavePix)) + (descricao ? tlv('02', semAcento(descricao).slice(0, 40)) : '');
    const id = (String(txid || '').replace(/[^A-Za-z0-9]/g, '') || '***').slice(0, 25);
    let p = tlv('00', '01') + tlv('26', conta) + tlv('52', '0000') + tlv('53', '986') + tlv('54', r2(valor).toFixed(2)) + tlv('58', 'BR')
      + tlv('59', (semAcento(e.recebedor) || 'Recebedor').slice(0, 25)) + tlv('60', (semAcento(e.cidade) || 'Rio de Janeiro').slice(0, 15))
      + tlv('62', tlv('05', id)) + '6304';
    return p + crc16(p);
  }
  /** QR do código Pix em SVG (precisa do qrcode.js carregado) */
  function pixQrSvg(codigo) {
    if (typeof qrcode !== 'function') return '';
    const q = qrcode(0, 'M'); q.addData(codigo); q.make();
    return q.createSvgTag({ cellSize: 5, margin: 2, scalable: true });
  }

  window.NATAL = { temPix, temCartao, linkCartao, PADRAO, REGRAS_PADRAO, natal, entradaCfg, regras, precoFinal, entradaAtiva, valorEntrada, pixCodigo, pixQrSvg, crc16, r2 };
})();
