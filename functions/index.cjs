const {onCall,HttpsError}=require('firebase-functions/v2/https');
const {initializeApp}=require('firebase-admin/app');
const {getFirestore}=require('firebase-admin/firestore');
initializeApp();
const db=getFirestore();
const ADMIN='juliamarcico@gmail.com';
const active=a=>a && ['pendente','confirmado'].includes(a.status);
const fail=(msg,code='invalid-argument')=>{throw new HttpsError(code,msg)};
const validId=id=>typeof id==='string' && /^[A-Za-z0-9_:-]{1,128}$/.test(id) && !['__proto__','prototype','constructor'].includes(id);
const minutes=s=>{if(typeof s!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(s))fail('Horário inválido.');return Number(s.slice(0,2))*60+Number(s.slice(3));};
const hm=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
const text=(s,max=500)=>{if(typeof s!=='string'||s.length>max)fail('Texto inválido.');return s.trim()};
const round=n=>Math.round(n*100)/100;
function validateBooking(a){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(a.data||'')||!Number.isFinite(Date.parse(a.data+'T12:00:00-03:00'))||new Date(a.data+'T12:00:00Z').toISOString().slice(0,10)!==a.data)fail('Data inválida.');
 if(minutes(a.ini)>=minutes(a.fim))fail('O fim deve ser depois do início.');
 if(!Number.isFinite(a.preco)||a.preco<0)fail('Preço inválido.');
 text(a.nome,150);text(a.telefone,30);text(a.obs||'');
}
function clientBooking(input,cfg,auth,profile){
 const s=(cfg.servicos||[]).find(x=>x.id===input.servicoId);if(!s)fail('Serviço não encontrado.');
 const natal={ativo:true,adicional:10,...cfg.natal};
 const selected=input.adicionais||[];if(!Array.isArray(selected)||selected.length>30)fail('Adicionais inválidos.');
 const adds=selected.map(x=>{const a=(s.adicionais||[]).find(a=>a.nome===x.nome);if(!a)fail('Adicional não encontrado.');return a;});
 if(new Set(adds.map(a=>a.id)).size!==adds.length)fail('Adicional repetido.');
 const dur=Number(s.duracao)+adds.reduce((n,a)=>n+Number(a.duracao||0),0);
 if(!Number.isFinite(dur)||dur<=0||dur>1440)fail('Duração inválida.');
 const start=minutes(input.ini);if(start+dur>=1440)fail('Atendimento ultrapassa o dia.');
 const price=round(Number(s.preco)+(natal.ativo?Number(natal.adicional):0)+adds.reduce((n,a)=>n+Number(a.preco),0));
 if(input.preco!==price || input.fim!==hm(start+dur))fail('O preço ou a duração mudou. Atualize a agenda.','failed-precondition');
 const extra=(cfg.extras||[]).find(x=>x.startsWith(input.data+' '));
 let h=cfg.horarios?.[new Date(input.data+'T12:00:00-03:00').getUTCDay()];
 if(extra){const [ini,fim]=extra.slice(11).split('-');h={ativo:true,ini,fim};}
 else if((cfg.bloqueios||[]).includes(input.data))h=null;
 if(!h?.ativo||start<minutes(h.ini)||start+dur>minutes(h.fim))fail('Fora do expediente.');
 const blocks=(cfg.travas||[]).filter(x=>x.startsWith(input.data+' ')).map(x=>x.slice(11).split('-'));
 if(h.pIni&&h.pFim)blocks.push([h.pIni,h.pFim]);
 if(blocks.some(([a,b])=>start<minutes(b)&&start+dur>minutes(a)))fail('Horário bloqueado.');
 if(Date.parse(input.data+'T'+input.ini+':00-03:00')<Date.now()+Number(cfg.antecedenciaHoras||0)*3600000)fail('Horário fora da antecedência mínima.');
 // Match the horizon exposed by the client, including December and extra days.
 const now=new Date(Date.now()-3*3600000), end=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()+Number(cfg.diasAFrente||30)-1));
 let last=new Date(Date.UTC(end.getUTCFullYear(),end.getUTCMonth()+1,0)).toISOString().slice(0,10);
 if(natal.ativo&&now.getUTCMonth()>=10)last=[last,now.getUTCFullYear()+'-12-31'].sort().pop();
 for(const x of cfg.extras||[])last=[last,x.slice(0,10)].sort().pop();
 if(input.data>last)fail('Dia fora da agenda aberta.');
 const ag={nome:text(input.nome,150),telefone:text(input.telefone,30),servicoId:s.id,servicoNome:s.nome+(adds.length?' + '+adds.map(x=>x.nome).join(' + '):''),duracao:dur,preco:price,precoBase:Number(s.preco),adicionalNatal:natal.ativo?Number(natal.adicional):0,data:input.data,ini:input.ini,fim:hm(start+dur),deco:text(input.deco||''),obs:text(input.obs||''),aceitouRegras:input.aceitouRegras===true,status:'pendente',origem:'link',criadoEm:Date.now(),clienteUid:auth.uid,email:auth.token.email||''};
 if(!ag.nome||ag.telefone.replace(/\D/g,'').length<10)fail('Confira nome e WhatsApp.');
 if(natal.ativo&&ag.deco.length<3)fail('Informe a decoração.');
 if((cfg.regras?.length||natal.ativo)&&!ag.aceitouRegras)fail('Aceite os pré-requisitos.');
 if(adds.length)ag.adicionais=adds.map(a=>({nome:a.nome,preco:Number(a.preco),duracao:Number(a.duracao||0)}));
 if(input.recompensa){const r=(cfg.recompensas?.catalogo||[{custo:30,nome:'Hidratação de cutículas de presente'},{custo:50,nome:'2 unhas decoradas de presente'},{custo:80,nome:'Esfoliação nos pés de presente'},{custo:100,nome:'R$10 de desconto no serviço'},{custo:150,nome:'Decoração natalina completa de presente'}]).find(r=>r.nome===input.recompensa.nome&&r.custo===input.recompensa.custo);if(!r||Number(profile?.estrelas||0)<r.custo)fail('Recompensa indisponível.');ag.recompensa={nome:r.nome,custo:r.custo};}
 const e={ativo:true,percentual:50,...cfg.entrada};
 const link=(e.linksCartao||{})[s.id], card=e.cartaoAtivo&&(e.linkCartao||(!adds.length&&link));
 const required=e.ativo&&(e.chavePix||card), value=round(price*Number(e.percentual)/100);
 if(e.ativo&&!e.chavePix&&!card && e.cartaoAtivo)fail('Meio de pagamento indisponível.');
 if(required&&value>0){if(!input.entrada||input.entrada.valor!==value||!['pix','cartao'].includes(input.entrada.forma)||(input.entrada.forma==='pix'&&!e.chavePix)||(input.entrada.forma==='cartao'&&!card))fail('Confira a entrada e o meio de pagamento.');ag.entrada={valor:value,percentual:Number(e.percentual),forma:input.entrada.forma,status:'informada',informadaEm:Date.now()};}
 validateBooking(ag);return ag;
}
// Every reservation mutation and payment takes the same day lock.
const handler=async request=>{
 if(!request.auth)fail('Entre na sua conta.','unauthenticated');
 const admin=request.auth.token.email===ADMIN;
 const {action,id,data={},tipo,venda,patch}=request.data||{};
 if(!validId(id))fail('Identificador inválido.');
 if(!['salvar','excluir','pagamento'].includes(action))fail('Operação inválida.');
 if(!admin&&action!=='salvar')fail('Acesso restrito.','permission-denied');
 return db.runTransaction(async tx=>{
  const control=await tx.get(db.doc('controle/seguranca'));
  if(control.data()?.schemaVersion!==2)fail('Agenda temporariamente em atualização.','failed-precondition');
  if (admin && control.data()?.adminUid !== request.auth.uid) fail('Acesso restrito.','permission-denied');
  const ref=db.doc('agendamentos/'+id), before=await tx.get(ref), old=before.data();
  const access=await tx.get(db.doc('clienteAcessos/'+request.auth.uid));
  const cfg=await tx.get(db.doc('config/geral'));
  const profileId=access.data()?.perfilId || 'u_'+request.auth.uid;
  const profile=(await tx.get(db.doc('perfis/'+profileId))).data();
  let next, sale=null, saleType=tipo;
  if(action==='salvar'){
   if(!admin&&old){if(old.clienteUid!==request.auth.uid)fail('Acesso restrito.','permission-denied');return {id};}
   next=admin?{...old,...data}:clientBooking(data,cfg.data()||{},request.auth,profile);
   validateBooking(next);
   if(admin && !old && next.entrada?.status==='recebida'){saleType='entrada';sale={data:new Date(Date.now()-3*3600000).toISOString().slice(0,10),descricao:next.servicoNome,tipo:'entrada',cliente:next.nome,valor:next.entrada.valor,forma:next.entrada.forma,agendamentoId:id,criadoEm:Date.now()};if(!Number.isFinite(sale.valor)||sale.valor<0)fail('Entrada inválida.');}
  }else if(action==='pagamento'){
   if(!old)fail('Agendamento não encontrado.','not-found');
   if(!['entrada','servico'].includes(tipo))fail('Pagamento inválido.');
   if((tipo==='entrada'&&old.entrada?.status==='recebida')||(tipo==='servico'&&old.status==='concluido'))return old;
   if(!active(old)||!Number.isFinite(venda?.valor)||venda.valor<0)fail('Pagamento inválido.');
   sale={...venda,agendamentoId:id};next={...old,...patch};validateBooking(next);
  }else{if(!old)return {id};next=null;}
  const days=[...new Set([old?.data,next?.data].filter(Boolean))].sort();
  const locks=[];for(const day of days)locks.push(await tx.get(db.doc('agendaDias/'+day)));
  for(let i=0;i<days.length;i++){
   const entries={...(locks[i].data()?.reservas||{})};delete entries[id];
   if(next?.data===days[i]&&active(next)){
    if(!admin&&Object.values(entries).some(a=>minutes(next.ini)<minutes(a.fim)&&minutes(next.fim)>minutes(a.ini)))fail('Esse horário acabou de ser ocupado. Escolha outro.','already-exists');
    entries[id]={ini:next.ini,fim:next.fim};
   }
   tx.set(db.doc('agendaDias/'+days[i]),{reservas:entries});
  }
  if(next)tx.set(ref,next);else tx.delete(ref);
  if(active(next))tx.set(db.doc('ocupados/'+id),{data:next.data,ini:next.ini,fim:next.fim});else tx.delete(db.doc('ocupados/'+id));
  if(sale)tx.set(db.doc('vendas/'+saleType+':'+id),sale);
  return action==='pagamento'?next:{id};
 });
};
exports.agendaSegura=onCall({region:'southamerica-east1',maxInstances:10},handler);
exports._test={clientBooking,validateBooking,handler};
