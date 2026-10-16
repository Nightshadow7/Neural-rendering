export const fileTypes = '.pdf,.docx,.txt,.md,.csv,.tsv,.json,.html,.htm,.xml,.log,.py,.js,.ts,.css,.yaml,.yml';
const MAX_TEXT = 1000000;
export async function readDocument(file: File, progress: (message: string) => void): Promise<string> {
 const extension = file.name.split('.').pop()?.toLowerCase();
 if (!extension || !fileTypes.split(',').includes(`.${extension}`)) throw new Error('Formato no admitido. Usa PDF, DOCX o uno de los formatos de texto indicados.');
 if (file.size > 20 * 1024 * 1024) throw new Error('El archivo supera los 20 MiB.');
 let text = '';
 if (extension === 'pdf') {
  progress('Abriendo PDF…');
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  try {
   const pdf = await task.promise;
   if (pdf.numPages > 200) throw new Error('El PDF supera las 200 páginas. Divide el documento.');
   const pages: string[] = [];
   let length = 0;
   for (let i = 1; i <= pdf.numPages; i++) {
    progress(`Leyendo página ${i} de ${pdf.numPages}…`);
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const value = content.items.map(item => 'str' in item ? item.str + ('hasEOL' in item && item.hasEOL ? '\n' : ' ') : '').join('').trim();
    if (value) pages.push(`[Página ${i}]\n${value}`);
    length += value.length;
    page.cleanup();
    if (length > MAX_TEXT) throw new Error('El texto supera un millón de caracteres. Divide el documento.');
   }
   text = pages.join('\n\n');
   if (!text.trim()) throw new Error('Este PDF no contiene texto extraíble. Si es un escaneo, aplícale OCR antes de cargarlo.');
  } catch (e) {
   if (e instanceof Error && e.name === 'PasswordException') throw new Error('El PDF está protegido con contraseña. Carga una copia desbloqueada.');
   throw e;
  } finally { await task.destroy(); }
 } else if (extension === 'docx') {
  progress('Leyendo documento de Word…');
  const mammoth = await import('mammoth/mammoth.browser');
  text = (await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value;
 } else {
  text = await file.text();
  if (['html', 'htm', 'xml'].includes(extension)) {
   const document = new DOMParser().parseFromString(text, 'text/html');
   document.querySelectorAll('script,style,noscript').forEach(el => el.remove());
   document.querySelectorAll('p,div,section,article,li,br,tr,h1,h2,h3').forEach(el => el.append('\n'));
   text = document.body.textContent ?? '';
  }
 }
 if (text.length > MAX_TEXT) throw new Error('El texto supera un millón de caracteres. Divide el documento.');
 if (!text.trim()) throw new Error('No se encontró texto en el documento.');
 return text;
}

