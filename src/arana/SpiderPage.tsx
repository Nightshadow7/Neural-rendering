'use client';
import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';
import { Chunk, contextPrompt, rankDocument, selectContext, splitDocument } from './retrieval';
import s from './SpiderPage.module.css';
import { SpiderScene } from './SpiderScene';
import { fileTypes, readDocument } from './documents';
const example = 'La CPU coordina las tareas del sistema y ejecuta instrucciones generales. Puede preparar los datos que recibe el modelo.\n\nLa GPU realiza muchas operaciones en paralelo. Las multiplicaciones de matrices del modelo pueden aprovechar este paralelismo.\n\nLa VRAM almacena pesos y datos de trabajo en la GPU. Cuando no alcanza, parte del trabajo puede distribuirse a la CPU y a la RAM.\n\nLa búsqueda documental selecciona fragmentos relacionados con una pregunta. El modelo recibe esos fragmentos como contexto para redactar una respuesta.';
const steps = ['Documento', 'Búsqueda', 'Contexto', 'Respuesta'];
const pause = (ms: number, signal: AbortSignal) => new Promise<void>((resolve, reject) => {
 const cancel = () => { clearTimeout(timer); reject(new Error('Consulta detenida.')); };
 const timer = setTimeout(() => { signal.removeEventListener('abort', cancel); resolve(); }, ms);
 if (signal.aborted) cancel(); else signal.addEventListener('abort', cancel, { once: true });
});
export function SpiderPage() {
 const [chunks, setChunks] = useState<Chunk[]>([]);
 const [filename, setFilename] = useState('Sin documento');
 const [question, setQuestion] = useState('¿Qué hace la GPU y qué almacena la VRAM?');
 const [phase, setPhase] = useState(0);
 const [scanned, setScanned] = useState(0);
 const [selected, setSelected] = useState<Chunk[]>([]);
 const [answer, setAnswer] = useState('');
 const [reasoning, setReasoning] = useState('');
 const [error, setError] = useState('');
 const [busy, setBusy] = useState(false);
 const [reading, setReading] = useState(false);
 const [status, setStatusValue] = useState('Haz una pregunta o carga un documento para iniciar el recorrido.');
 const [model, setModel] = useState('');
 const [pulse, setPulse] = useState(0);
 const [activity, setActivity] = useState<string[]>([]);
 function setStatus(message: string) { setStatusValue(message); setActivity(previous => [...previous.slice(-4), message]); }
 const [hardware, setHardware] = useState<{ cpu?: { utilization: number | null }; gpus?: { utilization: number | null; used: number | null }[] } | null>(null);
 const [tokens, setTokens] = useState<number | null>(null);
 const [slow, setSlow] = useState(true);
 const operation = useRef<AbortController | null>(null);
 const mounted = useRef(true);
 useEffect(() => {
  mounted.current = true;
  const abort = new AbortController();
  let timer: ReturnType<typeof setTimeout>;
  async function poll() {
   try { const res = await fetch('/api/hardware', { signal: abort.signal }); if (!res.ok) throw new Error(); const data = await res.json(); if (!abort.signal.aborted) setHardware(data); }
   catch { if (!abort.signal.aborted) setHardware(null); }
   if (!abort.signal.aborted) timer = setTimeout(poll, 2000);
  }
  void poll();
  return () => { mounted.current = false; abort.abort(); operation.current?.abort(); clearTimeout(timer); };
 }, []);
 function install(text: string, name: string) {
  const next = splitDocument(text);
  setInspected(null); setActivity([]); setPulse(0); setChunks(next); setFilename(name); setSelected([]); setScanned(0); setPhase(0); setAnswer(''); setReasoning(''); setTokens(null); setError('');
  setStatus(`${next.length} fragmentos preparados. Haz una pregunta sobre el documento.`);
 }
 async function upload(event: React.ChangeEvent<HTMLInputElement>) {
  const file = event.target.files?.[0]; event.target.value = '';
  if (!file) return;
  setReading(true); setError('');
  try {
   const text = await readDocument(file, message => { if (mounted.current) setStatus(message); });
   if (mounted.current) install(text, file.name);
  } catch (e) { if (mounted.current) setError(e instanceof Error ? e.message : 'No se pudo leer el archivo.'); }
  finally { if (mounted.current) setReading(false); }
 }
 async function run(event: React.FormEvent) {
  event.preventDefault();
  if (busy || reading || !question.trim()) return;
  const abort = new AbortController(); operation.current = abort;
  setPulse(0); setActivity([]); setBusy(true); setError(''); setAnswer(''); setReasoning(''); setTokens(null); setSelected([]); setScanned(0); setPhase(1);
  const ranked = rankDocument(chunks, question);
  setChunks(ranked.map(c => ({ ...c, score: 0, terms: [] })));
  try {
   for (let i = 0; i < ranked.length; i++) {
    if (abort.signal.aborted) throw new Error('Consulta detenida.');
    setStatus(`${ranked[i].id} · similitud ${ranked[i].score.toFixed(3)} · ${ranked[i].terms.length ? 'coincide: ' + ranked[i].terms.join(', ') : 'sin palabras compartidas'}`);
    setChunks(previous => previous.map((c, index) => index === i ? ranked[i] : c)); setScanned(i + 1);
    await pause(slow ? Math.min(650, Math.max(6, 12000 / ranked.length)) : 0, abort.signal);
   }
   const context = selectContext(ranked); setSelected(context); setPhase(2);
   if (chunks.length && !context.length) { setStatus('No hay coincidencias. Prueba palabras que aparezcan en el documento. No se envió una consulta al modelo.'); return; }
   setStatus(`Seleccionados ${context.length} fragmentos. Solo este contexto se enviará al modelo.`);
   await pause(slow ? 1300 : 0, abort.signal);
   setStatus('Cargando el modelo local…');
   const connected = await fetch('/api/model', { method: 'POST', signal: abort.signal });
   const info = await connected.json(); if (!connected.ok) throw new Error(info.error);
   setModel(`${info.model} · ${info.engine}`); setPhase(3); setStatus('El modelo está redactando con el contexto seleccionado…');
   const response = await fetch('/api/generate', { method: 'POST', signal: abort.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: context.length ? contextPrompt(question, context) : question }) });
   if (!response.ok) { const data = await response.json(); throw new Error(data.error); }
   if (!response.body) throw new Error('No se recibió texto del modelo.');
   const reader = response.body.getReader(), decoder = new TextDecoder();
   let buffer = '', content = '', thought = '', doneEvent = false, limited = false;
   const consume = (line: string) => {
    if (!line.startsWith('data:')) return;
    const payload = line.slice(5).trim(); if (!payload) return;
    if (payload === '[DONE]') { doneEvent = true; return; }
    const data = JSON.parse(payload); if (data.error) throw new Error('El servidor interrumpió la respuesta.');
    const delta = data.choices?.[0]?.delta;
    if (delta?.content || delta?.reasoning_content || delta?.reasoning) {
     content += delta.content ?? ''; thought += delta.reasoning_content ?? delta.reasoning ?? '';
     const open = content.indexOf('<think>'), close = content.indexOf('</think>');
     setReasoning(thought + (open >= 0 ? content.slice(open + 7, close >= 0 ? close : undefined) : ''));
     setAnswer(open >= 0 ? close >= 0 ? content.slice(close + 8) : content.slice(0, open) : content);
     setPulse(p => p + 1);
    }
    if (typeof data.usage?.completion_tokens === 'number') setTokens(data.usage.completion_tokens);
    if (data.choices?.[0]?.finish_reason === 'length') limited = true;
   };
   while (true) {
    const { value, done } = await reader.read(); buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
    const lines = buffer.split('\n'); buffer = lines.pop() ?? ''; lines.forEach(consume);
    if (done) { if (buffer.trim()) consume(buffer); break; }
   }
   if (!doneEvent) throw new Error('La conexión terminó antes de completar la respuesta.');
   setStatus(limited ? 'Se alcanzó el límite de salida. La respuesta puede estar incompleta.' : 'Respuesta terminada. Puedes revisar el contexto enviado y sus coincidencias.');
  } catch (e) { if (mounted.current) { setError(abort.signal.aborted ? 'Consulta detenida.' : e instanceof Error ? e.message : 'No se pudo completar la consulta.'); setStatus('Puedes volver a intentarlo.'); } }
  finally { if (mounted.current) setBusy(false); operation.current = null; }
 }

 const [inspected, setInspected] = useState<string | null>(null);
 const ids = new Set(selected.map(c => c.id));
 const detail = chunks.find(c => c.id === inspected);
 const value = (n: number | null | undefined, unit: string) => n == null ? '—' : `${n.toLocaleString('es-CO')} ${unit}`;
 return <main className={s.page}>
  <header className={s.header}><div><h1>ARAÑITA <span>/ explorador de contexto</span></h1></div><Link href="/" target="_blank" rel="noopener noreferrer">Visualización 3D ↗</Link></header>
  <div className={s.workspace}>
   <section className={s.visual}>
    <div className={s.topline}><span><i /> {busy ? 'EN ACTIVIDAD' : 'EN ESPERA'}</span><span>{chunks.length} FRAGMENTOS · {selected.length} SELECCIONADOS</span></div>
    <SpiderScene chunks={chunks} selected={selected} scanned={scanned} phase={phase} busy={busy} pulse={pulse} onSelect={setInspected} />
    <div className={s.visualFooter}><div className={s.steps}>{steps.map((step, i) => <span key={step} className={phase === i ? s.current : ''}>0{i + 1} {step}</span>)}</div><p role="status">{status}</p><div className={s.pipeline} aria-label="Esquema explicativo del modelo">
     <span className={phase >= 2 && selected.length ? s.flow : ''}>Contexto<small>{selected.length} fragmentos</small></span>
     <span className={phase === 3 ? s.flow : ''}>Embeddings<small>Texto a vectores</small></span>
     <span className={phase === 3 ? s.flow : ''}>Atención<small>Q · K · V</small></span>
     <span className={phase === 3 ? s.flow : ''}>MLP<small>Transformación</small></span>
     <span key={pulse} className={pulse ? `${s.output} ${s.streamPulse}` : ''}>Salida<small>{pulse} eventos recibidos</small></span>
    </div><div className={s.pipelineNote}>Capas: esquema ilustrativo. Los pulsos de salida siguen el texto recibido.</div><div className={s.legend}><span>● Conexiones</span><span>● Contexto seleccionado</span><span>● Texto recibido</span></div></div>
    <div className={s.sensors}><span>CPU <b>{value(hardware?.cpu?.utilization, '%')}</b></span><span>GPU <b>{value(hardware?.gpus?.[0]?.utilization, '%')}</b></span><span>VRAM <b>{value(hardware?.gpus?.[0]?.used, 'MiB')}</b></span><span>Uso total del equipo</span></div>
   </section>
   <aside className={s.sidebar}>
    <div className={s.sidebarTitle}><span>CONVERSACIÓN</span><small>{model || 'DeepSeek · local'}</small></div>
    <section className={s.documents}><h2>Documento</h2><label className={s.upload}>{reading ? 'Leyendo documento…' : '+ Añadir archivo'}<input type="file" accept={fileTypes} disabled={busy || reading} onChange={upload} /></label><button className={s.example} disabled={busy || reading} onClick={() => install(example, 'Ejemplo: CPU y GPU')}>Usar ejemplo</button><p className={s.filename}>{filename}</p><small>PDF, DOCX y texto · hasta 20 MiB<br />PDF: hasta 200 páginas con texto. Sin OCR.</small></section>
    <section className={s.conversation}><div className={s.answer}>{answer || <div className={s.welcome}><span>¿Qué quieres explorar?</span><p>Haz una pregunta o añade un documento. Verás crecer una red de fragmentos y palabras, cómo se busca el contexto y cómo llega la respuesta.</p></div>}</div>{reasoning && <details><summary>Razonamiento emitido por el modelo</summary><p className={s.thought}>{reasoning}</p></details>}{tokens !== null && <small>{tokens} tokens de salida reportados</small>}{error && <p role="alert" className={s.error}>{error}</p>}</section>
    <form className={s.form} onSubmit={run}><label htmlFor="document-question">Tu pregunta</label><textarea id="document-question" maxLength={1000} rows={3} value={question} disabled={busy} onChange={e => setQuestion(e.target.value)} placeholder="Pregunta al modelo…" /><div className={s.actions}><label className={s.check}><input type="checkbox" checked={slow} disabled={busy} onChange={e => setSlow(e.target.checked)} /> Paso a paso</label>{busy ? <button type="button" onClick={() => operation.current?.abort()}>Detener</button> : <button type="submit" disabled={reading || !question.trim()}>Preguntar ↗</button>}</div></form>
    <section className={s.activity}><h2>Recorrido</h2>{activity.map((message, index) => <p key={`${index}-${message}`}>{message}</p>)}</section>
    <details className={s.context} open={!!detail}><summary>Contexto · {selected.length} seleccionados</summary>{detail && <article><strong>{detail.id} · fragmento inspeccionado</strong><p>{detail.text}</p><button onClick={() => setInspected(null)}>Cerrar fragmento</button></article>}{chunks.map((chunk, i) => <details key={chunk.id} className={ids.has(chunk.id) ? s.selected : ''}><summary>{chunk.id} · {ids.has(chunk.id) ? 'Enviado al modelo' : scanned > i ? `Afinidad ${chunk.score.toFixed(3)}` : 'Pendiente'}</summary><p>{chunk.text}</p><small>Coincidencias: {chunk.terms.join(', ') || 'ninguna'}</small></details>)}{!chunks.length && <p>Sin documento: la respuesta usa el conocimiento del modelo.</p>}</details>
    <p className={s.disclaimer}>La red conecta palabras compartidas; la búsqueda usa TF-IDF y similitud de coseno. Las capas ilustran el proceso: no se miden pesos de atención ni FLOPs internos. CPU y GPU son lecturas reales del equipo.</p>
   </aside>
  </div>
 </main>;
}
