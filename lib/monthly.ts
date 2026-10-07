import {modelKey} from './packages';
export type MonthlyCondition={id:string;model:string;cash26:number|null;cash27:number|null;limit:number;months:number;difference:number};
// 依使用者提供的 10/1～10/31 月通報照片逐列建立，非市場報價。
export const monthlyConditions:MonthlyCondition[]=[
 ['RAV4-HV',3,null,200000,20,4800],['RAV4-PHEV',null,null,0,0,0],['RAV4-HV GR版',1,null,0,0,0],['COROLLA SPORT',null,3,300000,30,10080],['HILUX',null,3,0,0,0],['CAMRY汽油',3,null,600000,30,20160],['CAMRY-HV',1,null,0,0,0],['PRIUS PHEV',null,2,0,0,0],['L CRUISER',null,null,0,0,0],['ALPHARD HV & PHV',null,1,0,0,0],['SIENNA HV',1,null,0,0,0],['bZ4X',null,2,0,0,0],['CROWN Crossover',null,1,0,0,0],['CROWN Sport',null,null,0,0,0],['ALTIS',6,4,600000,40,26760],['ALTIS-HV',6,4,400000,40,17880],['C-CROSS 汽油版',6,4,500000,30,16800],['C-CROSS HV',6,4,500000,30,16800],['VIOS',6,null,400000,30,13440],['YARIS CROSS',6,4,600000,40,26760],['TOWN ACE PICK UP',5,3,500000,50,27900],['TOWN ACE VAN',5,3,500000,50,27900],
].map((r,i)=>({id:String(i),model:r[0] as string,cash26:r[1] as number|null,cash27:r[2] as number|null,limit:r[3] as number,months:r[4] as number,difference:r[5] as number}));
export function companyTerms(condition:MonthlyCondition,year:'26'|'27',qualified:boolean,installment:boolean,wholesale:boolean,date:string){
 const listed=year==='26'?condition.cash26:condition.cash27;
 const valid=date>='2026-10-01'&&date<='2026-10-31';
 return {valid,rate:valid&&!wholesale&&listed!==null?Math.max(0,listed-(qualified?0:.5)):0,difference:valid&&!wholesale&&installment?condition.difference:0,limit:valid&&!wholesale&&installment?condition.limit:0,months:condition.months};
}

export const zeroInterestConditions=monthlyConditions.filter(x=>x.limit>0&&x.months>0);
export function zeroInterestLabel(x:MonthlyCondition){return `${x.model} ${x.limit/10000}萬／${x.months}期 0%・補貼息 $${x.difference.toLocaleString('zh-TW')}`;}

export function zeroInterestOptions(model:string,trim=''){
 if(!model.trim())return [];
 const text=(model+' '+trim).toUpperCase();
 if(/PHEV|PHV|GR版|\bGR\b/.test(text))return [];
 const hybrid=/HEV|HV|HYBRID|油電/.test(text),gas=/汽油/.test(text);
 const options=zeroInterestConditions.filter(x=>modelKey(x.model)===modelKey(model));
 const isHybrid=(x:MonthlyCondition)=>/HEV|HV|油電/i.test(x.model);
 return hybrid?options.filter(isHybrid):gas||options.some(x=>!isHybrid(x))?options.filter(x=>!isHybrid(x)):options;
}

// 比對上方車型與通報條件，避免同車系不同動力套錯優惠。
export function conditionMatchesVehicle(condition:MonthlyCondition,model:string,trim=''){
 if(modelKey(condition.model)!==modelKey(model))return false;
 const text=(model+' '+trim).toUpperCase(), target=condition.model.toUpperCase();
 const power=(s:string)=>/PHEV|PHV/.test(s)?'plug-in':/HEV|HV|HYBRID|油電/.test(s)?'hybrid':/汽油/.test(s)?'gas':'';
 const actual=power(text), expected=power(target);
 if(actual && (actual!==expected && !(actual==='gas'&&!expected)))return false;
 // ALTIS、CAMRY、C-CROSS 未標油電時沿用汽油版；RAV4 未標動力時不推定。
 if(!actual && /ALTIS|CAMRY|COROLLA CROSS/.test(modelKey(model)) && expected && expected!=='gas')return false;
 if(/GR版|\bGR\b/.test(text)!==/GR版|\bGR\b/.test(target))return false;
 for(const variant of ['CROSSOVER','SPORT']){
  if(modelKey(model)==='CROWN' && text.includes(variant)!==target.includes(variant) && /CROSSOVER|SPORT/.test(text))return false;
 }
 return true;
}
