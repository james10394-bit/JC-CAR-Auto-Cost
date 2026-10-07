import type {PackageInfo} from './packages';
export type Vehicle = {id:string; kind?:'accessory-package'; packageInfo?:PackageInfo; model:string; trim:string; year:string; bare:number|null; package:number|null; rebate:number|null; commission:number|null; quota:number|null; stock:number|null; color:string; validFrom:string; validTo:string; sourceId:string; note:string; status:'draft'|'confirmed'; rebatePercent?:number; commissionPercent?:number; referencePrice?:number; createdAt?:string};
export const numericFields=['bare','package','rebate','commission','quota','stock'] as const;
export const labels:Record<string,string>={model:'車型',trim:'等級／版本',year:'年式',bare:'空車成本',package:'套裝總成本',rebate:'原廠獎金／折讓',commission:'車貸佣金',quota:'配車額度',stock:'現有庫存',color:'車色',validFrom:'生效日',validTo:'截止日',note:'條件／備註'};
export function blank():Vehicle{return {id:crypto.randomUUID(),model:'',trim:'',year:'',bare:null,package:null,rebate:null,commission:null,quota:null,stock:null,color:'',validFrom:'',validTo:'',sourceId:'',note:'',status:'draft'};}
export function expired(v:Vehicle,today=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Taipei'})){return !!v.validTo&&v.validTo<today;}
export function effective(v:Vehicle,today=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Taipei'})){return !expired(v,today)&&(!v.validFrom||v.validFrom<=today);}
export type Scenario={sale:number;extras:number;subsidy:number;trade:number;debt:number;down:number;rate:number;months:number;fees:number;dealerCost:number;referencePrice?:number;rebate?:number;commission?:number;rebatePercent?:number;commissionPercent?:number;companyRate?:number;financeCost?:number;promoLimit?:number;promoMonths?:number};
export function calculate(v:Vehicle,mode:string,s:Scenario){
 const cost=mode==='package'?v.package:v.bare;
 const sale=s.sale+s.extras,net=sale-s.subsidy-s.trade+s.debt,cash=Math.min(s.down,Math.max(0,net)),principal=Math.max(0,net-cash),r=s.rate/1200,months=Math.max(1,s.months);
 const promoLimit=s.promoLimit||0,promoMonths=Math.max(1,s.promoMonths||months),promoPrincipal=Math.min(principal,promoLimit),regularPrincipal=principal-promoPrincipal;
 const regularMonthly=regularPrincipal===0?0:r===0?regularPrincipal/months:regularPrincipal*r/(1-Math.pow(1+r,-months));
 const promoMonthly=promoPrincipal/promoMonths,monthly=regularMonthly+promoMonthly,interest=regularMonthly*months-regularPrincipal;
 const reference=s.referencePrice??v.referencePrice??0;
 const rebate=(s.rebate??v.rebate??0)+reference*(s.rebatePercent??v.rebatePercent??0)/100;
 const commission=(s.commission??v.commission??0)+principal*(s.commissionPercent??v.commissionPercent??0)/100;
 const companySupport=reference*(s.companyRate||0)/100,financeCost=s.financeCost||0;
 return {cost,net,cash,principal,monthly,interest,total:cash+principal+interest+s.fees,refund:Math.max(0,-net),rebate,commission,companySupport,financeCost,promoPrincipal,promoMonthly,regularMonthly,promoMonths,months,profit:cost==null?null:sale+rebate+commission+companySupport-cost-s.dealerCost-financeCost};
}

const aliases:Record<string,string>={'車型':'model','model':'model','等級':'trim','版本':'trim','等級／版本':'trim','trim':'trim','年式':'year','year':'year','空車':'bare','空車成本':'bare','bare':'bare','套裝':'package','套裝總成本':'package','套裝成本':'package','package':'package','原廠獎金':'rebate','原廠獎金／折讓':'rebate','獎金':'rebate','折讓':'rebate','rebate':'rebate','車貸佣金':'commission','佣金':'commission','commission':'commission','配車額度':'quota','車額':'quota','配額':'quota','quota':'quota','庫存':'stock','現有庫存':'stock','stock':'stock','車色':'color','顏色':'color','color':'color','生效日':'validFrom','validfrom':'validFrom','截止日':'validTo','有效期限':'validTo','validto':'validTo','備註':'note','note':'note','原廠獎金趴數':'rebatePercent','獎金比例':'rebatePercent','獎金%':'rebatePercent','車貸佣金趴數':'commissionPercent','佣金比例':'commissionPercent','佣金%':'commissionPercent','牌價':'referencePrice','車價基準':'referencePrice'};
export function percent(x:unknown){const s=String(x??'').trim().replace(/[％%\s]/g,'');return /^\d+(\.\d+)?$/.test(s)?Number(s):0;}
export function amount(x:unknown):number|null{const s=String(x??'').trim().replace(/[,，\s$＄元台幣NTD]/g,'');if(!/^\d+(\.\d+)?(萬|千)?$/.test(s))return null;return Number(s.replace(/[萬千]/,''))*(s.endsWith('萬')?10000:s.endsWith('千')?1000:1);}
export function normalizeRecord(row:Record<string,unknown>):Vehicle{
 const v=blank();for(const [key,val] of Object.entries(row)){const k=aliases[key.replace(/\s/g,'').toLowerCase()]; if(!k)continue; if(['rebate','commission'].includes(k)&&/[%％]/.test(String(val))){(v as any)[k+'Percent']=percent(val);(v as any)[k]=0;} else if(['rebatePercent','commissionPercent'].includes(k)){(v as any)[k]=percent(val);} else if(k==='referencePrice'||numericFields.includes(k as any)){(v as any)[k]=amount(val);} else{(v as any)[k]=val instanceof Date?val.toISOString().slice(0,10):String(val??'').trim();}}
 return v;
}
export function parseText(text:string):Vehicle[]{
 const chunks=text.split(/\n\s*\n/).filter(x=>x.trim());const records:Vehicle[]=[];
 for(const chunk of chunks){const values:Record<string,unknown>={};for(const line of chunk.split(/\r?\n/)){const m=line.match(/^\s*([^:：=]+)\s*[:：=]\s*(.+)$/);if(m)values[m[1].trim()]=m[2].trim();}
 const v=normalizeRecord(values);if(!v.model){const m=chunk.match(/\b(COROLLA CROSS|COROLLA ALTIS|YARIS CROSS|RAV4|CAMRY|SIENTA|VIOS|ALTIS|PRIUS|HILUX|TOWN ACE|CROWN|YARIS)\b/i);if(m)v.model=m[1].toUpperCase();}
 for(const [k,pattern] of Object.entries({bare:'空車(?:成本)?',package:'套裝(?:總成本|成本)?',rebate:'原廠獎金|獎金|折讓',commission:'車貸佣金',quota:'配車額度|配額|車額',stock:'現有庫存|庫存'})){if((v as any)[k]===null){const m=chunk.match(new RegExp('(?:'+pattern+')\\s*[:：=]?\\s*(?:NT\\$|\\$)?\\s*(\\d[\\d,，]*(?:\\.\\d+)?\\s*(?:萬|千)?)','i'));if(m)if(['rebate','commission'].includes(k)&&chunk.slice(m.index!+m[0].length).trimStart().startsWith('%')){(v as any)[k+'Percent']=Number(m[1]);(v as any)[k]=0;}else (v as any)[k]=amount(m[1]);}}
 if(v.model||numericFields.some(k=>v[k]!==null)){v.note=v.note||'自動擷取草稿；請核對版本、條件及日期。';records.push(v);}}
 return records.length?records:[{...blank(),note:'未找到可明確判讀的車型欄位，請對照原始資料補填。'}];
}
