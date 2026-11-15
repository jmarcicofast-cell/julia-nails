const {Timestamp,GeoPoint}=require('firebase-admin/firestore');
function encode(v){
 if(typeof v==='number'&&!Number.isFinite(v))return {__tipo:'number',value:String(v)};
 if(v===undefined)return {__tipo:'undefined'};
 if(v===null||typeof v!=='object')return v;
 if(v instanceof Timestamp)return {__tipo:'timestamp',seconds:v.seconds,nanoseconds:v.nanoseconds};
 if(v instanceof GeoPoint)return {__tipo:'geopoint',latitude:v.latitude,longitude:v.longitude};
 if(Buffer.isBuffer(v))return {__tipo:'bytes',base64:v.toString('base64')};
 if(v.path&&v.firestore)return {__tipo:'reference',path:v.path};
 if(Array.isArray(v))return {__tipo:'array',items:v.map(encode)};
 return {__tipo:'map',entries:Object.entries(v).map(([k,x])=>[k,encode(x)])};
}
function decode(v,db){
 if(v===null||typeof v!=='object')return v;
 switch(v.__tipo){
 case 'number':return Number(v.value);
 case 'undefined':return undefined;
 case 'timestamp':return new Timestamp(v.seconds,v.nanoseconds);
 case 'geopoint':return new GeoPoint(v.latitude,v.longitude);
 case 'bytes':return Buffer.from(v.base64,'base64');
 case 'reference':return db.doc(v.path);
 case 'array':return v.items.map(x=>decode(x,db));
 case 'map':return Object.fromEntries(v.entries.map(([k,x])=>[k,decode(x,db)]));
 default:throw Error('Backup inválido.');
 }
}
module.exports={encode,decode};
