// Adaptador Firestore para Spark: somente transações e regras, sem servidor pago.
(function(root){
  const min=s=>Number(s.slice(0,2))*60+Number(s.slice(3));
  const hm=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
  const active=a=>a && ['pendente','confirmado'].includes(a.status);
  const idOk=id=>typeof id==='string'&&/^[A-Za-z0-9_:-]{1,128}$/.test(id)&&!['__proto__','constructor','prototype'].includes(id);
  function ordered(entries){
    let max='00:00';
    return entries.sort((a,b)=>a.ini.localeCompare(b.ini)||a.id.localeCompare(b.id)).map(a=>{max=max>a.fim?max:a.fim;return {id:a.id,ini:a.ini,fim:a.fim,maxFim:max};});
  }
  function compile(cfg,now=Date.now()){
    for(const s of cfg.servicos||[]){
      for(const value of [s.preco,...(s.adicionais||[]).map(a=>a.preco)])if(Math.abs(Number(value)*100-Math.round(Number(value)*100))>0.000001)throw Error('Use no máximo duas casas decimais nos preços.');
      if((s.adicionais||[]).length>20)throw Error('O plano de regras aceita até 20 adicionais por serviço. Revise o cadastro sem apagar o histórico.');
      if(!Number.isInteger(Number(s.duracao))||Number(s.duracao)<=0||Number(s.duracao)>1440||!Number.isFinite(Number(s.preco))||Number(s.preco)<0)throw Error('Confira duração e preço dos serviços.');
      for(const a of s.adicionais||[])if(!Number.isInteger(Number(a.duracao||0))||Number(a.duracao||0)<0||Number(a.duracao||0)>1440||!Number.isFinite(Number(a.preco))||Number(a.preco)<0)throw Error('Confira os adicionais.');
    }
    const today=new Date(now-3*3600000), first=today.toISOString().slice(0,10);
    const end=new Date(Date.UTC(today.getUTCFullYear(),today.getUTCMonth(),today.getUTCDate()+Number(cfg.diasAFrente||30)-1));
    let last=new Date(Date.UTC(end.getUTCFullYear(),end.getUTCMonth()+1,0)).toISOString().slice(0,10);
    if(cfg.natal?.ativo!==false&&today.getUTCMonth()>=10)last=[last,today.getUTCFullYear()+'-12-31'].sort().pop();
    for(const x of cfg.extras||[])last=[last,x.slice(0,10)].sort().pop();
    const dias={};
    for(const d=new Date(first+'T12:00:00Z');d.toISOString().slice(0,10)<=last;d.setUTCDate(d.getUTCDate()+1)){
      const day=d.toISOString().slice(0,10), extra=(cfg.extras||[]).find(x=>x.startsWith(day+' '));
      let h=cfg.horarios?.[d.getUTCDay()];
      if(extra){const [ini,fim]=extra.slice(11).split('-');h={ativo:true,ini,fim};}
      else if((cfg.bloqueios||[]).includes(day))h=null;
      if(!h?.ativo)continue;
      let windows=[[min(h.ini),min(h.fim)]];
      const blocks=(cfg.travas||[]).filter(x=>x.startsWith(day+' ')).map(x=>x.slice(11).split('-').map(min));
      if(h.pIni&&h.pFim)blocks.push([min(h.pIni),min(h.pFim)]);
      for(const [a,b]of blocks)windows=windows.flatMap(([i,f])=>b<=i||a>=f?[[i,f]]:[[i,Math.min(a,f)],[Math.max(b,i),f]].filter(([x,y])=>x<y));
      dias[day]=windows.map(([ini,fim])=>({ini:hm(ini),fim:hm(fim)}));
    }
    const servicos=(cfg.servicos||[]).map(s=>({id:s.id,grupos:Array.from({length:4},(_,g)=>({opcoes:Array.from({length:32},(_,mask)=>{
      const indices=Array.from({length:5},(_,i)=>g*5+i).filter((i,j)=>mask & (1<<j));
      if(indices.some(i=>i>=(s.adicionais||[]).length))return null;
      const adicionais=indices.map(i=>({nome:s.adicionais[i].nome,preco:Number(s.adicionais[i].preco),duracao:Number(s.adicionais[i].duracao||0)}));
      const valor=adicionais.reduce((sum,a)=>sum+Math.round(a.preco*100)*30000+a.duracao,0);
      if(!Number.isSafeInteger(valor))throw Error('Preço fora do limite numérico seguro.');
      return {indices,valor,adicionais,sufixo:adicionais.map(a=>' + '+a.nome).join('')};
    })}))}));
    return {dias,servicos};
  }
  function adapter(f,db){
    const ref=(col,id)=>f.doc(db,col,id);
    async function config(data){
      return f.runTransaction(db,async tx=>{
        const r=ref('config','geral'),old=await tx.get(r),policy=await tx.get(ref('config','reservas')),privateCfg=await tx.get(ref('configAdmin','recompensas')),next={...(old.data()||{}),...data};
        const adjustments=Object.prototype.hasOwnProperty.call(next.recompensas||{},'ajustes') ? next.recompensas.ajustes : privateCfg.data()?.ajustes||{};
        if(next.recompensas){next.recompensas={...next.recompensas};delete next.recompensas.ajustes;}
        const compiled=compile(next);
        if(JSON.stringify(privateCfg.data()?.ajustes)!==JSON.stringify(adjustments))tx.set(ref('configAdmin','recompensas'),{ajustes:adjustments});
        if(JSON.stringify(old.data())!==JSON.stringify(next))tx.set(r,next);
        if(JSON.stringify(policy.data())!==JSON.stringify(compiled))tx.set(ref('config','reservas'),compiled);
      });
    }
    async function booking(id,data,{admin=false,remove=false,payment=null}={}){
      if(!idOk(id))throw Error('Identificador inválido.');
      return f.runTransaction(db,async tx=>{
        const r=ref('agendamentos',id),before=await tx.get(r),old=before.data();
        if(!admin&&before.exists()){
          // The rules allow this read only to the owner. The retry never overwrites it.
          return old;
        }
        if(remove&&!old)return null;
        let next=remove?null:{...old,...data};
        const extraSales=[];
        if(payment){
          if(!old||!active(old)||!Number.isFinite(payment.venda.valor)||payment.venda.valor<0){
            if(old&&((payment.tipo==='entrada'&&old.entrada?.status==='recebida')||(payment.tipo==='servico'&&old.status==='concluido')))return old;
            throw Error('Este agendamento não permite o pagamento informado.');
          }
          if(payment.tipo==='entrada'&&old.entrada?.status==='recebida')return old;
          if(!['entrada','servico'].includes(payment.tipo))throw Error('Pagamento inválido.');
          extraSales.push({id:payment.tipo+':'+id,data:payment.venda});
        }
        if(admin&&!old&&next?.entrada?.status==='recebida')extraSales.push({id:'entrada:'+id,data:{data:new Date(Date.now()-3*3600000).toISOString().slice(0,10),descricao:next.servicoNome,tipo:'entrada',cliente:next.nome,valor:next.entrada.valor,forma:next.entrada.forma,agendamentoId:id,criadoEm:Date.now()}});
        if(!admin){
          const cfg=(await tx.get(ref('config','geral'))).data(),policy=(await tx.get(ref('config','reservas'))).data();
          next.servicoIndice=(cfg?.servicos||[]).findIndex(s=>s.id===next.servicoId);
          const s=cfg?.servicos?.[next.servicoIndice];
          next.adicionaisIndices=(next.adicionais||[]).map(a=>(s?.adicionais||[]).findIndex(x=>x.nome===a.nome)).sort((a,b)=>a-b);
          next.adicionaisMascaras=[0,0,0,0];
          for(const i of next.adicionaisIndices)if(i>=0)next.adicionaisMascaras[Math.floor(i/5)]|=1<<(i%5);
          next.janelaIndice=(policy?.dias?.[next.data]||[]).findIndex(w=>w.ini<=next.ini&&w.fim>=next.fim);
          if(next.servicoIndice<0||next.janelaIndice<0||next.adicionaisIndices.some(i=>i<0))throw Error('A disponibilidade mudou. Atualize a agenda.');
        }
        const days=[...new Set([old?.data,next?.data].filter(Boolean))].sort(),guards=[];
        for(const day of days)guards.push(await tx.get(ref('agendaDias',day)));
        for(let i=0;i<days.length;i++){
          let entries=(guards[i].data()?.blocos||[]).filter(a=>a.id!==id);
          if(active(next)&&next.data===days[i]){
            if(!admin&&entries.some(a=>next.ini<a.fim&&next.fim>a.ini))throw Error('Esse horário acabou de ser ocupado. Escolha outro.');
            entries.push({id,ini:next.ini,fim:next.fim});
          }
          const blocos=ordered(entries),pos=blocos.findIndex(a=>a.id===id);
          tx.set(ref('agendaDias',days[i]),{blocos,ultimoId:id,pos});
        }
        if(next)tx.set(r,next);else tx.delete(r);
        if(active(next))tx.set(ref('ocupados',id),{data:next.data,ini:next.ini,fim:next.fim});else tx.delete(ref('ocupados',id));
        for(const sale of extraSales)tx.set(ref('vendas',sale.id),sale.data);
        return next;
      });
    }
    return {config,booking};
  }
  root.SPARK_STORE={adapter,compile,ordered};
  if(typeof module!=='undefined')module.exports=root.SPARK_STORE;
})(typeof window==='undefined'?globalThis:window);
