# Segurança e migração — versão 2

## Estado desta entrega

O código inclui regras privadas por conta, histórico de conversas vinculado por mapa administrativo, função `agendaSegura` para reservar/cancelar/excluir/finalizar e scripts de migração. Tudo foi desenvolvido com dados fictícios. Nenhuma regra, função, conta ou registro real foi alterado.

**Não faça merge/publicação isolada dos HTML.** As novas páginas dependem da função implantada, das novas regras e da migração ativada. A agenda recusa gravações no servidor enquanto `controle/seguranca.schemaVersion` não for 2.

## O que muda

- A cliente não escreve diretamente em agendamentos nem ocupações, nem mesmo usando a API fora da interface.
- Serviço, preço, adicionais, entrada, pausa, bloqueios, antecedência e horizonte são conferidos pelo servidor. O fuso do atendimento é `America/Sao_Paulo` (UTC−03:00 para as datas atuais), compatível com o studio no Rio de Janeiro; confirmar antes de implantar.
- Toda reserva usa um documento de exclusão por dia. Pedido/ocupação são gravados juntos; duas reservas sobrepostas de clientes não são aceitas. Uma repetição do mesmo ID não cria novo pedido. A administradora mantém a exceção manual, inclusive sobreposição intencional já confirmada na interface.
- Cancelamento, recusa, falta, exclusão e conclusão removem a ocupação na mesma transação. Pagamentos e entrada manual atualizam movimento e agendamento juntos.
- Somente a cliente titular e a administradora leem dados privados. O UID administrativo é obtido do Authentication na migração, além da conferência de e-mail nas regras/função.
- Conversas antigas preservam os IDs e as mensagens. A cliente seleciona as conversas migradas pelo campo “Conversa”; a conversa nova é vinculada ao UID e pode ser retomada em outro aparelho.
- Perfis antigos só são acessíveis quando vinculados pelo mapa. Novos perfis por UID consideram atendimentos vinculados à conta. O painel mantém perfis administrativos por telefone e atualiza os perfis por UID quando aberto, como já ocorria com recompensas. O saldo e os prêmios migrados não são zerados.

## Acesso necessário

A conexão GitHub não dá acesso ao Firebase. A implantação exige uma sessão administrativa autorizada no Firebase/Google Cloud do projeto `julia-nails-fda89`, permissão para implantar regras/funções e ler Authentication/Firestore para a migração. Não envie senhas, tokens ou arquivos de chave no chat. O operador autorizado deve usar credenciais locais/ambiente seguro (Application Default Credentials para o script e uma sessão Firebase CLI autorizada para implantação).

Cloud Functions de segunda geração pode exigir plano Blaze/faturamento e APIs Google Cloud habilitadas. Verifique isso no console antes da implantação; esta entrega não alterou plano ou cobrança.

## Prévia da migração

1. Faça primeiro uma implantação equivalente em um projeto de homologação. Crie os usuários fictícios no Authentication e documentos de teste. Não use uma cópia de dados pessoais em ambiente público.
2. O mapa é um JSON revisado pela administradora, com um objeto por UID:

```json
[
  {
    "uid": "UID_CONFIRMADO_NO_AUTHENTICATION",
    "conversaIds": ["ID_DA_CONVERSA_ANTIGA"],
    "perfilId": "ID_DO_PERFIL_ANTIGO",
    "agendamentoIds": ["ID_DO_AGENDAMENTO_SEM_UID"]
  }
]
```

Omita campos opcionais vazios. Não use o telefone, sozinho, como comprovação de titularidade. Quando houver dúvida, mantenha o registro sem vínculo: continua disponível à administradora até revisão. Contas ainda inexistentes podem ser vinculadas numa rodada posterior, com uma operação administrativa específica revisada; não atribua registros ao próximo login.

3. Instale ferramentas locais:

```sh
npm ci
npm ci --prefix functions
```

4. Execute a simulação no projeto correto, com credenciais autorizadas e saída privada nova a cada tentativa:

```sh
node scripts/migrar-seguranca.cjs --project julia-nails-fda89 --map mapeamento-real.json --out backups/previa-01
```

A execução padrão não grava no banco. Ela verifica que os UIDs existem no Authentication, gera backup e plano, informa conversas/agendamentos ainda sem titular e rejeita conflitos de dono. `backup-restauravel.json` preserva timestamps, bytes, referências e geopontos; `backup.json` é uma versão de consulta. Os arquivos contêm dados pessoais, estão excluídos do Git e devem ser guardados com acesso restrito. As subcoleções de mensagens também são copiadas. Revisar plano e pendências antes de continuar. O apply é bloqueado se houver conversas/agendamentos sem titular. Somente quando a administradora decidir manter explicitamente esses registros restritos ao painel, use `--allow-unassigned`; não use a opção apenas para ignorar pendências.

## Corte para produção (somente após homologação aprovada)

1. Confirmar backup oficial/exportação do Firestore e Authentication, além do backup local do script, e procedimento de recuperação. Agendar janela de manutenção; fechar abas antigas da administradora. Preparar a nova versão estática sem ativar o tráfego ainda.
2. Implantar a função sem enviar páginas ao público:

```sh
npx firebase deploy --only functions --project julia-nails-fda89
```

3. Publicar as regras novas na janela de manutenção. Elas passam a negar as gravações diretas dos clientes antigos. A função ainda nega gravações sem o marcador da migração:

```sh
npx firebase deploy --only firestore:rules --project julia-nails-fda89
```

4. Com o tráfego parado, gerar uma nova simulação/backup final. Conferir pendências e aplicar com outro diretório novo (o apply também gera seu próprio backup e plano):

```sh
node scripts/migrar-seguranca.cjs --project julia-nails-fda89 --map mapeamento-real.json --out backups/aplicacao-01 --apply --confirm-project julia-nails-fda89
```

O script não apaga documentos ou mensagens. Ele vincula registros confirmados, reconstrói exclusões diárias e saneia os documentos públicos de ocupação para conter somente data/início/fim. Reconfere os documentos antes de alterá-los e só ativa a versão 2 no fim. Se falhar parcialmente, não reabra tráfego: preserve os backups, investigue o erro e gere uma nova simulação sobre o estado atual. Ele não reinicia automaticamente uma migração já ativa.

5. Publicar os HTML compatíveis e validar com duas contas fictícias controladas: titular/terceira pessoa, histórico, novo chat, recompensa, Pix/cartão, reserva simultânea, reserva manual, cancelamento, financeiro e reenvio.
6. Reabrir tráfego somente quando cliente, funções, regras e mapa estiverem consistentes. Verificar logs e uso do Firestore.

## Recuperação

Em falha, mantenha a manutenção. Não reative as regras públicas antigas apenas para fazer o site antigo voltar. O backup tipado permite reconstrução dos documentos originais com `decode` de `scripts/snapshot-codec.cjs`, mas não há rotina de restauração automática destrutiva. Uma recuperação deve comparar cada documento com as escritas do plano e preservar qualquer dado posterior ao backup. Revisar com a administradora quais vínculos devem ser revertidos; não remover mensagens ou lançamentos indiscriminadamente.

## Testes reproduzíveis

```sh
npm test
CHROMIUM_PATH=/caminho/do/chromium npm run test:browser
npm run test:security
```

A suíte de segurança usa projeto `demo-julia-nails` e Firestore emulado, Java 21 e dados fictícios. Exercita autorização, preço adulterado, pausa, reserva simultânea, reenvio, cancelamento, pagamentos concorrentes, marcação manual e preservação dos tipos de backup. Os testes do servidor chamam o mesmo handler da função contra o Firestore emulado; a autenticação de transporte da callable é fornecida pelo Firebase em produção e ainda deve ser validada ponta a ponta em homologação.

Limites atuais: nenhuma validação com dados reais, plano de faturamento ou regras atualmente publicadas; Safari/iOS e notificações em aparelhos reais continuam pendentes. Não há acesso administrativo configurado neste ambiente. Portanto a implementação está preparada para revisão/homologação, não migrada em produção.
