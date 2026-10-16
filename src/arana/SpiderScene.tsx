'use client';
import React, { useEffect, useRef, useState } from 'react';
import type { ForceGraph3DInstance, NodeObject, LinkObject } from '3d-force-graph';
import { words, type Chunk } from './retrieval';
import s from './SpiderPage.module.css';
type Node = NodeObject & { id: string; label: string; kind: 'fragment' | 'term' | 'query' | 'model' | 'output'; color: string };
type Edge = LinkObject<Node> & { active?: boolean };
type Props = { chunks: Chunk[]; selected: Chunk[]; scanned: number; phase: number; busy: boolean; pulse: number; transferring: string | null; delivered: number; transferDuration: number; onSelect: (id: string) => void };
const identity = (node: string | number | Node | undefined) => typeof node === 'object' ? node.id : node;
export function SpiderScene(props: Props) {
 const host = useRef<HTMLDivElement>(null);
 const labels = useRef<HTMLDivElement>(null);
 const graph = useRef<ForceGraph3DInstance<Node, Edge> | null>(null);
 const current = useRef(props);
 const refresh = useRef<() => void>(() => {});
 const follow = useRef(true);
 const [following, setFollowing] = useState(true);
 const [paused, setPaused] = useState(false);
 const [visible, setVisible] = useState(0);
 const [failure, setFailure] = useState('');
 const documentKey = props.chunks.map(c => c.text).join('\0');
 useEffect(() => {
  const old = current.current; current.current = props;
  if (old.chunks !== props.chunks || old.selected !== props.selected || old.scanned !== props.scanned || old.phase !== props.phase || old.busy !== props.busy || old.transferring !== props.transferring) refresh.current();
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
   let added = 0, lastPhase = 0, transferStarted = 0, transferId: string | null = null, lastPulse = current.current.pulse, previousFrame = 0;
   const packet = document.createElement('span'); packet.className = s.contextPacket; packet.hidden = true; labelHost?.append(packet);
   const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
   const captions = new Map<string, HTMLElement>();
   function drawLabels(time: number) {
    if (disposed) return;
    frame = requestAnimationFrame(drawLabels);
    if (!labels.current || time - previousFrame < 30) return;
    previousFrame = time;
    const state = current.current;
    const focus = state.phase === 1 ? byId.get(state.chunks[state.scanned - 1]?.id) : undefined;
    if (follow.current && focus && state.busy) {
     const target = { x: focus.x ?? 0, y: focus.y ?? 0, z: focus.z ?? 0 };
     const camera = g.cameraPosition();
     const easing = reduced ? 1 : .13;
     g.cameraPosition({ x: camera.x + (target.x - camera.x) * easing, y: camera.y + (target.y + 12 - camera.y) * easing, z: camera.z + (target.z + 150 - camera.z) * easing }, target);
    }
    if (state.transferring !== transferId) { transferId = state.transferring; transferStarted = time; }
    const from = transferId ? byId.get(transferId) : undefined, destination = byId.get('model');
    packet.hidden = !from || !destination || !state.busy;
    if (from && destination && !packet.hidden) {
     const progress = reduced ? 1 : Math.min(1, Math.max(0, (time - transferStarted - state.transferDuration * .2) / (state.transferDuration * .7)));
     const point = g.graph2ScreenCoords((from.x ?? 0) + ((destination.x ?? 0) - (from.x ?? 0)) * progress, (from.y ?? 0) + ((destination.y ?? 0) - (from.y ?? 0)) * progress, (from.z ?? 0) + ((destination.z ?? 0) - (from.z ?? 0)) * progress);
     packet.textContent = `${transferId} → Modelo`;
     packet.style.transform = `translate(${point.x}px, ${point.y}px)`;
    }
    if (state.pulse !== lastPulse) {
     lastPulse = state.pulse;
     const outputLink = links.find(l => identity(l.source) === 'model');
     if (outputLink && !reduced) g.emitParticle(outputLink);
    }
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
     el.dataset.focused = String(n.kind === 'fragment' && current.current.phase === 1 && current.current.chunks[current.current.scanned - 1]?.id === n.id);
     const width = n.label.length * 7 + 14;
     const overlap = occupied.some(r => Math.abs(r.y - p.y) < 16 && p.x < r.x + r.width && p.x + width > r.x);
     el.style.display = n.kind === 'term' && overlap ? 'none' : '';
     if (!overlap || n.kind !== 'term') occupied.push({ x: p.x, y: p.y, width });
    }
   }
   frame = requestAnimationFrame(drawLabels);
   g.backgroundColor('#050b10').showNavInfo(false).nodeVal(n => n.kind === 'model' ? 45 : n.kind === 'output' ? 24 : n.kind === 'fragment' ? 16 : n.kind === 'query' ? 22 : 2)
    .nodeColor(n => n.color).nodeOpacity(.95)
    .nodeLabel(n => { const el = document.createElement('span'); el.textContent = n.kind === 'fragment' ? current.current.chunks.find(c => c.id === n.id)?.text ?? n.label : n.label; return el; })
    .linkColor(l => l.active ? current.current.phase === 1 ? '#ffc879' : '#8cf9bc' : '#236676').linkOpacity(.75).linkWidth(l => l.active ? 2.8 : .7)
    .linkDirectionalParticles(l => l.active && current.current.busy && !reduced ? 5 : 0).linkDirectionalParticleWidth(3).linkDirectionalParticleSpeed(.008)
    .onNodeClick(n => { if (n.kind === 'fragment') current.current.onSelect(n.id); })
    .cooldownTicks(120).d3VelocityDecay(.32)
    .onEngineStop(() => { if (current.current.phase === 0) g.zoomToFit(600, 28); });
   g.d3Force('charge')?.strength(-65);
   g.d3Force('link')?.distance(35);
   g.d3Force('compact', (alpha: number) => {
    for (const n of nodes) { n.vx = (n.vx ?? 0) - (n.x ?? 0) * alpha * .012; n.vy = (n.vy ?? 0) - (n.y ?? 0) * alpha * .025; n.vz = (n.vz ?? 0) - (n.z ?? 0) * alpha * .09; }
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
    // Se muestra una copia animada del contexto, conservando el documento original.
    if (state.phase >= 2 && (state.selected.length || state.phase === 3) && !byId.has('model')) {
     const right = Math.max(80, ...nodes.map(n => n.x ?? 0)) + 100;
     const model: Node = { id: 'model', label: 'Modelo local', kind: 'model', color: '#a0ffbe', x: right, y: 0, z: 0, fx: right, fy: 0, fz: 0 };
     const output: Node = { id: 'output', label: 'Respuesta', kind: 'output', color: '#ff98c1', x: right + 100, y: 0, z: 0, fx: right + 100, fy: 0, fz: 0 };
     nodes.push(model, output); byId.set('model', model); byId.set('output', output);
    }
    if (state.phase === 1 && lastPhase !== 1) {
     for (const n of nodes) { if (n.kind !== 'model' && n.kind !== 'output') { n.fx = undefined; n.fy = undefined; n.fz = undefined; } }
     for (let i = nodes.length - 1; i >= 0; i--) if (nodes[i].kind === 'model' || nodes[i].kind === 'output') { captions.get(nodes[i].id)?.remove(); captions.delete(nodes[i].id); byId.delete(nodes[i].id); nodes.splice(i, 1); }
    }
    if (state.phase >= 2) for (const n of nodes) { n.fx = n.x ?? 0; n.fy = n.y ?? 0; n.fz = n.z ?? 0; }
    // Las conexiones de consulta corresponden a la comparación y selección reales.
    const base = links.filter(l => identity(l.source) !== 'query' && identity(l.source) !== 'model' && identity(l.target) !== 'model');
    links.splice(0, links.length, ...base);
    const selected = new Set(state.selected.map(c => c.id));
    const compared = new Map(state.chunks.slice(0, state.scanned).map(c => [c.id, c.score]));
    const activeIds = new Set([...selected, ...(focused ? [focused.id] : [])]);
    if (state.phase === 1) for (const id of activeIds) links.push({ source: 'query', target: id, active: true });
    if (byId.has('model')) {
     for (const id of selected) links.push({ source: id, target: 'model', active: true });
     links.push({ source: 'model', target: 'output', active: state.phase === 3 });
    }
    for (const n of nodes) n.color = n.kind === 'model' ? '#a0ffbe' : n.kind === 'output' ? '#ff98c1' : n.kind === 'query' ? '#f9bf6e' : selected.has(n.id) ? '#8bffb5' : focused?.id === n.id ? '#f9bf6e' : n.kind === 'fragment' ? compared.has(n.id) ? compared.get(n.id)! > 0 ? '#9bd1dd' : '#41515f' : '#46cde1' : '#538e9b';
    for (const l of links) l.active = identity(l.target) === 'model' ? identity(l.source) === state.transferring : identity(l.source) === 'model' ? state.phase === 3 : state.phase === 1 && (activeIds.has(String(identity(l.source))) || identity(l.source) === 'query');
    g.graphData({ nodes: [...nodes], links: [...links] });
    g.nodeColor(n => n.color).linkColor(l => l.active ? current.current.phase === 1 ? '#ffc879' : '#8cf9bc' : '#236676');
    g.linkDirectionalParticles(l => l.active && identity(l.source) !== 'model' && state.busy && !reduced ? 5 : 0);
    if (state.phase !== lastPhase && state.phase >= 2 && byId.has('model') && follow.current) {
     g.zoomToFit(reduced ? 0 : 700, 45, n => selected.has(n.id) || n.kind === 'model' || n.kind === 'output');
    }
    lastPhase = state.phase;
   };
   function grow() {
    if (disposed) return;
    const chunks = current.current.chunks;
    const limit = Math.min(120, chunks.length);
    if (added < limit) {
     addFragment(chunks[added++]); setVisible(added); refresh.current();
     if (current.current.phase === 0 && (added === limit || added % 12 === 0)) g.zoomToFit(650, 28);
     timer = setTimeout(grow, reduced ? 0 : Math.max(90, Math.min(900, 10000 / limit)));
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
  {props.phase >= 2 && <div className={s.transferStatus} role="status">{props.transferring ? `Preparando ${props.transferring} → Modelo · ${props.delivered}/${props.selected.length}` : props.phase === 3 ? `Modelo → Respuesta · ${props.pulse} eventos recibidos` : `Contexto preparado · ${props.delivered}/${props.selected.length}`}<small>Recorrido explicativo; no representa activaciones internas.</small></div>}
  {failure && <p className={s.graphError} role="alert">{failure}</p>}
  <div className={s.sceneControls}><span>ARRASTRA PARA GIRAR · RUEDA PARA ACERCAR</span><button aria-pressed={following} onClick={() => { follow.current = !follow.current; setFollowing(follow.current); }}>{following ? 'Cámara automática' : 'Cámara libre'}</button><button onClick={() => { if (paused) graph.current?.resumeAnimation(); else graph.current?.pauseAnimation(); setPaused(!paused); }}>{paused ? 'Animar' : 'Pausar'}</button><button aria-label="Acercar red" onClick={() => { const g = graph.current; if (g) { const p = g.cameraPosition(); g.cameraPosition({ x: p.x * .8, y: p.y * .8, z: p.z * .8 }, undefined, 250); } }}>+</button><button aria-label="Alejar red" onClick={() => { const g = graph.current; if (g) { const p = g.cameraPosition(); g.cameraPosition({ x: p.x * 1.25, y: p.y * 1.25, z: p.z * 1.25 }, undefined, 250); } }}>−</button><button onClick={() => { follow.current = false; setFollowing(false); graph.current?.zoomToFit(650, 28); }}>Ver toda la red</button></div>
 </div>;
}
