const asset=(path:string)=>import.meta.env.BASE_URL+path;
import {readPackages} from './packages';
import {normalizeRecord,parseText,Vehicle} from './cost';
async function ocr(image:File|HTMLCanvasElement,onProgress:(s:string)=>void){
 const {createWorker}=await import('tesseract.js');
 const worker=await createWorker('chi_tra',1,{workerPath:asset('ocr/worker.min.js'),corePath:asset('ocr/core'),langPath:asset('ocr/lang'),workerBlobURL:false,logger:m=>{if(m.status==='recognizing text')onProgress(`辨識文字 ${Math.round(m.progress*100)}%`);}});
 try{const {data}=await worker.recognize(image);return data.text;}finally{await worker.terminate();}
}
export async function extract(file:File,onProgress:(s:string)=>void):Promise<{text:string;records:Vehicle[]}>{
 const ext=file.name.split('.').pop()?.toLowerCase();let text='';let records:Vehicle[]|undefined;
 if(['png','jpg','jpeg','webp'].includes(ext||'')){onProgress('載入繁體中文辨識，首次需較長時間…');text=await ocr(file,onProgress);}
 else if(['xlsx','xls','csv'].includes(ext||'')){
 const XLSX=await import('xlsx');const book=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:true});records=readPackages(book);
 for(const [sheetIndex,name] of book.SheetNames.entries()){if(book.Workbook?.Sheets?.[sheetIndex]?.Hidden)continue;const rows=XLSX.utils.sheet_to_json<Record<string,unknown>>(book.Sheets[name],{defval:''});text+=`${name}\n${XLSX.utils.sheet_to_csv(book.Sheets[name])}\n`;for(const row of rows){const v=normalizeRecord(row);if(v.model&&!records.some(x=>x.kind))records.push(v);}}
 if(!records.length)records=parseText(text);
 }else if(ext==='pdf'){
 const pdfjs=await import('pdfjs-dist');pdfjs.GlobalWorkerOptions.workerSrc=asset('pdf.worker.min.mjs');const task=pdfjs.getDocument({data:await file.arrayBuffer(),cMapUrl:asset('pdf-cmaps/'),cMapPacked:true,standardFontDataUrl:asset('pdf-fonts/')});const doc=await task.promise;
 try{if(doc.numPages>30)throw new Error('PDF 超過 30 頁，請拆分後上傳；原檔已保存。');for(let i=1;i<=doc.numPages;i++){onProgress(`讀取 PDF 第 ${i}／${doc.numPages} 頁`);const page=await doc.getPage(i);const content=await page.getTextContent();let pageText='',y:number|undefined;for(const item of content.items as any[]){if(!item.str)continue;if(y!==undefined&&Math.abs(item.transform[5]-y)>3)pageText+='\n';pageText+=item.str+' ';y=item.transform[5];if(item.hasEOL)pageText+='\n';}
 if(pageText.trim().length<15){const viewport=page.getViewport({scale:Math.min(2,1800/page.getViewport({scale:1}).width)});const canvas=document.createElement('canvas');canvas.width=viewport.width;canvas.height=viewport.height;await page.render({canvas,canvasContext:canvas.getContext('2d')!,viewport}).promise;pageText=await ocr(canvas,onProgress);canvas.width=canvas.height=0;}text+=pageText+'\n\n';page.cleanup();}}finally{await task.destroy();}
 }else if(ext==='docx'){const mammoth=await import('mammoth/mammoth.browser');const result=await mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()});text=result.value;}
 else if(ext==='eml'){const {default:PostalMime}=await import('postal-mime');const mail=await PostalMime.parse(await file.arrayBuffer());const htmlText=mail.html?new DOMParser().parseFromString(mail.html,'text/html').body.textContent:'';text=`主旨：${mail.subject||''}\n${mail.text||htmlText||''}`;if(mail.attachments.length)text+='\n\n此郵件含附件；請另行上傳附件進行判讀。';}
 else if(ext==='txt'){text=await file.text();}else throw new Error('這個檔案格式尚不支援文字判讀。');
 return {text,records:records||parseText(text)};
}
