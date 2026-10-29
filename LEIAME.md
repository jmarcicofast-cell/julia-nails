# Júlia Marcico Nails — app de agendamento

Dois endereços, um só app:

- **index.html** → painel da Júlia (só ela entra, com e-mail e senha)
- **agendar.html** → link que as clientes usam para agendar, entrar na lista de encaixe e conversar

Enquanto o `config.js` estiver com `COLE_AQUI`, o app abre em **modo demonstração**, com dados de exemplo salvos só no aparelho. Dá para testar tudo assim antes de configurar.

## O que o painel faz

- **Agenda**: semana com bolinhas por dia, pedidos para aprovar no topo (Confirmar / Recusar), botão de WhatsApp com mensagem pronta de confirmação, lembrete e recusa. "Finalizar e receber" registra o pagamento direto no financeiro.
- **Encaixes**: lista de quem não achou horário (vem do link ou ela adiciona), vagas livres dos próximos 7 dias, botão "Avisar vaga" no WhatsApp e "Encaixar", que já cria o horário. Quando ela cancela um horário, o app lembra quem está esperando.
- **Financeiro**: lucro do mês, entradas, saídas, ticket médio, gráfico de 6 meses, formas de pagamento, serviços que mais vendem, gastos por categoria e lista de movimentações.
- **Chat**: conversas das clientes em tempo real, com atalho para o WhatsApp de cada uma.
- **Ajustes**: serviços e preços, horário de cada dia com pausa, intervalo entre horários, antecedência mínima, folgas, link para copiar e avisos no celular.

## Passo a passo para colocar no ar

### 1. Criar o Firebase (grátis)
1. Acesse console.firebase.google.com → **Adicionar projeto** → nome `julia-nails`.
2. Menu **Build → Authentication** → Começar → ative **E-mail/senha**.
3. Na aba **Users** → **Adicionar usuário** com o e-mail e a senha da Júlia.
4. Menu **Build → Firestore Database** → Criar banco → região `southamerica-east1 (São Paulo)` → modo de produção.
5. Na aba **Regras**, apague tudo, cole o conteúdo de `firestore.rules`, troque `juliamarcico@gmail.com` pelo e-mail dela e clique em **Publicar**.
6. Engrenagem → **Configurações do projeto** → Seus apps → ícone **</>** (Web) → registre o app e copie o bloco `firebaseConfig`.

### 2. Preencher o config.js
- `adminEmail`: o mesmo e-mail da Júlia.
- `firebase`: cole os valores do bloco copiado (apiKey, authDomain, projectId…).

### 3. Publicar no Netlify
- Mais rápido: app.netlify.com/drop → arraste a pasta inteira.
- Ou suba no GitHub e conecte o repositório no Netlify (atualiza sozinho a cada mudança).
- Em **Site configuration → Change site name**, coloque algo como `julia-marcico-nails`.

Ficará assim:
- Painel: `https://julia-marcico-nails.netlify.app`
- Link das clientes: `https://julia-marcico-nails.netlify.app/agendar.html`

### 4. Primeiro acesso da Júlia
1. Abrir o painel no celular e entrar com e-mail e senha.
2. Em **Ajustes**: conferir serviços, preços, horários e o WhatsApp dela → **Salvar ajustes**.
3. No navegador, **Adicionar à tela inicial** para virar ícone de app.
4. Copiar o link de agendamento e colocar na bio do Instagram e no status do WhatsApp.

## Bom saber
- O pedido feito pelo link **já reserva o horário** (ninguém mais consegue pegar) até ela confirmar ou recusar.
- As clientes não veem nomes de outras clientes — o link só enxerga se o horário está livre.
- Os avisos de novo pedido e nova mensagem funcionam com o app aberto ou em segundo plano no celular.
- O plano grátis do Firebase aguenta com folga o movimento de um studio.
