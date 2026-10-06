import {createRequire} from 'node:module';import {dirname,join} from 'node:path';import {mkdir,copyFile,cp,readdir} from 'node:fs/promises';
const require=createRequire(import.meta.url),tess=dirname(require.resolve('tesseract.js/package.json')),core=dirname(createRequire(join(tess,'package.json')).resolve('tesseract.js-core/package.json')),lang=dirname(require.resolve('@tesseract.js-data/chi_tra/package.json')),pdf=dirname(require.resolve('pdfjs-dist/package.json'));
await mkdir('public/ocr/core',{recursive:true});await mkdir('public/ocr/lang',{recursive:true});
await copyFile(join(tess,'dist/worker.min.js'),'public/ocr/worker.min.js');
for(const name of await readdir(core))if(name.includes('-lstm.wasm'))await copyFile(join(core,name),join('public/ocr/core',name));
await copyFile(join(lang,'4.0.0_best_int/chi_tra.traineddata.gz'),'public/ocr/lang/chi_tra.traineddata.gz');
await copyFile(join(pdf,'build/pdf.worker.min.mjs'),'public/pdf.worker.min.mjs');
await cp(join(pdf,'cmaps'),'public/pdf-cmaps',{recursive:true});await cp(join(pdf,'standard_fonts'),'public/pdf-fonts',{recursive:true});
console.log('OCR and PDF assets ready');
