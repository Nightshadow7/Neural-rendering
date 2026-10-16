'use client';
import React, { useEffect, useRef, useState } from 'react';
import type { ForceGraph3DInstance, NodeObject, LinkObject } from '3d-force-graph';
import { words, type Chunk } from './retrieval';
import s from './SpiderPage.module.css';
type Node = NodeObject & { id: string; label: string; kind: 'fragment' | 'term' | 'query'; color: string };
type Edge = LinkObject<Node> & { active?: boolean };
type Props = { chunks: Chunk[]; selected: Chunk[]; scanned: number; phase: number; busy: boolean; pulse: number; onSelect: (id: string) => void };
const identity = (node: string | number | Node | undefined) => typeof node === 'object' ? node.id : node;
export function SpiderScene(props: Props) {
 const host = useRef<HTMLDivElement>(null);
 const labels = useRef<HTMLDivElement>(null);
 const graph = useRef<ForceGraph3DInstance<Node, Edge> | null>(null);
 const current = useRef(props);
 const refresh = useRef<() => void>(() => {});
 const [paused, setPaused] = useState(false);
 const [visible, setVisible] = useState(0);
 const [failure, setFailure] = useState('');
 const documentKey = props.chunks.map(c => c.text).join('\0');
 useEffect(() => {
  const old = current.current; current.current = props;
  if (old.chunks !== props.chunks || old.selected !== props.selected || old.scanned !== props.scanned || old.phase !== props.phase || old.busy !== props.busy) refresh.current();
 }, [props]);
 useEffect(() => {
  const labelHost = labels.current;
  let frame = 0;
  let disposed = false, timer: ReturnType<typeof setTimeout>, observer: ResizeObserver;
  async function start() {
   const { default: ForceGraph } = await import('3d-force-graph');
   if (disposed || !host.current) return;
   setVisible(0); setPaused(false); setFailure('');
   const g = new ForceGraph(host.current) as unknown as ForceGraph3DInstance<Node, Edge>;
   graph.current = g;
   const nodes: Node[] = [], links: Edge[] = [], byId = new Map<string, Node>();
   let added = 0;
   const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
   const captions = new Map<string, HTMLElement>();
   function drawLabels() {
    if (disposed) return;
    frame = requestAnimationFrame(drawLabels);
    if (!labels.current) return;
    const occupied: { x: number; y: number; width: number }[] = [];
    for (const n of [...nodes].sort((a, b) => Number(a.kind === 'term') - Number(b.kind === 'term'))) {
     if (n.kind === 'term' && nodes.length > 100) { const previous = captions.get(n.id); if (previous) previous.style.display = 'none'; continue; }
     let el = captions.get(n.id);
     if (!el) {
      el = document.createElement(n.kind === 'fragment' ? 'button' : 'span');
      el.textContent = n.label;
      if (n.kind === 'fragment') el.onclick = () => current.current.onSelect(n.id);
      labels.current.append(el); captions.set(n.id, el);
     }
     const p = g.graph2ScreenCoords(n.x ?? 0, n.y ?? 0, n.z ?? 0);
     el.style.transform = `translate(${p.x + 8}px, ${p.y - 8}px)`;
     el.style.color = n.color;
     const width = n.label.length * 6 + 10;
     const overlap = occupied.some(r => Math.abs(r.y - p.y) < 16 && p.x < r.x + r.width && p.x + width > r.x);
     el.style.display = n.kind === 'term' && overlap ? 'none' : '';
     if (!overlap || n.kind !== 'term') occupied.push({ x: p.x, y: p.y, width });
    }
   }
   frame = requestAnimationFrame(drawLabels);
   g.backgroundColor('#050b10').showNavInfo(false).nodeVal(n => n.kind === 'fragment' ? 12 : n.kind === 'query' ? 18 : 1.4)
    .nodeColor(n => n.color).nodeOpacity(.95)
    .nodeLabel(n => { const el = document.createElement('span'); el.textContent = n.kind === 'fragment' ? current.current.chunks.find(c => c.id === n.id)?.text ?? n.label : n.label; return el; })
    .linkColor(l => l.active ? '#8cf9bc' : '#236676').linkOpacity(.75).linkWidth(l => l.active ? 1.2 : .65)
    .linkDirectionalParticles(l => l.active && current.current.busy && !reduced ? 3 : 0).linkDirectionalParticleWidth(1.7).linkDirectionalParticleSpeed(.008)
    .onNodeClick(n => { if (n.kind === 'fragment') current.current.onSelect(n.id); })
    .cooldownTicks(120).d3VelocityDecay(.32)
    .onEngineStop(() => g.zoomToFit(600, 100));
   g.d3Force('charge')?.strength(-65);
   g.d3Force('link')?.distance(35);
   g.d3Force('compact', (alpha: number) => {
    for (const n of nodes) { n.vx = (n.vx ?? 0) - (n.x ?? 0) * alpha * .025; n.vy = (n.vy ?? 0) - (n.y ?? 0) * alpha * .025; n.vz = (n.vz ?? 0) - (n.z ?? 0) * alpha * .025; }
   });
   const frequency = new Map<string, number>();
   current.current.chunks.forEach(c => new Set(words(c.text)).forEach(w => frequency.set(w, (frequency.get(w) ?? 0) + 1)));
   g.cameraPosition({ x: 0, y: 0, z: 340 });
   observer = new ResizeObserver(() => { if (host.current) g.width(host.current.clientWidth).height(host.current.clientHeight); });
   observer.observe(host.current);
   function addFragment(chunk: Chunk) {
    if (byId.has(chunk.id)) return;
    const fragment: Node = { id: chunk.id, label: chunk.id, kind: 'fragment', color: '#46cde1' };
    nodes.push(fragment); byId.set(fragment.id, fragment);
    const counts = new Map<string, number>();
    words(chunk.text).forEach(w => counts.set(w, (counts.get(w) ?? 0) + 1));
    const terms = [...counts].sort((a, b) => ((frequency.get(b[0]) ?? 0) * b[1]) - ((frequency.get(a[0]) ?? 0) * a[1])).slice(0, 10);
    for (const [term] of terms) {
     const id = `term:${term}`;
     if (!byId.has(id)) { const node: Node = { id, label: term, kind: 'term', color: '#538e9b' }; nodes.push(node); byId.set(id, node); }
     links.push({ source: fragment.id, target: id });
    }
   }
   refresh.current = () => {
    const state = current.current;
    const focused = state.phase === 1 ? state.chunks[state.scanned - 1] : undefined;
    for (const chunk of [...state.selected, ...(focused ? [focused] : [])]) addFragment(chunk);
    if (state.phase > 0 && !byId.has('query')) {
     const query: Node = { id: 'query', label: 'Tu pregunta', kind: 'query', color: '#f9bf6e' };
     nodes.push(query); byId.set(query.id, query);
    }
    // Las conexiones de consulta corresponden a la comparación y selección reales.
    const base = links.filter(l => identity(l.source) !== 'query');
    links.splice(0, links.length, ...base);
    const selected = new Set(state.selected.map(c => c.id));
    const activeIds = new Set([...selected, ...(focused ? [focused.id] : [])]);
    for (const id of activeIds) links.push({ source: 'query', target: id, active: true });
    for (const n of nodes) n.color = n.kind === 'query' ? '#f9bf6e' : selected.has(n.id) ? '#8bffb5' : focused?.id === n.id ? '#f9bf6e' : n.kind === 'fragment' ? '#46cde1' : '#538e9b';
    for (const l of links) l.active = activeIds.has(String(identity(l.source))) || identity(l.source) === 'query';
    g.graphData({ nodes: [...nodes], links: [...links] });
    g.nodeColor(n => n.color).linkColor(l => l.active ? '#8cf9bc' : '#236676');
    g.linkDirectionalParticles(l => l.active && state.busy && !reduced ? 3 : 0);
   };
   function grow() {
    if (disposed) return;
    const chunks = current.current.chunks;
    const limit = Math.min(120, chunks.length);
    if (added < limit) {
     addFragment(chunks[added++]); setVisible(added); refresh.current();
     if (added === limit || added % 12 === 0) g.zoomToFit(650, 65);
     timer = setTimeout(grow, reduced ? 0 : Math.max(45, Math.min(650, 6000 / limit)));
    }
   }
   grow();
  }
  void start().catch(() => { if (!disposed) setFailure('No se pudo iniciar la vista 3D. Activa la aceleración gráfica del navegador. El chat y el contexto siguen disponibles.'); });
  return () => { disposed = true; cancelAnimationFrame(frame); labelHost?.replaceChildren(); clearTimeout(timer); observer?.disconnect(); refresh.current = () => {}; graph.current?._destructor(); graph.current = null; };
 }, [documentKey]);
 return <div className={s.scene}>
  <div ref={host} className={s.graphHost} aria-label="Red 3D de fragmentos y palabras compartidas. Arrastra para girar; pulsa un fragmento para leerlo." />
  <div ref={labels} className={s.graphLabels} /><div className={s.graphCaption}><b>MAPA DE CONTEXTO</b><span>{props.chunks.length ? `${visible} fragmentos incorporados · conexiones por palabras compartidas` : 'Carga un documento para construir su red de conceptos'}</span>{props.chunks.length > 120 && <span>Vista inicial: 120 fragmentos. La búsqueda analiza todos y añade sus resultados.</span>}</div>
  {failure && <p className={s.graphError} role="alert">{failure}</p>}
  <div className={s.sceneControls}><span>ARRASTRA PARA GIRAR · RUEDA PARA ACERCAR</span><button onClick={() => { if (paused) graph.current?.resumeAnimation(); else graph.current?.pauseAnimation(); setPaused(!paused); }}>{paused ? 'Animar' : 'Pausar'}</button><button onClick={() => graph.current?.zoomToFit(650, 65)}>Centrar</button></div>
 </div>;
}
