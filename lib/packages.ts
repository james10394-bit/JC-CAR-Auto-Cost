import type * as XLSX from 'xlsx';
import {blank,Vehicle,amount} from './cost';
export type PackageInfo={code:string;sheet:string;items:{code:string;name:string;price:number|null}[];dealerTotal:number|null;bundlePrice:number|null;quote:number|null};
export function modelKey(s:string){const t=s.toUpperCase().replace(/[\s_-]/g,'');if(t.includes('TOWNACEVAN'))return 'TOWN ACE VAN';if(t.includes('TOWNACE'))return 'TOWN ACE';if(t.includes('CCROSS')||t.includes('COROLLACROSS'))return 'COROLLA CROSS';if(t.includes('YCROSS')||t.includes('YARISCROSS'))return 'YARIS CROSS';if(t.includes('PHV'))return 'PRIUS PHV';if(t.includes('CSPORT')||t.includes('COROLLASPORT'))return 'COROLLA SPORT';return ['HILUX','CAMRY','ALTIS','VIOS','BZ4X','RAV4','SIENTA','PRIUS','CROWN','AURIS','YARIS'].find(m=>t.includes(m))||s.trim().toUpperCase();}
const cell=({r,c}:{r:number;c:number})=>{let col='';for(let n=c+1;n;n=Math.floor((n-1)/26))col=String.fromCharCode(65+(n-1)%26)+col;return col+(r+1);};
const clean=(x:unknown)=>String(x??'').replace(/\r\n/g,'\n').trim();
const number=(x:unknown)=>amount(x);
export function readPackages(book:XLSX.WorkBook):Vehicle[]{
 const out:Vehicle[]=[];
 book.SheetNames.forEach((name,i)=>{
 if(book.Workbook?.Sheets?.[i]?.Hidden)return;
 const sheet=book.Sheets[name];if(!sheet['!ref'])return;
 const range={s:{r:0,c:0},e:{r:Math.max(...Object.keys(sheet).filter(k=>/^[A-Z]+\d+$/.test(k)).map(k=>Number(k.match(/\d+$/)![0])-1)),c:Math.max(...Object.keys(sheet).filter(k=>/^[A-Z]+\d+$/.test(k)).map(k=>[...k.match(/^[A-Z]+/)![0]].reduce((n,c)=>n*26+c.charCodeAt(0)-64,0)-1))}};
 const val=(r:number,c:number)=>{const merge=sheet['!merges']?.find(m=>r>=m.s.r&&r<=m.e.r&&c>=m.s.c&&c<=m.e.c);return sheet[cell(merge?.s||{r,c})]?.v;};
 let header:{model:number;code:number;name:number;price:number}|undefined,current:Vehicle|undefined;
 for(let r=range.s.r;r<=range.e.r;r++){
 const row=Array.from({length:range.e.c+1},(_,c)=>clean(sheet[cell({r,c})]?.v));
 if(row.includes('品名')&&row.includes('業代價')&&row.includes('編號')){header={model:row.indexOf('車種'),code:row.indexOf('編號'),name:row.indexOf('品名'),price:row.indexOf('業代價')};continue;}
 if(!header)continue;
 const rawCode=clean(val(r,header.code));const code=rawCode.replace(/※/g,'').trim().split(/[\s(（]/)[0];
 const line=row.join(' ');const summary=/統一報價|套裝價/.test(line);
 if(current&&summary){const info=current.packageInfo!;const get=(label:string)=>{const m=line.match(new RegExp(label+'[：:\\s]*([\\d,]+)'));return m?Number(m[1].replace(/,/g,'')):null;};info.quote=get('統一報價');info.bundlePrice=get('套裝價');info.dealerTotal=number(sheet[cell({r,c:header.price})]?.v);current=undefined;continue;}
 const itemName=clean(sheet[cell({r,c:header.name})]?.v);
 if(!/^[A-Z]{2,}[\d][A-Z\d.-]*$/i.test(code)||!itemName||itemName==='品名')continue;
 if(!current||current.packageInfo!.code!==code){current={...blank(),kind:'accessory-package',model:modelKey(name),trim:header.model>=0?clean(val(r,header.model)):'',note:`配件套裝，來源工作表：${name}。價格需核對；不含空車成本。`,packageInfo:{code,sheet:name,items:[],dealerTotal:null,bundlePrice:null,quote:null}};out.push(current);}
 current.packageInfo!.items.push({code:clean(sheet[cell({r,c:header.name-1})]?.v),name:itemName,price:number(sheet[cell({r,c:header.price})]?.v)});
 }
 });return out;
}
