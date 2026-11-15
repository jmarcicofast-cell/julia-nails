// Validação dos ajustes antes de salvar. Sem dependências ou acesso a dados.
(function (root) {
  function validarConfiguracao(c) {
    const positivo = n => Number.isFinite(Number(n)) && Number(n) > 0;
    const dinheiro = n => Number.isFinite(Number(n)) && Number(n) >= 0;
    const hora = s => /^([01]\d|2[0-3]):[0-5]\d$/.test(s || '');
    for (const s of c.servicos || []) {
      if (!positivo(s.duracao) || Number(s.duracao) > 1440) return 'A duração de cada serviço deve ser maior que zero e de até 1440 minutos.';
      if (!dinheiro(s.preco)) return 'O preço dos serviços não pode ser negativo.';
      for (const a of s.adicionais || []) {
        if (!dinheiro(a.preco) || !dinheiro(a.duracao)) return 'Confira o preço e a duração dos adicionais.';
      }
    }
    for (const h of Object.values(c.horarios || {})) {
      if (!h.ativo) continue;
      if (!hora(h.ini) || !hora(h.fim) || h.ini >= h.fim) return 'O fechamento deve ser depois da abertura.';
      if (h.pIni || h.pFim) {
        if (!hora(h.pIni) || !hora(h.pFim) || h.pIni >= h.pFim || h.pIni < h.ini || h.pFim > h.fim) return 'A pausa deve ter início e fim dentro do expediente.';
      }
    }
    if (c.passoServico === false && !positivo(c.intervalo)) return 'Informe um intervalo maior que zero.';
    return '';
  }
  root.validarConfiguracao = validarConfiguracao;
  if (typeof module !== 'undefined') module.exports = validarConfiguracao;
})(typeof window === 'undefined' ? globalThis : window);
