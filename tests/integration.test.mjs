import assert from 'node:assert/strict';
import handler from '../api/lead.js';

process.env.GOOGLE_APPS_SCRIPT_URL='https://script.google.com/macros/s/TEST/exec';
process.env.GOOGLE_SHEETS_SECRET='test-secret-for-local-test-only';
process.env.RD_API_KEY='local-test-key';
process.env.SITE_ORIGIN='https://www.aasbc.com.br';
const sample={
 request_id:'teste-001',name:'Contato Exemplo',email:'teste@example.com',phone:'11999998888',
 stage:'Fundamental I',grade:'2º ano',message:'Quero agendar',
 privacy_accepted:true,marketing_accepted:false,honeypot:'',landing_page:'https://www.aasbc.com.br/',
 attribution:{utm_source:'instagram',utm_campaign:'matriculas_2027'}
};
function mockResponse() {
 return {headers:{},code:0,body:null,setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(v){this.body=v;return this;}};
}
const calls=[];
globalThis.fetch=async (url,options)=>{
 const data=JSON.parse(options.body);
 calls.push({url:String(url),data});
 return new Response(JSON.stringify({ok:true,id:data.request_id,event_uuid:'fake'}), {status:200,headers:{'Content-Type':'application/json'}});
};
let res=mockResponse();
await handler({method:'POST',headers:{origin:'https://www.aasbc.com.br','content-length':500},body:sample},res);
assert.equal(res.code,200);
assert.equal(res.body.ok,true);
assert.equal(res.body.partial,false);
assert.equal(calls.length,2);
const sheets=calls.find(c=>c.url.includes('script.google.com'));
const rd=calls.find(c=>c.url.includes('api.rd.services'));
assert.equal(sheets.data.integration_secret,process.env.GOOGLE_SHEETS_SECRET);
assert.equal(sheets.data.phone,sample.phone);
assert.equal(sheets.data.attribution.utm_source,'instagram');
assert.equal(rd.data.event_type,'CONVERSION');
assert.equal(rd.data.payload.email,sample.email);
assert.equal(rd.data.payload.conversion_identifier,'AA SBC | Matrículas 2027 | Fundamental I');
console.log('PASS: payload do site -> Sheets + RD');

res=mockResponse();
await handler({method:'POST',headers:{origin:'https://www.aasbc.com.br'},body:{...sample,email:'invalido'}},res);
assert.equal(res.code,422);
assert.equal(calls.length,2);
console.log('PASS: bloqueio de cadastro inválido');

res=mockResponse();
await handler({method:'POST',headers:{origin:'https://site-diferente.com.br'},body:sample},res);
assert.equal(res.code,403);
console.log('PASS: bloqueio de origem não permitida');

// Failure of RD should not lose the lead already saved in Sheets
calls.length=0;
globalThis.fetch=async (url,options)=>{
 calls.push({url:String(url),data:JSON.parse(options.body)});
 if (String(url).includes('rd.services')) return new Response(JSON.stringify({error:'failed'}),{status:400});
 return new Response(JSON.stringify({ok:true}),{status:200});
};
res=mockResponse();
await handler({method:'POST',headers:{origin:'https://www.aasbc.com.br'},body:sample},res);
assert.equal(res.code,200);
assert.equal(res.body.partial,true);
console.log('PASS: cadastro salvo no Sheets em caso de falha RD (sucesso parcial)');


// Formulário do botão de WhatsApp usa o mesmo endpoint, com origem distinta.
calls.length=0;
globalThis.fetch=async (url,options)=>{
 const data=JSON.parse(options.body);
 calls.push({url:String(url),data});
 return new Response(JSON.stringify({ok:true,id:data.request_id}),{status:200,headers:{'Content-Type':'application/json'}});
};
res=mockResponse();
await handler({method:'POST',headers:{origin:'https://www.aasbc.com.br'},body:{
 ...sample,request_id:'teste-whatsapp-1',source:'whatsapp_floating',stage:'Ainda não sei',
 grade:'Preciso de orientação',message:'Origem do lead: botão flutuante de WhatsApp da LP Matrículas 2027.'
}},res);
assert.equal(res.code,200);
assert.equal(res.body.ok,true);
assert.equal(calls.length,2);
assert.equal(calls.find(c=>c.url.includes('script.google.com')).data.message.includes('botão flutuante'),true);
const rdWa=calls.find(c=>c.url.includes('api.rd.services'));
assert.equal(rdWa.data.payload.conversion_identifier,'AA SBC | Matrículas 2027 | WhatsApp');
assert.equal(rdWa.data.payload.tags.includes('via-whatsapp-flutuante'),true);
console.log('PASS: WhatsApp flutuante -> Google Sheets + RD Station, origem identificada');
