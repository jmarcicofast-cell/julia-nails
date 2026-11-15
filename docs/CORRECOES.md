> Atualização: a etapa 2 foi implementada para revisão e testes locais. Consulte [MIGRACAO-FIREBASE.md](MIGRACAO-FIREBASE.md) para regras, função de reserva e migração. A descrição abaixo registra o escopo da etapa 1; as pendências de código de segurança foram tratadas na etapa 2, mas a implantação e migração reais continuam pendentes.

# Correções — etapa 1

Esta branch corrige os problemas reproduzidos no aplicativo, sem alterar o Firebase de produção. As páginas continuam nos mesmos endereços; não há migração de framework ou remoção de telas/ações.

## Implementado

- Dados locais e ID de conversa separados por UID; listeners e formulários são limpos na saída e na troca de conta. Os horários são filtrados por titular. Retornar à mesma conta recupera seus dados.
- Entrada e finalização financeira usam transação do Firestore, com ID determinístico por operação e leitura do status atual. Cliques, reenvios e chamadas concorrentes da versão nova não devem criar duas vendas. A demonstração também ignora repetições.
- Durações inválidas são rejeitadas antes de salvar e antes do cálculo de vagas. Preços negativos, pausa incompleta e expediente invertido são rejeitados.
- Tela de pagamento interrompe o fluxo e orienta contato se o serviço não tiver Pix ou cartão disponível. Não cria cobrança/reserva sem meio válido.
- Grades e campos cabem em 320 px; painel usa até 960 px no computador. Estilos comuns extraídos para responsive.css.
- Ações assíncronas exibem erro e evitam execução repetida pelo mesmo botão.

## Compatibilidade e histórico

Não foram apagados dados do Firestore nem chaves locais legadas. Agendamentos já vinculados a `clienteUid` continuam disponíveis pela consulta da conta, inclusive em outro aparelho. Dados locais sem titular comprovado não são atribuídos automaticamente à próxima conta que entrar.

**Conversas antigas sem vínculo por UID precisam de migração antes de liberar esta versão para todas as clientes.** Elas permanecem no painel da administradora, mas o aplicativo novo não reutiliza automaticamente um ID de conversa global do aparelho. Não é seguro atribuir esse histórico apenas por telefone ou pelo próximo login. O processo de migração deve vincular explicitamente titular e conversa, com confirmação administrativa.

A transação financeira não corrige duplicatas já existentes. Conferir extrato e comprovantes antes de qualquer ajuste no histórico. Não executar exclusão automática. Evitar manter abas antigas do painel abertas durante a atualização, porque o código antigo ainda pode registrar duplicações.

## Próxima etapa: exige homologação e acesso administrativo ao Firebase

As regras publicadas e os dados reais não foram acessados. O arquivo firestore.rules permanece inalterado nesta etapa; os riscos de autorização identificados na análise **ainda existem**. A correção visual de sessão não substitui autorização no servidor.

Plano para concluir segurança e concorrência sem perder funcionalidades:

1. Exportar backup, verificar regras efetivamente publicadas e criar projeto de homologação/emulador.
2. Definir e migrar vínculo `clienteUid` de conversas e perfis; manter histórico antigo acessível à administradora e tratar os casos sem titular comprovado.
3. Implementar uma operação confiável de reserva que valide preço, duração, expediente e todos os intervalos sobrepostos. Serializar a disputa por dia/intervalo com transação. Incluir marcação manual, exceção administrativa, recusa, cancelamento e falta na mesma política de ocupação.
4. Migrar ocupações atuais antes da troca. Implementar reenvio pelo mesmo ID e consistência entre agendamento/ocupação.
5. Publicar cliente e regras compatíveis: somente titular/admin lê dados privados; mensagens validam autor; a cliente não escreve diretamente em bloqueios financeiros ou dados de outra conta. Perfis de recompensas continuam disponíveis, com vínculo comprovado.
6. Testar regras no emulador: acesso anônimo, outra conta, falsificação de remetente, alteração de preço/status, reserva simultânea e falha parcial. Testar dados antigos migrados.
7. Somente após validação, publicar em produção. Não colar regras restritivas isoladamente no console antes da migração e do cliente compatível.

## Como testar

Requer Node.js 22 ou superior. Os testes do navegador interceptam todos os arquivos locais e bloqueiam recursos externos. Não usam o Firebase configurado em config.js nem realizam pagamento real.

```sh
npm ci
npx playwright install chromium
npm test
npm run test:browser
```

Se já houver Chromium instalado, pode-se usar `CHROMIUM_PATH=/caminho/do/chromium npm run test:browser`.

Resultados/capturas são gravados em `/tmp/julia-nails-tests` (ou na pasta indicada em TEST_OUTPUT). Cobertura: cinco testes de validação/cálculo/registro financeiro; navegação em cinco larguras; criação e troca de contas; retorno à conta original; Pix; pedido; clique repetido no recebimento e finalização; serviço sem meio de pagamento. A camada de transação usa um adaptador simulado nos testes unitários; não houve teste contra o Firestore real.

Ainda validar Safari/iOS, teclado virtual, fontes externas e implantação no Firebase de homologação. A etapa 1 é proposta de revisão, não declaração de que todos os problemas do projeto estão resolvidos.
