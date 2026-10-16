import { detectModel } from '@/src/server/model';
export const runtime = 'nodejs';
export async function POST(request: Request) {
    const origin = request.headers.get('origin');
    if (origin && new URL(origin).host !== request.headers.get('host')) return Response.json({ error: 'Origen no permitido.' }, { status: 403 });
    let prompt: unknown;
    try { ({ prompt } = await request.json()); } catch { return Response.json({ error: 'Solicitud inválida.' }, { status: 400 }); }
    if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 8000) return Response.json({ error: 'Escribe una pregunta de entre 1 y 8000 caracteres.' }, { status: 400 });
    try {
        const { base, model } = await detectModel();
        const response = await fetch(`${base}/v1/chat/completions`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: request.signal,
            body: JSON.stringify({ model, stream: true, stream_options: { include_usage: true }, max_tokens: 1024,
                messages: [{ role: 'system', content: 'Responde siempre en español, de manera clara y concisa.' }, { role: 'user', content: prompt }] }),
        });
        if (!response.ok || !response.body) return Response.json({ error: `El servidor del modelo rechazó la consulta (${response.status}).` }, { status: 502 });
        return new Response(response.body, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform' } });
    } catch {
        return Response.json({ error: 'Se perdió la conexión con el modelo local.' }, { status: 503 });
    }
}

