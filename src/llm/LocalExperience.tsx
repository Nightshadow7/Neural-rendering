'use client';
import React, { useEffect, useRef, useState } from 'react';
import { LayerView } from './LayerView';
import { Phase } from './walkthrough/Walkthrough';
import s from './LocalExperience.module.css';
type Hardware = { cpu: { name: string; utilization: number | null }; ram: { used: number; total: number }; gpus: { name: string; utilization: number | null; used: number | null; total: number | null; temperature: number | null; power: number | null }[] };
const stages = [
 { phase: Phase.Input_Detail_Embedding, title: 'Representación de tokens', text: 'El texto se divide en tokens. Cada token se convierte en un vector que representa información aprendida durante el entrenamiento.' },
 { phase: Phase.Input_Detail_SelfAttention, title: 'Atención: consultas, claves y valores', text: 'Las consultas (Q) se comparan con las claves (K). Sus puntuaciones ponderan los valores (V) de los tokens anteriores para combinar el contexto.' },
 { phase: Phase.Input_Detail_Mlp, title: 'Red de transformación (MLP)', text: 'La red transforma cada vector mediante matrices y funciones no lineales. DeepSeek-R1 de 7B usa Qwen2; el GPT pequeño de la escena no reproduce todos sus detalles.' },
 { phase: Phase.Input_Detail_Output, title: 'Probabilidades y siguiente token', text: 'Softmax convierte las puntuaciones de salida en probabilidades. El muestreo elige el siguiente token. El proceso se repite hasta completar la respuesta.' },
];
const fmt = (n: number | null | undefined, suffix = '') => n == null ? 'No disponible' : `${n.toLocaleString('es-CO', { maximumFractionDigits: 1 })}${suffix}`;
export function LocalExperience() {
 const [hardware, setHardware] = useState<Hardware | null>(null);
 const [connection, setConnection] = useState<{ model: string; engine: string } | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState('');
 const [prompt, setPrompt] = useState('¿Cómo utiliza un modelo de lenguaje la CPU y la GPU para generar una respuesta?');
 const [answer, setAnswer] = useState('');
 const [thinking, setThinking] = useState('');
 const [busy, setBusy] = useState(false);
 const [stage, setStage] = useState<number | null>(null);
 const [latency, setLatency] = useState<number | null>(null);
 const [tokens, setTokens] = useState<number | null>(null);
 const [elapsed, setElapsed] = useState<number | null>(null);
 const controller = useRef<AbortController | null>(null);
 async function connect(signal?: AbortSignal) {

  try {
   const res = await fetch('/api/model', { method: 'POST', signal });
   const data = await res.json();
   if (!res.ok) throw new Error(data.error);
   setConnection(data);
  } catch (e) { if (!signal?.aborted) setError(e instanceof Error ? e.message : 'No se pudo conectar.'); }
  finally { if (!signal?.aborted) setLoading(false); }
 }
 useEffect(() => {
  const abort = new AbortController();
  // La actualización ocurre después de la petición de red, no sincrónicamente.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  void connect(abort.signal);
  let timer: ReturnType<typeof setTimeout>;
  async function poll() {
   try {
    const res = await fetch('/api/hardware', { signal: abort.signal });
    if (!res.ok) throw new Error();
    const data = await res.json();
    if (!abort.signal.aborted) setHardware(data);
   } catch { if (!abort.signal.aborted) setHardware(null); }
   if (!abort.signal.aborted) timer = setTimeout(poll, 1500);
  }
  void poll();
  return () => { abort.abort(); clearTimeout(timer); controller.current?.abort(); };
 }, []);
 useEffect(() => {
  if (!busy) return;
  const timer = setInterval(() => setStage(current => ((current ?? 0) + 1) % stages.length), 8000);
  return () => clearInterval(timer);
 }, [busy]);
 async function generate(event: React.FormEvent) {
  event.preventDefault();
  if (busy || !prompt.trim() || !connection) return;
  setBusy(true); setError(''); setAnswer(''); setThinking(''); setLatency(null); setTokens(null); setElapsed(null); setStage(0);
  const abort = new AbortController(); controller.current = abort;
  const start = performance.now();
  let first = false, content = '', reasoning = '', buffer = '', complete = false;
  function consume(line: string) {
   if (!line.startsWith('data:')) return;
   const payload = line.slice(5).trim();
   if (!payload) return;
   if (payload === '[DONE]') { complete = true; return; }
   const data = JSON.parse(payload);
   if (data.error) throw new Error('El modelo interrumpió la generación.');
   const delta = data.choices?.[0]?.delta;
   if (delta?.content || delta?.reasoning_content || delta?.reasoning) {
    if (!first) { first = true; setLatency(performance.now() - start); }
    reasoning += delta.reasoning_content ?? delta.reasoning ?? '';
    content += delta.content ?? '';
    const open = content.indexOf('<think>'), close = content.indexOf('</think>');
    if (open >= 0) {
     setThinking(reasoning + content.slice(open + 7, close >= 0 ? close : undefined));
     setAnswer(close >= 0 ? content.slice(close + 8) : content.slice(0, open));
    } else { setThinking(reasoning); setAnswer(content); }
   }
   if (typeof data.usage?.completion_tokens === 'number') setTokens(data.usage.completion_tokens);
   if (data.choices?.[0]?.finish_reason === 'length') setError('Se alcanzó el límite de salida de 1024 tokens. Puedes formular una pregunta más breve.');
  }
  try {
   const res = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }), signal: abort.signal });
   if (!res.ok) { const data = await res.json(); throw new Error(data.error); }
   if (!res.body) throw new Error('No se recibió una respuesta.');
   const reader = res.body.getReader(), decoder = new TextDecoder();
   while (true) {
    const { done, value } = await reader.read();
    buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
    const lines = buffer.split('\n'); buffer = lines.pop() ?? '';
    lines.forEach(consume);
    if (done) { if (buffer.trim()) consume(buffer); break; }
   }
   if (!complete) throw new Error('La conexión terminó antes de completar la respuesta.');
   setStage(3);
  } catch (e) { setError(abort.signal.aborted ? 'Generación detenida.' : e instanceof Error ? e.message : 'Error de conexión.'); }
  finally { setElapsed((performance.now() - start) / 1000); setBusy(false); controller.current = null; }
 }
 return <main className={s.app}>
  <header className={s.header}><div><strong>El modelo por dentro</strong><span>Visualización 3D · CPU y GPU en vivo</span></div><div className={s.connection}>{loading ? 'Cargando modelo local…' : connection ? `${connection.model} · ${connection.engine}` : 'Modelo sin conexión'}</div></header>
  <section className={s.metrics} aria-label="Uso real del equipo">
   <div title={hardware?.cpu.name}><small>CPU · equipo completo</small><strong>{fmt(hardware?.cpu.utilization, ' %')}</strong><meter min="0" max="100" value={hardware?.cpu.utilization ?? 0} aria-label="Uso de CPU" /></div>
   <div><small>Memoria RAM</small><strong>{hardware ? `${fmt(hardware.ram.used / 2 ** 30)} / ${fmt(hardware.ram.total / 2 ** 30)} GiB` : 'No disponible'}</strong></div>
   <div title={hardware?.gpus[0]?.name}><small>GPU · {hardware?.gpus[0]?.name ?? 'NVIDIA'}</small><strong>{fmt(hardware?.gpus[0]?.utilization, ' %')}</strong><meter min="0" max="100" value={hardware?.gpus[0]?.utilization ?? 0} aria-label="Uso de GPU" /></div>
   <div><small>Memoria de GPU</small><strong>{hardware?.gpus[0] ? `${fmt(hardware.gpus[0].used)} / ${fmt(hardware.gpus[0].total)} MiB` : 'No disponible'}</strong></div>
   <div><small>Temperatura · potencia</small><strong>{fmt(hardware?.gpus[0]?.temperature, ' °C')} · {fmt(hardware?.gpus[0]?.power, ' W')}</strong></div>
  </section>
  <div className={s.workspace}>
   <section className={s.visual} aria-label="Recorrido interactivo del modelo"><LayerView activePhase={stage == null ? undefined : stages[stage].phase} /></section>
   <aside className={s.panel}>
    <div className={s.eyebrow}>EXPLORA Y PRUEBA</div><h1>Del texto a la respuesta</h1><p>Recorre las capas y observa cómo cambia el uso de tu equipo al generar texto.</p>
    <div className={s.note}>La escena usa un GPT pequeño con datos de ejemplo. El recorrido durante la generación es didáctico: llama.cpp y Ollama no exponen las activaciones internas de DeepSeek.</div>
    <div className={s.stages}>{stages.map((item, i) => <button key={item.phase} aria-pressed={stage === i} onClick={() => setStage(i)} className={stage === i ? s.active : ''}><span>0{i + 1}</span>{item.title}</button>)}</div>
    {stage != null && <p className={s.explanation}>{stages[stage].text}</p>}
    <form onSubmit={generate}><label htmlFor="question">Pregunta al modelo local</label><textarea id="question" value={prompt} onChange={e => setPrompt(e.target.value)} rows={3} maxLength={8000} /><div className={s.actions}><button type="submit" disabled={busy || loading || !connection || !prompt.trim()}>{busy ? 'Generando…' : 'Generar respuesta'}</button>{busy ? <button type="button" onClick={() => controller.current?.abort()}>Detener</button> : <button type="button" disabled={loading} onClick={() => { setLoading(true); setConnection(null); setError(''); void connect(); }}>Reconectar</button>}</div></form>
    {error && <p className={s.error} role="alert">{error}</p>}
    {thinking && <details><summary>Texto de razonamiento emitido por el modelo</summary><p className={s.output}>{thinking}</p></details>}
    {answer && <section><h2>Respuesta</h2><div className={s.output}>{answer}</div></section>}
    <div className={s.timing}><span>Primer fragmento: {fmt(latency, ' ms')}</span><span>Tokens de salida: {fmt(tokens)}</span><span>Duración: {fmt(elapsed, ' s')}</span><span>Promedio total: {tokens != null && elapsed ? fmt(tokens / elapsed, ' tokens/s') : 'No disponible'}</span></div>
    <p className={s.footnote}>Sensores del equipo completo, incluido el navegador. Actualización aproximada cada 2 segundos. {hardware && !hardware.gpus.length && 'No se pudo consultar nvidia-smi.'} Los valores ausentes se muestran como no disponibles.</p>
   </aside>
  </div><div id="portal-container" />
 </main>;
}

