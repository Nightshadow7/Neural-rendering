import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(execFile);
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const sample = () => os.cpus().map(cpu => ({ idle: cpu.times.idle, total: Object.values(cpu.times).reduce((a, b) => a + b, 0) }));
const number = (value: string) => { const n = Number(value?.trim()); return value?.trim() && Number.isFinite(n) ? n : null; };
async function gpu() {
    try {
        const { stdout } = await exec('nvidia-smi', ['--query-gpu=name,memory.used,memory.total,utilization.gpu,temperature.gpu,power.draw,power.limit', '--format=csv,noheader,nounits'], { timeout: 2500, windowsHide: true });
        return stdout.trim().split(/\r?\n/).map(row => {
            const [name, used, total, utilization, temperature, power, limit] = row.split(',');
            return { name: name.trim(), used: number(used), total: number(total), utilization: number(utilization), temperature: number(temperature), power: number(power), limit: number(limit) };
        });
    } catch { return []; }
}
async function read() {
    const before = sample();
    const gpuPromise = gpu();
    await new Promise(resolve => setTimeout(resolve, 500));
    const after = sample();
    let total = 0, idle = 0;
    after.forEach((cpu, i) => { total += cpu.total - (before[i]?.total ?? cpu.total); idle += cpu.idle - (before[i]?.idle ?? cpu.idle); });
    return { cpu: { name: os.cpus()[0]?.model ?? 'CPU', utilization: total > 0 ? Math.round((1 - idle / total) * 1000) / 10 : null, cores: after.length },
        ram: { used: os.totalmem() - os.freemem(), total: os.totalmem() }, gpus: await gpuPromise, timestamp: Date.now() };
}
let pending: ReturnType<typeof read> | null = null;
export async function GET() {
    pending ??= read().finally(() => { pending = null; });
    return Response.json(await pending, { headers: { 'Cache-Control': 'no-store' } });
}
