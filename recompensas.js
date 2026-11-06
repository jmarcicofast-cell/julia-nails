// ============================================================
//  PROGRAMA DE RECOMPENSAS — estrelinhas, emblemas e prêmios
//  O painel calcula o perfil de cada cliente a partir dos
//  agendamentos e publica em /perfis/{telefone}. O link só lê.
// ============================================================
(function () {
  const PADRAO = {
    ativo: true,
    porAtendimento: 10,
    bonusNatal: 5,
    catalogo: [
      { custo: 30, nome: 'Hidratação de cutículas de presente' },
      { custo: 50, nome: '2 unhas decoradas de presente' },
      { custo: 80, nome: 'Esfoliação nos pés de presente' },
      { custo: 100, nome: 'R$10 de desconto no serviço' },
      { custo: 150, nome: 'Decoração natalina completa de presente' }
    ]
  };

  const EMBLEMAS = [
    { id: 'reserva', ic: '📅', nome: 'Primeira reserva', como: 'Fazer o primeiro agendamento' },
    { id: 'estreia', ic: '🎀', nome: 'Estreia', como: 'Concluir o primeiro atendimento' },
    { id: 'natal', ic: '🎄', nome: 'Unhas de Natal', como: 'Fazer as unhas na Agenda de Natal' },
    { id: 'pix', ic: '💌', nome: 'Pix em dia', como: 'Pagar a entrada de 3 agendamentos' },
    { id: 'explora', ic: '🌈', nome: 'Exploradora', como: 'Experimentar 3 serviços diferentes' },
    { id: 'mensal', ic: '🔁', nome: 'De volta no mês', como: '2 atendimentos no mesmo mês' },
    { id: 'fiel', ic: '💅', nome: 'Cliente fiel', como: 'Concluir 5 atendimentos' },
    { id: 'presente', ic: '✨', nome: 'Sempre presente', como: '5 atendimentos sem nenhuma falta' },
    { id: 'rainha', ic: '👑', nome: 'Rainha das unhas', como: 'Concluir 10 atendimentos' }
  ];

  const NIVEIS = [
    { min: 0, ic: '🌱', nome: 'Iniciante' },
    { min: 3, ic: '💖', nome: 'Querida' },
    { min: 6, ic: '🌟', nome: 'VIP' },
    { min: 10, ic: '👑', nome: 'Diamante' }
  ];

  const cfgDe = cfg => {
    const r = { ...PADRAO, ...((cfg && cfg.recompensas) || {}) };
    if (!Array.isArray(r.catalogo) || !r.catalogo.length) r.catalogo = PADRAO.catalogo;
    r.catalogo = r.catalogo.filter(x => x && x.nome && Number(x.custo) > 0).map(x => ({ custo: Number(x.custo), nome: String(x.nome) })).sort((a, b) => a.custo - b.custo);
    return r;
  };

  /** Chave do perfil: só os números do WhatsApp, sem o 55 do Brasil */
  function chave(tel) {
    let d = String(tel || '').replace(/\D/g, '');
    if (d.length >= 12 && d.startsWith('55')) d = d.slice(2);
    return d.length >= 10 ? d : '';
  }
  const nivel = concluidos => NIVEIS.filter(n => concluidos >= n.min).pop();
  const proximoNivel = concluidos => NIVEIS.find(n => n.min > concluidos) || null;
  /** "R$10 de desconto" → 10 */
  const desconto = nome => { const m = /R\$\s*(\d+(?:[.,]\d+)?)/i.exec(nome || ''); return m && /desconto/i.test(nome) ? Number(m[1].replace(',', '.')) : 0; };

  /** Calcula o perfil de uma cliente a partir dos agendamentos dela */
  function calcular(ags, cfg) {
    const r = cfgDe(cfg);
    const conc = ags.filter(a => a.status === 'concluido').sort((a, b) => (a.data + a.ini).localeCompare(b.data + b.ini));
    const faltas = ags.filter(a => a.status === 'falta').length;
    const natalDe = a => Number(a.adicionalNatal) > 0 || String(a.data || '').slice(5, 7) === '12';
    const ganhas = conc.reduce((s, a) => s + r.porAtendimento + (natalDe(a) ? r.bonusNatal : 0), 0);
    const usadas = conc.reduce((s, a) => s + (a.recompensa && a.recompensa.aplicada ? Number(a.recompensa.custo) || 0 : 0), 0);
    const porMes = {}; conc.forEach(a => { const m = String(a.data || '').slice(0, 7); porMes[m] = (porMes[m] || 0) + 1; });
    const ok = {
      reserva: ags.some(a => ['pendente', 'confirmado', 'concluido'].includes(a.status)),
      estreia: conc.length >= 1,
      natal: conc.some(natalDe),
      pix: ags.filter(a => a.entrada && a.entrada.status === 'recebida').length >= 3,
      explora: new Set(conc.map(a => a.servicoId || a.servicoNome)).size >= 3,
      mensal: Object.values(porMes).some(n => n >= 2),
      fiel: conc.length >= 5,
      presente: conc.length >= 5 && faltas === 0,
      rainha: conc.length >= 10
    };
    const ultimo = ags.map(a => a.nome).filter(Boolean).pop() || '';
    return {
      nome: ultimo.trim().split(/\s+/)[0] || 'Cliente',
      concluidos: conc.length,
      ganhas, usadas, estrelas: Math.max(0, ganhas - usadas),
      emblemas: EMBLEMAS.filter(e => ok[e.id]).map(e => e.id),
      ultimaVisita: conc.length ? conc[conc.length - 1].data : ''
    };
  }

  window.RECOMP = { PADRAO, EMBLEMAS, NIVEIS, cfgDe, chave, nivel, proximoNivel, desconto, calcular };
})();
