// Dry-run by default. Uses Application Default Credentials outside the emulator.
const fs=require('node:fs');
const path=require('node:path');
const {initializeApp}=require('firebase-admin/app');
const {getFirestore}=require('firebase-admin/firestore');
const {getAuth}=require('firebase-admin/auth');
const COLLECTIONS=['config','agendamentos','ocupados','clientes','perfis','encaixes','conversas','vendas','despesas','clienteAcessos','agendaDias','controle'];
const validId=s=>typeof s==='string'&&s.length>0&&!s.includes('/')&&!['__proto__','prototype','constructor'].includes(s);
function plan(snapshot,mappings,adminUid){
 if(!validId(adminUid))throw Error('UID administrativo inválido.');
 if(!Array.isArray(mappings))throw Error('O mapa deve ser uma lista.');
 const writes=[],claimed=new Map(),locks={},uids=new Set();
 const take=(col,id,uid)=>{
  if(!validId(id)||!snapshot[col]?.[id])throw Error('Documento inexistente: '+col+'/'+id);
  const key=col+'/'+id, owner=claimed.get(key)||snapshot[col][id].clienteUid;
  if(owner&&owner!==uid)throw Error('Conflito de titularidade: '+key);
  claimed.set(key,uid);return snapshot[col][id];
 };
 for(const m of mappings){
  if(!validId(m.uid)||uids.has(m.uid))throw Error('UID inválido ou repetido.');
  uids.add(m.uid);
  const before=snapshot.clienteAcessos?.[m.uid]||{};
  const conversaIds=[...new Set([...(before.conversaIds||[]),...(m.conversaIds||[])])];
  const perfilId=m.perfilId||before.perfilId||'u_'+m.uid;
  if(before.perfilId&&m.perfilId&&before.perfilId!==m.perfilId)throw Error('Perfil já vinculado; revisão manual necessária.');
  for(const id of m.conversaIds||[]){take('conversas',id,m.uid);writes.push({path:'conversas/'+id,data:{clienteUid:m.uid},merge:true});}
  for(const id of m.agendamentoIds||[]){take('agendamentos',id,m.uid);writes.push({path:'agendamentos/'+id,data:{clienteUid:m.uid},merge:true});}
  if(m.perfilId){take('perfis',m.perfilId,m.uid);writes.push({path:'perfis/'+m.perfilId,data:{clienteUid:m.uid},merge:true});}
  writes.push({path:'clienteAcessos/'+m.uid,data:{perfilId,conversaIds},merge:false});
 }
 const add=(id,a)=>{
  if(!validId(id))throw Error('ID de ocupação inválido: '+id);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(a.data||'')||!/^([01]\d|2[0-3]):[0-5]\d$/.test(a.ini||'')||!/^([01]\d|2[0-3]):[0-5]\d$/.test(a.fim||'')||a.ini>=a.fim)throw Error('Ocupação inválida: '+id);
  (locks[a.data]||={})[id]={ini:a.ini,fim:a.fim};
 };
 for(const [id,a]of Object.entries(snapshot.ocupados||{})){
  add(id,a);writes.push({path:'ocupados/'+id,data:{data:a.data,ini:a.ini,fim:a.fim},merge:false});
 }
 for(const [id,a]of Object.entries(snapshot.agendamentos||{}))if(['pendente','confirmado'].includes(a.status)){
  add(id,a);writes.push({path:'ocupados/'+id,data:{data:a.data,ini:a.ini,fim:a.fim},merge:false});
 }
 for(const [day,reservas]of Object.entries(locks))writes.push({path:'agendaDias/'+day,data:{reservas},merge:false});
 return {writes,unassigned:{conversas:Object.keys(snapshot.conversas||{}).filter(id=>!claimed.has('conversas/'+id)&&!snapshot.conversas[id].clienteUid),agendamentos:Object.keys(snapshot.agendamentos||{}).filter(id=>!claimed.has('agendamentos/'+id)&&!snapshot.agendamentos[id].clienteUid)},control:{schemaVersion:2,adminUid}};
}
async function run(){
 const args=process.argv.slice(2), get=k=>args[args.indexOf(k)+1];
 if(!args.includes('--project')||!args.includes('--map')||!args.includes('--out'))throw Error('Use --project ID --map arquivo.json --out pasta [--apply --confirm-project ID].');
 const project=get('--project'), apply=args.includes('--apply');
 if(apply&&(!args.includes('--confirm-project')||get('--confirm-project')!==project))throw Error('Confirme o ID do projeto ao aplicar.');
 initializeApp({projectId:project});const db=getFirestore(),auth=getAuth();
 const dir=path.resolve(get('--out'));fs.mkdirSync(dir,{recursive:true,mode:0o700});
 const save=(name,obj)=>fs.writeFileSync(path.join(dir,name),JSON.stringify(obj,null,2),{mode:0o600,flag:'wx'});
 const mappings=JSON.parse(fs.readFileSync(get('--map'),'utf8'));
 const admin=await auth.getUserByEmail('juliamarcico@gmail.com');
 for(const m of mappings)await auth.getUser(m.uid);
 const snapshot={};
 for(const col of COLLECTIONS){snapshot[col]={};for(const d of (await db.collection(col).get()).docs)snapshot[col][d.id]=d.data();}
 snapshot.mensagens={};for(const cid of Object.keys(snapshot.conversas))for(const d of (await db.collection('conversas/'+cid+'/msgs').get()).docs)snapshot.mensagens[cid+'/'+d.id]=d.data();
 const p=plan(snapshot,mappings,admin.uid);
 // Backups include Firestore types, timestamps and document references without lossy JSON conversion.
 save('backup.json',snapshot);
 const {encode,decode}=require('./snapshot-codec.cjs');save('backup-restauravel.json',encode(snapshot));
 save('plano.json',p);
 console.log(JSON.stringify({project,apply,documentos:p.writes.length,pendentes:p.unassigned,backup:dir},null,2));
 if(!apply)return;
 if((p.unassigned.conversas.length || p.unassigned.agendamentos.length) && !args.includes('--allow-unassigned'))throw Error('Há registros sem titular. Revise as pendências; só prossiga com --allow-unassigned se a administradora decidiu mantê-los restritos ao painel.');
 // Keep clients closed during cutover; publish restrictive rules and the new functions before applying.
 const check=await db.doc('controle/seguranca').get();
 if(check.data()?.schemaVersion===2)throw Error('Migração já ativada. Gere um novo dry-run e revise; este script não reabre uma migração ativa.');
 // Recheck every source document before writes, avoiding silent overwrite of live data.
 // Maintenance window is mandatory: direct writes by old app versions must already be denied by rules.
 const unique=new Map(p.writes.map(w=>[w.path,w]));
 for(const w of unique.values())await db.runTransaction(async tx=>{
  const ref=db.doc(w.path),now=await tx.get(ref),[col,id]=w.path.split('/');
  const original=snapshot[col]?.[id];
  if(JSON.stringify(encode(now.data()))!==JSON.stringify(encode(original)))throw Error('Dados mudaram desde o backup: '+w.path);
  tx.set(ref,w.data,{merge:w.merge});
 });
 await db.doc('controle/seguranca').set({...p.control,migradoEm:Date.now()});
 console.log('Migração ativada. Histórico e mensagens preservados.');
}
module.exports={plan,COLLECTIONS};
if(require.main===module)run().catch(e=>{console.error(e.message);process.exitCode=1});
