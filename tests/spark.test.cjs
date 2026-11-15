const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {initializeTestEnvironment,assertFails,assertSucceeds}=require('@firebase/rules-unit-testing');
const f=require('firebase/firestore');
const {adapter,compile,ordered}=require('../spark-store.js');
let env,day,cfg;
before(async()=>{
 env=await initializeTestEnvironment({projectId:'demo-julia-spark',firestore:{host:'127.0.0.1',port:8088,rules:fs.readFileSync('firestore.rules','utf8')}});
 day=new Date(Date.now()+3*86400000).toISOString().slice(0,10);
 cfg={horarios:Object.fromEntries(Array.from({length:7},(_,i)=>[i,{ativo:true,ini:'09:00',fim:'19:00',pIni:'12:00',pFim:'13:00'}])),servicos:[{id:'s1',nome:'Mão',duracao:60,preco:35,adicionais:[{id:'x',nome:'Extra',preco:10,duracao:15}]}],natal:{ativo:false},entrada:{ativo:false},antecedenciaHoras:0,diasAFrente:30,travas:[]};
 await env.clearFirestore();
 await env.withSecurityRulesDisabled(async c=>{
  for(const [path,data]of Object.entries({'controle/seguranca':{schemaVersion:3,adminUid:'admin'},'config/geral':cfg,'config/reservas':compile(cfg)}))await f.setDoc(f.doc(c.firestore(),path),data);
 });
});
after(async()=>env?.cleanup());
const db=uid=>env.authenticatedContext(uid,{email:uid==='admin'?'juliamarcico@gmail.com':uid+'@example.invalid'}).firestore();
const booking=(uid,ini='09:00',fim='10:00')=>({nome:'Teste',telefone:'21900000000',servicoId:'s1',servicoNome:'Mão',duracao:60,preco:35,precoBase:35,adicionalNatal:0,data:day,ini,fim,deco:'',obs:'',aceitouRegras:true,status:'pendente',origem:'link',criadoEm:Date.now(),clienteUid:uid,email:uid+'@example.invalid'});
test('Spark: duas clientes disputam uma vaga; somente uma reserva atômica é criada',async()=>{
 const result=await Promise.allSettled([adapter(f,db('a')).booking('a',booking('a')),adapter(f,db('b')).booking('b',booking('b'))]);
 assert.equal(result.filter(x=>x.status==='fulfilled').length,1);
 const winner=result[0].status==='fulfilled'?'a':'b',loser=winner==='a'?'b':'a';
 assert((await f.getDoc(f.doc(db(winner),'ocupados',winner))).exists());
 assert(!(await f.getDoc(f.doc(db(loser),'ocupados',loser))).exists());
 assert.equal((await f.getDoc(f.doc(db(winner),'agendaDias',day))).data().blocos.length,1);
 await adapter(f,db(winner)).booking(winner,booking(winner));
 await adapter(f,db('admin')).booking(winner,{status:'cancelado'},{admin:true});
 assert(!(await f.getDoc(f.doc(db(winner),'ocupados',winner))).exists());
});
test('Spark: preço, duração, autor e bloqueios não podem ser burlados por chamadas diretas',async()=>{
 await assert.rejects(adapter(f,db('a')).booking('preco',{...booking('a'),preco:1}));
 await assert.rejects(adapter(f,db('a')).booking('duracao',{...booking('a'),fim:'10:15'}));
 await assert.rejects(adapter(f,db('a')).booking('pausa',booking('a','12:00','13:00')));
 await assert.rejects(adapter(f,db('a')).booking('falso',{...booking('a'),clienteUid:'b'}));
 const a=booking('a');
 await assertFails(f.setDoc(f.doc(db('a'),'agendamentos','sem-lock'),{...a,servicoIndice:0,adicionaisIndices:[],adicionaisMascaras:[0,0,0,0],janelaIndice:0}));
 await assertFails(f.setDoc(f.doc(db('a'),'agendaDias','2099-01-01'),{blocos:[{id:'fake',ini:'01:00',fim:'23:59',maxFim:'23:59'}],ultimoId:'fake',pos:0}));
});
test('Spark: adicionais, entrada, adjacência e pagamentos repetidos preservam os recursos',async()=>{
 const admin=adapter(f,db('admin'));
 await admin.config({entrada:{ativo:true,percentual:50,chavePix:'teste@example.invalid'}});
 const a={...booking('a'),fim:'10:15',duracao:75,preco:45,servicoNome:'Mão + Extra',adicionais:[{nome:'Extra',preco:10,duracao:15}],entrada:{valor:22.5,percentual:50,forma:'pix',status:'informada',informadaEm:Date.now()}};
 await adapter(f,db('a')).booking('extra',a);
 await adapter(f,db('b')).booking('adjacente',{...booking('b','10:15','11:15'),entrada:{valor:17.5,percentual:50,forma:'pix',status:'informada',informadaEm:Date.now()}});
 const opts={admin:true,payment:{tipo:'entrada',venda:{valor:22.5,tipo:'entrada',agendamentoId:'extra'}}};
 await Promise.all([admin.booking('extra',{entrada:{...a.entrada,status:'recebida'}},opts),admin.booking('extra',{entrada:{...a.entrada,status:'recebida'}},opts)]);
 assert.equal((await f.getDoc(f.doc(db('admin'),'vendas','entrada:extra'))).data().valor,22.5);
 await admin.booking('extra',{status:'concluido'},{admin:true,payment:{tipo:'servico',venda:{valor:22.5,tipo:'servico',agendamentoId:'extra'}}});
 assert(!(await f.getDoc(f.doc(db('a'),'ocupados','extra'))).exists());
});
test('Spark: prefixo máximo bloqueia sobreposição com atendimento manual longo',async()=>{
 const admin=adapter(f,db('admin'));
 await admin.booking('longo',{...booking('admin','14:00','18:00'),status:'confirmado'},{admin:true});
 await admin.booking('curto',{...booking('admin','15:00','16:00'),status:'confirmado'},{admin:true});
 await assert.rejects(adapter(f,db('a')).booking('dentro',{...booking('a','16:00','17:00'),entrada:{valor:17.5,percentual:50,forma:'pix',status:'informada',informadaEm:Date.now()}}));
 assert.equal(ordered([{id:'x',ini:'09:00',fim:'18:00'},{id:'y',ini:'10:00',fim:'11:00'}])[1].maxFim,'18:00');
});

test('Spark: chamadas diretas não removem nem atravessam intervalos anteriores',async()=>{
 const a=db('a'),r=f.doc(a,'agendaDias',day),old=(await f.getDoc(r)).data();
 const ag={...booking('a','16:00','17:00'),servicoIndice:0,adicionaisIndices:[],adicionaisMascaras:[0,0,0,0],janelaIndice:1,entrada:{valor:17.5,percentual:50,forma:'pix',status:'informada',informadaEm:Date.now()}};
 const i=old.blocos.findIndex(b=>b.ini>'16:00');const pos=i<0?old.blocos.length:i;
 const blocos=[...old.blocos.slice(0,pos),{id:'forjado',ini:ag.ini,fim:ag.fim,maxFim:ag.fim},...old.blocos.slice(pos)];
 const batch=f.writeBatch(a);batch.set(f.doc(a,'agendamentos','forjado'),ag);batch.set(f.doc(a,'ocupados','forjado'),{data:day,ini:ag.ini,fim:ag.fim});batch.set(r,{blocos,ultimoId:'forjado',pos});
 await assertFails(batch.commit());
 await assertFails(f.updateDoc(r,{blocos:[],ultimoId:'a',pos:0}));
});
test('Spark: vinte adicionais são aceitos sem exceder a avaliação das regras',async()=>{
 const adds=Array.from({length:20},(_,i)=>({id:'x'+i,nome:'Extra '+i,preco:1,duracao:1}));
 await adapter(f,db('admin')).config({servicos:[{...cfg.servicos[0],adicionais:adds}]});
 const other=new Date(Date.now()+4*86400000).toISOString().slice(0,10);
 await adapter(f,db('a')).booking('vinte',{...booking('a'),data:other,servicoNome:'Mão'+adds.map(a=>' + '+a.nome).join(''),fim:'10:20',duracao:80,preco:55,adicionais:adds.map(({nome,preco,duracao})=>({nome,preco,duracao})),entrada:{valor:27.5,percentual:50,forma:'pix',status:'informada',informadaEm:Date.now()}});
});
test('Spark: ajustes por telefone ficam privados e recompensas falsas são rejeitadas',async()=>{
 await adapter(f,db('admin')).config({recompensas:{ativo:true,ajustes:{'21900000000':10}}});
 const cfgPublic=(await f.getDoc(f.doc(db('a'),'config','geral'))).data();
 assert(!('ajustes' in cfgPublic.recompensas));
 await assertFails(f.getDoc(f.doc(db('a'),'configAdmin','recompensas')));
 assert.equal((await f.getDoc(f.doc(db('admin'),'configAdmin','recompensas'))).data().ajustes['21900000000'],10);
 const future=new Date(Date.now()+5*86400000).toISOString().slice(0,10);
 await assert.rejects(adapter(f,db('a')).booking('mimo-falso',{...booking('a'),data:future,recompensa:{nome:'R$10000 de desconto',custo:1,aplicada:true},entrada:{valor:17.5,percentual:50,forma:'pix',status:'informada',informadaEm:Date.now()}}));
});
test('Spark: recompensa válida continua disponível à titular',async()=>{
 await f.setDoc(f.doc(db('admin'),'perfis','u_a'),{estrelas:100});
 const future=new Date(Date.now()+6*86400000).toISOString().slice(0,10);
 await adapter(f,db('a')).booking('mimo-valido',{...booking('a'),data:future,recompensa:{nome:'Hidratação de cutículas de presente',custo:30},entrada:{valor:17.5,percentual:50,forma:'pix',status:'informada',informadaEm:Date.now()}});
 assert.equal((await f.getDoc(f.doc(db('a'),'agendamentos','mimo-valido'))).data().recompensa.custo,30);
});
