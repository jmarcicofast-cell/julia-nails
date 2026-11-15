# Melhorias para o Firebase Spark — sem Blaze

## Situação

Esta versão não usa Cloud Functions, Cloud Run, servidor próprio ou plano pago. Foi retirada a dependência da função `agendaSegura` e a configuração de implantação de Functions. O Firebase Spark continua sujeito às cotas gratuitas; não há promessa de capacidade ilimitada. Nada foi publicado no Firebase real.

Estão preservados cadastro, recuperação de senha, agenda, adicionais, marcação manual, exceção administrativa de sobreposição, encaixes, financeiro, recompensas, conversas antigas/novas, Pix, cartão por link, WhatsApp, bloqueios, pausas, folgas, horários extras, temas e layouts.

## Como funciona

- `spark-store.js` compartilha o adaptador de transações Firestore entre as páginas. A reserva, a ocupação e o registro diário são gravados juntos.
- O registro diário contém somente IDs aleatórios e intervalos, sem nomes, UID ou telefone. As regras validam que uma cliente só acrescenta o próprio pedido, mantendo os intervalos anteriores intactos e sem sobreposição. O prefixo máximo de término também cobre reservas manuais sobrepostas já existentes. Duas transações disputando o mesmo dia são reavaliadas pelo Firestore.
- Preço e duração são conferidos pelas regras a partir do serviço e dos adicionais cadastrados. A entrada informada deve corresponder ao percentual e a um meio de pagamento configurado. O pagamento real continua conferido manualmente pela administradora, como no projeto original.
- Os horários permitidos são compilados quando a administradora salva ajustes, modifica bloqueios ou abre o painel. `config/reservas` contém janelas por data, descontando pausas, folgas e bloqueios. As regras conferem a janela escolhida e a antecedência. O fuso do studio é UTC−03:00 (Rio de Janeiro para as datas atuais). Confirmar antes de implantar.
- Ajustes de recompensas identificados por telefone são guardados em `configAdmin/recompensas`, restrito à administradora, preservando os valores na migração.
- Somente a titular e a administradora leem dados privados. Conversas legadas dependem de vínculo explícito revisado; nunca são atribuídas automaticamente pelo telefone.
- Recebimento, conclusão e entrada manual usam IDs estáveis e transações para evitar duplicação. A exceção de sobreposição manual continua exclusiva da administradora.
- As páginas leem apenas ocupações de hoje em diante, reduzindo leituras de histórico desnecessárias. Mensagens, reservas e vendas ainda consomem a cota normal do Firestore; acompanhe a aba de uso.

## Limites explícitos

As regras aceitam até 20 adicionais por serviço (com valores em centavos e duração inteira de minutos), sem limitar quais combinações podem ser escolhidas dentro desse cadastro. Se houver mais, a preparação acusa o problema para revisão, sem apagar registros. A agenda aberta é atualizada ao abrir o painel administrativo e ao salvar mudanças; manter o painel sem uso por longos períodos pode exigir reabri-lo para renovar as datas disponíveis.

Perfis de recompensas continuam sendo recalculados pelo painel aberto. O prêmio é um pedido da cliente, sujeito à conferência e aplicação administrativa; não há débito automático de estrelas nem confirmação automática de Pix. Notificações push com o aplicativo fechado não foram implementadas.

## Preparação e migração real

**Não publique somente os HTML nem cole as regras isoladamente.** O cliente, regras e migração precisam ser compatíveis. As novas reservas dependem de `controle/seguranca.schemaVersion == 3`.

A conexão GitHub não autoriza acesso ao Firebase. Para operar nos dados reais é necessária uma sessão administrativa autorizada no projeto `julia-nails-fda89`. Não envie senha, token ou arquivo de chave no chat. Um operador autorizado pode executar o script com Application Default Credentials no próprio ambiente seguro. Não é necessário ativar faturamento para usar este modelo.

1. Preparar homologação com dados fictícios e validar a migração antes de tocar nos registros reais.
2. Confirmar os UIDs do Authentication e revisar o mapa administrativo. Exemplo (`mapeamento-real.json`, fora do Git):

```json
[
  {
    "uid": "UID_CONFIRMADO",
    "conversaIds": ["ID_DA_CONVERSA_ANTIGA"],
    "perfilId": "ID_DO_PERFIL_ANTIGO",
    "agendamentoIds": ["ID_DO_PEDIDO_SEM_UID"]
  }
]
```

Não usar telefone isolado como prova. Registros sem titular confirmado continuam no painel administrativo. Conversas mantêm IDs e mensagens; a cliente pode selecionar o histórico migrado. Agendamentos que já possuem UID continuam consultáveis pela titular.

3. Instalar as ferramentas de teste/migração, sem contratar serviços:

```sh
npm ci
```

4. Rodar a simulação com diretório de saída novo:

```sh
node scripts/migrar-seguranca.cjs --project julia-nails-fda89 --map mapeamento-real.json --out backups/previa-01
```

O padrão não grava no banco. Ele verifica UIDs, gera plano e backup, lista pendências e rejeita conflitos de titularidade. `backup-restauravel.json` preserva timestamps, bytes, referências e geopontos, incluindo as mensagens. O backup contém dados pessoais: guardar em local privado. Leituras administrativas de backup também consomem cota do Spark.

5. Revisar os vínculos, plano e backup. Fazer também exportação/backup administrativo disponível para o projeto. Não apagar duplicatas financeiras automaticamente.
6. Em janela de manutenção, fechar abas antigas da administradora e preparar a versão estática sem abrir tráfego. Publicar as regras somente como parte desse corte coordenado:

```sh
npx firebase deploy --only firestore:rules --project julia-nails-fda89
```

Não há comando de deploy de Functions nesta versão.

7. Com tráfego parado e credenciais administrativas, executar a migração aprovada:

```sh
node scripts/migrar-seguranca.cjs --project julia-nails-fda89 --map mapeamento-real.json --out backups/aplicacao-01 --apply --confirm-project julia-nails-fda89
```

O apply gera um novo backup, reconfere os documentos, vincula os registros, reconstrói os intervalos diários e compila as janelas públicas. Só ativa a versão 3 no fim. Conversas/agendamentos sem titular bloqueiam o apply: apenas se a administradora decidir mantê-los restritos ao painel, pode passar `--allow-unassigned`. Não usar a opção para pular a revisão.

8. Publicar os HTML e `spark-store.js` compatíveis. Validar duas contas, histórico, novo chat, perfil, reserva, adicionais, bloqueio, cancelamento, marcação manual, financeiro e repetição de cliques. Reabrir tráfego só após os testes.

Em falha parcial, manter manutenção, preservar backups e gerar nova simulação sobre o estado atual. A migração não apaga mensagens ou documentos antigos e não reinicia uma versão 3 já ativa. Não reativar regras públicas antigas para fazer uma versão antiga voltar. Recuperação deve comparar cada documento com o plano e preservar alterações posteriores ao backup; o codec permite reconstrução tipada, mas não há restauração destrutiva automática.

## Testes locais

Requer Node 22+, Java 21 e Chromium para testes visuais:

```sh
npm ci
npx playwright install chromium
npm test
npm run test:browser
npm run test:security
```

O emulador usa projetos `demo-…`, não dados reais. O navegador intercepta a configuração e usa demonstração. Ainda validar Safari/iOS, implantação de homologação e cotas reais do studio. A implementação está preparada para revisão; a migração e as regras do projeto real ainda não foram aplicadas.
