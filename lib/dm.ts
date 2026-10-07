import {blank,Vehicle} from './cost';

export type DmVariant={trim:string;packagePrice:number;barePrice:number};

// Toyota Corolla Cross 2026 特仕車 DM 的一組兩欄：左套裝、右空車。
export function corollaCrossDmDrafts(kind:'gr'|'hev',prices:number[]):Vehicle[]{
 const trims=kind==='gr'?['GR SPORT 汽油','GR SPORT HYBRID 油電']:['豪華 HYBRID 油電','豪華（選）HYBRID 油電','The 60th 典藏版 HYBRID 油電','旗艦 HYBRID 油電'];
 if(prices.length!==trims.length*2||prices.some((n,i)=>!Number.isFinite(n)||n<500000||n>2000000||(i%2===0&&n<=prices[i+1])))return [];
 return trims.map((trim,i)=>({
  ...blank(),model:'COROLLA CROSS',trim,year:'2026',
  dmPackagePrice:prices[i*2],dmBarePrice:prices[i*2+1],referencePrice:prices[i*2+1],
  note:'來源：2026 特仕車規格表 DM。左欄為套裝車價，右欄為空車價；均為表列售價，並非業務進車成本。進車成本請另行核對填入。下方加購活動未併入車價。',
 }));
}

export function corollaCrossUnclearDrafts(kind:'gr'|'hev'):Vehicle[]{
 const trims=kind==='gr'?['GR SPORT 汽油','GR SPORT HYBRID 油電']:['豪華 HYBRID 油電','豪華（選）HYBRID 油電','The 60th 典藏版 HYBRID 油電','旗艦 HYBRID 油電'];
 return trims.map(trim=>({...blank(),model:'COROLLA CROSS',trim,year:'2026',note:'已辨識 2026 COROLLA CROSS DM 與版本，價目欄位未能可靠判讀；請對照原始 DM 手動輸入空車與套裝售價。兩者是 DM 對客售價，業務進車成本需另行填寫。'}));
}
