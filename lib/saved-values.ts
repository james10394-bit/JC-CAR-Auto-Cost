import type {Vehicle} from './cost';
const key=(value:unknown)=>String(value??'').trim().replace(/\s+/g,' ').toLocaleUpperCase();
export function savedValues(records:Vehicle[],entry:Vehicle,field:string):string[]{
 let pool=records.filter(v=>v.id!==entry.id);
 if(field!=='model'){
 pool=pool.filter(v=>v.kind===entry.kind);
 if(entry.model.trim())pool=pool.filter(v=>key(v.model)===key(entry.model));
 if(!['model','trim'].includes(field)&&entry.trim.trim()&&pool.some(v=>key(v.trim)===key(entry.trim)))pool=pool.filter(v=>key(v.trim)===key(entry.trim));
 if(!['model','trim','year'].includes(field)&&entry.year.trim()&&pool.some(v=>key(v.year)===key(entry.year)))pool=pool.filter(v=>key(v.year)===key(entry.year));
 }
 const seen=new Set<string>(),values:string[]=[];
 for(const v of pool){const value=field.startsWith('packageInfo.')?v.packageInfo?.[field.split('.')[1] as 'dealerTotal'|'bundlePrice'|'quote']:(v as any)[field];if(value==null||String(value).trim()==='')continue;const s=String(value).trim();if(!seen.has(key(s))){seen.add(key(s));values.push(s);}}
 return values.sort((a,b)=>a.localeCompare(b,'zh-TW',{numeric:true}));
}
