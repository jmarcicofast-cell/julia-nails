const { chromium } = require('playwright');
const fs=require('fs'); const path=require('path'); const assert=require('node:assert/strict');
const root=path.resolve(__dirname, '..'); const output=process.env.TEST_OUTPUT || '/tmp/julia-nails-tests';fs.mkdirSync(output,{recursive:true});
(async()=>{
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH}: {})});
const context=await browser.newContext();
await context.route('**/config.js',r=>r.fulfill({contentType:'application/javascript',body:'window.APP_CONFIG={firebase:{apiKey:"COLE_AQUI"}};'}));
await context.route(/https:\/\/(?!127\.0\.0\.1)/,r=>r.abort());
await context.route('http://127.0.0.1:8765/**',r=>{
 const file=path.join(root, new URL(r.request().url()).pathname);
 if(file.endsWith('/config.js')) return r.fulfill({contentType:'application/javascript',body:'window.APP_CONFIG={firebase:{apiKey:"COLE_AQUI"}};'});
 if(!fs.existsSync(file)) return r.fulfill({status:404,body:''});
 const ext=path.extname(file);const type={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.webmanifest':'application/manifest+json'}[ext];
 return r.fulfill({contentType:type,body:fs.readFileSync(file)});
});
const page=await context.newPage(); const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.clock.setFixedTime(new Date('2026-11-14T10:00:00Z'));
const results=[];
async function measure(label){results.push(await page.evaluate(label=>({label,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,contentWidth:document.querySelector('main')?.getBoundingClientRect().width,overflow:[...document.querySelectorAll('body *')].filter(e=>{let r=e.getBoundingClientRect();return r.width&&r.right>innerWidth+1&&getComputedStyle(e).position!=='fixed'}).slice(0,8).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent.slice(0,60)}))}),label));}
await page.goto('http://127.0.0.1:8765/index.html');
for(const width of [320,375,390,768,1440]){
await page.setViewportSize({width,height:900});
for(const tab of ['agenda','encaixes','fin','chat','ajustes']){await page.locator(`[data-v="${tab}"]`).click();await measure('admin-'+tab);}
await page.locator('[data-v="agenda"]').click();await page.locator('[data-act="novo"]').first().click();await measure('admin-novo');await page.locator('#sheet [data-act="fechar"]').first().click();
}
await page.goto('http://127.0.0.1:8765/agendar.html');
await page.locator('[data-ac="criar"]').click();await page.locator('#acForm [name="nome"]').fill('Teste Auditoria');await page.locator('#acForm [name="telefone"]').fill('21900000000');await page.locator('#acForm [name="email"]').fill('auditoria@example.invalid');await page.locator('#acForm [name="senha"]').fill('demo123456');await page.locator('#acBtn').click();
for(const width of [320,375,390,768,1440]){await page.setViewportSize({width,height:900});for(const tab of ['agendar','meus','perfil','chat']){await page.locator(`[data-v="${tab}"]`).click();await measure('cliente-'+tab);}}
await page.locator('[data-v="agendar"]').click();await page.locator('.sv').first().click();await page.locator('.cd.livre').first().click();await page.locator('.slot').first().click();await page.locator('#dados [name="deco"]').fill('Francesinha');await page.locator('#dados [name="aceite"]').check();await page.locator('#btnEnviar').click();await measure('cliente-pix');
await page.locator('#btnPaguei').click();await page.locator('#sheet [data-act="fechar"]').click();
await page.locator('[data-v="chat"]').click();await page.locator('#chatIdent [name="nome"]').fill('Teste Auditoria');await page.locator('#chatIdent [name="telefone"]').fill('21900000000');await page.locator('#chatIdent button').click();await page.locator('#chatForm input').fill('Mensagem da conta A');await page.locator('#chatForm button').click();
await page.locator('[data-v="perfil"]').click();page.once('dialog',d=>d.accept());await page.locator('[data-act="sairConta"]').click();await page.locator('[data-ac="criar"]').click();await page.locator('#acForm [name="nome"]').fill('Conta B');await page.locator('#acForm [name="telefone"]').fill('21911111111');await page.locator('#acForm [name="email"]').fill('contab@example.invalid');await page.locator('#acForm [name="senha"]').fill('demo123456');await page.locator('#acBtn').click();await page.locator('[data-v="meus"]').click();const leakedBookings=await page.locator('#v-meus').innerText();await page.locator('[data-v="chat"]').click();const leakedChat=await page.locator('#msgs').innerText();assert(!leakedBookings.includes('Mão'));assert(!leakedChat.includes('Mensagem da conta A'));results.push({accountIsolation:'PASS'});
// Returning to A must restore its own booking and chat, without losing them.
await page.locator('[data-v=perfil]').click();page.once('dialog',d=>d.accept());await page.locator('[data-act=sairConta]').click();await page.locator('[data-ac=entrar]').click();await page.locator('#acForm [name=email]').fill('auditoria@example.invalid');await page.locator('#acForm [name=senha]').fill('demo123456');await page.locator('#acBtn').click();await page.locator('[data-v=meus]').click();assert((await page.locator('#v-meus').innerText()).includes('Mão'));await page.locator('[data-v=chat]').click();assert((await page.locator('#msgs').innerText()).includes('Mensagem da conta A'));
await page.goto('http://127.0.0.1:8765/index.html');await page.locator('[data-act="confirmar"][data-id="d2"]').first().click();await page.locator('[data-act="entradaOk"]').evaluate(e=>{e.click();e.click()});await page.waitForFunction(()=>Object.values(JSON.parse(localStorage.getItem('demo:vendas'))).some(x=>x.agendamentoId==='d2'));const payments=await page.evaluate(()=>Object.values(JSON.parse(localStorage.getItem('demo:vendas'))).filter(x=>x.agendamentoId==='d2'));assert.equal(payments.length,1);results.push({doublePayment:'PASS'});
await page.locator('#sheet [data-act=fechar]').click();
await page.locator('[data-act=concluir][data-id=d2]').click();await page.locator('#sheet form').evaluate(f=>{f.requestSubmit();f.requestSubmit()});
await page.waitForFunction(()=>JSON.parse(localStorage.getItem('demo:agendamentos')).d2.status==='concluido');assert.equal(await page.evaluate(()=>Object.values(JSON.parse(localStorage.getItem('demo:vendas'))).filter(x=>x.agendamentoId==='d2'&&x.tipo==='servico').length),1);
await page.locator('[data-v=ajustes]').click();await page.locator('[data-k=duracao]').first().fill('-5');await page.locator('[data-act=salvarAjustes]').click();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('demo:config')).geral.servicos[0].duracao),45);
await page.locator('[data-v=agenda]').click();
await page.setViewportSize({width:320,height:800});await page.screenshot({path:path.join(output,'admin-mobile.png'),fullPage:true});
// A service with no matching payment link must not crash or create a request.
await page.evaluate(()=>{const c=JSON.parse(localStorage.getItem('demo:config'));c.geral.entrada.chavePix='';c.geral.entrada.linkCartao='';c.geral.entrada.linksCartao={s2:'https://example.invalid/pagar'};localStorage.setItem('demo:config',JSON.stringify(c))});
await page.goto('http://127.0.0.1:8765/agendar.html');await page.locator('.sv').first().click();await page.locator('.cd.livre').first().click();await page.locator('.slot').first().click();await page.locator('#dados [name=deco]').fill('Francesinha');await page.locator('#dados [name=aceite]').check();await page.locator('#btnEnviar').click();await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('meio de pagamento'));assert.equal(await page.locator('#btnPaguei').count(),0);
await page.setViewportSize({width:1440,height:900});await page.screenshot({path:path.join(output,'cliente-desktop.png'),fullPage:true});
assert.deepEqual(errors,[]);for(const x of results.filter(x=>'width' in x))assert(x.scrollWidth<=x.width,JSON.stringify(x));results.push({errors});
fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(results,null,2));
console.log('PASS: sessão, retorno à conta, Pix, pedido, recebimento e finalização repetidos, validação, pagamento indisponível e '+results.filter(x=>'width' in x).length+' medições responsivas.');
await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
