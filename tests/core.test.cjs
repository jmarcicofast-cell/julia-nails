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
test('painel usa o adaptador transacional Spark para pagamentos',async()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const source=html.slice(html.indexOf('const CFG ='),html.indexOf('/* ================= UTILITÁRIOS'));
 const calls=[];
 const context=vm.createContext({window:{APP_CONFIG:{firebase:{apiKey:'TEST'}}},EventTarget,Event,addEventListener:()=>{},mock:{spark:{booking:async (...args)=>{calls.push(args);return {status:'concluido'}}}},Date,Math,Number});
 vm.runInContext(source+'\nfb=mock;globalThis.store=store;',context);
 const result=await context.store.registrarPagamento('a','servico',{valor:35},{status:'concluido'});
 assert.equal(result.status,'concluido');assert.equal(calls.length,1);assert.equal(calls[0][0],'a');assert.equal(calls[0][2].payment.tipo,'servico');assert.equal(calls[0][2].admin,true);
});
test('Spark mantém horário extra acima da folga e desconta bloqueio parcial',()=>{
 const {compile}=require('../spark-store.js');
 const cfg=good(),day='2030-11-20';cfg.bloqueios=[day];cfg.extras=[day+' 09:00-12:00'];cfg.travas=[day+' 10:00-11:00'];cfg.diasAFrente=30;
 const policy=compile(cfg,Date.parse('2030-11-15T12:00:00Z'));
 assert.deepEqual(policy.dias[day],[{ini:'09:00',fim:'10:00'},{ini:'11:00',fim:'12:00'}]);
});
test('migração Spark separa ajustes privados sem alterar o saldo ou documentos originais',()=>{
 const {plan}=require('../scripts/migrar-seguranca.cjs');
 const cfg=good();cfg.recompensas={ajustes:{'21900000000':15}};
 const result=plan({config:{geral:cfg}},[],'admin');
 assert.equal(result.control.schemaVersion,3);
 assert(!result.writes.find(w=>w.path==='config/geral').data.recompensas.ajustes);
 assert.equal(result.writes.find(w=>w.path==='configAdmin/recompensas').data.ajustes['21900000000'],15);
 assert.equal(cfg.recompensas.ajustes['21900000000'],15);
});
