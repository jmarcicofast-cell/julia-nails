const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const validar=require('../validacao.js');
const root=path.resolve(__dirname,'..');
const good=()=>({servicos:[{duracao:45,preco:35,adicionais:[]}],horarios:{2:{ativo:true,ini:'09:00',fim:'18:00',pIni:'12:00',pFim:'13:00'}},passoServico:false,intervalo:30});
test('rejeita duração inválida, valores negativos, pausa incompleta e expediente invertido',()=>{
 assert.equal(validar(good()),'');
 for(const dur of [-1,0,Infinity,NaN,1500]){const c=good();c.servicos[0].duracao=dur;assert.notEqual(validar(c),'');}
 const c=good();c.servicos[0].preco=-10;assert.notEqual(validar(c),'');
 const p=good();p.horarios[2].pFim='';assert.notEqual(validar(p),'');
 const h=good();h.horarios[2].fim='08:00';assert.notEqual(validar(h),'');
});
for(const file of ['index.html','agendar.html'])test(file+': disponibilidade respeita pausas, ocupações e duração inválida',()=>{
 const html=fs.readFileSync(path.join(root,file),'utf8');
 const source=html.slice(html.indexOf('function expediente('),html.indexOf('/* ================= ESTADO'));
 const ctx=vm.createContext({Date,Number,Math});
 vm.runInContext(`const parseYmd=s=>new Date(s+'T00:00:00');const toMin=s=>{const [h,m]=s.split(':').map(Number);return h*60+m};const toHM=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');\n${source}`,ctx);
 const cfg=good();cfg.bloqueios=[];cfg.horarios[2]={ativo:true,ini:'09:00',fim:'13:00',pIni:'10:00',pFim:'11:00'};
 const slots=ctx.slotsDoDia(cfg,[{data:'2099-01-06',ini:'11:00',fim:'12:00'}],'2099-01-06',60,0);
 assert.deepEqual(Array.from(slots),['09:00','12:00']);
 assert.equal(ctx.slotsDoDia(cfg,[],'2099-01-06',-1,0).length,0);
 assert.equal(ctx.slotsDoDia(cfg,[],'2099-01-06',0,0).length,0);
});
function paymentStore(initial){
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const source=html.slice(html.indexOf('const CFG ='),html.indexOf('/* ================= UTILITÁRIOS'));
 const docs=new Map([['agendamentos/a',structuredClone(initial)]]);
 let commits=0;
 const f={doc:(_db,col,id)=>col+'/'+id,runTransaction:async(_db,fn)=>{
  const staged=[];
  const result=await fn({get:async ref=>({exists:()=>docs.has(ref),data:()=>structuredClone(docs.get(ref))}),set:(ref,d)=>staged.push([ref,d]),update:(ref,d)=>staged.push([ref,{...docs.get(ref),...d}])});
  if(staged.length)commits++;
  for(const [ref,d]of staged)docs.set(ref,structuredClone(d));return result;
 }};
 const context=vm.createContext({window:{APP_CONFIG:{firebase:{apiKey:'TEST'}}},EventTarget,Event,addEventListener:()=>{},localStorage:{getItem:()=>null},mock:{f,db:{}},Date,Math,Number});
 vm.runInContext(source+'\nfb=mock;globalThis.store=store;',context);
 return {store:context.store,docs,commits:()=>commits};
}
test('pagamento repetido mantém uma venda e uma atualização de status',async()=>{
 const env=paymentStore({status:'pendente',entrada:{status:'informada'}});
 await env.store.registrarPagamento('a','entrada',{valor:35},{entrada:{status:'recebida'}});
 await env.store.registrarPagamento('a','entrada',{valor:35},{entrada:{status:'recebida'}});
 assert.equal(env.commits(),1);assert.equal(env.docs.get('vendas/entrada:a').valor,35);assert.equal(env.docs.size,2);
 await env.store.registrarPagamento('a','servico',{valor:35},{status:'concluido'});
 await env.store.registrarPagamento('a','servico',{valor:35},{status:'concluido'});
 assert.equal(env.commits(),2);assert.equal(env.docs.size,3);
});
test('agendamento cancelado e valor negativo não geram movimentações',async()=>{
 for(const [ag,valor]of [[{status:'cancelado'},35],[{status:'confirmado'},-1]]){
  const env=paymentStore(ag);await assert.rejects(env.store.registrarPagamento('a','servico',{valor},{status:'concluido'}));assert.equal(env.commits(),0);assert.equal(env.docs.size,1);
 }
});
