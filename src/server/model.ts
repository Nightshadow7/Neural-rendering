type Connection = { base: string; model: string; engine: 'llama.cpp' | 'Ollama' };

export async function detectModel(): Promise<Connection> {
    const bases = process.env.LLAMA_BASE_URL
        ? [process.env.LLAMA_BASE_URL.replace(/\/$/, '')]
        : ['http://127.0.0.1:8080', 'http://127.0.0.1:8081'];
    for (const base of bases) {
        try {
            const res = await fetch(`${base}/v1/models`, { signal: AbortSignal.timeout(1500), cache: 'no-store' });
            if (!res.ok) continue;
            const data = await res.json();
            if (data.data?.[0]?.id) return { base, model: data.data[0].id, engine: 'llama.cpp' };
        } catch { /* Intentar el siguiente servidor local. */ }
    }
    const base = 'http://127.0.0.1:11434';
    try {
        const res = await fetch(`${base}/api/tags`, { signal: AbortSignal.timeout(2000), cache: 'no-store' });
        if (!res.ok) throw new Error();
        const data = await res.json();
        const model = data.models?.find((m: { name: string }) => m.name === 'deepseek-r1:7b');
        if (model) return { base, model: model.name, engine: 'Ollama' };
    } catch { /* Devolver un mensaje claro sin simular una conexión. */ }
    throw new Error('No se encontró un modelo local. Inicia llama-server en el puerto 8080 o abre Ollama con deepseek-r1:7b instalado.');
}

let loading: Promise<Connection> | null = null;
export async function loadModel() {
    if (loading) return loading;
    loading = (async () => {
        const connection = await detectModel();
        if (connection.engine === 'Ollama') {
            const res = await fetch(`${connection.base}/api/generate`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: connection.model, stream: false, keep_alive: '30m', options: { num_ctx: 4096 } }),
                signal: AbortSignal.timeout(180000),
            });
            if (!res.ok) throw new Error('Ollama no pudo cargar el modelo en memoria.');
        } else {
            const res = await fetch(`${connection.base}/health`, { signal: AbortSignal.timeout(5000), cache: 'no-store' });
            if (!res.ok) throw new Error('llama-server todavía está cargando el modelo. Pulsa Reconectar en unos segundos.');
        }
        return connection;
    })();
    try { return await loading; } finally { loading = null; }
}
