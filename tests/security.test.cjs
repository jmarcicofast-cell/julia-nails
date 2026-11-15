const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const {doc,setDoc,getDoc,collection,getDocs,query,where}=require('firebase/firestore');
const {plan}=require('../scripts/migrar-seguranca.cjs');
let env;
before(async()=>{
 env=await initializeTestEnvironment({projectId:'demo-julia-nails',firestore:{host:'127.0.0.1',port:8088,rules:fs.readFileSync('firestore.rules','utf8')}});
 await env.withSecurityRulesDisabled(async ctx=>{
  const db=ctx.firestore();
  for(const [p,d]of Object.entries({'controle/seguranca':{schemaVersion:2,adminUid:'admin'},'agendamentos/antigo':{clienteUid:'a',nome:'Cliente A'},'perfis/21900000000':{estrelas:10},'conversas/legado':{nome:'Cliente A',clienteUid:'a',telefone:'21900000000',ultimaMsg:'Oi',ultimaDe:'cliente',atualizadoEm:1},'conversas/legado/msgs/1':{de:'admin',texto:'Olá',em:1},'clienteAcessos/a':{perfilId:'21900000000',conversaIds:['legado']}}))await setDoc(doc(db,p),d);
 });
});
after(async()=>env?.cleanup());
const db=uid=>uid?env.authenticatedContext(uid,{email:uid==='admin'?'juliamarcico@gmail.com':uid+'@example.invalid'}).firestore():env.unauthenticatedContext().firestore();
test('anônimo e outra cliente não leem reserva, perfil ou conversa',async()=>{
 for(const uid of [null,'b'])for(const p of ['agendamentos/antigo','perfis/21900000000','conversas/legado','conversas/legado/msgs/1'])await assertFails(getDoc(doc(db(uid),p)));
 for(const p of ['agendamentos/antigo','perfis/21900000000','conversas/legado','conversas/legado/msgs/1'])await assertSucceeds(getDoc(doc(db('a'),p)));
 await assertSucceeds(getDoc(doc(db('admin'),'agendamentos/antigo')));
 await assertSucceeds(getDocs(query(collection(db('a'),'agendamentos'),where('clienteUid','==','a'))));
 await assertFails(getDocs(collection(db('a'),'agendamentos')));
});
test('cliente não forja remetente, titularidade, bloqueio ou estado financeiro',async()=>{
 await assertFails(setDoc(doc(db('a'),'conversas/u_a/msgs/falso'),{de:'admin',texto:'falso',em:1}));
 await assertSucceeds(setDoc(doc(db('a'),'conversas/u_a/msgs/ok'),{de:'cliente',texto:'oi',em:1}));
 await assertFails(setDoc(doc(db('b'),'conversas/u_a/msgs/falso'),{de:'cliente',texto:'oi',em:1}));
 for(const uid of ['a','admin']){
  await assertFails(setDoc(doc(db(uid),'ocupados/falso'),{data:'2099-01-06',ini:'09:00',fim:'10:00'}));
  await assertFails(setDoc(doc(db(uid),'agendamentos/falso'),{clienteUid:'a',status:'pendente'}));
 }
 await assertFails(setDoc(doc(db('a'),'clienteAcessos/a'),{conversaIds:['legado']}));
 await assertFails(setDoc(doc(db('a'),'vendas/falso'),{valor:1}));
 await assertFails(getDoc(doc(db('a'),'agendaDias/2099-01-06')));
});
test('mapa explícito mantém IDs e não toma dados de outra conta',()=>{
 const snapshot={conversas:{c:{ultimaMsg:'preservada'}},agendamentos:{a:{nome:'A',status:'pendente',data:'2099-01-06',ini:'09:00',fim:'10:00'}},perfis:{p:{estrelas:10}},ocupados:{a:{data:'2099-01-06',ini:'09:00',fim:'10:00'}}};
 const p=plan(snapshot,[{uid:'u',conversaIds:['c'],perfilId:'p',agendamentoIds:['a']}],'admin');
 assert(p.writes.some(w=>w.path==='conversas/c'&&w.data.clienteUid==='u'&&w.merge));
 assert.equal(snapshot.conversas.c.ultimaMsg,'preservada');
 assert.equal(p.writes.find(w=>w.path==='agendaDias/2099-01-06').data.reservas.a.ini,'09:00');
 assert.throws(()=>plan(snapshot,[{uid:'a',conversaIds:['c']},{uid:'b',conversaIds:['c']}],'admin'),/Conflito/);
 assert.throws(()=>plan(snapshot,[{uid:'a',conversaIds:['inexistente']}],'admin'),/inexistente/);
});
test('migração preserva tipos no backup restaurável',()=>{
 const {Timestamp,GeoPoint}=require('firebase-admin/firestore'),{encode,decode}=require('../scripts/snapshot-codec.cjs');
 const source={timestamp:new Timestamp(123,456),map:{__tipo:'qualquer'},geo:new GeoPoint(1,2),bytes:Buffer.from('abc')};
 const result=decode(JSON.parse(JSON.stringify(encode(source))));
 assert(source.timestamp.isEqual(result.timestamp));assert(source.geo.isEqual(result.geo));assert.deepEqual(result.map,source.map);assert(source.bytes.equals(result.bytes));
});
test('metadados de conversa permitem mensagem e leitura, mas rejeitam falsificação',async()=>{
 const a=db('a');
 await assertSucceeds(setDoc(doc(a,'conversas/u_a'),{clienteUid:'a',nome:'A',telefone:'21900000000',ultimaMsg:'oi',ultimaDe:'cliente',atualizadoEm:1,naoLidaAdmin:true}));
 await assertFails(setDoc(doc(a,'conversas/u_a'),{ultimaDe:'admin',ultimaMsg:'falso'},{merge:true}));
 await assertFails(setDoc(doc(a,'conversas/u_a'),{clienteUid:'b'},{merge:true}));
 await assertSucceeds(setDoc(doc(db('admin'),'conversas/u_a'),{ultimaDe:'admin',ultimaMsg:'resposta',naoLidaCliente:true},{merge:true}));
 await assertSucceeds(setDoc(doc(a,'conversas/u_a'),{naoLidaCliente:false},{merge:true}));
 await assertSucceeds(getDoc(doc(a,'perfis/u_a')));
 await assertFails(getDoc(doc(db('b'),'perfis/u_a')));
});
