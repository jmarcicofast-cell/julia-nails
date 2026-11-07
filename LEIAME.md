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

## 🎄 Agenda de Natal e entrada por Pix
- **Ajustes › Natal e entrada por Pix**: liga/desliga o visual natalino e o reajuste (R$10 por serviço), define a % da entrada (50%), a chave Pix, o nome e a cidade de quem recebe, e os pré-requisitos que aparecem no link.
- No link, depois de escolher serviço, dia e horário, a cliente informa a decoração, aceita as regras e **paga a entrada por Pix ali mesmo** (QR Code ou copia e cola com o valor já preenchido). Só depois de tocar em "Já paguei" o pedido é enviado.
- No painel, o pedido chega com "Pix de entrada · conferir". Ao confirmar, a Júlia confere no banco e toca em "Recebi o Pix" — a entrada entra no financeiro e, no "Finalizar e receber", só aparece o restante.
- "Faltou" registra a falta e libera o horário (a entrada fica com ela). "Cancelar" pergunta se vai devolver a entrada e lança a devolução como saída.
- Use "Testar Pix de R$ 1,00" para conferir se a chave está certa antes de divulgar.
- Depois do Natal: desmarque "Modo Natal" e o app volta ao visual rosa, sem o reajuste.

## ⭐ Recompensas das clientes (perfil, emblemas e mimos)
- **Antes de usar, publique as regras novas**: Firebase › Firestore › Regras → cole de novo o `firestore.rules` (ganhou o bloco `perfis`) → Publicar.
- A cliente abre a aba **Perfil** no link, coloca o WhatsApp e vê nível, estrelinhas, emblemas e os mimos que pode trocar.
- Cada atendimento concluído vale +10⭐ (+5⭐ de bônus no Natal). Emblemas: primeira reserva, estreia, unhas de Natal, Pix em dia, exploradora, de volta no mês, cliente fiel, sempre presente e rainha das unhas.
- Ao agendar, ela escolhe o mimo se tiver estrelas. No painel aparece "🎁 Quer usar" com o saldo dela; no "Finalizar e receber" a Júlia marca se aplicou (prêmio de "R$ de desconto" já abate do valor).
- Em **Ajustes › Recompensas** dá para mudar as estrelas por atendimento, o bônus de Natal e a lista de mimos (`estrelas | prêmio`, um por linha).

## 💳 Entrada no cartão
- Em **Ajustes › Natal e entrada**, marque "Aceitar cartão na entrada" e cole os links de pagamento criados na sua plataforma (InfinitePay, Mercado Pago, PagBank…).
- Melhor opção: um link com o valor exato da entrada de cada serviço (o painel mostra o valor ao lado de cada campo). Se a plataforma só tiver link de valor livre, use o "link geral": a cliente é avisada para digitar o valor.
- A cliente escolhe Pix ou Cartão na tela de pagamento. No painel aparece "Cartão de entrada · conferir"; confira nas vendas da plataforma e toque em "Recebi". A entrada vai para o financeiro como Crédito.
- Se mudar o preço ou a % da entrada, lembre de criar links novos com o valor certo.

## Horários pela duração do serviço
- Em Ajustes › Regras do link › "Horários de quantos em quantos minutos", a opção padrão agora é **Pela duração do serviço escolhido**.
- Exemplo: Pé e mão (90 min) aparece 09:00, 10:30, 12:00…; Mão (45 min) aparece 09:00, 09:45, 10:30…
- Se esbarrar na pausa ou em outro atendimento, o próximo horário começa logo depois dele.
- Quem preferir o jeito antigo pode escolher "A cada 15/20/30/45/60 min".

## Calendário e Mamãe Noel
- O dia agora é escolhido num calendário do mês (com setas para o mês seguinte). O pontinho verde marca os dias com horário livre.
- No modo Natal, aparecem ilustrações animadas da Júlia de Mamãe Noel (topo do link, pedido enviado e dia sem vaga). As cores de cabelo e pele ficam no começo do arquivo mamae-noel.js.

## Liberar e bloquear horários (painel)
- Na **Agenda**, cada dia tem o quadro "🔒 Liberar e bloquear horários": toque num horário para bloquear (vermelho) e toque de novo para liberar. Salva na hora e o link atualiza sozinho.
- Atalhos: Bloquear manhã, Bloquear tarde, Liberar tudo, Fechar o dia, Mudar horário do dia.
- Dia de folga ou dia em que não atende (ex.: segunda): "Reabrir o dia" ou "Abrir com outro horário…" (vale só para aquele dia).
- Em **Ajustes › Folgas, férias e horários bloqueados**: bloqueia um dia ou um período inteiro (De/Até) e mostra a lista de tudo que está bloqueado, com botão para liberar.
- Datas que já passaram saem da lista sozinhas.

## Conta da cliente (e-mail e senha)
- O link (agendar.html) agora abre com "Entrar" / "Criar conta". A cliente cria a conta com nome, WhatsApp, e-mail e senha; depois entra só com e-mail e senha, em qualquer aparelho. Tem "Esqueci minha senha".
- O painel (index.html) continua só para a Júlia. Quem abrir o painel por engano vê o botão "💅 Quero agendar meu horário", que leva para o link.
- O link certo para mandar às clientes é o que termina em **/agendar.html** (botão "Link" do painel).
- **Publique as regras novas:** Firebase › Firestore › Regras › cole o conteúdo de firestore.rules › Publicar.
- No Firebase › Authentication › Método de login, o **E-mail/senha** precisa estar ativado (o mesmo que a Júlia usa para entrar no painel).

## Adicionais por serviço
- Em Ajustes › Serviços, cada serviço tem o campo "Adicionais" (um por linha: `nome | preço | minutos a mais`). Ex.: `Francesinha | 10 | 15`.
- A cliente marca os adicionais logo abaixo do serviço escolhido. O preço e o tempo somam: os horários livres, a entrada e o pedido já consideram o total.
- No painel, o pedido chega como "Mão + Francesinha" com o valor total.
- Se tiver adicional marcado e o serviço usar link de cartão de valor fixo, o app usa o link geral (a cliente digita o valor).
