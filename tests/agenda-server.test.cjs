const {test,before}=require('node:test');
const assert=require('node:assert/strict');
// Real Firestore emulator, calling the same server handler used by the callable.
const {_test:{handler}}=require('../functions/index.cjs');
const {getFirestore}=require('node:module').createRequire(require.resolve('../functions/index.cjs'))('firebase-admin/firestore');
const db=getFirestore();
const day=new Date(Date.now()+3*86400000).toISOString().slice(0,10);
const horarios=Object.fromEntries(Array.from({length:7},(_,i)=>[i,{ativo:true,ini:'09:00',fim:'18:00',pIni:'12:00',pFim:'13:00'}]));
const booking=(name='A')=>({nome:name,telefone:'21900000000',servicoId:'s1',servicoNome:'Mão',duracao:60,preco:35,data:day,ini:'09:00',fim:'10:00',aceitouRegras:true});
const req=(uid,id,data=booking())=>({auth:{uid,token:{email:uid+'@example.invalid'}},data:{action:'salvar',id,data}});
const admin=(data)=>({auth:{uid:'admin',token:{email:'juliamarcico@gmail.com'}},data});
before(async()=>{
 await db.doc('controle/seguranca').set({schemaVersion:2,adminUid:'admin'});
 await db.doc('config/geral').set({horarios,servicos:[{id:'s1',nome:'Mão',duracao:60,preco:35}],natal:{ativo:false},entrada:{ativo:false},antecedenciaHoras:0,diasAFrente:30});
});
test('disputa de duas clientes cria apenas uma reserva e um bloqueio',async()=>{
 const results=await Promise.allSettled([handler(req('a','disputa-a')),handler(req('b','disputa-b'))]);
 assert.equal(results.filter(x=>x.status==='fulfilled').length,1);
 const winner=results[0].status==='fulfilled'?'disputa-a':'disputa-b';
 const owner=winner==='disputa-a'?'a':'b';
 assert((await db.doc('ocupados/'+winner).get()).exists);
 assert.equal(Object.keys((await db.doc('agendaDias/'+day).get()).data().reservas).length,1);
 await handler(req(owner,winner)); // retry of the same request
 assert.equal(Object.keys((await db.doc('agendaDias/'+day).get()).data().reservas).length,1);
 await handler(admin({action:'salvar',id:winner,data:{status:'cancelado'}}));
 assert(!(await db.doc('ocupados/'+winner).get()).exists);
 assert.equal(Object.keys((await db.doc('agendaDias/'+day).get()).data().reservas).length,0);
 await handler(req('a','apos-cancelar'));
});
test('preço adulterado, pausa e anônimo não gravam reserva',async()=>{
 await assert.rejects(handler(req('a','preco',{...booking(),preco:1})),/preço/);
 await assert.rejects(handler(req('a','pausa',{...booking(),ini:'12:00',fim:'13:00'})),/bloqueado/);
 await assert.rejects(handler({data:{action:'salvar',id:'anon',data:booking()}}),/Entre/);
 for(const id of ['preco','pausa','anon'])assert(!(await db.doc('agendamentos/'+id).get()).exists);
});
test('pagamento concorrente grava uma única venda com o novo status',async()=>{
 await handler(admin({action:'salvar',id:'financeiro',data:{...booking(),ini:'14:00',fim:'15:00',status:'confirmado',entrada:{valor:10,status:'informada'}}}));
 const input=admin({action:'pagamento',id:'financeiro',tipo:'entrada',venda:{valor:10,tipo:'entrada'},patch:{entrada:{valor:10,status:'recebida'}}});
 await Promise.all([handler(input),handler(input)]);
 assert.equal((await db.doc('vendas/entrada:financeiro').get()).data().valor,10);
 assert.equal((await db.doc('agendamentos/financeiro').get()).data().entrada.status,'recebida');
 const finish=admin({action:'pagamento',id:'financeiro',tipo:'servico',venda:{valor:25,tipo:'servico'},patch:{status:'concluido'}});
 await Promise.all([handler(finish),handler(finish)]);
 assert(!(await db.doc('ocupados/financeiro').get()).exists);
 assert(!(await db.doc('agendaDias/'+day).get()).data().reservas.financeiro);
});
test('marcação manual e entrada ficam atômicas e erro não cria venda',async()=>{
 const data={...booking(),ini:'16:00',fim:'17:00',status:'confirmado',entrada:{valor:12,forma:'pix',status:'recebida'}};
 await handler(admin({action:'salvar',id:'manual',data}));
 assert.equal((await db.doc('vendas/entrada:manual').get()).data().valor,12);
 assert((await db.doc('ocupados/manual').get()).exists);
 await assert.rejects(handler(admin({action:'pagamento',id:'manual',tipo:'servico',venda:{valor:-1},patch:{status:'concluido'}})),/inválido/);
 assert(!(await db.doc('vendas/servico:manual').get()).exists);
 assert.equal((await db.doc('agendamentos/manual').get()).data().status,'confirmado');
 await handler(admin({action:'excluir',id:'manual'}));
 assert(!(await db.doc('ocupados/manual').get()).exists);
});

test('IDs reservados não burlam o bloqueio e outro UID não reutiliza pedido',async()=>{
 await assert.rejects(handler(req('a','__proto__')),/Identificador/);
 await assert.rejects(handler(req('b','apos-cancelar')),/restrito/);
});
