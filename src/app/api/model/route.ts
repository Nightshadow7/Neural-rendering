import { loadModel } from '@/src/server/model';
export const runtime = 'nodejs';
export async function POST(request: Request) {
    const origin = request.headers.get('origin');
    if (origin && new URL(origin).host !== request.headers.get('host')) return Response.json({ error: 'Origen no permitido.' }, { status: 403 });
    try {
        const { engine, model } = await loadModel();
        return Response.json({ engine, model });
    } catch (error) {
        return Response.json({ error: error instanceof Error ? error.message : 'No se pudo cargar el modelo.' }, { status: 503 });
    }
}

