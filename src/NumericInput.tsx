import {useEffect,useState} from 'react';
export default function NumericInput({value,onValue,min=0,max=1e9,decimal=false,placeholder='未填視為 0',...props}:{value:number|null|undefined;onValue:(n:number)=>void;min?:number;max?:number;decimal?:boolean;placeholder?:string;id?:string;'aria-label'?:string}){
 const [text,setText]=useState(value?String(value):'');
 useEffect(()=>{setText(value?String(value):'');},[value]);
 return <input {...props} type="text" inputMode={decimal?'decimal':'numeric'} value={text} placeholder={placeholder} onFocus={e=>{if(Number(e.target.value)===0)setText('');}} onChange={e=>{const t=e.target.value.replace(/[,，]/g,'');if(!/^\d*(\.\d*)?$/.test(t)||(!decimal&&t.includes('.')))return;setText(t);const n=Number(t);if(Number.isFinite(n))onValue(Math.max(min,Math.min(max,n)));}} onBlur={()=>setText(value?String(value):'')}/>;
}
